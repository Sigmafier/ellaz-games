// The career kit's rules were COPIED from the Toybox's campaign layer
// (studio/toybox/campaign/), re-typed for the site. Not byte copies - the
// Toybox packs gear into integers and keys a purse, the site uses strings and
// gold - so the precedent's byte-equality check (src/shared/sprites/
// copies-match-the-studio.test.ts) cannot hold them. What CAN be held is each
// RULE that was carried over: the Toybox's line, and the career line that
// says the same thing.
//
// If either side changes, this reds naming the rule. That is the moment to
// decide on purpose whether the other side follows - a fix to the Toybox's
// unlock rule that the site never hears about is the drift a copy invites.
//
// READ, NEVER IMPORTED. studio/scripts/assert-boundary.mjs refuses an import
// from src/ into studio/ in either direction; it scans import specifiers, and a
// file read is not one.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const TOYBOX = join(HERE, "..", "..", "..", "studio", "toybox", "campaign");

interface Pin { rule: string; theirs: [string, string]; ours: [string, string] }

const PINS: Pin[] = [
  {
    rule: "a level opens when the one before it is cleared",
    theirs: ["flow.ts", "return index === 0 || save.levels.includes(stages[index - 1]);"],
    ours: ["progress.ts", "if (!open) return { id, state: \"locked\", stars };"],
  },
  {
    rule: "exactly one level is NOW: the first open one not cleared",
    theirs: ["lobby.ts", "const now = nodes.findIndex((n) => n.state === \"open\");"],
    ours: ["progress.ts", "open = false;"],
  },
  {
    rule: "a save of the wrong version is not a save",
    theirs: ["save.ts", "if (!s || typeof s !== \"object\" || s.version !== SAVE_VERSION) return false;"],
    ours: ["save.ts", "if (!record(raw) || raw.version !== CAREER_SAVE_VERSION) return false;"],
  },
  {
    rule: "a record that fails the check is discarded for a fresh save, never migrated",
    theirs: ["save.ts", ": freshSave();"],
    ours: ["save.ts", "return isCareerSave(raw) ? copy(raw) : freshSave();"],
  },
  {
    rule: "an item beats an empty slot, or a worse item",
    theirs: ["gear.ts", "return worn === null || itemValue(gear, item) > itemValue(gear, worn);"],
    ours: ["gear.ts", "worn === null || worn === undefined || itemValue(file, item) > itemValue(file, worn);"],
  },
  {
    rule: "a found item that beats its slot is worn on the spot",
    theirs: ["gear.ts", "if (slot < gear.slots.length && beats(gear, item, equipped[slot] ?? null)) equipped[slot] = item;"],
    ours: ["gear.ts", "if (it && itemValue(file, key) > 0 && beats(file, key, equipped[it.slot])) equipped[it.slot] = key;"],
  },
  {
    rule: "a row costs its price plus a step for each already owned",
    theirs: ["flow.ts", "return rung ? rung.coins + rung.step * itemOwned(shop, purse, item) : null;"],
    ours: ["shop.ts", "export const priceOf = (row: ShopRowDef, owned: number): number => row.price + row.step * owned;"],
  },
  {
    rule: "a purse that cannot pay is refused with the save untouched",
    theirs: ["flow.ts", "if (cost === null || s.save.purse.coins < cost) return s;"],
    ours: ["shop.ts", "if (save.gold < cost) return { ok: false, why: \"short\", save };"],
  },
];

const squash = (s: string): string => s.replace(/\s+/g, " ").trim();
const read = (dir: string, file: string): string => squash(readFileSync(join(dir, file), "utf8"));

/**
 * Does a LIVE line of the file carry the pinned text? A pin matched against the
 * whole file also matched "// open = false;" - the rule commented out and dead -
 * so a planted defect that disabled the unlock rule left this test green. Only a
 * line that is not a comment counts.
 */
function carries(dir: string, file: string, pin: string): boolean {
  const want = squash(pin);
  return readFileSync(join(dir, file), "utf8").split("\n").some((line) => {
    const code = squash(line);
    return !code.startsWith("//") && !code.startsWith("*") && code.includes(want);
  });
}

describe("the rules copied from the Toybox still say the same thing on both sides", () => {
  it("has a Toybox to compare against", () => {
    // THE POSITIVE CONTROL: a moved directory would make every pin below fail
    // for a reason that has nothing to do with the rules - say so first.
    expect(existsSync(TOYBOX), `${TOYBOX} is missing - these pins compared nothing`).toBe(true);
    for (const f of new Set(PINS.map((p) => p.theirs[0]))) expect(read(TOYBOX, f).length, f).toBeGreaterThan(1000);
    for (const f of new Set(PINS.map((p) => p.ours[0]))) expect(read(HERE, f).length, f).toBeGreaterThan(500);
  });

  it.each(PINS.map((p) => [p.rule, p] as const))("%s", (rule, p) => {
    expect(carries(TOYBOX, p.theirs[0], p.theirs[1]), `the Toybox's ${p.theirs[0]} no longer carries the rule "${rule}". Decide whether src/shared/career/${p.ours[0]} follows, then re-pin both lines.`).toBe(true);
    expect(carries(HERE, p.ours[0], p.ours[1]), `src/shared/career/${p.ours[0]} no longer carries the rule "${rule}" it copied from the Toybox's ${p.theirs[0]}. Change both on purpose, or neither.`).toBe(true);
  });

  it("the matcher refuses a pinned rule that is only a comment", () => {
    // the control for the fix above: the exact defect that once passed must now read as absent
    const dead = "  // open = false;\n";
    expect(squash(dead).startsWith("//")).toBe(true);
    expect(dead.split("\n").some((l) => { const c = squash(l); return !c.startsWith("//") && c.includes("open = false;"); })).toBe(false);
  });
});
