// Tiny static server for the game (Node 22, standard library only).
// Serves game/ on http://localhost:8080 so it can be played and
// screenshotted in a desktop browser: `node serve.ts [--port N]`.

import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("./game", import.meta.url)));
const portArg = process.argv.indexOf("--port");
const port = portArg === -1 ? 8080 : Number(process.argv[portArg + 1]) || 8080;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json",
};

const server = createServer((req, res) => {
  const path = normalize(join(root, decodeURIComponent(req.url.split("?")[0])));
  if (!path.startsWith(root + sep) && path !== root) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  const file = path === root ? join(root, "index.html") : path;
  try {
    const st = statSync(file);
    if (!st.isFile()) throw new Error("not a file");
    res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

server.listen(port, () => console.log(`serving game/ at http://localhost:${port}`));
