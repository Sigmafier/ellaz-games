import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { GAMES } from "../portal/games";
import { TOYBOX_LIST } from "../content/toybox";
import { CATEGORY_IDS, OG_ROUTES, ROUTES, localesOf, toyboxPagePath, toyboxPlayPath } from "./routes";
import { renderRoute } from "./pages";
import { cardArt, ogCardText, ogImageFile } from "./ogCard";
import { toyboxArtFile, toyboxArtFiles } from "./toyboxArt";
import { toyboxGraph } from "./schema";

/**
 * The Toybox pages: one indexable document per Toybox game, at `/games/<slug>/`.
 *
 * Every cell here answers something no other gate in this repo reads - the
 * route table's shape for a kind nothing else knows, the link that leaves this
 * build, the keys the prose promises, the picture the page embeds.
 */
const TOYBOX_ROUTES = ROUTES.filter((r) => r.kind === "toybox");
const brawl = TOYBOX_LIST.find((t) => t.id === "brawl")!;
const brawlRoute = TOYBOX_ROUTES.find((r) => r.id === "brawl")!;

describe("the route", () => {
  it("is one route per entry, and the population is not zero", () => {
    expect(TOYBOX_LIST.length, "no Toybox pages - every cell below is vacuous").toBeGreaterThan(0);
    expect(TOYBOX_ROUTES).toHaveLength(TOYBOX_LIST.length);
  });

  it("puts the Brawl at /games/toybox-brawl/, indexable, English only", () => {
    expect(brawlRoute.path).toBe("/games/toybox-brawl/");
    expect(brawlRoute.file).toBe("games/toybox-brawl/index.html");
    expect(brawlRoute.indexable).toBe(true);
    expect(brawlRoute.emit).toBe(true);
    expect(localesOf(brawlRoute)).toEqual(["en"]);
  });

  it("never writes under toybox/, which the deploy copies in AFTER this build", () => {
    // `cp -r studio/dist-toybox dist/toybox` into a directory that already
    // exists copies INTO it, as dist/toybox/dist-toybox/ - and the shelf is gone.
    for (const r of ROUTES) {
      expect(r.file.startsWith("toybox/"), r.file).toBe(false);
      expect(r.path.startsWith("/toybox/"), r.path).toBe(false);
    }
  });

  it("collides with no game and no category - two routes, one file", () => {
    const taken = new Set<string>([...GAMES.map((g) => g.id), ...CATEGORY_IDS]);
    for (const t of TOYBOX_LIST) expect(taken.has(t.slug), t.slug).toBe(false);
    const files = ROUTES.map((r) => r.file);
    expect(new Set(files).size).toBe(files.length);
  });
});

describe("the PLAY link", () => {
  it("opens the campaign, and carries the base on both hosts", () => {
    const path = toyboxPlayPath(brawl.dir, brawl.campaign);
    expect(path).toBe("/toybox/games/fight/page/index.html?campaign=brawl");
    expect(renderRoute(brawlRoute, "/")).toContain(`class="play" href="/toybox/games/fight/page/index.html?campaign=brawl"`);
    expect(renderRoute(brawlRoute, "/ellaz/")).toContain(
      `class="play" href="/ellaz/toybox/games/fight/page/index.html?campaign=brawl"`,
    );
  });

  it("has the shape the app's own toyboxGameHref builds, which this build may not import", () => {
    const paths = readFileSync(new URL("../portal/paths.ts", import.meta.url), "utf8");
    expect(paths).toContain("toybox/games/${dir}/page/index.html");
    expect(toyboxPlayPath("DIR", "X").split("?")[0]).toBe("/toybox/games/DIR/page/index.html");
  });
});

/**
 * Every key the page names, held to the Toybox's own key map.
 *
 * Parsed out of `studio/toybox/cells/shared/input.ts` - read, never imported,
 * because `src/` may not import `studio/`. A key that is in NO list is a
 * control that does nothing; a key in TWO lists is one the page cannot honestly
 * describe (K is both swing and bolt today, which is why the page never names it).
 */
function keyLists(source: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const m of source.matchAll(/^const ([A-Z]+) = \[([^\]]*)\] as const;/gm)) {
    out.set(m[1]!, [...m[2]!.matchAll(/"([A-Za-z]+)"/g)].map((k) => k[1]!));
  }
  return out;
}

function listsNaming(lists: Map<string, string[]>, code: string): string[] {
  return [...lists].filter(([, codes]) => codes.includes(code)).map(([name]) => name);
}

describe("the keys the page promises", () => {
  const input = readFileSync(
    new URL("../../studio/toybox/cells/shared/input.ts", import.meta.url),
    "utf8",
  );
  const lists = keyLists(input);

  it("reads the key map it claims to read", () => {
    // Population: the four walk axes and the three buttons. A parser that
    // matched nothing would pass the cell below over zero keys.
    for (const name of ["LEFT", "RIGHT", "UP", "DOWN", "ATTACK", "SPELL"]) {
      expect(lists.get(name)?.length, name).toBeGreaterThan(0);
    }
  });

  it("names only keys the game binds, each to exactly one thing", () => {
    const codes = brawl.copy.keyboard.flatMap((k) => k.codes);
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) expect(listsNaming(lists, code), code).toHaveLength(1);
  });

  it("CONTROL: the check can fail both ways", () => {
    const fake = keyLists(
      'const ATTACK = ["Space", "KeyK"] as const;\nconst BOLT = ["KeyK"] as const;\n',
    );
    expect(listsNaming(fake, "KeyK")).toHaveLength(2);
    expect(listsNaming(fake, "KeyQ")).toHaveLength(0);
  });
});

describe("the copy", () => {
  const all = JSON.stringify(brawl);

  it("carries no em dash, en dash or horizontal bar - customer-facing copy uses a hyphen", () => {
    expect(all).not.toMatch(/[–—―]/);
  });

  it("never calls the Brawl a game for kids", () => {
    expect(all).not.toMatch(/\bkids?\b/i);
    expect(all).not.toMatch(/for (young )?children/i);
  });

  it("fits a search result: title <= 60, description 50-160", () => {
    expect(brawl.copy.metaTitle.length).toBeLessThanOrEqual(60);
    expect(brawl.copy.metaDescription.length).toBeGreaterThanOrEqual(50);
    expect(brawl.copy.metaDescription.length).toBeLessThanOrEqual(160);
  });
});

describe("the document", () => {
  const page = renderRoute(brawlRoute, "/");

  it("is its own canonical, indexable on the primary host, noindex on the mirror", () => {
    expect(page).toContain('<link rel="canonical" href="https://ellaz.fun/games/toybox-brawl/"');
    const robots = /<meta name="robots" content="noindex/;
    expect(page).not.toMatch(robots);
    expect(renderRoute(brawlRoute, "/ellaz/")).toMatch(robots);
  });

  it("boots nothing - it is a document, not a screen", () => {
    expect(page).not.toContain('id="root"');
    expect(page).not.toContain('id="game-frame"');
  });

  it("embeds the picture this build writes, with both dimensions and an alt", () => {
    const src = `/${toyboxArtFile("brawl")}`;
    expect(src).toMatch(/^\/games\/toybox-brawl\/hero-[0-9a-f]{8}\.png$/);
    expect(page).toContain(`src="${src}"`);
    expect(page).toContain('width="1200"');
    expect(page).toContain('height="900"');
    expect(page).toContain(`alt="${brawl.copy.artAlt}"`);
  });

  it("is linked from the footer of an ordinary page, in any language", () => {
    const he = ROUTES.find((r) => r.kind === "game" && r.locale === "he")!;
    const footer = renderRoute(he, "/").match(/<footer>[\s\S]*?<\/footer>/)?.[0] ?? "";
    expect(footer).toContain(`href="${toyboxPagePath(brawl.slug, brawl.locale)}"`);
  });

  it("describes the game in structured data as the pair Search can use", () => {
    const node = toyboxGraph(brawl)["@graph"][0] as Record<string, unknown>;
    expect(node["@type"]).toEqual(["VideoGame", "SoftwareApplication"]);
    expect(node.typicalAgeRange).toBe("13-");
    expect((node.image as string[])[0]).toBe(`https://ellaz.fun/${toyboxArtFile("brawl")}`);
  });
});

describe("the pictures", () => {
  it("writes a real 1200x900 PNG beside its page, never under art/", () => {
    const [f] = toyboxArtFiles(["brawl"]);
    expect(f!.fileName).toBe(toyboxArtFile("brawl"));
    const png = Buffer.from(f!.png);
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(900);
    // A flat ground with nothing on it compresses to almost nothing.
    expect(png.length).toBeGreaterThan(4096);
  });

  it("gives the share card the game's name and its own hero, never the home mosaic", () => {
    const og = OG_ROUTES.find((r) => r.kind === "toybox" && r.id === "brawl")!;
    expect(ogCardText(og).title).toBe("Toybox Brawl");
    const tiles = cardArt(og);
    expect(tiles).toHaveLength(1);
    expect(tiles[0]!.source).toBe("toybox");
    expect(ogImageFile(og)).toMatch(/^og\/toybox-brawl-en-/);
  });

  it("refuses a Toybox page with no picture source rather than drawing nothing", () => {
    expect(() => toyboxArtFile("no-such-page")).toThrow(/no picture source/);
  });
});
