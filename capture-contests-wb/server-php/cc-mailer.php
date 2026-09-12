<?php
/**
 * Capture Caribbean mailer.
 *
 * Ported from the Inner Web Solutions mailer (smtp-send.php) so the delivery
 * chain that is already proven on this hosting is reused unchanged: Resend API
 * first, then authenticated SMTP, then mail() as a last resort. Only the
 * branding, the From address and the templates differ.
 *
 * Credentials live in cc-config.php, which is NOT in the repository.
 */

/**
 * Minimal authenticated SMTP sender (no library) so mail is sent THROUGH Purelymail and passes
 * SPF/DKIM/DMARC. GoDaddy's mail() sends as our domain from an unauthorized server, which our
 * DMARC p=reject policy causes Gmail + Purelymail to reject — hence nothing arrives.
 *
 * Configure the 'smtp' block in cc-config.php. Returns array('ok'=>bool,'error'=>?,'log'=>[]).
 * The auth credentials are NEVER written to the returned log.
 */

function smtp_send($smtp, $toList, $subject, $htmlBody, $replyTo = '') {
    $host     = isset($smtp['host'])   ? $smtp['host']   : '';
    $port     = isset($smtp['port'])   ? (int)$smtp['port'] : 465;
    $secure   = isset($smtp['secure']) ? $smtp['secure'] : 'ssl';   // 'ssl' (465) or 'tls' (587 STARTTLS)
    $user     = isset($smtp['user'])   ? $smtp['user']   : '';
    $pass     = isset($smtp['pass'])   ? $smtp['pass']   : '';
    $from     = isset($smtp['from'])   ? $smtp['from']   : $user;
    $fromName = isset($smtp['from_name']) ? $smtp['from_name'] : '';

    if ($host === '' || $user === '' || $pass === '' || $pass === 'PASTE_MAILBOX_OR_APP_PASSWORD') {
        return array('ok' => false, 'error' => 'SMTP not configured (fill the smtp block in cc-config.php)');
    }
    if (!is_array($toList)) { $toList = explode(',', (string)$toList); }
    $toList = array_values(array_filter(array_map('trim', $toList)));
    if (!count($toList)) { return array('ok' => false, 'error' => 'no recipients'); }

    $log = array();
    $transport = ($secure === 'ssl') ? 'ssl://' : 'tcp://';
    $ctx = stream_context_create(array('ssl' => array('verify_peer' => false, 'verify_peer_name' => false)));
    $en = 0; $es = '';
    $fp = @stream_socket_client($transport . $host . ':' . $port, $en, $es, 20, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) { return array('ok' => false, 'error' => 'connect failed: ' . $es . ' (' . $en . ') — GoDaddy may block outbound SMTP', 'log' => $log); }
    stream_set_timeout($fp, 20);

    $read = function () use ($fp, &$log) {
        $data = '';
        while (($line = fgets($fp, 515)) !== false) {
            $data .= $line; $log[] = rtrim($line);
            if (isset($line[3]) && $line[3] === ' ') break;
        }
        return $data;
    };
    $say = function ($c, $hide = false) use ($fp, &$log) { $log[] = '> ' . ($hide ? '[redacted]' : $c); fwrite($fp, $c . "\r\n"); };
    $is  = function ($resp, $codes) { return in_array((int)substr($resp, 0, 3), (array)$codes, true); };
    $bail = function ($m) use ($fp, &$log) { @fclose($fp); return array('ok' => false, 'error' => $m, 'log' => $log); };

    if (!$is($read(), 220)) { return $bail('no 220 greeting'); }
    $say('EHLO innerwebsolutions.com'); if (!$is($read(), 250)) { return $bail('EHLO rejected'); }

    if ($secure === 'tls') {
        $say('STARTTLS'); if (!$is($read(), 220)) { return $bail('STARTTLS refused'); }
        if (!@stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) { return $bail('TLS negotiation failed'); }
        $say('EHLO innerwebsolutions.com'); $read();
    }

    $say('AUTH LOGIN'); if (!$is($read(), 334)) { return $bail('AUTH LOGIN not supported'); }
    $say(base64_encode($user), true); if (!$is($read(), 334)) { return $bail('username rejected'); }
    $say(base64_encode($pass), true); if (!$is($read(), 235)) { return $bail('auth failed — check smtp user/pass'); }

    $say('MAIL FROM:<' . $from . '>'); if (!$is($read(), 250)) { return $bail('MAIL FROM rejected'); }
    foreach ($toList as $rcpt) { $say('RCPT TO:<' . $rcpt . '>'); if (!$is($read(), array(250, 251))) { return $bail('RCPT rejected: ' . $rcpt); } }
    $say('DATA'); if (!$is($read(), 354)) { return $bail('DATA rejected'); }

    $fromHdr = $fromName ? ('"' . str_replace('"', '', $fromName) . '" <' . $from . '>') : $from;
    $headers = array(
        'From: ' . $fromHdr, 'To: ' . implode(', ', $toList), 'Subject: ' . $subject,
        'MIME-Version: 1.0', 'Content-Type: text/html; charset=UTF-8', 'Date: ' . date('r'),
    );
    if ($replyTo !== '') { $headers[] = 'Reply-To: ' . $replyTo; }
    $body = preg_replace('/^\./m', '..', $htmlBody);            // dot-stuffing
    fwrite($fp, implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.\r\n");
    if (!$is($read(), 250)) { return $bail('message not accepted'); }
    $say('QUIT'); @fclose($fp);
    return array('ok' => true, 'log' => $log);
}

/**
 * Send via the Resend HTTP API (https, port 443 — works even where GoDaddy blocks SMTP).
 * Needs a domain verified in Resend so the mail is DKIM-signed for innerwebsolutions.com (passes DMARC).
 */
function resend_send($api, $to, $subject, $html, $replyTo = '') {
    $key  = isset($api['api_key']) ? $api['api_key'] : '';
    $from = isset($api['from']) ? $api['from'] : '';
    if ($key === '' || strpos($key, 'PASTE') !== false || $from === '') {
        return array('ok' => false, 'error' => 'Resend API not configured');
    }
    $fromName = isset($api['from_name']) ? $api['from_name'] : '';
    $fromHdr  = $fromName ? ($fromName . ' <' . $from . '>') : $from;
    if (!is_array($to)) { $to = array_filter(array_map('trim', explode(',', (string)$to))); }
    $payload = array('from' => $fromHdr, 'to' => array_values($to), 'subject' => $subject, 'html' => $html);
    if ($replyTo !== '') { $payload['reply_to'] = $replyTo; }

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, array(
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => array('Authorization: Bearer ' . $key, 'Content-Type: application/json'),
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_TIMEOUT        => 25,
    ));
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $cerr = curl_error($ch);
    curl_close($ch);
    if ($res === false) { return array('ok' => false, 'error' => 'curl: ' . $cerr); }
    $j = json_decode($res, true);
    if ($code >= 200 && $code < 300 && isset($j['id'])) { return array('ok' => true, 'id' => $j['id']); }
    return array('ok' => false, 'code' => $code, 'error' => 'API ' . $code . ': ' . substr($res, 0, 300));
}

/** Best-available mailer: Resend API first (works on GoDaddy), then SMTP, then mail(). */
function cc_send($cfg, $to, $subject, $html, $replyTo = '') {
    $first = null;
    $api = isset($cfg['mail_api']) ? $cfg['mail_api'] : array();
    if (!empty($api['api_key']) && strpos($api['api_key'], 'PASTE') === false) {
        $r = resend_send($api, $to, $subject, $html, $replyTo); $r['via'] = 'api';
        if (!empty($r['ok'])) { return $r; }
        // 429 = rate limited. That is a "slow down", NOT a delivery failure - the
        // message is fine, there were simply too many requests at once. Falling
        // through to SMTP/mail() here converts a throttled request into a delivery
        // by another route, which is how a burst of requests turns into a burst of
        // duplicate emails in the inbox. Stop here and let the caller see the 429.
        if (isset($r['code']) && (int)$r['code'] === 429) { return $r; }
        $first = $r;
    }
    $smtp = isset($cfg['smtp']) ? $cfg['smtp'] : array();
    if (!empty($smtp['host'])) {
        $r = smtp_send($smtp, $to, $subject, $html, $replyTo); $r['via'] = 'smtp';
        if (!empty($r['ok'])) { return $r; }
        if ($first === null) { $first = $r; }
    }
    $headers = "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nFrom: hello@innerwebsolutions.com\r\n"
             . ($replyTo !== '' ? ('Reply-To: ' . $replyTo . "\r\n") : '');
    @mail(is_array($to) ? implode(',', $to) : $to, $subject, $html, $headers);
    return $first !== null ? $first : array('ok' => false, 'error' => 'no mailer configured', 'via' => 'mail');
}


/* =========================================================================
   AUTO-RESPONDERS
   One builder per form. Modelled on the IWS buyer_booking_html() template —
   dark logo bar, bordered card, single accent colour, reply-to-this-email
   close — so the two brands' mail reads as coming from the same studio.
   Add a new function here (and a new entry in CC_FORMS) per extra form.
   ========================================================================= */

/** Shell shared by every Capture Caribbean auto-responder. */
function cc_shell_html($heading, $intro, $rows, $closing) {
    $site = 'https://www.capturecaribbean.com';
    $table = $rows === ''
        ? ''
        : '<table style="border-collapse:collapse;font-size:15px;margin-bottom:18px">' . $rows . '</table>';
    return '<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1d22;max-width:560px;margin:0 auto">'
         . '<div style="background:#0c0e14;padding:18px;text-align:center;border-radius:10px 10px 0 0">'
         . '<span style="color:#fff;font-size:19px;letter-spacing:.12em;text-transform:uppercase">Capture Caribbean</span>'
         . '</div>'
         . '<div style="border:1px solid #e3e6ea;border-top:0;border-radius:0 0 10px 10px;padding:26px">'
         . '<h1 style="color:#df5e26;font-size:20px;margin:0 0 10px">' . $heading . '</h1>'
         . '<p style="font-size:15px;line-height:1.6;margin:0 0 16px">' . $intro . '</p>'
         . $table
         . '<p style="font-size:15px;line-height:1.6;margin:0 0 18px">' . $closing . '</p>'
         . '<div style="text-align:center;margin:0 0 8px"><a href="' . $site . '" style="display:inline-block;background:#df5e26;color:#fff;text-decoration:none;font-weight:bold;font-size:14px;padding:11px 24px;border-radius:7px">Visit capturecaribbean.com</a></div>'
         . '<p style="font-size:14px;color:#555;line-height:1.6;margin:18px 0 0">Questions? Just reply to this email &mdash; it reaches us directly.</p>'
         . '<p style="font-size:13px;color:#9aa0a8;margin:16px 0 0"><a href="' . $site . '" style="color:#df5e26;text-decoration:none">capturecaribbean.com</a> &middot; Capture Contests</p>'
         . '</div></div>';
}

/**
 * Auto-responder for the PARTNER INQUIRY form (/partner-inquiry).
 * Deliberately its own function rather than a branch in a generic one: a
 * partner enquiry is a business conversation and the copy has to say what
 * happens next, which is not what a general contact reply would say.
 * $d: name, organization, country, interests[], goals[]
 */
function cc_partner_inquiry_html($d) {
    $e = function ($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); };
    $name = isset($d['name']) ? trim((string)$d['name']) : '';
    $first = $name !== '' ? preg_split('/\s+/', $name)[0] : '';

    $rows = '';
    $add = function ($lab, $val) use (&$rows, $e) {
        if ($val === '' || $val === null) { return; }
        if (is_array($val)) { $val = implode(', ', $val); if (trim($val) === '') { return; } }
        $rows .= '<tr><td style="padding:4px 16px 4px 0;color:#666;vertical-align:top">' . $lab
               . '</td><td style="padding:4px 0"><strong>' . $e($val) . '</strong></td></tr>';
    };
    $add('Organisation', isset($d['organization']) ? $d['organization'] : '');
    $add('Country',      isset($d['country'])      ? $d['country']      : '');
    $add('Interested in',isset($d['interests'])    ? $d['interests']    : '');
    $add('Goals',        isset($d['goals'])        ? $d['goals']        : '');

    return cc_shell_html(
        'Thank you' . ($first !== '' ? ', ' . $e($first) : '') . '!',
        'We have your partnership enquiry and a member of the Capture Caribbean team will be in touch '
        . 'within two business days to talk it through. Here is what you sent us:',
        $rows,
        'In the meantime, nothing is needed from you. If anything changes, or you would like to add '
        . 'detail before we speak, simply reply to this message.'
    );
}

/** Registry: form key => subject + builder. One entry per form. */
function cc_forms() {
    return array(
        'partner-inquiry' => array(
            'subject'  => 'Thank you for your partnership enquiry — Capture Caribbean',
            'builder'  => 'cc_partner_inquiry_html',
            'notify'   => 'New partnership enquiry',
        ),
    );
}
