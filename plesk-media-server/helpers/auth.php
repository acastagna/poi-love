<?php
// =============================================================================
// POI•LOVE — Helpers: Autenticazione JWT Supabase
// =============================================================================
// Strategia: valida il token chiamando Supabase /auth/v1/user.
// Non serve la JWT secret — Supabase verifica internamente e restituisce
// l'utente se il token è valido e non scaduto.
// =============================================================================

/**
 * Estrae il Bearer token dall'header Authorization.
 *
 * @return string|null  Il token, o null se assente/malformato
 */
function extract_bearer_token(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION']
           ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
           ?? '';

    if (empty($header)) {
        // Alcuni setup Apache non passano Authorization via $_SERVER
        // Prova getallheaders()
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $name => $value) {
                if (strtolower($name) === 'authorization') {
                    $header = $value;
                    break;
                }
            }
        }
    }

    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        return null;
    }

    return trim($matches[1]);
}

/**
 * Valida un Supabase JWT e restituisce i dati utente.
 * Chiama l'endpoint Supabase /auth/v1/user — il token viene verificato
 * server-side da Supabase (firma + scadenza).
 *
 * @param  string $token  Il Bearer token
 * @return array|null     Array con 'id' (UUID utente) e 'email', o null se non valido
 */
function validate_supabase_token(string $token): ?array {
    if (empty($token) || strlen($token) < 20) {
        return null;
    }

    $url = SUPABASE_URL . '/auth/v1/user';

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $token,
            'apikey: '              . SUPABASE_ANON_KEY,
            'Content-Type: application/json',
        ],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_error = curl_error($ch);
    curl_close($ch);

    if ($curl_error) {
        error_log("POI•LOVE auth: cURL error → $curl_error");
        return null;
    }

    if ($http_code !== 200) {
        // 401 = token non valido o scaduto
        return null;
    }

    $user = json_decode($response, true);

    if (!isset($user['id'])) {
        return null;
    }

    return [
        'id'    => $user['id'],
        'email' => $user['email'] ?? '',
        'role'  => $user['role']  ?? 'authenticated',
    ];
}

/**
 * Shortcut: estrae e valida il token in un solo passaggio.
 * Termina con 401 se non autenticato.
 *
 * @return array  ['id' => uuid, 'email' => string, 'role' => string]
 */
function require_auth(): array {
    $token = extract_bearer_token();

    if ($token === null) {
        error_response('Token di autenticazione mancante', 401);
    }

    $user = validate_supabase_token($token);

    if ($user === null) {
        error_response('Token non valido o scaduto', 401);
    }

    return $user;
}
