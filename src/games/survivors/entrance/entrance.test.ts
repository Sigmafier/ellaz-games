import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { NEON_CAREER_WORDS } from "../careerWords";
import { SHIPPED_LOCALES } from "@i18n/index";
import { careerCardView } from "./ModeCards";
import { freshSave } from "../../../shared/career/save";

/**
 * Neon Survival's way in (operator, 2026-09-30, approved off a mock): a TITLE
 * screen with one Tap to start, then the MODE screen - two picture cards,
 * Career and Quick run - in place of the two small tiles it opened on.
 *
 * Quick run goes to the WEAPON PICK (with Calm / Normal / Wild on it) and then
 * into the run; Career goes to today's map, and every level on it goes through
 * the same pick before it starts (operator ruling 2026-09-30, "like Survivor.io").
 *
 * Source assertions - nothing here can mount a Phaser game - each with the
 * mutation that must turn it red.
 */

const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ").replace(/\{\/\*[\s\S]*?\*\/\}/g, " ");
const read = (p: string) => code(readFileSync(new URL(p, import.meta.url), "utf8"));
const GAME = read("../SurvivorsGame.tsx");
const LAYER = read("../CareerLayer.tsx");
const SCREENS = read("../careerScreens.tsx");
const TITLE = read("./NeonTitle.tsx");
const MODE = read("./ModeCards.tsx");

describe("the game opens on its title", () => {
  const opens = (s: string) => /useState<"title" \| "menu" \| "pick" \| "quick" \| "career">\("title"\)/.test(s);
  it("the first screen is the title, not the mode cards", () => {
    expect(opens(GAME)).toBe(true);
  });
  it("FIRES if it opens on the menu again", () => {
    const m = GAME.replace('("title")', '("menu")');
    expect(m).not.toBe(GAME);
    expect(opens(m)).toBe(false);
  });

  it("the title is drawn only on the title, and its one button goes to the mode cards", () => {
    expect(GAME).toMatch(/\{mode === "title" && \(\s*<NeonTitle/);
    expect(GAME).toMatch(/onStart=\{\(\) => setMode\("menu"\)\}/);
  });

  it("the title is the shared shell, with the game's own art inside it", () => {
    expect(TITLE).toContain("<ArcadeTitle");
    expect(TITLE).toMatch(/from "@ui\/ArcadeTitle"/);
    expect(TITLE).not.toMatch(/<button\b/);
  });
});

describe("the mode cards replace the two tiles", () => {
  it("the career layer draws the mode cards on the menu, and the old tiles are gone", () => {
    expect(LAYER).toMatch(/props\.mode === "menu"[\s\S]{0,40}<ModeCards/);
    expect(LAYER).not.toContain("<Chooser");
    expect(SCREENS).not.toContain("export function Chooser");
  });

  it("exactly two cards and one Back, all real buttons, none disabled", () => {
    expect((MODE.match(/<button\b/g) ?? []).length).toBe(2);
    expect(MODE).toMatch(/<ModeCard\b[\s\S]*<ModeCard\b/);
    expect((MODE.match(/<ModeCard\b/g) ?? []).length).toBe(2);
    expect(MODE).not.toMatch(/\bdisabled\b/);
  });

  it("Career goes to today's map and Quick run to the weapon pick", () => {
    expect(LAYER).toMatch(/onCareer=\{\(\) => \{ setScreen\("lobby"\); props\.onCareer\(\); \}\}/);
    expect(LAYER).toMatch(/onQuick=\{props\.onQuick\}/);
    expect(GAME).toMatch(/onQuick=\{\(\) => setMode\("pick"\)\}/);
    // The result screen after a run is today's entrance, still gated the way it was.
    expect(GAME).toMatch(/mode === "quick" && asking && !choosing/);
  });

  it("Back from the cards is the title, and the quick entrance's Menu is the cards", () => {
    expect(GAME).toMatch(/onTitle=\{\(\) => setMode\("title"\)\}/);
    expect(GAME).toMatch(/onPress=\{\(\) => setMode\("menu"\)\}/);
  });

  it("the career layer is not mounted under the title", () => {
    expect(GAME).toMatch(/\(mode === "menu" \|\| mode === "career"\) && \(\s*<CareerLayer/);
  });
});

describe("the career card says where you are, from the save", () => {
  it("a fresh save is World 1, nothing done", () => {
    const v = careerCardView(freshSave());
    expect(v).toEqual({ world: "city", number: 1, done: 0, of: 4 });
  });

  it("clearing World 1's boss moves the card to World 2", () => {
    const s = freshSave();
    for (const id of ["city-1", "city-2", "city-3", "city-boss"]) s.stars[id] = 2;
    expect(careerCardView(s)).toEqual({ world: "frost", number: 2, done: 0, of: 4 });
  });

  it("partway through a world counts what is done in it", () => {
    const s = freshSave();
    s.stars["city-1"] = 3;
    s.stars["city-2"] = 1;
    expect(careerCardView(s)).toEqual({ world: "city", number: 1, done: 2, of: 4 });
  });

  it("a star past a gap opens nothing, the kit's own rule", () => {
    const s = freshSave();
    s.stars["city-3"] = 3;
    expect(careerCardView(s).done).toBe(0);
  });

  it("everything cleared reads as the last world, full", () => {
    const s = freshSave();
    for (const w of ["city", "frost", "lava"]) for (const l of ["1", "2", "3", "boss"]) s.stars[`${w}-${l}`] = 3;
    expect(careerCardView(s)).toEqual({ world: "lava", number: 3, done: 4, of: 4 });
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

describe("the weapon pick", () => {
  it("is drawn on the pick, and its PLAY takes the weapon and starts the quick run", () => {
    expect(GAME).toMatch(/\{mode === "pick" && \(\s*<WeaponPick/);
    expect(GAME).toMatch(/onPlay=\{\(id\) => \{\s*chooseWeapon\(id\);\s*setMode\("quick"\);\s*notifyRunStart\(\);/);
    expect(GAME).toMatch(/onBack=\{\(\) => setMode\("menu"\)\}/);
  });

  it("offers exactly what the save has opened - the quick run and the career read the same rule", () => {
    expect(GAME).toMatch(/open=\{weaponsOpenIn\(careerStore\)\}/);
    expect(LAYER).toMatch(/open=\{weaponsOpen\(save\)\}/);
  });

  it("a stored weapon is validated against that set, never trusted", () => {
    expect(GAME).toMatch(/asMainWeapon\(ctx\.storage\.get<string>\(START_KEY, "bolt"\), weaponsOpenIn\(careerStore\)\)/);
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
    expect(GAME).toMatch(/if \(card\.kind === "evolve"\) \{\s*return \(\s*<SuperCard/);
    expect(GAME).toMatch(/onTake=\{\(\) => sceneRef\.current\?\.choose\(card\)\}/);
  });

  it("it has one button, Take it, and it takes the card", () => {
    expect((SUPER.match(/<button\b/g) ?? []).length).toBe(1);
    expect(SUPER).toMatch(/onClick=\{props\.onTake\}/);
    expect(SUPER).not.toMatch(/\bdisabled\b/);
  });
});
