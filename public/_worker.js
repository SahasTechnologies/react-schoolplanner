export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.hostname === "react-schoolplanner.pages.dev") {
      const newUrl = new URL(request.url);
      newUrl.hostname = "school.sahas.dpdns.org";
      return Response.redirect(newUrl.toString(), 301);
    }

    return env.ASSETS.fetch(request);
  },
};
