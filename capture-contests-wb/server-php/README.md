# Capture Caribbean form mailer

PHP endpoint for the Partner Inquiry form. It lives here rather than in `public/`
on purpose: `public/` ships to Cloudflare Pages, which cannot execute PHP, and
uploading these files there would publish the source without ever running it.

## Files

| File | Purpose |
|---|---|
| `cc-inquiry-send.php` | The endpoint the form posts to. CORS, bot filters, record, two emails. |
| `cc-mailer.php` | Ported from IWS `smtp-send.php`. `cc_send()` = Resend API -> SMTP -> `mail()`. Also holds the auto-responder templates. |
| `cc-config.sample.php` | Copy to `cc-config.php` **on the server** and fill in. Never committed. |

## Install

1. Upload `cc-inquiry-send.php` and `cc-mailer.php` to the web root of
   **capturecaribbean.com**.
2. Copy `cc-config.sample.php` to `cc-config.php` beside them and fill in:
   - the Resend API key (preferred), or the SMTP block
   - `to` — currently `contact@capturecaribbean.com, brandom.designer@gmail.com`
3. Verify **capturecaribbean.com** as a sending domain in Resend, or the mail
   will be rejected or land in spam. This is the step that most often gets missed.
4. Make sure the store directory (`cc-enquiries/`, above the web root by default)
   is writable by PHP.
5. The domain sits behind Cloudflare with HTTP Basic auth. **The endpoint path
   must be excluded from that auth**, or the browser's POST gets a 401 before it
   reaches PHP.

## Adding another form

1. Write a new builder in `cc-mailer.php` (copy `cc_partner_inquiry_html`).
2. Add an entry to `cc_forms()` keyed by the form name.
3. Post `form: '<that key>'` from the front end.

Each form gets its own subject line and its own auto-responder copy — the
registry is what keeps them from collapsing into one generic reply.

## Test

    curl -i -X POST https://www.capturecaribbean.com/cc-inquiry-send.php \
      -H 'Content-Type: application/json' \
      -H 'Origin: https://capturecontests.com' \
      -d '{"form":"partner-inquiry","name":"Test","email":"you@example.com","organization":"Test Org"}'

Expect `{"ok":true}`. Note the endpoint drops anything completed in under three
seconds when `ccStart` is present, so omit `ccStart` when testing by hand.
