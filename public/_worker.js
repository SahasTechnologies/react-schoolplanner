export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = request.headers.get('host') || url.hostname;

    // Redirect any requests hitting the Pages domain for this project (including preview branches)
    // e.g. react-schoolplanner.pages.dev or <branch>.react-schoolplanner.pages.dev
    if (
      host === 'react-schoolplanner.pages.dev' ||
      host.endsWith('.react-schoolplanner.pages.dev')
    ) {
      const target = new URL(request.url);
      target.protocol = 'https:'; // ensure HTTPS on destination
      target.hostname = 'school.sahas.dpdns.org';
      // Path, search, and hash are preserved by default
      return Response.redirect(target.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
