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
      // Serve our custom 301 info page instead of redirecting
      const rewritten = new URL(url.toString());
      rewritten.pathname = '/301.html';
      rewritten.search = '';
      rewritten.hash = '';
      return env.ASSETS.fetch(new Request(rewritten.toString(), request));
    }

    return env.ASSETS.fetch(request);
  },
};
