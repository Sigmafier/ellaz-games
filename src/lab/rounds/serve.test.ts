import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { roundFile, verdictName } from "./serve";

const ROUNDS = new URL(".", import.meta.url).pathname;
const ROOT = join(ROUNDS, "../../..");

describe("what the rounds door will serve", () => {
  const has = (...files: string[]) => (f: string) => files.includes(f);

  it("a round page from the repo before a picture folder of the same name", () => {
    const both = has(join(ROOT, "src/lab/rounds/table.html"), join(ROOT, ".lab-shots/t/table.html"));
    expect(roundFile(ROOT, "table.html", both)).toBe(join(ROOT, "src/lab/rounds/table.html"));
  });

  it("a picture a round took, from the ignored folder", () => {
    const shot = has(join(ROOT, ".lab-shots/t/today-snake-pc.jpg"));
    expect(roundFile(ROOT, "today-snake-pc.jpg", shot)).toBe(join(ROOT, ".lab-shots/t/today-snake-pc.jpg"));
  });

  it("nothing outside its two folders, and nothing that is not there", () => {
    const any = () => true;
    for (const bad of ["../vite.config.ts", "..%2Fx.html", "a/b.html", ".env", "x.ts", "x.html.bak", ""]) expect(roundFile(ROOT, bad, any), bad).toBeNull();
    expect(roundFile(ROOT, "missing.html", () => false)).toBeNull();
  });

  it("a verdict file is named by a round id only", () => {
    expect(verdictName("table-v1-2026-09-28")).toBe("table-v1-2026-09-28");
    for (const bad of ["../x", "Table", "a_b", "a--b", "-a", ""]) expect(verdictName(bad), bad).toBeNull();
  });
});

describe("the ledger", () => {
  const { rounds } = JSON.parse(readFileSync(join(ROUNDS, "rounds.json"), "utf8")) as {
    rounds: { id: string; href: string | null; verdicts: string | null; date: string; ruling: string }[];
  };

  it("every round keeps the operator's own words and a date", () => {
    expect(rounds.length).toBeGreaterThan(0);
    for (const r of rounds) {
      expect(r.ruling.trim(), r.id).not.toBe("");
      expect(r.date, r.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("every page a round links to is frozen here, under a dated name", () => {
    for (const r of rounds.filter((x) => x.href)) {
      const file = r.href!.replace(/^\/__lab\/t\//, "");
      expect(file, r.id).toMatch(/-\d{4}-\d{2}-\d{2}\.html$/);
      expect(existsSync(join(ROUNDS, file)), `${r.id} -> ${file}`).toBe(true);
    }
  });

  it("every frozen page is in the ledger - none kept that nobody can find", () => {
    const linked = new Set(rounds.map((r) => r.href?.replace(/^\/__lab\/t\//, "")));
    const frozen = readdirSync(ROUNDS).filter((f) => /-\d{4}-\d{2}-\d{2}\.html$/.test(f));
    expect(frozen.length).toBeGreaterThan(0);
    for (const f of frozen) expect(linked.has(f), f).toBe(true);
  });

  it("each frozen page saves its verdicts to its OWN file", () => {
    const names = rounds.filter((r) => r.href).map((r) => r.verdicts);
    expect(new Set(names).size).toBe(names.length);
    for (const r of rounds.filter((x) => x.href)) {
      const page = readFileSync(join(ROUNDS, r.href!.replace(/^\/__lab\/t\//, "")), "utf8");
      expect(page, r.id).toContain(`/__lab/v/${r.verdicts}`);
    }
  });
});
