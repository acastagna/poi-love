<?php
// =============================================================================
// POI•LOVE — Helpers: Elaborazione Immagini
// =============================================================================
// Richiede: GD extension (presente in quasi tutti i Plesk Linux)
// Alternativa fallback: Imagick (se GD non disponibile)
// =============================================================================

/**
 * Verifica che la GD extension sia disponibile.
 */
function check_gd_available(): bool {
    return extension_loaded('gd') && function_exists('imagecreatefromjpeg');
}

/**
 * Rileva il MIME type reale del file (ignora l'header inviato dal client).
 * Usa finfo per sicurezza — non fidarti mai di $_FILES['type'].
 *
 * @param  string $tmp_path  Percorso temporaneo file
 * @return string|null       MIME type o null se non rilevabile
 */
function detect_real_mime(string $tmp_path): ?string {
    if (!file_exists($tmp_path)) return null;

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($tmp_path);
    return $mime ?: null;
}

/**
 * Valida che il file sia un'immagine permessa.
 * Controlla MIME reale + dimensioni + size in bytes.
 *
 * @param  string $tmp_path  Percorso temporaneo
 * @param  int    $file_size Dimensione in bytes da $_FILES
 * @return array  ['valid' => bool, 'mime' => string, 'error' => string]
 */
function validate_image(string $tmp_path, int $file_size): array {
    // Controllo size prima di tutto (evita di leggere file enormi)
    if ($file_size > MAX_FILE_SIZE) {
        return [
            'valid' => false,
            'error' => 'File troppo grande. Massimo ' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB',
        ];
    }

    $mime = detect_real_mime($tmp_path);

    if ($mime === null) {
        return ['valid' => false, 'error' => 'Impossibile rilevare il tipo di file'];
    }

    // HEIC → supportato solo se Imagick è disponibile con HEIC support
    if ($mime === 'image/heic' && !extension_loaded('imagick')) {
        return ['valid' => false, 'error' => 'Formato HEIC non supportato in questo server'];
    }

    if (!in_array($mime, ALLOWED_MIME_TYPES, true)) {
        return [
            'valid' => false,
            'error' => 'Formato non permesso. Usa JPEG, PNG, WebP o HEIC',
        ];
    }

    // Verifica che GD riesca a leggere le dimensioni (doppio check anti-exploit)
    $size = @getimagesize($tmp_path);
    if ($size === false) {
        return ['valid' => false, 'error' => 'File immagine corrotto o non valido'];
    }

    return ['valid' => true, 'mime' => $mime, 'width' => $size[0], 'height' => $size[1]];
}

/**
 * Carica un'immagine GD dal percorso temporaneo, gestendo tutti i formati.
 *
 * @param  string $tmp_path
 * @param  string $mime
 * @return resource|GdImage|null
 */
function load_gd_image(string $tmp_path, string $mime) {
    switch ($mime) {
        case 'image/jpeg': return @imagecreatefromjpeg($tmp_path);
        case 'image/png':  return @imagecreatefrompng($tmp_path);
        case 'image/webp': return @imagecreatefromwebp($tmp_path);
        case 'image/heic':
            // HEIC via Imagick → converti in JPEG temporaneo → carica GD
            if (extension_loaded('imagick')) {
                $im = new Imagick($tmp_path);
                $im->setImageFormat('jpeg');
                $tmp_jpg = $tmp_path . '_heic.jpg';
                $im->writeImage($tmp_jpg);
                $gd = @imagecreatefromjpeg($tmp_jpg);
                @unlink($tmp_jpg);
                return $gd;
            }
            return null;
        default:
            return null;
    }
}

/**
 * Ridimensiona mantenendo le proporzioni (non supera MAX_IMAGE_DIMENSION).
 * Se l'immagine è già piccola, non la ingrandisce.
 *
 * @param  resource|GdImage $src  Immagine GD sorgente
 * @param  int $src_w
 * @param  int $src_h
 * @return resource|GdImage  Nuova immagine ridimensionata (o la stessa se non serve)
 */
function resize_if_needed($src, int $src_w, int $src_h) {
    $max = MAX_IMAGE_DIMENSION;

    // Nessun ridimensionamento necessario
    if ($src_w <= $max && $src_h <= $max) {
        return $src;
    }

    // Calcola nuove dimensioni mantenendo aspect ratio
    if ($src_w >= $src_h) {
        $new_w = $max;
        $new_h = (int) round($src_h * $max / $src_w);
    } else {
        $new_h = $max;
        $new_w = (int) round($src_w * $max / $src_h);
    }

    $dst = imagecreatetruecolor($new_w, $new_h);

    // Preserva trasparenza PNG
    imagealphablending($dst, false);
    imagesavealpha($dst, true);
    $transparent = imagecolorallocatealpha($dst, 0, 0, 0, 127);
    imagefilledrectangle($dst, 0, 0, $new_w, $new_h, $transparent);
    imagealphablending($dst, true);

    imagecopyresampled($dst, $src, 0, 0, 0, 0, $new_w, $new_h, $src_w, $src_h);

    return $dst;
}

/**
 * Processo completo: valida → carica → ruota (EXIF) → ridimensiona → salva WebP.
 *
 * @param  string $tmp_path   Percorso temporaneo upload
 * @param  int    $file_size  Bytes
 * @param  string $dest_path  Percorso destinazione assoluto (senza estensione)
 * @return array  ['ok' => bool, 'url' => string, 'error' => string]
 */
function process_and_save_image(string $tmp_path, int $file_size, string $dest_path): array {
    if (!check_gd_available()) {
        return ['ok' => false, 'error' => 'GD library non disponibile sul server'];
    }

    // 1. Validazione
    $validation = validate_image($tmp_path, $file_size);
    if (!$validation['valid']) {
        return ['ok' => false, 'error' => $validation['error']];
    }

    $mime  = $validation['mime'];
    $src_w = $validation['width'];
    $src_h = $validation['height'];

    // 2. Carica immagine GD
    $src = load_gd_image($tmp_path, $mime);
    if ($src === false || $src === null) {
        return ['ok' => false, 'error' => 'Impossibile decodificare l\'immagine'];
    }

    // 3. Correzione orientamento EXIF (solo JPEG)
    if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
        $exif = @exif_read_data($tmp_path);
        if (!empty($exif['Orientation'])) {
            $src = apply_exif_rotation($src, $exif['Orientation']);
            // Aggiorna dimensioni dopo rotazione
            $src_w = imagesx($src);
            $src_h = imagesy($src);
        }
    }

    // 4. Ridimensionamento
    $img = resize_if_needed($src, $src_w, $src_h);

    // 5. Salvataggio WebP
    $output_file = $dest_path . '.webp';
    $dir = dirname($output_file);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    $saved = imagewebp($img, $output_file, IMAGE_QUALITY);

    // Cleanup memoria
    if ($img !== $src) imagedestroy($img);
    imagedestroy($src);

    if (!$saved) {
        return ['ok' => false, 'error' => 'Errore nel salvataggio dell\'immagine'];
    }

    // 6. Costruisci URL pubblico
    // $dest_path è relativo a STORAGE_BASE_PATH, quindi estrai la parte relativa
    $relative = str_replace(STORAGE_BASE_PATH . '/', '', $dest_path);
    $public_url = STORAGE_BASE_URL . '/' . $relative . '.webp';

    return [
        'ok'   => true,
        'url'  => $public_url,
        'path' => $output_file,
        'size' => filesize($output_file),
    ];
}

/**
 * Applica la rotazione EXIF all'immagine GD.
 *
 * @param  resource|GdImage $img
 * @param  int $orientation  Valore EXIF 1-8
 * @return resource|GdImage
 */
function apply_exif_rotation($img, int $orientation) {
    switch ($orientation) {
        case 3: return imagerotate($img, 180, 0);
        case 6: return imagerotate($img, -90, 0);
        case 8: return imagerotate($img, 90, 0);
        // 2, 4, 5, 7 → flip (rari, non implementati per semplicità)
        default: return $img;
    }
}

/**
 * Genera un nome file sicuro e univoco per un POI.
 * Formato: {poi_id}/{timestamp}_{random}.webp
 *
 * @param  string $poi_id  UUID del POI
 * @return string  Percorso relativo senza estensione (aggiunta da process_and_save_image)
 */
function generate_safe_filename(string $poi_id): string {
    // Sanifica UUID — solo caratteri esadecimali e trattini
    $safe_id = preg_replace('/[^a-f0-9\-]/', '', strtolower($poi_id));
    if (strlen($safe_id) < 32) {
        $safe_id = bin2hex(random_bytes(16)); // fallback se UUID malformato
    }

    $timestamp = time();
    $random    = bin2hex(random_bytes(6)); // 12 caratteri hex

    return $safe_id . '/' . $timestamp . '_' . $random;
}
