// DIAMONDS - the site-wide second currency. 1 per boss beaten in any career
// game, spent on special things (looks, special gear) in any career game.
//
// Operator ruling G13 (games-doctrine, 2026-09-29): "each career game has its
// own gold; diamonds are site-wide, 1 per boss beaten in any career game, spent
// on special things (looks, special gear) in any career game; site coins stay
// for the World room." So this is a SECOND spend site beside the World screen,
// on purpose - CLAUDE.md and rewards-economy-convention.md name it. Coins are
// untouched: `ctx.rewards` stays add-only and has no spend().
//
// THE RULES THIS FILE HOLDS
// - A game reports a REASON, never an amount. `grant("boss_defeated", token)`
//   reads its payout from `economy.ts` (`diamondsFor`).
// - A run reported twice pays once. The caller names the run with a token
//   (`<gameId>:<run id>`); the last PAID_TOKENS_KEPT paid tokens are kept on the
//   device, the `SETTLED_KEY` pattern `careerRules.ts bankRun` uses, widened
//   from one token to a list because several career games share this balance.
// - Nothing is reported as money until it READS BACK. A setter can swallow a
//   refused write (a full quota, a private window) and still say yes, so every
//   write is checked by reading it again - `bankRun`'s `landed()`.
// - A failed persist rolls back, like `wallet.buy()`: if the balance landed and
//   the paid-token list did not, the balance is written back, the grant reports
//   `unsaved`, and the run stays unpaid so the next report pays it. (If the
//   rollback write ALSO fails the balance keeps the diamond while the run looks
//   unpaid - a device refusing two writes in a row, and the only double-pay
//   path this file has.)
// - Spend refuses when short, or for a price that is not a whole positive
//   number (a negative one would MINT), and changes nothing when it refuses.
// - Wrong-shape stored data reads as 0 and never throws.
// - Every read goes to the store; nothing is cached in memory. Two tabs cannot
//   clobber each other with a stale whole record, which is the bug the wallet
//   needed a `storage` listener to fix.
//
// WHERE IT PERSISTS, AND THE MEASUREMENT THAT DECIDED IT
// Its own key - the balance as a plain JSON number under
// `ellaz:diamonds:score:balance`, the paid tokens under `ellaz:diamonds:paid:v1`
// - and NOT on the profile (`ellaz:profile:v1`), which is what plan P4 first
// said. Measured 2026-09-30, `vite build` + `assert-payload.mjs`, every arm
// built from ONE tree (origin/main as archived, CEILING 57,682), local Node 24
// (CI is Node 22 and reads ~54 B different - compare arms, never absolutes).
// "Imports it" = survivors' `bankRun` granting on a boss clear, the real wiring.
// P was built with this file's first draft; it is a lower bound for the route.
//
//   A  baseline, no diamonds                                        57,657 B gz
//   P  on the profile: migrateProfile keeps a `diamonds` field, and
//      this logic sits in the shell beside the wallet               58,137  (+480)
//   B1 own key `ellaz:diamonds:v1`, records.ts taught that one
//      extra key so a backup carries it (nothing imports it yet)    57,713  (+56)
//   B  own key IN THE RECORD SHAPE, as shipped (nothing imports it) 57,657  (+0)
//   C  B, with a career chunk importing it, no vite pin             58,129  (+472)
//   D  B, with a career chunk importing it, pinned to `career`      57,714  (+57)
//
// The profile's migrator and the wallet are both shell, so the profile route
// cannot come off the first visit at all: +480 against 25 B of headroom. B1
// was the honest-looking own key and still cost 56 B, all of it records.ts
// learning a second key. So the balance takes the key SHAPE the backup walk
// already carries (`ellaz:<game>:score:<board>`, "game" = diamonds) and the
// first visit does not move - see the note beside RECORD_KEY in records.ts,
// and the test that no game may ever take the id "diamonds".
//
// WHAT THE NEXT STEP MUST DO. The `src/sdk/` catch-all in vite.config.ts pins
// every sdk module to the shell, so the day a career game imports this file it
// lands on the first visit (arm C) unless vite.config.ts pins
// `src/sdk/diamonds.ts` to the `career` chunk ABOVE that catch-all (arm D; the
// `career-*.js` globIgnores entry already exists). What D still adds is
// `economy.diamondsFor` - the price has to live in economy.ts, which is shell -
// and the cross-chunk exports; that remainder is a CEILING raise to argue with
// arms A and D in scripts/assert-payload.mjs, in the change that wires it.
//
// HOW A GAME REACHES IT
// Imported BY PATH from the lazy career code - `import { diamonds } from
// "@sdk/diamonds"` - never through the `@sdk/index` barrel, which is shell and
// would drag this file onto every first visit. The same arrangement
// `Lettercross.tsx` already has with `@sdk/streak`. A `ctx.diamonds` port was
// the alternative and it is worse on bytes: `createContext.ts` is shell, so a
// port object built there ships to every child, career game or not.
//
// BACKUP
// The balance travels in the records walk (its key has the record shape),
// because a restore applies exactly the profile and the records, and cloud
// sync's dedupe fingerprint already covers the records. The wallet never hears
// about a diamond, so every landed change calls `pushNow()` - already exported
// from the shell for Backup, so it costs no new bytes. It skips the 30 s
// debounce, and that is bounded rather than a quota leak: it fires once per
// BOSS or per purchase, both far rarer than the debounce window, and a push
// identical to the last one is dropped by the same fingerprint.
import { diamondsFor, type DiamondReason } from "./economy";
import { localStorageBackend, type KeyValueBackend } from "./profile";
import { pushNow } from "./cloudSync";

/**
 * The balance. Persisted, so never renamed. The record SHAPE on purpose, so the
 * backup's record walk carries it (`records.ts`, beside RECORD_KEY).
 */
export const DIAMONDS_KEY = "ellaz:diamonds:score:balance";
/** The runs already paid, newest last. Device-local: a backup does not carry it. */
export const DIAMONDS_PAID_KEY = "ellaz:diamonds:paid:v1";
/** How many paid run tokens are remembered - far more than one sitting can report twice. */
export const PAID_TOKENS_KEPT = 32;

/** The two calls this file makes: `localStorageBackend()` in the app, a map in a test. */
export type DiamondStore = KeyValueBackend;

export interface DiamondGrant {
  /** True when the balance on the device holds this run's diamond - now or from before. */
  ok: boolean;
  /** Diamonds this call added. 0 when refused, and 0 for a run already paid. */
  granted: number;
  /** This run's token was already paid; nothing was added. */
  already: boolean;
  /** The balance as it READS BACK after the call. */
  diamonds: number;
  reason?: "invalid" | "unsaved";
}

export interface DiamondSpend {
  ok: boolean;
  /** The balance as it READS BACK after the call - unchanged on a refusal. */
  diamonds: number;
  /** `unsaved`: affordable and legal, but the device did not keep the write. */
  reason?: "invalid" | "unaffordable" | "unsaved";
}

export interface Diamonds {
  /** The balance on the device, read fresh. 0 for anything unreadable. */
  readonly count: number;
  /** Pay the diamonds `reason` is worth, once per `token`. */
  grant(reason: DiamondReason, token: string): DiamondGrant;
  /** Take `price` diamonds, or refuse and change nothing. */
  spend(price: number): DiamondSpend;
}

export function createDiamonds(store: DiamondStore = localStorageBackend(), onChange?: () => void): Diamonds {
  const read = (key: string): string | null => {
    try {
      return store.read(key);
    } catch {
      return null;
    }
  };

  const json = (key: string): unknown => {
    try {
      return JSON.parse(read(key) ?? "");
    } catch {
      return undefined;
    }
  };

  const balance = (): number => {
    const n = json(DIAMONDS_KEY);
    return Number.isSafeInteger(n) && (n as number) >= 0 ? (n as number) : 0;
  };

  const paid = (): string[] => {
    const list = json(DIAMONDS_PAID_KEY);
    return Array.isArray(list) ? list.filter((t): t is string => typeof t === "string") : [];
  };

  /** Write, then READ BACK: the only proof a swallowed write can give. */
  const put = (key: string, value: string): boolean => {
    try {
      store.write(key, value);
    } catch {
      /* a throw is a refusal; the read-back below says so */
    }
    return read(key) === value;
  };

  const changed = () => {
    try {
      onChange?.();
    } catch {
      /* a listener must never turn a landed write into a failure */
    }
  };

  return {
    get count() {
      return balance();
    },

    grant(reason, token) {
      const have = balance();
      const amount = diamondsFor(reason);
      if (typeof token !== "string" || token === "" || amount <= 0) {
        return { ok: false, granted: 0, already: false, diamonds: have, reason: "invalid" };
      }
      const done = paid();
      if (done.includes(token)) return { ok: true, granted: 0, already: true, diamonds: have };

      // Balance first, then the token: a run marked paid before its diamond
      // landed would lose that diamond for good.
      if (!put(DIAMONDS_KEY, String(have + amount))) {
        return { ok: false, granted: 0, already: false, diamonds: balance(), reason: "unsaved" };
      }
      if (!put(DIAMONDS_PAID_KEY, JSON.stringify([...done, token].slice(-PAID_TOKENS_KEPT)))) {
        put(DIAMONDS_KEY, String(have));
        return { ok: false, granted: 0, already: false, diamonds: balance(), reason: "unsaved" };
      }
      changed();
      return { ok: true, granted: amount, already: false, diamonds: have + amount };
    },

    spend(price) {
      const have = balance();
      if (!Number.isSafeInteger(price) || price <= 0) return { ok: false, diamonds: have, reason: "invalid" };
      if (price > have) return { ok: false, diamonds: have, reason: "unaffordable" };
      if (!put(DIAMONDS_KEY, String(have - price))) return { ok: false, diamonds: balance(), reason: "unsaved" };
      changed();
      return { ok: true, diamonds: have - price };
    },
  };
}

/** The one balance the app shares, and the backup hears about every change to it. */
export const diamonds: Diamonds = createDiamonds(localStorageBackend(), () => void pushNow());
