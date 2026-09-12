<?php
/**
 * Copy this file to cc-config.php on the server and fill it in.
 * cc-config.php holds live credentials and must NEVER be committed.
 *
 * Mirrors the shape the IWS mailer expects, so cc_send() works unchanged:
 * Resend API first, then authenticated SMTP, then mail().
 */

return array(

    /* Who receives the enquiry itself.
       brandom.designer@gmail.com is a TEMPORARY test recipient - delete it
       from this line once delivery to contact@ has been confirmed. */
    'to' => 'contact@capturecaribbean.com, brandom.designer@gmail.com',

    /* Preferred: Resend HTTPS API. Works where the host blocks outbound SMTP.
       capturecaribbean.com must be a VERIFIED domain in Resend, otherwise the
       mail is rejected or lands in spam. */
    'mail_api' => array(
        'api_key'   => 'PASTE_RESEND_API_KEY',
        'from'      => 'contact@capturecaribbean.com',
        'from_name' => 'Capture Caribbean',
    ),

    /* Fallback: authenticated SMTP. Used only if the API key is absent or fails. */
    'smtp' => array(
        'host'      => '',
        'port'      => 465,
        'secure'    => 'ssl',
        'user'      => 'contact@capturecaribbean.com',
        'pass'      => 'PASTE_MAILBOX_OR_APP_PASSWORD',
        'from'      => 'contact@capturecaribbean.com',
        'from_name' => 'Capture Caribbean',
    ),

    /* Browser origins allowed to POST here. The form is on the Pages site, so
       this is a cross-origin request and the list must include its real host. */
    'origins' => array(
        'https://capturecontests.com',
        'https://www.capturecontests.com',
        'https://capture-contests-dev.pages.dev',
        'https://dev-contests.capture-contests-dev.pages.dev',
        'http://localhost:4900',
    ),

    /* Where submissions are recorded. Put this ABOVE the web root so the
       JSON files are not publicly fetchable. */
    'store_dir' => dirname(__DIR__) . '/cc-enquiries',
);
