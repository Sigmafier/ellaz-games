// THE CAREER PAGE (P4, the operator's approved mock, 2026-09-30): every career
// game - where the player is in it, its gold and gear, a play button - and the
// site's diamonds in a box of their own. Phone: the box, then the cards in one
// column. PC: two columns of cards and the box beside them.
//
// LAZY, in the `career` chunk (vite.config.ts): PageApp imports it only on the
// Career page, so its words, the kit rules it reads and the diamond balance reach
// nobody else's first visit. Its colours are the career kit's fixed palette - the
// cards are game art, readable on either theme because they carry their own ground.

import type { ReactElement } from "react";
import { pageLocaleFor, textFor } from "@i18n/index";
import type { AppLocale, Locale } from "@i18n/index";
import { diamonds } from "@sdk/diamonds";
import { createSaveStore } from "@sdk/storage";
import type { CareerStore } from "../../shared/career/save";
import { CareerIcon } from "../../ui/career/icons";
import { P } from "../../ui/career/palette";
import { careerWords, fill } from "../../ui/career/words";
import { neonCareerWords } from "../../games/survivors/careerWords";
import { snakeCareerWords } from "../../games/snakesurvivors/careerWords";
import { gameHref } from "../paths";
import { GEAR_KINDS, neonCard, snakeCard, type CareerCardView } from "./careerCards";

interface PageWords {
  levelOf: string;
  next: string;
  joinsNext: string;
  later: string;
  shooter: string;
  rpg: string;
  notStarted: string;
  gearOf: string;
  bossPays: string;
  spend: string;
}

const WORDS: Record<Locale, PageWords> = {
  en: {
    levelOf: "level {n} of {m}", next: "Next", joinsNext: "joins the career next", later: "coming later",
    shooter: "A shooter", rpg: "An RPG", notStarted: "Not started yet", gearOf: "gear {n} of {m}",
    bossPays: "= +1", spend: "spend in any career game",
  },
  he: {
    levelOf: "שלב {n} מתוך {m}", next: "הבא", joinsNext: "מצטרף לקריירה בקרוב", later: "בהמשך",
    shooter: "משחק יריות", rpg: "משחק תפקידים", notStarted: "עוד לא התחלתם", gearOf: "ציוד {n} מתוך {m}",
    bossPays: "= +1", spend: "להוציא בכל משחק קריירה",
  },
  es: {
    levelOf: "nivel {n} de {m}", next: "Pronto", joinsNext: "se une a la carrera pronto", later: "más adelante",
    shooter: "Un juego de disparos", rpg: "Un juego de rol", notStarted: "Aún sin empezar", gearOf: "equipo {n} de {m}",
    bossPays: "= +1", spend: "gástalos en cualquier juego de carrera",
  },
  sv: {
    levelOf: "nivå {n} av {m}", next: "Snart", joinsNext: "går med i karriären snart", later: "kommer senare",
    shooter: "Ett skjutspel", rpg: "Ett rollspel", notStarted: "Inte påbörjad än", gearOf: "prylar {n} av {m}",
    bossPays: "= +1", spend: "spendera i vilket karriärspel som helst",
  },
};

const both = (pattern: string, n: number | string, m: number): string => fill(pattern, n).replace("{m}", String(m));

/** `createSaveStore` as the kit's store - the same shape Neon's own lobby hands the kit. */
function gameStore(gameId: string): CareerStore {
  const s = createSaveStore(gameId);
  return { get: (key) => s.get<unknown>(key, null), set: (key, value) => s.set(key, value) };
}

const card = (dashed: boolean, faded: boolean) => ({
  display: "flex", gap: 14, alignItems: "center", background: dashed ? P.cream : P.sand, color: P.ink,
  border: `3px ${dashed ? "dashed" : "solid"} ${P.ink}`, borderRadius: 18, boxShadow: dashed ? "none" : `0 4px 0 ${P.ink}`,
  padding: 12, opacity: faded ? 0.55 : 1, minWidth: 0,
}) as const;

const art = (ground: string) => ({ width: 80, height: 80, borderRadius: 14, flex: "none", display: "grid", placeItems: "center", border: `3px solid ${P.ink}`, background: ground }) as const;

/** One career game: its name and picture, the names of its worlds, and the last world (shown once every level is cleared). */
interface CardGame { name: string; ground: string; icon: ReactElement; worlds: Record<string, string>; last: string }

function GameCard(props: { game: CardGame; view: CareerCardView; w: PageWords; locale: AppLocale }): ReactElement {
  const { view, w, game } = props;
  const kw = careerWords(props.locale);
  const where = !view.started
    ? w.notStarted
    : view.world === null
      ? `${game.worlds[game.last]} - ${kw.boss}`
      : `${game.worlds[view.world] ?? view.world} - ${view.boss ? kw.boss : both(w.levelOf, view.level ?? 1, view.of)}`;
  const href = gameHref(view.id, pageLocaleFor(props.locale));
  return (
    <div style={card(false, false)} data-career-card={view.id}>
      <div style={art(game.ground)}>{game.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 19, fontWeight: 700 }}>{game.name}</div>
        <div style={{ fontSize: 14, opacity: 0.85 }}>{where}</div>
        <div role="img" aria-label={`${Math.round(view.progress * 100)}%`} style={{ height: 12, borderRadius: 6, background: P.shade33, margin: "7px 0", overflow: "hidden" }}>
          <i style={{ display: "block", height: "100%", width: `${Math.round(view.progress * 100)}%`, background: P.berry }} />
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 14, fontWeight: 700, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><CareerIcon name="gold" size={22} />{view.gold}</span>
          <span>{both(w.gearOf, view.gear, GEAR_KINDS)}</span>
        </div>
      </div>
      <a href={href} aria-label={`${kw.play}: ${game.name}`}
        style={{ width: 56, height: 56, borderRadius: 28, flex: "none", background: P.white, border: `3px solid ${P.ink}`, boxShadow: `0 3px 0 ${P.ink}`, display: "grid", placeItems: "center" }}>
        <CareerIcon name="play" size={30} />
      </a>
    </div>
  );
}

function SoonCard(props: { name: string; line: string; tag?: string; icon: ReactElement; faded: boolean }): ReactElement {
  return (
    <div style={card(true, props.faded)}>
      <div style={art(props.faded ? P.silver : `radial-gradient(circle, ${P.mintDark}, ${P.night})`)}>{props.icon}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 19, fontWeight: 700 }}>
          {props.name}
          {props.tag ? <span style={{ marginInlineStart: 8, fontSize: 12, background: P.sun, border: `2px solid ${P.ink}`, borderRadius: 6, padding: "0 6px", verticalAlign: "middle" }}>{props.tag}</span> : null}
        </div>
        <div style={{ fontSize: 14, opacity: 0.8 }}>{props.line}</div>
      </div>
    </div>
  );
}

function GemBox(props: { count: number; w: PageWords; label: string }): ReactElement {
  return (
    <div role="group" aria-label={`${props.label}: ${props.count}`}
      style={{ background: `linear-gradient(160deg, ${P.gemDeep}, ${P.gemLit})`, color: P.white, border: `3px solid ${P.ink}`, borderRadius: 18, boxShadow: `0 4px 0 ${P.ink}`, padding: 16, textAlign: "center", display: "grid", gap: 8, alignContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 56, fontWeight: 700, lineHeight: 1 }}>
        <CareerIcon name="gem" size={52} />{props.count}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 18, fontWeight: 700, direction: "ltr" }}>
        <CareerIcon name="crown" size={30} />{props.w.bossPays}<CareerIcon name="gem" size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, opacity: 0.9 }}>{props.w.spend}</div>
    </div>
  );
}

const snake = <svg aria-hidden="true" width="54" height="54" viewBox="0 0 50 50"><path d="M10 38c0-14 30-14 30-24" stroke={P.aqua} strokeWidth="8" fill="none" strokeLinecap="round" /><circle cx="40" cy="12" r="6" fill={P.aqua} /></svg>;

export function Career({ locale }: { locale: AppLocale }): ReactElement {
  const w = textFor(WORDS, locale);
  const kw = careerWords(locale);
  const neon: CardGame = { name: "Neon Survival", ground: `radial-gradient(circle, ${P.violet}, ${P.navyDeep})`, icon: <CareerIcon name="bot" size={58} />, worlds: neonCareerWords(locale).world, last: "lava" };
  const snakeGame: CardGame = { name: "Snake Survivors", ground: `radial-gradient(circle, ${P.mintDark}, ${P.night})`, icon: snake, worlds: snakeCareerWords(locale).world, last: "cave" };
  return (
    <div className="career-page" style={{ width: "100%", padding: "4px 0 12px", containerType: "inline-size" }}>
      {/* Sized by the BOX it is given, not the window: on a PC the page's stage is a
          ~660px column, and a window query put three columns into it (measured on
          the built page, 2026-09-30). One column on a phone; two with the box on
          top from 560px; the mock's cards-plus-box row from 960px. */}
      <style>{`.career-page .cp-grid{display:grid;gap:14px;grid-template-columns:minmax(0,1fr)}
.career-page .cp-gem{order:-1}
@container (min-width:560px){.career-page .cp-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.career-page .cp-gem{grid-column:1/-1}}
@container (min-width:960px){.career-page .cp-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr) 280px}.career-page .cp-gem{grid-column:3;grid-row:1/span 2;order:0}}`}</style>
      <div className="cp-grid">
        <div className="cp-gem"><GemBox count={diamonds.count} w={w} label={kw.diamonds} /></div>
        <GameCard game={neon} view={neonCard(gameStore("survivors"))} w={w} locale={locale} />
        <GameCard game={snakeGame} view={snakeCard(gameStore("snakesurvivors"))} w={w} locale={locale} />
        <SoonCard name={w.shooter} line={w.later} icon={<CareerIcon name="bolt" size={44} />} faded />
        <SoonCard name={w.rpg} line={w.later} icon={<CareerIcon name="sword" size={44} />} faded />
      </div>
    </div>
  );
}
