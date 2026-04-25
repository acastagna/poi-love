<?php
/**
 * POI•LOVE — Media Server: Self-test
 * Accedi a /media/test.php per verificare che tutto funzioni
 * RIMUOVI QUESTO FILE IN PRODUZIONE
 */

require_once __DIR__ . '/config.php';

$checks = [];

// ─── PHP version ──────────────────────────────────
$checks['php_version'] = [
    'label'  => 'PHP >= 8.1',
    'ok'     => version_compare(PHP_VERSION, '8.1', '>='),
    'detail' => PHP_VERSION,
];

// ─── GD extension ─────────────────────────────────
$checks['gd'] = [
    'label'  => 'GD extension (image resize)',
    'ok'     => extension_loaded('gd'),
    'detail' => extension_loaded('gd') ? implode(', ', array_keys(gd_info())) : 'NOT LOADED',
];

// ─── Fileinfo extension ───────────────────────────
$checks['fileinfo'] = [
    'label'  => 'Fileinfo extension (MIME detection)',
    'ok'     => extension_loaded('fileinfo'),
    'detail' => extension_loaded('fileinfo') ? 'OK' : 'NOT LOADED',
];

// ─── Upload root scrivibile ───────────────────────
$upload_writable = is_dir(UPLOAD_ROOT)
    ? is_writable(UPLOAD_ROOT)
    : @mkdir(UPLOAD_ROOT, 0755, true);

$checks['upload_dir'] = [
    'label'  => 'Upload directory writable',
    'ok'     => (bool) $upload_writable,
    'detail' => UPLOAD_ROOT,
];

// ─── Config non defaults ─────────────────────────
$checks['config_upload_secret'] = [
    'label'  => 'UPLOAD_SECRET configurato',
    'ok'     => UPLOAD_SECRET !== 'SOSTITUISCI_CON_SECRET_SICURO',
    'detail' => UPLOAD_SECRET !== 'SOSTITUISCI_CON_SECRET_SICURO' ? 'OK' : '⚠ Ancora default!',
];

$checks['config_jwt_secret'] = [
    'label'  => 'SUPABASE_JWT_SECRET configurato',
    'ok'     => SUPABASE_JWT_SECRET !== 'SOSTITUISCI_CON_SUPABASE_JWT_SECRET',
    'detail' => SUPABASE_JWT_SECRET !== 'SOSTITUISCI_CON_SUPABASE_JWT_SECRET' ? 'OK' : '⚠ Ancora default!',
];

// ─── Output ───────────────────────────────────────
$all_ok = array_reduce($checks, fn($carry, $c) => $carry && $c['ok'], true);

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>POI•LOVE — Media Server Test</title>
<style>
  body { font-family: monospace; background: #1a1a1a; color: #eae4d8; padding: 2rem; }
  h1 { color: #D42B2B; }
  .ok   { color: #4caf50; }
  .fail { color: #f44336; }
  table { border-collapse: collapse; margin-top: 1rem; }
  td, th { padding: .4rem 1rem; border: 1px solid #333; text-align: left; }
  th { background: #333; }
  .summary { margin-top: 1.5rem; font-size: 1.2rem; }
</style>
</head>
<body>
<h1>POI•LOVE Media Server — Self Test</h1>
<p>Base URL: <strong><?= MEDIA_BASE_URL ?></strong></p>
<table>
  <tr><th>Check</th><th>Status</th><th>Dettaglio</th></tr>
  <?php foreach ($checks as $c): ?>
  <tr>
    <td><?= htmlspecialchars($c['label']) ?></td>
    <td class="<?= $c['ok'] ? 'ok' : 'fail' ?>"><?= $c['ok'] ? '✓ OK' : '✗ FAIL' ?></td>
    <td><?= htmlspecialchars($c['detail']) ?></td>
  </tr>
  <?php endforeach; ?>
</table>
<p class="summary <?= $all_ok ? 'ok' : 'fail' ?>">
  <?= $all_ok ? '✓ Tutto OK — pronto per il deploy' : '✗ Correggi i check falliti prima di procedere' ?>
</p>
<p style="color:#888; margin-top:2rem; font-size:.85rem;">⚠ Rimuovi questo file (test.php) in produzione.</p>
</body>
</html>
