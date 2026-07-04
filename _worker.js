// mitsuki-web — Cloudflare Pages advanced-mode Worker.
//
// Pages runs this for every request. Static files are served straight from the
// ASSETS binding (unchanged behaviour). The only dynamic route is /download/* :
// it resolves the latest GitHub release DMG, 302-redirects there, and fires an
// anonymous, server-side click event to Supabase. No cookie, no client-side
// script — consistent with the site's "no analytics SDKs / no tracking" policy.

const GITHUB_LATEST = "https://api.github.com/repos/baoueb/Mitsuki/releases/latest";
const RELEASES_PAGE = "https://github.com/baoueb/Mitsuki/releases/latest";
const TRACK_URL = "https://taslgchmtflgfdgjwsco.supabase.co/functions/v1/track-download";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/download" || url.pathname.startsWith("/download/")) {
      return handleDownload(request, url, ctx);
    }
    // Everything else is a static asset (Pages provides the ASSETS binding).
    return env.ASSETS.fetch(request);
  },
};

async function handleDownload(request, url, ctx) {
  const platform = (url.pathname.replace(/^\/download\/?/, "") || "mac").slice(0, 32);

  // Resolve the latest .dmg; fall back to the releases page if GitHub is down.
  let target = RELEASES_PAGE;
  try {
    const r = await fetch(GITHUB_LATEST, {
      headers: { "User-Agent": "mitsuki-web", Accept: "application/vnd.github+json" },
      cf: { cacheTtl: 300, cacheEverything: true },
    });
    if (r.ok) {
      const data = await r.json();
      const dmg = (data.assets || []).find((a) => a.name.endsWith(".dmg"));
      if (dmg) target = dmg.browser_download_url;
    }
  } catch (_) {
    /* keep the releases-page fallback */
  }

  // Fire-and-forget: never let the analytics call delay the user's download.
  const country = request.cf && request.cf.country ? request.cf.country : null;
  const referer = request.headers.get("referer");
  ctx.waitUntil(
    fetch(TRACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, country, referer }),
    }).catch(() => {}),
  );

  return Response.redirect(target, 302);
}
