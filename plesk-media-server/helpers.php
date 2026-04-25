<?php
/**
 * POI•LOVE — Media Server Helpers
 */

require_once __DIR__ . '/config.php';

// ───────────────────────────────────────────
//  CORS
// ───────────────────────────────────────────

function handle_cors(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if (in_array($origin, ALLOWED_ORIGINS, true)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-POI-ID');
    header('Access-Control-Max-Age: 86400');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

// ───────────────────────────────────────────
//  JSON response helpers
// ───────────────────────────────────────────

function json_ok(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

function json_error(string $message, int $code = 400): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $message]);
    exit;
}

// ───────────────────────────────────────────
//  Autenticazione — Bearer JWT (Supabase)
//  Ritorna il sub (user UUID) se valido
// ───────────────────────────────────────────

function authenticate_request(): string {
    $auth_header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($auth_header, 'Bearer ')) {
        json_error('Missing or invalid Authorization header', 401);
    }

    $token = substr($auth_header, 7);

    // Decodifica JWT senza librerie esterne (verifica firma HS256)
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        json_error('Malformed JWT', 401);
    }

    [$header_b64, $payload_b64, $sig_b64] = $parts;

    // Verifica firma
    $expected_sig = base64url_encode(
        hash_hmac('sha256', "$header_b64.$payload_b64", SUPABASE_JWT_SECRET, true)
    );
    if (!hash_equals($expected_sig, $sig_b64)) {
        json_error('Invalid JWT signature', 401);
    }

    // Decodifica payload
    $payload = json_decode(base64url_decode($payload_b64), true);
    if (!$payload) {
        json_error('Cannot decode JWT payload', 401);
    }

    // Verifica scadenza
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        json_error('JWT expired', 401);
    }

    // Ritorna user UUID (sub)
    $user_id = $payload['sub'] ?? null;
    if (!$user_id) {
        json_error('JWT missing sub claim', 401);
    }

    return $user_id;
}

// ───────────────────────────────────────────
//  Validazione POI UUID
// ───────────────────────────────────────────

function validate_poi_id(string $poi_id): bool {
    return (bool) preg_match(
        '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i',
        $poi_id
    );
}

// ───────────────────────────────────────────
//  Sanitizzazione path — previene directory traversal
// ───────────────────────────────────────────

function safe_poi_dir(string $poi_id): string {
    if (!validate_poi_id($poi_id)) {
        json_error('Invalid POI ID format', 400);
    }
    $dir = UPLOAD_ROOT . '/' . strtolower($poi_id);
    return $dir;
}

// ───────────────────────────────────────────
//  Resize immagine (GD — disponibile su Plesk)
//  Ritorna path del file ottimizzato
// ───────────────────────────────────────────

function resize_and_save(string $tmp_path, string $dest_path, string $mime): bool {
    if (MAX_IMAGE_DIMENSION === 0) {
        return copy($tmp_path, $dest_path);
    }

    [$orig_w, $orig_h] = getimagesize($tmp_path);
    $max = MAX_IMAGE_DIMENSION;

    if ($orig_w <= $max && $orig_h <= $max) {
        // Già abbastanza piccola — salva direttamente come JPEG
        $src = image_create_from_any($tmp_path, $mime);
        if (!$src) return copy($tmp_path, $dest_path);
        $result = imagejpeg($src, $dest_path, JPEG_QUALITY);
        imagedestroy($src);
        return $result;
    }

    // Calcola nuove dimensioni mantenendo aspect ratio
    if ($orig_w > $orig_h) {
        $new_w = $max;
        $new_h = (int) round($orig_h * ($max / $orig_w));
    } else {
        $new_h = $max;
        $new_w = (int) round($orig_w * ($max / $orig_h));
    }

    $src   = image_create_from_any($tmp_path, $mime);
    $dst   = imagecreatetruecolor($new_w, $new_h);

    // Preserva trasparenza per PNG
    imagealphablending($dst, false);
    imagesavealpha($dst, true);

    imagecopyresampled($dst, $src, 0, 0, 0, 0, $new_w, $new_h, $orig_w, $orig_h);

    $result = imagejpeg($dst, $dest_path, JPEG_QUALITY);

    imagedestroy($src);
    imagedestroy($dst);

    return $result;
}

function image_create_from_any(string $path, string $mime): GdImage|false {
    return match($mime) {
        'image/jpeg' => imagecreatefromjpeg($path),
        'image/png'  => imagecreatefrompng($path),
        'image/webp' => imagecreatefromwebp($path),
        default      => imagecreatefromjpeg($path), // fallback
    };
}

// ───────────────────────────────────────────
//  Base64URL encode/decode (per JWT)
// ───────────────────────────────────────────

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}
