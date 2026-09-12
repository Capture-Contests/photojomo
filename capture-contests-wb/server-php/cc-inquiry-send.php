<?php
/**
 * Capture Caribbean form endpoint.
 *
 * Ported from the Inner Web Solutions contact-send.php, keeping its bot
 * defences (honeypot, timing trap, per-IP rate limit) and its ordering: the
 * enquiry is recorded to disk BEFORE any mail is attempted, because the email
 * is a notification and the file is the record.
 *
 * Two messages go out per submission:
 *   1. the enquiry itself, to the team
 *   2. an auto-responder to whoever submitted it, chosen by "form"
 *
 * POST JSON: { form, name, email, ... , fax, ccStart } -> { ok:true }
 */

require_once __DIR__ . '/cc-mailer.php';

$cfg = @include __DIR__ . '/cc-config.php';
if (!is_array($cfg)) { $cfg = array(); }

/* Recipients. brandom.designer@gmail.com is a TEMPORARY test recipient -
   remove it from cc-config.php once delivery has been confirmed. */
$TO = isset($cfg['to']) && $cfg['to'] !== ''
    ? $cfg['to']
    : 'contact@capturecaribbean.com, brandom.designer@gmail.com';

/* ---- CORS ---------------------------------------------------------------
   The form is served from the Cloudflare Pages site, so this is a
   cross-origin POST. Only the known front ends are allowed; anything else
   gets no CORS header and the browser blocks it. */
$ALLOWED = isset($cfg['origins']) ? $cfg['origins'] : array(
    'https://capturecontests.com',
    'https://www.capturecontests.com',
    'https://capture-contests-dev.pages.dev',
    'https://dev-contests.capture-contests-dev.pages.dev',
    'http://localhost:4900',
);
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($origin !== '' && in_array($origin, $ALLOWED, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Max-Age: 86400');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

header('Content-Type: application/json');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); echo json_encode(array('ok' => false)); exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) { $body = array(); }

function cc_g($a, $k, $max) {
    return isset($a[$k]) && !is_array($a[$k]) ? substr(trim((string)$a[$k]), 0, $max) : '';
}
function cc_list($a, $k) {
    if (!isset($a[$k]) || !is_array($a[$k])) { return array(); }
    $vals = array_map(function ($v) { return substr(trim((string)$v), 0, 80); }, $a[$k]);
    return array_slice(array_values(array_filter($vals)), 0, 25);
}

$form  = cc_g($body, 'form', 40);
$forms = cc_forms();
if (!isset($forms[$form])) { $form = 'partner-inquiry'; }

$name  = cc_g($body, 'name', 120);
$email = cc_g($body, 'email', 160);

/* ---- Bot filters --------------------------------------------------------
   Both answer 200 {"ok":true}. A spam script that receives an error learns the
   trap exists and retries in a different shape; silence teaches it nothing.
   Nothing is stored and nothing is emailed on either path. */

// 1. Honeypot: the 'fax' input is off-screen, so only a script fills it.
if (cc_g($body, 'fax', 100) !== '') { echo json_encode(array('ok' => true)); exit; }

// 2. Timing: ccStart is stamped when the form loads. A human cannot complete
//    it in under three seconds. Negative means a skewed client clock, not a
//    bot, so that case is allowed through.
$startMs = isset($body['ccStart']) ? (float)$body['ccStart'] : 0;
if ($startMs > 0) {
    $elapsed = (microtime(true) * 1000) - $startMs;
    if ($elapsed >= 0 && $elapsed < 3000) { echo json_encode(array('ok' => true)); exit; }
}

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400); echo json_encode(array('ok' => false, 'error' => 'invalid')); exit;
}

/* Cloudflare fronts this domain, so REMOTE_ADDR is Cloudflare's proxy.
   CF-Connecting-IP is the visitor's real address. */
$ip = isset($_SERVER['HTTP_CF_CONNECTING_IP']) ? $_SERVER['HTTP_CF_CONNECTING_IP']
    : (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '');

/* 3. Rate limit per IP (5/hour, 15/day), applied after validation so malformed
      junk does not consume a genuine visitor's allowance. Fails OPEN: a disk
      problem must never cost a real enquiry. */
function cc_rate_ok($ip, $dir) {
    if ($ip === '') { return true; }
    $f    = $dir . '/rate-' . sha1($ip) . '.json';
    $now  = time();
    $hits = array();
    if (is_file($f)) {
        $j = json_decode(@file_get_contents($f), true);
        if (is_array($j)) { $hits = $j; }
    }
    $hits = array_values(array_filter($hits, function ($t) use ($now) { return ($now - (int)$t) < 86400; }));
    $hour = count(array_filter($hits, function ($t) use ($now) { return ($now - (int)$t) < 3600; }));
    if ($hour >= 5 || count($hits) >= 15) { return false; }
    $hits[] = $now;
    @file_put_contents($f, json_encode($hits), LOCK_EX);
    return true;
}

/* Store outside the web root where possible - same shape as the IWS stores. */
$store = isset($cfg['store_dir']) ? $cfg['store_dir'] : dirname(__DIR__) . '/cc-enquiries';
if (!is_dir($store)) { @mkdir($store, 0775, true); }

if (!cc_rate_ok($ip, $store)) {
    http_response_code(429); echo json_encode(array('ok' => false, 'error' => 'rate_limited')); exit;
}

/* ---- Build the team notification ---------------------------------------- */
$fields = array(
    'Name'          => $name,
    'Organisation'  => cc_g($body, 'organization', 160),
    'Role'          => cc_g($body, 'role', 120),
    'Email'         => $email,
    'Phone'         => cc_g($body, 'phone', 60),
    'Website'       => cc_g($body, 'website', 200),
    'Country'       => cc_g($body, 'country', 80),
    'Interested in' => implode(', ', cc_list($body, 'interests')),
    'Goals'         => implode(', ', cc_list($body, 'goals')),
    'Opportunity'   => cc_g($body, 'opportunity', 4000),
    'IP address'    => $ip,
);
$bold = array('Name' => 1, 'Organisation' => 1, 'Phone' => 1, 'Interested in' => 1);
$rows = '';
foreach ($fields as $lab => $val) {
    if ($val === '') { continue; }
    $v = htmlspecialchars($val, ENT_QUOTES, 'UTF-8');
    if (isset($bold[$lab])) { $v = '<strong>' . $v . '</strong>'; }
    $rows .= '<tr><td style="padding:3px 14px 3px 0;color:#666;vertical-align:top">' . $lab
           . '</td><td style="padding:3px 0">' . $v . '</td></tr>';
}
$notifyHtml = '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a1d22">'
            . '<h2 style="color:#df5e26;margin:0 0 12px">' . htmlspecialchars($forms[$form]['notify']) . '</h2>'
            . '<table style="border-collapse:collapse">' . $rows . '</table></div>';

/* ---- Record first, then mail -------------------------------------------- */
$record = array(
    'form' => $form,
    'at'   => gmdate('c'),
    'ip'   => $ip,
    'ua'   => isset($_SERVER['HTTP_USER_AGENT']) ? substr($_SERVER['HTTP_USER_AGENT'], 0, 300) : '',
);
foreach ($fields as $lab => $val) { $record[$lab] = $val; }
@file_put_contents(
    $store . '/' . gmdate('Ymd-His') . '-' . substr(sha1($email . microtime()), 0, 6) . '.json',
    json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
);

// 1. the enquiry, to the team - Reply-To is the sender so a reply goes straight back
cc_send($cfg, $TO, $forms[$form]['notify'] . ' - ' . $name, $notifyHtml, $email);

// 2. the auto-responder, to whoever submitted it
$builder = $forms[$form]['builder'];
$ackHtml = $builder(array(
    'name'         => $name,
    'organization' => $fields['Organisation'],
    'country'      => $fields['Country'],
    'interests'    => cc_list($body, 'interests'),
    'goals'        => cc_list($body, 'goals'),
));
cc_send($cfg, $email, $forms[$form]['subject'], $ackHtml, 'contact@capturecaribbean.com');

echo json_encode(array('ok' => true));
