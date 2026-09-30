// The diamond core: one site-wide balance, earned 1 per boss and spent inside
// career games (operator ruling G13, games-doctrine 2026-09-29).
//
// Every write here is money, so every test below is about what the balance
// READS BACK as - never about what a function returned it would be.
import { describe, it, expect } from "vitest";
import {
  DIAMONDS_KEY,
  DIAMONDS_PAID_KEY,
  PAID_TOKENS_KEPT,
  createDiamonds,
  type DiamondStore,
} from "./diamonds";
import { diamondsFor } from "./economy";
import { isRecordKey, readRecords } from "./records";

/** A map-backed store. `drop` names keys whose writes say yes and keep nothing. */
function store(
  seed: Record<string, string> = {},
  opts: { drop?: (key: string) => boolean; refuse?: (key: string) => boolean; throwOn?: (key: string) => boolean } = {},
): DiamondStore & { all: Map<string, string> } {
  const all = new Map(Object.entries(seed));
  return {
    all,
    read: (k) => all.get(k) ?? null,
    write: (k, v) => {
      if (opts.throwOn?.(k)) throw new Error("quota");
      if (opts.refuse?.(k)) return false;
      if (opts.drop?.(k)) return true; // the swallowed write: "yes", and nothing kept
      all.set(k, v);
      return true;
    },
  };
}

describe("reading the balance", () => {
  it("is 0 on a device that has never earned one", () => {
    expect(createDiamonds(store()).count).toBe(0);
  });

  it("reads a stored whole number", () => {
    expect(createDiamonds(store({ [DIAMONDS_KEY]: "7" })).count).toBe(7);
  });

  it("reads WRONG-SHAPE data as 0, and never throws", () => {
    for (const raw of ["abc", "{", '"5"', "-3", "2.5", "null", "[]", '{"n":5}', "true", "1e400", ""]) {
      const d = createDiamonds(store({ [DIAMONDS_KEY]: raw }));
      expect(d.count, raw).toBe(0);
    }
  });

  it("reads 0 when the store itself throws", () => {
    const d = createDiamonds({
      read: () => {
        throw new Error("SecurityError");
      },
      write: () => true,
    });
    expect(d.count).toBe(0);
  });
});

describe("earning one for a boss", () => {
  it("pays what economy.ts prices the reason at - 1 - and the balance reads back", () => {
    const s = store();
    const d = createDiamonds(s);
    const r = d.grant("boss_defeated", "survivors:run-1");
    expect(diamondsFor("boss_defeated")).toBe(1);
    expect(r).toMatchObject({ ok: true, granted: 1, already: false, diamonds: 1 });
    expect(createDiamonds(s).count).toBe(1);
  });

  it("stores the balance as a plain JSON number, the shape a backup carries", () => {
    const s = store();
    createDiamonds(s).grant("boss_defeated", "t1");
    expect(s.all.get(DIAMONDS_KEY)).toBe("1");
  });

  it("uses a key the backup's record walk carries, and the walk reads it as the balance", () => {
    expect(isRecordKey(DIAMONDS_KEY)).toBe(true);
    const all = new Map<string, string>();
    const d = createDiamonds({ read: (k) => all.get(k) ?? null, write: (k, v) => (all.set(k, v), true) });
    d.grant("boss_defeated", "t1");
    d.grant("boss_defeated", "t2");
    const walk = readRecords({ keys: () => [...all.keys()], get: (k) => all.get(k) ?? null, set: () => true });
    expect(walk).toEqual({ [DIAMONDS_KEY]: 2 }); // the paid-token list is NOT a record, so it stays home
  });

  it("pays nothing, and writes nothing, for a reason the economy does not price", () => {
    const s = store();
    const r = createDiamonds(s).grant("level_complete" as never, "t1");
    expect(r).toMatchObject({ ok: false, granted: 0, reason: "invalid", diamonds: 0 });
    expect(s.all.size).toBe(0);
  });

  it("refuses a grant with no run token, because it could never be paid only once", () => {
    const s = store();
    for (const bad of ["", undefined, 5, null]) {
      const r = createDiamonds(s).grant("boss_defeated", bad as never);
      expect(r).toMatchObject({ ok: false, reason: "invalid", granted: 0 });
    }
    expect(s.all.size).toBe(0);
  });
});

describe("a run reported twice pays once", () => {
  it("the same token is paid once, and the second report says so", () => {
    const s = store();
    const d = createDiamonds(s);
    expect(d.grant("boss_defeated", "survivors:run-9").granted).toBe(1);
    const again = d.grant("boss_defeated", "survivors:run-9");
    expect(again).toMatchObject({ ok: true, granted: 0, already: true, diamonds: 1 });
    expect(createDiamonds(s).count).toBe(1);
  });

  it("holds across a reload, because the token list is on the device", () => {
    const s = store();
    createDiamonds(s).grant("boss_defeated", "run-a");
    expect(createDiamonds(s).grant("boss_defeated", "run-a").granted).toBe(0);
    expect(createDiamonds(s).count).toBe(1);
  });

  it("two different runs pay twice", () => {
    const s = store();
    const d = createDiamonds(s);
    d.grant("boss_defeated", "run-a");
    d.grant("boss_defeated", "run-b");
    expect(createDiamonds(s).count).toBe(2);
  });

  it("keeps a bounded list of paid runs, newest kept", () => {
    const s = store();
    const d = createDiamonds(s);
    for (let i = 0; i < PAID_TOKENS_KEPT + 8; i++) d.grant("boss_defeated", `run-${i}`);
    const kept = JSON.parse(s.all.get(DIAMONDS_PAID_KEY)!) as string[];
    expect(kept).toHaveLength(PAID_TOKENS_KEPT);
    expect(kept).toContain(`run-${PAID_TOKENS_KEPT + 7}`);
    expect(d.grant("boss_defeated", `run-${PAID_TOKENS_KEPT + 7}`).granted).toBe(0);
  });

  it("treats a junk paid list as empty rather than refusing to pay", () => {
    const s = store({ [DIAMONDS_PAID_KEY]: '{"not":"a list"}' });
    expect(createDiamonds(s).grant("boss_defeated", "run-a").granted).toBe(1);
  });
});

describe("a write the device swallows is never reported as money", () => {
  it("a dropped balance write: not ok, balance unchanged, run left unpaid", () => {
    const s = store({ [DIAMONDS_KEY]: "4" }, { drop: (k) => k === DIAMONDS_KEY });
    const r = createDiamonds(s).grant("boss_defeated", "run-a");
    expect(r).toMatchObject({ ok: false, granted: 0, reason: "unsaved", diamonds: 4 });
    expect(createDiamonds(s).count).toBe(4);
    // Unpaid, so the next report - once the device keeps writes - pays it.
    expect(s.all.has(DIAMONDS_PAID_KEY)).toBe(false);
  });

  it("a refused paid-list write rolls the balance back, so the run can be paid later", () => {
    const s = store({ [DIAMONDS_KEY]: "4" }, { refuse: (k) => k === DIAMONDS_PAID_KEY });
    const r = createDiamonds(s).grant("boss_defeated", "run-a");
    expect(r).toMatchObject({ ok: false, reason: "unsaved", diamonds: 4 });
    expect(createDiamonds(s).count).toBe(4);
  });

  it("a write that throws is a refusal, not a crash", () => {
    const s = store({ [DIAMONDS_KEY]: "4" }, { throwOn: () => true });
    expect(createDiamonds(s).grant("boss_defeated", "run-a")).toMatchObject({ ok: false, reason: "unsaved" });
    expect(createDiamonds(s).spend(1)).toMatchObject({ ok: false, reason: "unsaved", diamonds: 4 });
    expect(createDiamonds(s).count).toBe(4);
  });

  it("a dropped spend is not a purchase", () => {
    const s = store({ [DIAMONDS_KEY]: "4" }, { drop: (k) => k === DIAMONDS_KEY });
    expect(createDiamonds(s).spend(3)).toMatchObject({ ok: false, reason: "unsaved", diamonds: 4 });
    expect(createDiamonds(s).count).toBe(4);
  });
});

describe("spending", () => {
  it("takes the price and reads back", () => {
    const s = store({ [DIAMONDS_KEY]: "5" });
    expect(createDiamonds(s).spend(3)).toMatchObject({ ok: true, diamonds: 2 });
    expect(createDiamonds(s).count).toBe(2);
  });

  it("spends down to exactly zero", () => {
    const s = store({ [DIAMONDS_KEY]: "2" });
    expect(createDiamonds(s).spend(2)).toMatchObject({ ok: true, diamonds: 0 });
    expect(createDiamonds(s).count).toBe(0);
  });

  it("REFUSES when short and changes nothing at all", () => {
    const s = store({ [DIAMONDS_KEY]: "1" });
    const before = JSON.stringify([...s.all]);
    expect(createDiamonds(s).spend(2)).toMatchObject({ ok: false, reason: "unaffordable", diamonds: 1 });
    expect(JSON.stringify([...s.all])).toBe(before);
  });

  it("refuses a price that is not a whole positive number - a negative one would MINT", () => {
    const s = store({ [DIAMONDS_KEY]: "3" });
    for (const bad of [0, -1, 1.5, NaN, Infinity, "2", null]) {
      expect(createDiamonds(s).spend(bad as never), String(bad)).toMatchObject({ ok: false, reason: "invalid", diamonds: 3 });
    }
    expect(createDiamonds(s).count).toBe(3);
  });
});

describe("telling the backup", () => {
  it("calls onChange once per write that landed, and never for one that did not", () => {
    let calls = 0;
    const s = store({ [DIAMONDS_KEY]: "1" });
    const d = createDiamonds(s, () => calls++);
    d.grant("boss_defeated", "a"); // landed
    d.grant("boss_defeated", "a"); // already paid - nothing written
    d.spend(9); // unaffordable
    d.spend(1); // landed
    expect(calls).toBe(2);

    let dropped = 0;
    createDiamonds(store({}, { drop: () => true }), () => dropped++).grant("boss_defeated", "b");
    expect(dropped).toBe(0);
  });

  it("a throwing listener cannot turn a landed grant into a failure", () => {
    const s = store();
    const r = createDiamonds(s, () => {
      throw new Error("listener");
    }).grant("boss_defeated", "a");
    expect(r.ok).toBe(true);
    expect(createDiamonds(s).count).toBe(1);
  });
});
