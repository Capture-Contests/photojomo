/**
 * Production environment. Mirrors the shape used by
 * capture-caribbean-sweepstakes-wb so both apps read the same way.
 *
 * inquiryEndpoint is deliberately a full URL rather than a path: the form is
 * served from Cloudflare Pages, and where the enquiry is actually delivered is
 * still being decided. Changing target is a change here, not in the component.
 */
export const environment = {
  production: true,
  apiBaseUrl: '',
  inquiryEndpoint: '/api/inquiry',
};
