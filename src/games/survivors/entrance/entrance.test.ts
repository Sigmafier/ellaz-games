import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { NEON_CAREER_WORDS } from "../careerWords";
import { SHIPPED_LOCALES } from "@i18n/index";

/**
 * Neon Survival's way in (operator, 2026-10-01, "one-screen start, all four",
 * which REPLACES the 2026-09-30 title -> mode cards flow): ONE title screen
 * with Calm / Normal / Wild and a big PLAY that starts a QUICK RUN on the
 * last-used weapon, plus two pills - the weapon (the pick screen, unchanged)
 * and Career (the map, unchanged). The Career / Quick run cards screen is gone.
 * Game over is the title-style card with PLAY AGAIN and Weapon / Menu pills.
 *
 * Source assertions - nothing here can mount a Phaser game - each with the
 * mutation that must turn it red. The rules themselves are pure and live in
 * quickStart.test.ts.
 */

const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
const read = (p: string) => code(readFileSync(new URL(p, import.meta.url), "utf8"));
const GAME = read("../SurvivorsGame.tsx");
const LAYER = read("../CareerLayer.tsx");
const TITLE = read("./NeonTitle.tsx");

describe("the game opens on its title, and the title is the one screen", () => {
  const opens = (s: string) => /useState<NeonMode>\("title"\)/.test(s);
  it("the first screen is the title", () => {
    expect(opens(GAME)).toBe(true);
  });
  it("FIRES if it opens anywhere else", () => {
    const m = GAME.replace('useState<NeonMode>("title")', 'useState<NeonMode>("pick")');
    expect(m).not.toBe(GAME);
    expect(opens(m)).toBe(false);
  });

  const title = GAME.slice(GAME.indexOf('view === "title"'), GAME.indexOf('view === "over"'));
  it("the title's PLAY starts a quick run on the last-used weapon", () => {
    expect(title).toContain("onAction: () => startQuick(startWeapon)");
    expect(GAME).toMatch(/const startQuick = \(id: WeaponId\) => \{\s*chooseWeapon\(id\);\s*setMode\("quick"\);/);
  });

  it("its two pills: the weapon opens the pick, Career opens the map", () => {
    expect(title).toContain("pills: [weaponPill, { label: neonCareerWords(ctx.locale).career, icon: CROWN, onPress: () => go(\"career\") }]");
    expect(GAME).toMatch(/const weaponPill = \{[\s\S]*?label: WN\[startWeapon\]\[0\],[\s\S]*?onPress: \(\) => go\("pick"\),/);
  });

  it("the art module is pieces for the shared card, and draws no button", () => {
    expect(TITLE).toMatch(/from "@ui\/ArcadeTitle"/);
    expect(TITLE).not.toMatch(/<button\b/);
  });
});

describe("the mode cards are gone, and everything they reached is still reached", () => {
  it("no mode cards are drawn anywhere, and there is no menu mode", () => {
    expect(LAYER).not.toContain("<ModeCards");
    expect(GAME).not.toContain('"menu"');
  });

  it("FIRES if the cards come back", () => {
    const m = LAYER.replace("export function CareerLayer", '<ModeCards />\nexport function CareerLayer');
    expect(m).toContain("<ModeCards");
  });

  it("Career opens today's map: the layer mounts on the career mode and its first screen is the lobby", () => {
    expect(GAME).toMatch(/\{mode === "career" && \(\s*<CareerLayer/);
    expect(LAYER).toMatch(/useState<Screen>\("lobby"\)/);
  });

  it("the map's Back leaves the career and goes to the title", () => {
    expect(LAYER).toMatch(/props\.scene\.current\?\.leaveCareer\(\);\s*props\.onTitle\(\);/);
    expect(GAME).toMatch(/onTitle=\{\(\) => go\("title"\)\}/);
  });

  it("game over: PLAY AGAIN, and Weapon / Menu pills back to the pick and the title", () => {
    const over = GAME.slice(GAME.indexOf('view === "over"'), GAME.indexOf(": null", GAME.indexOf('view === "over"')));
    expect(over).toContain("action: T.playAgain");
    expect(over).toContain("onPress: () => go(\"pick\")");
    expect(over).toContain("onPress: () => go(\"title\")");
  });
});

describe("the new words", () => {
  const DASHES = new RegExp("[\\u2013\\u2014\\u2015]");
  it("every shipped language has them, with no long dashes", () => {
    for (const loc of SHIPPED_LOCALES) {
      const w = NEON_CAREER_WORDS[loc];
      for (const s of [w.tap, w.worldN, w.quickLine, w.back]) {
        expect(s.length, loc).toBeGreaterThan(0);
        expect(DASHES.test(s), `${loc}: ${s}`).toBe(false);
      }
      expect(w.worldN, loc).toContain("{n}");
    }
  });
});

const PICK = read("./WeaponPick.tsx");
const SUPER = read("./SuperCard.tsx");
const CHEST = read("./GoldChest.tsx");

describe("the weapon pick", () => {
  it("is drawn on the pick, and its PLAY takes the weapon and starts the quick run", () => {
    expect(GAME).toMatch(/\{mode === "pick" && \(\s*<WeaponPick/);
    expect(GAME).toMatch(/onPlay=\{\(id\) => \{\s*notifyRunStart\(\);\s*startQuick\(id\);/);
    expect(GAME).toMatch(/onBack=\{\(\) => go\("title"\)\}/);
  });

  it("offers exactly what the save has opened - the quick run and the career read the same rule", () => {
    expect(GAME).toMatch(/open=\{weaponsOpenIn\(careerStore\)\}/);
    expect(LAYER).toMatch(/open=\{weaponsOpen\(save\)\}/);
  });

  it("a stored weapon is validated against that set, never trusted", () => {
    expect(GAME).toMatch(/readWeapon\(ctx\.storage, weaponsOpenIn\(careerStore\)\)/);
    expect(GAME).toMatch(/rememberWeapon\(ctx\.storage, id\)/);
    expect(PICK).toMatch(/const picked = asMainWeapon\(props\.weapon, props\.open\);/);
  });

  it("Calm / Normal / Wild are on the Quick run's pick and not the career's", () => {
    expect(GAME).toMatch(/<WeaponPick[\s\S]*?levels=\{\{/);
    const career = LAYER.slice(LAYER.indexOf("<WeaponPick"), LAYER.indexOf("/>", LAYER.indexOf("<WeaponPick")));
    expect(career).not.toContain("levels=");
  });
});

describe("a locked weapon answers a tap", () => {
  const pressable = (s: string) => /onPress=\{\(\) => \(locked \? refuse\(id\) : props\.onPick\(id\)\)\}/.test(s);

  it("a locked card is still a button, and its press is a wiggle", () => {
    expect(pressable(PICK)).toBe(true);
    expect(PICK).toMatch(/className=\{props\.shaking \? "neon-wiggle" : undefined\}/);
    expect(PICK).toMatch(/@keyframes neon-wiggle/);
    expect(PICK).toMatch(/<style>\{WIGGLE_CSS\}<\/style>/);
  });

  it("nothing on the pick is ever disabled", () => {
    expect(PICK).not.toMatch(/\bdisabled\b/);
  });

  it("every card, the back and PLAY are real buttons - and nothing else is", () => {
    expect((PICK.match(/<button\b/g) ?? []).length).toBe(3);
    expect(PICK).toMatch(/<WeaponCard\b/);
  });

  it("FIRES when a locked card goes dead, or is disabled", () => {
    const dead = PICK.replace("locked ? refuse(id) : props.onPick(id)", "locked ? undefined : props.onPick(id)");
    expect(dead).not.toBe(PICK);
    expect(pressable(dead)).toBe(false);
    const off = PICK.replace('type="button"', 'type="button" disabled={locked}');
    expect(off).toMatch(/\bdisabled\b/);
  });

  it("the locked card says which world opens it", () => {
    expect(PICK).toMatch(/lockLine=\{locked \? W\.lock\.replace\("\{n\}", String\(n \?\? 1\)\) : null\}/);
  });
});

describe("the strip names the REAL partner upgrade", () => {
  it("level 5 plus the weapon's partner from the recipe, then its super by name", () => {
    expect(PICK).toMatch(/const partner = RECIPE\[picked\];/);
    expect(PICK).toMatch(/UPGRADE_ART\[partner\]\(\)/);
    expect(PICK).toMatch(/props\.upgrades\[partner\]/);
    expect(PICK).toMatch(/const superName = W\.supers\[picked\]\[0\];/);
  });
});

describe("a career level goes through the pick", () => {
  it("pressing a level on the map opens the pick, not the run", () => {
    const play = LAYER.slice(LAYER.indexOf("const play = "), LAYER.indexOf("};", LAYER.indexOf("const play = ")));
    expect(play).toContain('setScreen("pick")');
    expect(play).not.toContain("startCareer");
  });

  it("the level starts only from the pick's PLAY, with the weapon it hands back", () => {
    expect((LAYER.match(/\.startCareer\(/g) ?? []).length, "one call site; the interface is not a call").toBe(1);
    expect(LAYER).toMatch(/const startLevel = \(id: string, weapon: WeaponId\) => \{\s*props\.onWeapon\(weapon\);\s*props\.scene\.current\?\.startCareer\(/);
    expect(LAYER).toMatch(/onPlay=\{\(weapon\) => startLevel\(level, weapon\)\}/);
  });

  it("FIRES if the map starts the run again", () => {
    const m = LAYER.replace('setScreen("pick");', 'props.scene.current?.startCareer(id, simStats(save), looks.worn); setScreen("intro");');
    expect(m).not.toBe(LAYER);
    expect((m.match(/\.startCareer\(/g) ?? []).length).toBe(2);
  });
});

describe("the SUPER POWER card", () => {
  it("an evolve card is drawn as the gold card", () => {
    // Since card option B (2026-10-02) the overlay branches once: a super offer
    // draws the gold card, anything else the three big cards (LevelCards.tsx).
    // Since 2026-10-02 through the gold chest, which then draws the same SuperCard.
    expect(GAME).toMatch(/status\.offer\[0\]\?\.kind === "evolve" \? \(\s*<SuperReveal/);
    expect(CHEST).toMatch(/return <SuperCard id=\{props\.id\}[^>]*onTake=\{props\.onTake\}/);
    expect(GAME).toMatch(/onTake=\{\(\) => sceneRef\.current\?\.choose\(status\.offer\[0\]!\)\}/);
  });

  it("it has one button, Take it, and it takes the card", () => {
    expect((SUPER.match(/<button\b/g) ?? []).length).toBe(1);
    expect(SUPER).toMatch(/onClick=\{props\.onTake\}/);
    expect(SUPER).not.toMatch(/\bdisabled\b/);
  });
});
