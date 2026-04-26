<?php
// =============================================================================
// POI•LOVE — media.poilove.com — Configurazione
// Cultural Bridge OS · MIT License
// =============================================================================
// ATTENZIONE: Non committare questo file con i valori reali su repository
// pubblici. Usa variabili d'ambiente Plesk o .env (non versionato).
// Questo file è il TEMPLATE — adatta i valori nel tuo Plesk.
// =============================================================================

// ---------------------------------------------------------------------------
// Supabase
// ---------------------------------------------------------------------------
define('SUPABASE_URL',         'https://ptppxwlafswfhbueakjt.supabase.co');
define('SUPABASE_ANON_KEY',    'YOUR_SUPABASE_ANON_KEY_HERE');
// Supabase anon key pubblica — usata per validare il JWT dell'utente
// Recuperala da: Supabase Dashboard → Settings → API → anon public

// ---------------------------------------------------------------------------
// Storage locale su Plesk
// ---------------------------------------------------------------------------
// Percorso assoluto della cartella dove salvare le immagini.
// Su Plesk di solito: /var/www/vhosts/poilove.com/media.poilove.com/httpdocs/poi/
// Adatta al tuo setup effettivo.
define('STORAGE_BASE_PATH',    __DIR__ . '/poi');
define('STORAGE_BASE_URL',     'https://media.poilove.com/poi');

// ---------------------------------------------------------------------------
// Limiti upload
// ---------------------------------------------------------------------------
define('MAX_FILE_SIZE',        5 * 1024 * 1024); // 5MB per singola immagine
define('MAX_PHOTOS_PER_POI',   3);               // max 3 foto per POI (UX core)
define('ALLOWED_MIME_TYPES',   ['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
define('OUTPUT_FORMAT',        'webp');           // converti tutto in WebP
define('IMAGE_QUALITY',        82);               // qualità WebP (82% = ottimo bilanciamento)
define('MAX_IMAGE_DIMENSION',  1200);             // px — lato più lungo

// ---------------------------------------------------------------------------
// Sicurezza
// ---------------------------------------------------------------------------
define('API_VERSION',          '1.0.0');
define('DEBUG_MODE',           false);            // MAI true in produzione!
// In debug mode le risposte di errore sono verbose.
// Attiva solo in sviluppo (accedi via IP Plesk diretto).
