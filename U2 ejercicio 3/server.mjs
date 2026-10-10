import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BASE = "/BCS-Turismo-Sostenible/U2 ejercicio 3"; // igual que BASE_PATH en src/config.js
const PORT = 5501;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

http
  .createServer(async (req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, `http://${req.headers.host}`).pathname
      );
    } catch {
      res.writeHead(400);
      return res.end("Bad request");
    }

    if (pathname === BASE) {
      res.writeHead(301, { Location: encodeURI(`${BASE}/`) });
      return res.end();
    }
    if (!pathname.startsWith(`${BASE}/`)) {
      res.writeHead(404);
      return res.end("Not found");
    }

    const rel = pathname.slice(BASE.length);
    let target = path.join(ROOT, path.normalize(rel));
    if (!target.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    try {
      const info = await stat(target).catch(() => null);

      if (info?.isDirectory()) {
        target = path.join(target, "index.html");
      } else if (!info) {

        if (path.extname(rel)) throw new Error("404");
        target = path.join(ROOT, "index.html");
      }

      const data = await readFile(target);
      res.writeHead(200, {
        "Content-Type": TYPES[path.extname(target)] ?? "application/octet-stream",
        "Cache-Control": "no-cache",
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}${encodeURI(BASE)}/`));