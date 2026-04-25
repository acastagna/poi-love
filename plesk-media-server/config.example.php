<?php
/**
 * POI•LOVE — Media Server Configuration (ESEMPIO)
 *
 * ⚠️  NON usare questo file direttamente.
 *     Copia in config.php e inserisci i valori reali.
 *     config.php è nel .gitignore e NON va su GitHub.
 */

// Dominio pubblico del media server (senza trailing slash)
define('MEDIA_BASE_URL', 'https://media.poilove.com');

// Path assoluto dove salvare i file su Plesk
define('UPLOAD_ROOT', __DIR__ . '/uploads');

// Secret per firmare il token di upload
// Genera con: php -r "echo bin2hex(random_bytes(32));"
define('UPLOAD_SECRET', 'SOSTITUISCI_CON_SECRET_SICURO');

// Supabase JWT secret
// Trova in: Supabase Dashboard → Settings → API → JWT Secret
define('SUPABASE_JWT_SECRET', 'SOSTITUISCI_CON_SUPABASE_JWT_SECRET');

// ─── Limiti upload ────────────────────────────────
define('MAX_PHOTOS_PER_POI',   3);
define('MAX_FILE_SIZE',        8 * 1024 * 1024);
define('ALLOWED_MIME_TYPES',   ['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
define('ALLOWED_EXTENSIONS',   ['jpg', 'jpeg', 'png', 'webp', 'heic']);
define('MAX_IMAGE_DIMENSION',  1920);
define('JPEG_QUALITY',         85);

// ─── CORS ─────────────────────────────────────────
define('ALLOWED_ORIGINS', [
    'https://poilove.com',
    'http://localhost:8081',
    'exp://localhost:8081',
]);
