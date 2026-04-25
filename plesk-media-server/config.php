<?php
/**
 * POI•LOVE — Media Server Configuration
 * Plesk PHP Upload API
 *
 * Copia questo file in /var/www/vhosts/[tuo-dominio]/httpdocs/media/
 * e adatta le costanti alla tua configurazione Plesk.
 */

// ═══════════════════════════════════════════════════
//  CONFIGURAZIONE — modifica questi valori su Plesk
// ═══════════════════════════════════════════════════

// Dominio pubblico del media server (senza trailing slash)
define('MEDIA_BASE_URL', 'https://media.poilove.com');

// Path assoluto dove salvare i file (deve essere scrivibile dal webserver)
// Su Plesk solitamente: /var/www/vhosts/<dominio>/httpdocs/uploads
define('UPLOAD_ROOT', __DIR__ . '/uploads');

// Secret usato per firmare il token di upload
// Genera con: php -r "echo bin2hex(random_bytes(32));"
// Deve essere lo stesso valore impostato in Supabase come secret ENV
define('UPLOAD_SECRET', 'SOSTITUISCI_CON_SECRET_SICURO');

// Supabase JWT secret (per validazione opzionale server-side del JWT)
// Trova in: Supabase Dashboard → Settings → API → JWT Secret
define('SUPABASE_JWT_SECRET', 'SOSTITUISCI_CON_SUPABASE_JWT_SECRET');

// ═══════════════════════════════════════════════════
//  LIMITI UPLOAD
// ═══════════════════════════════════════════════════

// Max foto per POI
define('MAX_PHOTOS_PER_POI', 3);

// Dimensione max per file (bytes) — default 8MB
define('MAX_FILE_SIZE', 8 * 1024 * 1024);

// Tipi MIME accettati
define('ALLOWED_MIME_TYPES', ['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

// Estensioni accettate (lowercase)
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'webp', 'heic']);

// Dimensione massima lato lungo dopo resize (px) — 0 = no resize
define('MAX_IMAGE_DIMENSION', 1920);

// Qualità JPEG output (1-100)
define('JPEG_QUALITY', 85);

// ═══════════════════════════════════════════════════
//  CORS — domini autorizzati
// ═══════════════════════════════════════════════════
define('ALLOWED_ORIGINS', [
    'https://poilove.com',
    'https://www.poilove.com',
    'https://acastagna.github.io',
    'http://localhost:8081',   // Expo dev
    'http://localhost:3000',   // Web dev
    'exp://localhost:8081',    // Expo Go
]);
