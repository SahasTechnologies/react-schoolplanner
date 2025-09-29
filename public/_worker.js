export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.hostname.endsWith('.pages.dev')) {
      const newUrl = new URL(request.url);
      newUrl.hostname = 'school.sahas.dpdns.org';
      return Response.redirect(newUrl.toString(), 301);
    }

    // Fallback to the default Pages behavior
    return env.ASSETS.fetch(request);
  },
};
