import { NextResponse, type NextRequest } from "next/server";
import { EnvError } from "@/lib/env";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    if (error instanceof EnvError) return setupRequired(error);
    throw error;
  }
}

/** Friendly page instead of a bare 500 when Supabase is not configured yet. */
function setupRequired(error: EnvError) {
  console.error(error.message);
  const details =
    process.env.NODE_ENV === "development"
      ? `<p>Set these in <code>.env.local</code>, then restart <code>npm run dev</code>:</p>
         <ul>${error.variables.map((v) => `<li><code>${v}</code></li>`).join("")}</ul>
         <p>Find them in the Supabase dashboard under <b>Project Settings → API</b>. See the README for the full setup.</p>`
      : "<p>The server is not configured yet. Please contact the site administrator.</p>";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Setup required</title><style>body{font-family:system-ui,sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem;line-height:1.6;color:#1f2937}
code{background:#f3f4f6;padding:.1rem .35rem;border-radius:.25rem}h1{font-size:1.4rem}</style></head>
<body><h1>Setup required</h1>${details}</body></html>`;
  return new NextResponse(html, { status: 503, headers: { "content-type": "text/html; charset=utf-8" } });
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
