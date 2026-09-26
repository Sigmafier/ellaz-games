/**
 * The Toybox on the home page: the Brawl as a banner, the three betas under it.
 *
 * Operator ruling 2026-09-26, off three mocks rendered on the live home: the
 * four text links it replaces sat above the grid and read as footnotes. The
 * Brawl is the one game released rather than in beta, so it gets the big PLAY;
 * the other three stay one tap away.
 *
 * NOT styled like a catalogue card, for the reason the strip was not: these
 * games keep no coins and no stars, and a card in the grid would promise both
 * (ruling 2026-09-22). Its own heading and its own colours keep it apart.
 *
 * The pictures are each game's own hero, cropped to its native pixel grid by
 * `scripts/toybox/portraits.py` - 645 to 973 B each, lazy, and outside the
 * precache glob (`vite.config.ts` sweeps html/css/js/svg/woff2, not png), so
 * they cost the first visit nothing but the markup.
 *
 * The card colours are the hub's (`studio/games/hub-games.ts`) and the ink on
 * them is a fixed dark, so the pair is the same in both themes: a literal fill
 * under a THEME ink is the chess defect (`a-contrast-floor-is-a-floor-not-a-target.md`).
 */
import { makeT } from "@i18n/index";
import type { AppLocale } from "@i18n/index";
import { toyboxArtHref, toyboxGameHref } from "./paths";

/**
 * [directory, campaign, name], the Brawl first. `studio/games/hub-games.ts` is
 * the source, and `toybox-games-match-the-hub.test.ts` holds this equal to it:
 * the app may not import the studio, so this is a mirror and the test is its gate.
 * The names are proper nouns in every language we ship, so they do not translate.
 */
export const TOYBOX_GAMES: [string, string, string][] = [
  ["fight", "brawl", "Toybox Brawl"],
  ["crypt", "crypt", "The Crypt"],
  ["ember", "ember", "Ember Hollow"],
  ["hollow", "hollow", "The Hollow"],
];

/** the hub's card colours, by directory */
const COLOUR: Record<string, string> = { fight: "#ffd166", crypt: "#b8e0ff", ember: "#c8f0b0", hollow: "#ffc2d9" };
const INK = "#241c17";

// tracking only on the borrowed Latin word: spaced Hebrew or Arabic letters read
// as separate letters ("ח ד ש"), measured on the Hebrew home 2026-09-26
const chip = (background: string, color: string, letterSpacing = "0.08em") =>
  ({ fontSize: 11, fontWeight: 800, letterSpacing, padding: "3px 8px", borderRadius: 999, background, color });

/** what both kinds of card share; the whole card is the link, so it is the tap target */
const card = (dir: string) => ({ display: "flex", alignItems: "center", background: COLOUR[dir], color: INK, textDecoration: "none" });

const portrait = (dir: string, box: number) => (
  <img src={toyboxArtHref(dir)} alt="" width={box} height={box} loading="lazy" style={{ objectFit: "contain", imageRendering: "pixelated" }} />
);

export function ToyboxRow({ locale, onTap }: { locale: AppLocale; onTap: () => void }) {
  const t = makeT(locale);
  const [[heroDir, heroCampaign, heroName], ...rest] = TOYBOX_GAMES;

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 8px", marginBottom: 10 }}>
        <h2 id="toybox-heading" style={{ margin: 0, fontSize: 20 }}>
          Toybox
        </h2>
        <span style={chip("var(--text)", "var(--bg)")}>BETA</span>
        <span style={{ color: "var(--text-dim)", fontSize: 13 }}>{t("toyboxTagline")}</span>
      </div>

      <a href={toyboxGameHref(heroDir, heroCampaign)} onClick={onTap} style={{ ...card(heroDir), gap: 16, padding: 16, borderRadius: 22, boxShadow: "0 3px 0 rgba(0,0,0,.14)" }}>
        {portrait(heroDir, 120)}
        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
          <span style={chip("var(--brand-strong)", "var(--on-brand)", "normal")}>{t("toyboxNew")}</span>
          <strong style={{ fontSize: "clamp(20px, 5.5vw, 26px)", lineHeight: 1.1 }}>{heroName}</strong>
          <span style={{ fontSize: 14 }}>{t("toyboxBrawlLine")}</span>
          <span style={{ ...chip("var(--brand-strong)", "var(--on-brand)", "normal"), fontSize: 16, padding: "12px 24px", borderRadius: 12 }}>{t("play")}</span>
        </span>
      </a>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
        {rest.map(([dir, campaign, name]) => (
          <a key={dir} href={toyboxGameHref(dir, campaign)} onClick={onTap} style={{ ...card(dir), flexDirection: "column", gap: 4, padding: 8, borderRadius: 14, fontSize: 13, fontWeight: 700, textAlign: "center" }}>
            {portrait(dir, 64)}
            {name}
          </a>
        ))}
      </div>
    </section>
  );
}
