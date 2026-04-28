const CREDENTIALS = [
  { username: 'photojomo', password: 'p0t0j0m0' },
  { username: 'BayGardens', password: 'B4yG4rd3ns' },
];

function unauthorized() {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Capture Caribbean"',
    },
  });
}

export default {
  async fetch(request, env) {
    const authorization = request.headers.get('Authorization');

    if (!authorization || !authorization.startsWith('Basic ')) {
      return unauthorized();
    }

    const credentials = atob(authorization.slice(6));
    const [user, pass] = credentials.split(':');

    if (!CREDENTIALS.some(c => c.username === user && c.password === pass)) {
      return unauthorized();
    }

    return env.ASSETS.fetch(request);
  },
};
