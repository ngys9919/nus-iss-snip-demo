import { join, relative, resolve, sep } from "node:path";

const port = Number.parseInt(process.env.PORT || "3000", 10);
const baseUrl = (
  process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${port}`)
).replace(/\/$/, "");
const publicDir = process.env.PUBLIC_DIR
  ? resolve(process.env.PUBLIC_DIR)
  : null;
const links = new Map();
const alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function createCode() {
  let code;
  do {
    const values = new Uint32Array(6);
    crypto.getRandomValues(values);
    code = Array.from(
      values,
      (value) => alphabet[value % alphabet.length],
    ).join("");
  } while (links.has(code));
  return code;
}

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    },
  });
}

function withCors(response) {
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  return response;
}

async function serveStatic(pathname) {
  if (!publicDir) return null;

  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = resolve(join(publicDir, requestedPath.slice(1)));
  const relativePath = relative(publicDir, filePath);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`)) {
    return null;
  }

  const file = Bun.file(filePath);
  return (await file.exists()) ? withCors(new Response(file)) : null;
}

const pathSeparator = sep;

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return jsonResponse(null, 204);
    }

    if (request.method === "POST" && url.pathname === "/api/links") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ error: "Invalid JSON" }, 400);
      }

      if (typeof payload?.url !== "string") {
        return jsonResponse({ error: "URL must be an http(s) URL" }, 400);
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(payload.url);
      } catch {
        return jsonResponse({ error: "URL must be an http(s) URL" }, 400);
      }

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return jsonResponse({ error: "URL must be an http(s) URL" }, 400);
      }

      const code = createCode();
      const link = {
        code,
        url: payload.url,
        shortUrl: `${baseUrl}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(link.code, link);
      return jsonResponse(link, 201);
    }

    if (request.method === "GET" && url.pathname === "/api/links") {
      return jsonResponse([...links.values()]);
    }

    if (request.method === "GET") {
      const staticResponse = await serveStatic(url.pathname);
      if (staticResponse) return staticResponse;

      const code = url.pathname.slice(1);
      const link = code && !code.includes("/") ? links.get(code) : null;
      if (!link) {
        return jsonResponse({ error: "Not found" }, 404);
      }

      link.hits += 1;
      return Response.redirect(link.url, 302);
    }

    return jsonResponse({ error: "Method not allowed" }, 405);
  },
});

console.log(`Snip listening on ${server.url}`);
