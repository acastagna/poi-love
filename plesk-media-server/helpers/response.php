<?php
// =============================================================================
// POI•LOVE — Helpers: Response JSON
// =============================================================================

/**
 * Invia una risposta JSON e termina l'esecuzione.
 *
 * @param int   $status  HTTP status code
 * @param array $data    Payload da serializzare
 */
function send_json(int $status, array $data): void {
    // Assicura che nessun output precedente abbia iniziato
    if (headers_sent($file, $line)) {
        error_log("POI•LOVE: headers già inviati in $file:$line");
    }

    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Risposta di successo standardizzata.
 */
function success(array $data = [], int $status = 200): void {
    send_json($status, array_merge(['ok' => true], $data));
}

/**
 * Risposta di errore standardizzata.
 * In DEBUG_MODE include il dettaglio; in produzione solo il messaggio generico.
 */
function error_response(string $message, int $status = 400, ?string $detail = null): void {
    $body = ['ok' => false, 'error' => $message];

    if ($detail !== null && defined('DEBUG_MODE') && DEBUG_MODE) {
        $body['detail'] = $detail;
    }

    send_json($status, $body);
}

/**
 * Risposta 405 Method Not Allowed con header Allow.
 */
function method_not_allowed(array $allowed = ['POST']): void {
    header('Allow: ' . implode(', ', $allowed));
    error_response('Metodo non consentito', 405);
}
