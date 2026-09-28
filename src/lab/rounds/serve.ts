/**
 * THE LAB ROUNDS' BACK DOOR - dev server only (`apply: "serve"`), so none of it
 * exists in a build, on ellaz.fun, or in a child's first visit.
 *
 * CONFIG-TIME NODE CODE: imported by vite.config.ts only, never by the app, so
 * it uses relative paths and node:fs like src/build does.
 *
 *   GET      /__lab/t/<file>    a round page, the ledger, the template - from
 *                               src/lab/rounds/ first, else from .lab-shots/t/
 *                               (a picture a round took, which is not committed)
 *   GET/POST /__lab/v/<name>    one page's verdicts, .lab-shots/t/v-<name>.json
 *   GET      /__lab/shots/<f>   a picture of a live page, from .lab-shots/
 *
 * A verdict is written to a FILE, not to one browser's storage, because a
 * ruling nobody else can read is not a ruling. The file is gitignored: the
 * operator's words land in the ledger (rounds.json), which is committed.
 * How a round is run: the run-a-lab-round skill.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  json: "application/json",
  jpg: "image/jpeg",
  png: "image/png",
  js: "text/javascript",
  css: "text/css",
};

/** The file a /__lab/t/ name serves, or null: one flat name, a known type, and it exists. */
export function roundFile(root: string, name: string, exists: (f: string) => boolean = existsSync): string | null {
  const m = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.([a-z]+)$/.exec(name);
  if (!m || !TYPES[m[1]]) return null;
  for (const dir of [join(root, "src/lab/rounds"), join(root, ".lab-shots/t")]) {
    const f = join(dir, name);
    if (exists(f)) return f;
  }
  return null;
}

/** A verdict file's name is a round id: lowercase words and hyphens, nothing else. */
export const verdictName = (name: string): string | null => (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) ? name : null);

const readBody = (req: IncomingMessage) =>
  new Promise<string>((ok, no) => {
    let s = "";
    req.on("data", (c: Buffer) => (s += c));
    req.on("end", () => ok(s));
    req.on("error", no);
  });

const nameOf = (req: IncomingMessage) => decodeURIComponent((req.url ?? "").replace(/^\//, "").split("?")[0]);

function send(res: ServerResponse, f: string) {
  res.setHeader("content-type", TYPES[f.split(".").pop() ?? ""] ?? "application/octet-stream");
  res.setHeader("cache-control", "no-cache");
  res.end(readFileSync(f));
}

export function labRoundsPlugin(): Plugin {
  let root = process.cwd();
  return {
    name: "ellaz-lab-rounds",
    apply: "serve",
    configResolved(c) {
      root = c.root;
    },
    configureServer(server) {
      server.middlewares.use("/__lab/t/", (req, res) => {
        const f = roundFile(root, nameOf(req));
        if (!f) {
          res.statusCode = 404;
          return res.end("not in src/lab/rounds/ or .lab-shots/t/");
        }
        send(res, f);
      });
      server.middlewares.use("/__lab/shots/", (req, res) => {
        const name = nameOf(req);
        const f = join(root, ".lab-shots", name);
        if (!/^[a-z0-9-]+\.(jpg|png)$/.test(name) || !existsSync(f)) {
          res.statusCode = 404;
          return res.end("no such picture - a round takes its own (run-a-lab-round skill, step 1)");
        }
        send(res, f);
      });
      server.middlewares.use("/__lab/v/", async (req, res) => {
        const name = verdictName(nameOf(req));
        res.setHeader("content-type", "application/json");
        if (!name) {
          res.statusCode = 400;
          return res.end("{}");
        }
        const dir = join(root, ".lab-shots", "t");
        const f = join(dir, `v-${name}.json`);
        if (req.method === "POST") {
          const body = await readBody(req);
          try {
            JSON.parse(body);
          } catch {
            res.statusCode = 400;
            return res.end(JSON.stringify({ saved: false, error: "not JSON" }));
          }
          mkdirSync(dir, { recursive: true });
          writeFileSync(f, body);
          return res.end(JSON.stringify({ saved: true }));
        }
        res.end(existsSync(f) ? readFileSync(f) : "{}");
      });
    },
  };
}
