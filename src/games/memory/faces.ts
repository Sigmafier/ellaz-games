/**
 * THE PICTURES on memory's cards - four themes of twelve, drawn rather than
 * fetched, and why they are drawn.
 *
 * They used to be OS emoji on a white card, which is two problems at once: an
 * emoji is an ICON, and it is a different icon on an iPhone, an Android tablet
 * and a Windows laptop, so the same deal looked like three different games.
 * These are flat SVG in the key art's vocabulary (`@ui/gameArt`: the same plum
 * ink, the same warm palette, no gradients, no <defs>), so they look the same
 * on every device, cost nothing to fetch, and work offline.
 *
 * NO <defs>, NO ids, for the reason gameArt gives: every face is inlined twice
 * on one board, and an id inlined twice is two elements with one name.
 *
 * WHY TWELVE PER THEME. The hardest level deals 10 pairs, and memory's one hard
 * rule is that every face must be told apart at a glance - so each theme's
 * twelve were chosen for SILHOUETTE first (a planet set was refused: planets
 * are all circles). Two spares mean a theme never deals the same ten twice in
 * a row once a deal draws from the whole set (see `pick`).
 *
 * A FACE IS ITS PICTURE plus a GROUND (its own background colour and the
 * theme's scenery). The ground is a second matching clue, which helps a
 * five-year-old and is exactly what the hard level takes away: `plain` draws
 * the picture alone on a paper card, so it has to be remembered by what it is.
 * Operator ruling 2026-09-22: "hide the backgrounds in hard mode only".
 *
 * Imports nothing - `faces.test.ts` reads it in node, and `logic.ts` stays the
 * picture-free permutation it was: a card's `face` is a face ID, never markup.
 */

export type ThemeId = "animals" | "food" | "vehicles" | "nature";

type Names = { en: string; he: string; es: string; sv: string };

export interface Face {
  /** Persisted inside a session snapshot, so treat it as forever. */
  id: string;
  name: Names;
  /** The card's own ground colour, unique within its theme. */
  bg: string;
  /** The picture, on a 100x100 stage, inside the shared stroke group. */
  art: string;
  /** Things that fly get no shadow - a shadow under a balloon reads as landed. */
  flies?: boolean;
}

export interface Theme {
  id: ThemeId;
  name: Names;
  /** Scenery drawn over a face's ground and under its picture. */
  deco: string;
  /** The emblem on the back of every card in this theme. */
  back: string;
  faces: Face[];
}

const INK = "#241C3B";
const PAPER = "#FFFDF8";
const GLASS = "#BFE9FF";

/* ---------------------------------------------------------------------------
   The vocabulary. Every face is built from these, which is what makes 48 of
   them read as one set rather than 48 drawings.
--------------------------------------------------------------------------- */

const r2 = (v: number): string => String(Math.round(v * 100) / 100);

const eye = (x: number, y: number, r = 3.4): string =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}" stroke="none"/>` +
  `<circle cx="${r2(x + r * 0.38)}" cy="${r2(y - r * 0.38)}" r="${r2(r * 0.38)}" fill="#fff" stroke="none"/>`;
const eyes = (x1: number, x2: number, y: number, r?: number): string => eye(x1, y, r) + eye(x2, y, r);
/** A closed, smiling eye - for the sun and the moon, which are asleep-happy. */
const lid = (x: number, y: number): string => `<path d="M${x - 4} ${y}c2 3 6 3 8 0"/>`;
const cheek = (x: number, y: number, c = "#FF6F91"): string =>
  `<ellipse cx="${x}" cy="${y}" rx="4.4" ry="2.7" fill="${c}" opacity=".5" stroke="none"/>`;
const cheeks = (x1: number, x2: number, y: number, c?: string): string => cheek(x1, y, c) + cheek(x2, y, c);
const shine = (d: string, w = 3.6): string =>
  `<path d="${d}" fill="none" stroke="#fff" stroke-width="${w}" opacity=".75"/>`;
const smile = (x: number, y: number, w = 8): string => `<path d="M${x - w / 2} ${y}c${w * 0.3} ${w * 0.35} ${w * 0.7} ${w * 0.35} ${w} 0"/>`;
const wheel = (x: number, y: number, r = 9): string =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x}" cy="${y}" r="${r2(r * 0.45)}" fill="#E4E1EE" stroke="none"/>`;
const star = (x: number, y: number, R: number, fill: string, stroke = true): string => {
  let d = "";
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const r = k % 2 ? R * 0.45 : R;
    d += `${k ? "L" : "M"}${r2(x + r * Math.cos(a))} ${r2(y + r * Math.sin(a))}`;
  }
  return `<path d="${d}Z" fill="${fill}"${stroke ? "" : ' stroke="none"'}/>`;
};
/** A puffy cloud whose base sits on `y`, `w` wide. */
const cloud = (x: number, y: number, w: number, fill = "#fff"): string => {
  const s = w / 40;
  const p = (a: number, b: number) => `${r2(x + a * s)} ${r2(y + b * s)}`;
  return (
    `<path d="M${p(-16, 0)}C${p(-23, 0)} ${p(-23, -11)} ${p(-15, -11)}C${p(-15, -20)} ${p(-4, -22)} ${p(0, -15)}` +
    `C${p(4, -24)} ${p(18, -22)} ${p(16, -11)}C${p(24, -11)} ${p(24, 0)} ${p(16, 0)}Z" fill="${fill}"/>`
  );
};
const drop = (x: number, y: number, fill = "#4FC3F7"): string =>
  `<path d="M${x} ${y - 6}c-3 5-5 7-5 9.5a5 5 0 0 0 10 0c0-2.5-2-4.5-5-9.5z" fill="${fill}"/>`;

/* ---------------------------------------------------------------------------
   ANIMALS - portraits, because a face is what a child recognises first.
--------------------------------------------------------------------------- */

const lionMane = (): string => {
  let s = "";
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    s += `<circle cx="${r2(50 + 27 * Math.cos(a))}" cy="${r2(52 + 27 * Math.sin(a))}" r="10.5" fill="#E07A1F"/>`;
  }
  return s + `<circle cx="50" cy="52" r="28" fill="#E07A1F" stroke="none"/>`;
};

const ANIMALS: Face[] = [
  {
    id: "dog",
    name: { en: "Dog", he: "כלב", es: "Perro", sv: "Hund" },
    bg: "#B3E3FA",
    art:
      `<path d="M27 32C12 34 10 58 18 67c6 5 11-5 12-17z" fill="#7A4B2E"/>` +
      `<path d="M73 32c15 2 17 26 9 35-6 5-11-5-12-17z" fill="#7A4B2E"/>` +
      `<ellipse cx="50" cy="52" rx="26" ry="25" fill="#E8A96B"/>` +
      `<ellipse cx="60" cy="45" rx="8.5" ry="7.5" fill="#C98450" stroke="none"/>` +
      `<ellipse cx="50" cy="65" rx="14" ry="11" fill="#FFF1DC"/>` +
      eyes(40, 60, 48) +
      `<path d="M46.5 68.5c0 8 7 8 7 0z" fill="#FF6F91"/>` +
      `<ellipse cx="50" cy="59" rx="5.4" ry="3.8" fill="${INK}"/>` +
      `<path d="M50 62.5v3.5M44 66c3 3 9 3 12 0"/>` +
      cheeks(33, 67, 57),
  },
  {
    id: "cat",
    name: { en: "Cat", he: "חתול", es: "Gato", sv: "Katt" },
    bg: "#CDEFA5",
    art:
      `<path d="M25 44 27 14l20 16z" fill="#F4A340"/><path d="M75 44 73 14 53 30z" fill="#F4A340"/>` +
      `<path d="M30 36 31 22l10 8z" fill="#FFB3C1" stroke="none"/><path d="M70 36 69 22l-10 8z" fill="#FFB3C1" stroke="none"/>` +
      `<ellipse cx="50" cy="55" rx="28" ry="24" fill="#F4A340"/>` +
      `<path d="M50 32v7M42 33l2 6M58 33l-2 6" stroke="#C9731C"/>` +
      `<circle cx="44.5" cy="65" r="7" fill="#FFF1DC" stroke="none"/><circle cx="55.5" cy="65" r="7" fill="#FFF1DC" stroke="none"/>` +
      eyes(39, 61, 52) +
      `<path d="M46.5 59.5h7L50 63z" fill="#FF6F91"/>` +
      `<path d="M50 63c0 3-3 4.5-5.5 3M50 63c0 3 3 4.5 5.5 3"/>` +
      `<path d="M33 62H20M33 67l-12 3M67 62h13M67 67l12 3" stroke-width="1.8"/>`,
  },
  {
    id: "fox",
    name: { en: "Fox", he: "שועל", es: "Zorro", sv: "Räv" },
    bg: "#F7B9E3",
    art:
      `<path d="M24 42 21 12l24 16z" fill="#F07A2B"/><path d="M76 42 79 12 55 28z" fill="#F07A2B"/>` +
      `<path d="M27 35 25 19l12 9z" fill="#7A2E14" stroke="none"/><path d="M73 35 75 19l-12 9z" fill="#7A2E14" stroke="none"/>` +
      `<path d="M19 42c0-12 14-15 31-15s31 3 31 15c0 16-15 34-31 38-16-4-31-22-31-38z" fill="#F07A2B"/>` +
      `<path d="M21 47c9 3 19 9 25 22l4 11c-13-4-25-17-29-33zM79 47c-9 3-19 9-25 22l-4 11c13-4 25-17 29-33z" fill="#FFF4E6" stroke="none"/>` +
      `<path d="M19 42c0-12 14-15 31-15s31 3 31 15c0 16-15 34-31 38-16-4-31-22-31-38z"/>` +
      eyes(39, 61, 47) +
      `<circle cx="50" cy="74" r="4" fill="${INK}"/>`,
  },
  {
    id: "bunny",
    name: { en: "Bunny", he: "ארנב", es: "Conejo", sv: "Kanin" },
    bg: "#E0C8F7",
    art:
      `<path d="M38 42c-9-10-10-34-1-34s9 22 7 34z" fill="#F7F3FA"/><path d="M62 42c9-10 10-34 1-34s-9 22-7 34z" fill="#F7F3FA"/>` +
      `<path d="M39 35c-4-7-4-20-.5-20s3.5 12 3 20z" fill="#FFB3C1" stroke="none"/><path d="M61 35c4-7 4-20 .5-20s-3.5 12-3 20z" fill="#FFB3C1" stroke="none"/>` +
      `<ellipse cx="50" cy="60" rx="26" ry="23" fill="#F7F3FA"/>` +
      eyes(40, 60, 56) +
      cheeks(33, 67, 65) +
      `<path d="M46.5 62h7L50 65.5z" fill="#FF6F91"/>` +
      `<path d="M50 65.5v2.5M45 69c2 2 3.5 1.5 5-1 1.5 2.5 3 3 5 1"/>`,
  },
  {
    id: "bear",
    name: { en: "Bear", he: "דוב", es: "Oso", sv: "Björn" },
    bg: "#FFEB99",
    art:
      `<circle cx="27" cy="29" r="11" fill="#A0673F"/><circle cx="73" cy="29" r="11" fill="#A0673F"/>` +
      `<circle cx="27" cy="29" r="5.5" fill="#E3B58A" stroke="none"/><circle cx="73" cy="29" r="5.5" fill="#E3B58A" stroke="none"/>` +
      `<circle cx="50" cy="54" r="28" fill="#A0673F"/>` +
      `<ellipse cx="50" cy="65" rx="13" ry="10" fill="#E8C39E"/>` +
      eyes(39, 61, 50) +
      `<ellipse cx="50" cy="61" rx="5" ry="3.5" fill="${INK}"/>` +
      `<path d="M50 64.5v3M45 68.5c2.5 2.5 7.5 2.5 10 0"/>` +
      cheeks(31, 69, 60),
  },
  {
    id: "panda",
    name: { en: "Panda", he: "פנדה", es: "Panda", sv: "Panda" },
    bg: "#FFC2D4",
    art:
      `<circle cx="27" cy="29" r="11" fill="${INK}"/><circle cx="73" cy="29" r="11" fill="${INK}"/>` +
      `<ellipse cx="50" cy="55" rx="29" ry="26" fill="#fff"/>` +
      `<ellipse cx="38.5" cy="52" rx="7.5" ry="10" transform="rotate(35 38.5 52)" fill="${INK}" stroke="none"/>` +
      `<ellipse cx="61.5" cy="52" rx="7.5" ry="10" transform="rotate(-35 61.5 52)" fill="${INK}" stroke="none"/>` +
      `<circle cx="40" cy="50.5" r="3" fill="#fff" stroke="none"/><circle cx="60" cy="50.5" r="3" fill="#fff" stroke="none"/>` +
      `<ellipse cx="50" cy="63" rx="4.6" ry="3.2" fill="${INK}"/>` +
      `<path d="M50 66v2.5M45.5 69.5c2 2 7 2 9 0"/>` +
      cheeks(31, 69, 65),
  },
  {
    id: "lion",
    name: { en: "Lion", he: "אריה", es: "León", sv: "Lejon" },
    bg: "#9FE5EA",
    art:
      lionMane() +
      `<circle cx="35" cy="38" r="5.5" fill="#F6C35B"/><circle cx="65" cy="38" r="5.5" fill="#F6C35B"/>` +
      `<circle cx="50" cy="55" r="20" fill="#F6C35B"/>` +
      eyes(42.5, 57.5, 51, 3) +
      `<circle cx="45.5" cy="62.5" r="5.5" fill="#FFE6A8" stroke="none"/><circle cx="54.5" cy="62.5" r="5.5" fill="#FFE6A8" stroke="none"/>` +
      `<path d="M46.5 57.5h7L50 61z" fill="#7A3B12"/>` +
      `<path d="M50 61v2.5M46 66c2 1.6 6 1.6 8 0"/>`,
  },
  {
    id: "pig",
    name: { en: "Pig", he: "חזיר", es: "Cerdo", sv: "Gris" },
    bg: "#A8EBD6",
    art:
      `<path d="M27 38 25 16l19 12z" fill="#FF8FA8"/><path d="M73 38 75 16 56 28z" fill="#FF8FA8"/>` +
      `<ellipse cx="50" cy="55" rx="28" ry="25" fill="#FFB8C8"/>` +
      eyes(39, 61, 48) +
      `<ellipse cx="50" cy="61" rx="11" ry="8" fill="#FF8FA8"/>` +
      `<ellipse cx="46" cy="61" rx="1.8" ry="2.8" fill="#B34766" stroke="none"/><ellipse cx="54" cy="61" rx="1.8" ry="2.8" fill="#B34766" stroke="none"/>` +
      smile(50, 72, 10) +
      cheeks(30, 70, 63, "#FF5C86"),
  },
  {
    id: "frog",
    name: { en: "Frog", he: "צפרדע", es: "Rana", sv: "Groda" },
    bg: "#FFD3A8",
    art:
      `<circle cx="33" cy="36" r="12" fill="#6FD44E"/><circle cx="67" cy="36" r="12" fill="#6FD44E"/>` +
      `<path d="M17 61c0-18 14-23 33-23s33 5 33 23c0 14-14 20-33 20s-33-6-33-20z" fill="#6FD44E"/>` +
      `<circle cx="33" cy="35" r="7.5" fill="#fff"/><circle cx="67" cy="35" r="7.5" fill="#fff"/>` +
      eyes(34, 66, 36, 3.8) +
      `<path d="M31 62c8 9 30 9 38 0"/>` +
      `<circle cx="46" cy="52" r="1" fill="${INK}"/><circle cx="54" cy="52" r="1" fill="${INK}"/>` +
      cheeks(26, 74, 64) +
      `<path d="M30 71c6 4 12 5 20 5s14-1 20-5" stroke="#3FA34D" stroke-width="2"/>`,
  },
  {
    id: "cow",
    name: { en: "Cow", he: "פרה", es: "Vaca", sv: "Ko" },
    bg: "#C4CBFF",
    art:
      `<path d="M33 32c-7-3-10-10-7-16 2 6 6 9 11 11z" fill="#FFE6A8"/><path d="M67 32c7-3 10-10 7-16-2 6-6 9-11 11z" fill="#FFE6A8"/>` +
      `<ellipse cx="22" cy="44" rx="10" ry="5.5" transform="rotate(-20 22 44)" fill="#fff"/>` +
      `<ellipse cx="78" cy="44" rx="10" ry="5.5" transform="rotate(20 78 44)" fill="#fff"/>` +
      `<ellipse cx="50" cy="49" rx="23" ry="22" fill="#fff"/>` +
      `<path d="M33 37c4-6 13-5 12 2-1 6-9 6-12 2z" fill="${INK}" stroke="none"/>` +
      `<path d="M60 33c5-1 8 3 7 7-4 1-7-2-7-7z" fill="${INK}" stroke="none"/>` +
      eyes(41, 59, 46) +
      `<ellipse cx="50" cy="67" rx="19" ry="12.5" fill="#FFB8C8"/>` +
      `<ellipse cx="43.5" cy="66" rx="2.4" ry="3.4" fill="#B34766" stroke="none"/><ellipse cx="56.5" cy="66" rx="2.4" ry="3.4" fill="#B34766" stroke="none"/>` +
      smile(50, 73, 8),
  },
  {
    id: "owl",
    name: { en: "Owl", he: "ינשוף", es: "Búho", sv: "Uggla" },
    bg: "#EADBC8",
    art:
      `<path d="M26 46 23 17l17 10c6-2 14-2 20 0l17-10-3 29v20c0 14-10 20-24 20s-24-6-24-20z" fill="#9B6BB5"/>` +
      `<ellipse cx="50" cy="69" rx="15" ry="13.5" fill="#EBDDF3" stroke="none"/>` +
      `<path d="M43 65l3.5 3 3.5-3 3.5 3 3.5-3M43 73l3.5 3 3.5-3 3.5 3 3.5-3" stroke="#9B6BB5" stroke-width="2"/>` +
      `<path d="M27 54c-5 6-5 16 1 22M73 54c5 6 5 16-1 22" stroke-width="2.2"/>` +
      `<circle cx="39.5" cy="43" r="10.5" fill="#fff"/><circle cx="60.5" cy="43" r="10.5" fill="#fff"/>` +
      `<circle cx="39.5" cy="43" r="6" fill="#FFC730" stroke="none"/><circle cx="60.5" cy="43" r="6" fill="#FFC730" stroke="none"/>` +
      eyes(39.5, 60.5, 43, 3.6) +
      `<path d="M46 51h8l-4 7z" fill="#FF8A3D"/>` +
      `<path d="M42 86v3M46 86v3M54 86v3M58 86v3" stroke="#FF8A3D" stroke-width="2.6"/>`,
  },
  {
    id: "penguin",
    name: { en: "Penguin", he: "פינגווין", es: "Pingüino", sv: "Pingvin" },
    bg: "#FFC0B3",
    art:
      `<ellipse cx="41" cy="86" rx="7" ry="3.4" fill="#FF8A3D"/><ellipse cx="59" cy="86" rx="7" ry="3.4" fill="#FF8A3D"/>` +
      `<path d="M28 48c-10 8-10 22-3 27 4-8 5-17 4-27z" fill="#2F3654"/><path d="M72 48c10 8 10 22 3 27-4-8-5-17-4-27z" fill="#2F3654"/>` +
      `<ellipse cx="50" cy="54" rx="24" ry="32" fill="#2F3654"/>` +
      `<path d="M50 37c-6-8-18-6-17 7-2 16 3 36 17 37 14-1 19-21 17-37 1-13-11-15-17-7z" fill="#fff" stroke="none"/>` +
      eyes(43, 57, 45) +
      `<path d="M45 51h10l-5 6z" fill="#FF8A3D"/>` +
      cheeks(37, 63, 54),
  },
];

/* ---------------------------------------------------------------------------
   FRUITS & VEGGIES - no faces. A carrot with eyes is a character, and these
   are meant to be the thing a child points at in the shop.
--------------------------------------------------------------------------- */

const pineappleMarks = (): string => {
  let d = "";
  for (let row = 0; row < 5; row++) {
    const y = 45 + row * 8.5;
    const half = 20 * Math.sqrt(Math.max(0, 1 - ((y - 61) / 24) ** 2)) - 5;
    const off = row % 2 ? 4.5 : 0;
    for (let x = 50 - half + off; x <= 50 + half; x += 9) d += `M${r2(x - 3)} ${r2(y - 2)}l3 2.5 3-2.5`;
  }
  return `<path d="${d}" stroke="#C98A10" stroke-width="2"/>`;
};

const cornKernels = (): string => {
  let s = "";
  for (let row = 0; row < 9; row++) {
    const y = 20 + row * 6.4;
    const half = row < 2 ? 7 : row > 6 ? 8 : 11;
    const off = row % 2 ? 2.6 : 0;
    for (let x = 50 - half + off; x <= 50 + half; x += 5.4)
      s += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="2.3" ry="2.6" fill="#FFE680" stroke="none"/>`;
  }
  return s;
};

const FOOD: Face[] = [
  {
    id: "apple",
    name: { en: "Apple", he: "תפוח", es: "Manzana", sv: "Äpple" },
    bg: "#CDEFA5",
    art:
      `<path d="M50 34c0-6 1-12 4-16" stroke="#6B3E26" stroke-width="3.4"/>` +
      `<path d="M50 34c-10-8-28-4-28 18 0 20 14 34 24 32 2-1 6-1 8 0 10 2 24-12 24-32 0-22-18-26-28-18z" fill="#EF3E5B"/>` +
      `<path d="M52 27c4-10 16-12 20-8-4 8-12 10-20 8z" fill="#6FD44E"/>` +
      `<path d="M55 25.5c5-2 10-4.5 14-6.5" stroke-width="1.6"/>` +
      shine("M31 50c0-7 4-11 9-12"),
  },
  {
    id: "banana",
    name: { en: "Banana", he: "בננה", es: "Plátano", sv: "Banan" },
    bg: "#C4CBFF",
    art:
      `<path d="M26 24c-4 32 16 60 54 54 4-1 4-6 0-7-24 1-40-15-42-45-1-5-11-6-12-2z" fill="#FFD43B"/>` +
      `<path d="M31 30c1 24 16 40 42 43" stroke="#E0A800" stroke-width="2"/>` +
      `<path d="M26.5 25 25 15l7 1 2 8z" fill="#8A6A2F"/>` +
      `<circle cx="81.5" cy="74.5" r="2" fill="#6B4A1F" stroke="none"/>` +
      shine("M29 40c1 10 5 18 11 24"),
  },
  {
    id: "strawberry",
    name: { en: "Strawberry", he: "תות", es: "Fresa", sv: "Jordgubbe" },
    bg: "#A8EBD6",
    art:
      `<path d="M50 86c-16-6-28-24-26-40 2-10 14-12 26-8 12-4 24-2 26 8 2 16-10 34-26 40z" fill="#F03E5A"/>` +
      [
        [38, 50], [50, 48], [62, 50], [44, 60], [56, 60], [36, 64], [64, 64], [50, 70], [44, 78], [56, 78],
      ]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.4" ry="2.2" fill="#FFE08A" stroke="none"/>`)
        .join("") +
      `<path d="M31 41c5-7 13-6 19-2 6-4 14-5 19 2-6 5-13 3-19 5-6-2-13 0-19-5z" fill="#3FBF5A"/>` +
      `<path d="M50 39V27" stroke-width="3.2"/>` +
      shine("M31 52c1 6 3 11 7 15"),
  },
  {
    id: "grapes",
    name: { en: "Grapes", he: "ענבים", es: "Uvas", sv: "Druvor" },
    bg: "#FFEB99",
    art:
      `<path d="M50 32c0-7 2-11 6-14" stroke="#6B3E26" stroke-width="3.2"/>` +
      `<path d="M53 29c6-10 20-10 22-4-6 6-16 8-22 4z" fill="#6FD44E"/>` +
      [
        [50, 72], [40, 59], [60, 59], [30, 45], [50, 45], [70, 45],
      ]
        .map(
          ([x, y]) =>
            `<circle cx="${x}" cy="${y}" r="10" fill="#8E5BD8"/>` +
            `<circle cx="${x - 3.5}" cy="${y - 3.5}" r="2.6" fill="#fff" opacity=".6" stroke="none"/>`,
        )
        .join(""),
  },
  {
    id: "orange",
    name: { en: "Orange", he: "תפוז", es: "Naranja", sv: "Apelsin" },
    bg: "#B3E3FA",
    art:
      `<circle cx="50" cy="56" r="28" fill="#FF9A2E"/>` +
      [
        [40, 46], [58, 42], [66, 58], [44, 66], [56, 72], [34, 58], [62, 50],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="#D9700C" stroke="none"/>`)
        .join("") +
      `<path d="M50 29v-5" stroke="#6B3E26" stroke-width="3.2"/>` +
      `<path d="M51 26c6-8 18-8 20-2-6 5-14 6-20 2z" fill="#3FBF5A"/>` +
      shine("M31 52c0-8 5-14 12-16"),
  },
  {
    id: "watermelon",
    name: { en: "Watermelon", he: "אבטיח", es: "Sandía", sv: "Vattenmelon" },
    bg: "#FFC2D4",
    art:
      `<g transform="rotate(-8 50 55)">` +
      `<path d="M15 40a35 35 0 0 0 70 0z" fill="#3FA34D"/>` +
      `<path d="M19.5 40a30.5 30.5 0 0 0 61 0z" fill="#E8F7D8" stroke="none"/>` +
      `<path d="M23 40a27 27 0 0 0 54 0z" fill="#FF4D6A" stroke="none"/>` +
      `<path d="M15 40a35 35 0 0 0 70 0z"/>` +
      [
        [36, 49], [50, 52], [64, 49], [43, 61], [57, 61], [50, 69],
      ]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="2.8" fill="${INK}" stroke="none"/>`)
        .join("") +
      `</g>`,
  },
  {
    id: "pineapple",
    name: { en: "Pineapple", he: "אננס", es: "Piña", sv: "Ananas" },
    bg: "#E0C8F7",
    art:
      `<path d="M50 40c-8-6-16-12-20-22 8 4 14 8 18 12-2-8-2-16 2-22 4 6 4 14 2 22 4-4 10-8 18-12-4 10-12 16-20 22z" fill="#3FBF5A"/>` +
      `<ellipse cx="50" cy="61" rx="20" ry="24" fill="#FFC730"/>` +
      pineappleMarks() +
      shine("M36 52c0-4 1-7 3-9", 3),
  },
  {
    id: "cherries",
    name: { en: "Cherries", he: "דובדבנים", es: "Cerezas", sv: "Körsbär" },
    bg: "#EADBC8",
    art:
      `<path d="M36 58c2-18 10-30 22-38M64 60c-2-16-4-28-6-40" stroke="#5A8A2F" stroke-width="3"/>` +
      `<path d="M58 20c6-8 18-8 22-2-6 6-16 8-22 2z" fill="#6FD44E"/>` +
      `<circle cx="35" cy="66" r="14" fill="#E0243F"/><circle cx="65" cy="68" r="14" fill="#E0243F"/>` +
      shine("M27 63c0-4 3-7 6-8", 3) +
      shine("M57 65c0-4 3-7 6-8", 3),
  },
  {
    id: "carrot",
    name: { en: "Carrot", he: "גזר", es: "Zanahoria", sv: "Morot" },
    bg: "#9FE5EA",
    art:
      `<g transform="rotate(20 50 50)">` +
      `<path d="M50 32c-6-9-10-15-15-21 8 1 13 7 15 14 0-10 2-16 6-20 2 8-2 16-4 23 4-7 10-11 17-11-4 7-10 12-17 17z" fill="#3FBF5A"/>` +
      `<path d="M36 34c4-4 24-4 28 0-2 18-8 38-14 54-6-16-12-36-14-54z" fill="#FF8A3D"/>` +
      `<path d="M40 46h6M54 56h6M43 66h5M52 74h4" stroke="#D2600F" stroke-width="2.2"/>` +
      `</g>`,
  },
  {
    id: "broccoli",
    name: { en: "Broccoli", he: "ברוקולי", es: "Brócoli", sv: "Broccoli" },
    bg: "#FFD3A8",
    art:
      `<path d="M43 58 41 84c5 4 13 4 18 0l-2-26z" fill="#A8DB7A"/>` +
      `<path d="M50 60v14M46 62l-6-6M54 62l6-6" stroke="#6FA64A" stroke-width="2.2"/>` +
      `<circle cx="34" cy="50" r="13" fill="#3FA34D"/><circle cx="66" cy="50" r="13" fill="#3FA34D"/>` +
      `<circle cx="50" cy="36" r="15" fill="#3FA34D"/><circle cx="50" cy="55" r="12" fill="#3FA34D"/>` +
      [
        [44, 30], [54, 33], [30, 47], [68, 46], [48, 52], [58, 57], [38, 55], [49, 40],
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#2A7F39" stroke="none"/>`)
        .join(""),
  },
  {
    id: "corn",
    name: { en: "Corn", he: "תירס", es: "Maíz", sv: "Majs" },
    bg: "#FFC0B3",
    art:
      `<path d="M50 12c12 0 16 18 14 38-1 16-6 28-14 30-8-2-13-14-14-30-2-20 2-38 14-38z" fill="#F5BD1F"/>` +
      cornKernels() +
      `<path d="M50 86c-14-6-22-22-20-42 8 12 14 22 20 42z" fill="#6FD44E"/>` +
      `<path d="M50 86c14-6 22-22 20-42-8 12-14 22-20 42z" fill="#4CB83A"/>`,
  },
  {
    id: "eggplant",
    name: { en: "Eggplant", he: "חציל", es: "Berenjena", sv: "Aubergine" },
    bg: "#F7B9E3",
    art:
      `<path d="M56 30c14 4 22 20 18 36-4 16-22 22-34 16-12-6-14-20-6-30 6-8 8-18 22-22z" fill="#8E4FC6"/>` +
      `<path d="M60 24c0-6 2-10 6-12" stroke="#3E8E41" stroke-width="3.2"/>` +
      `<path d="M47 33c4-10 14-12 18-4 4-2 8 2 6 6-6 2-12 6-16 10-2-6-6-8-8-12z" fill="#4CAF50"/>` +
      shine("M40 60c-2 8 2 16 8 18"),
  },
];

/* ---------------------------------------------------------------------------
   THINGS THAT GO - side views facing right, so the board reads as traffic.
--------------------------------------------------------------------------- */

const VEHICLES: Face[] = [
  {
    id: "car",
    name: { en: "Car", he: "מכונית", es: "Coche", sv: "Bil" },
    bg: "#FFEB99",
    art:
      `<path d="M13 62c0-8 4-12 12-12h9l8-14c2-2 4-3 8-3h14c4 0 6 1 8 4l8 13h4c4 0 6 4 6 10v6c0 2-2 4-4 4H17c-2 0-4-2-4-4z" fill="#EF3E5B"/>` +
      `<path d="M45 38l-5 11h15V38zM59 38v11h16l-6-11z" fill="${GLASS}"/>` +
      `<path d="M57 50v14M63 55h4"/>` +
      `<ellipse cx="88" cy="56" rx="2" ry="3" fill="#FFE680"/><rect x="13" y="54" width="4" height="5" rx="1" fill="#FF8A3D" stroke="none"/>` +
      wheel(31, 70) +
      wheel(73, 70) +
      shine("M24 55h10", 2.6),
  },
  {
    id: "bus",
    name: { en: "Bus", he: "אוטובוס", es: "Autobús", sv: "Buss" },
    bg: "#C4CBFF",
    art:
      `<path d="M16 26h62c6 0 10 6 12 12l2 10v18c0 2-2 4-4 4H14c-2 0-4-2-4-4V32c0-4 2-6 6-6z" fill="#FFC730"/>` +
      `<rect x="16" y="33" width="13" height="13" rx="2" fill="${GLASS}"/><rect x="33" y="33" width="13" height="13" rx="2" fill="${GLASS}"/>` +
      `<rect x="50" y="33" width="13" height="13" rx="2" fill="${GLASS}"/><path d="M68 33h12c3 0 5 3 6 6l2 9H68z" fill="${GLASS}"/>` +
      `<path d="M10 54h82" stroke-width="2"/>` +
      `<circle cx="88.5" cy="60" r="2.4" fill="#fff"/>` +
      wheel(28, 70) +
      wheel(72, 70),
  },
  {
    id: "firetruck",
    name: { en: "Fire truck", he: "כבאית", es: "Camión de bomberos", sv: "Brandbil" },
    bg: "#A8EBD6",
    art:
      `<rect x="14" y="30" width="46" height="8" rx="1.5" fill="#E4E1EE"/>` +
      `<path d="M21 30v8M29 30v8M37 30v8M45 30v8M53 30v8" stroke-width="2"/>` +
      `<rect x="68" y="30" width="9" height="6" rx="2" fill="#4F9DF5"/>` +
      `<rect x="10" y="40" width="56" height="28" rx="3" fill="#E53935"/>` +
      `<path d="M62 36h16c4 0 6 2 8 6l5 10v14c0 2-2 2-2 2H62z" fill="#E53935"/>` +
      `<path d="M66 40h12l6 12H66z" fill="${GLASS}"/>` +
      `<path d="M15 53h45" stroke="#fff" stroke-width="2.4" opacity=".8"/>` +
      `<circle cx="89" cy="60" r="2.2" fill="#FFE680"/>` +
      wheel(26, 70) +
      wheel(76, 70),
  },
  {
    id: "train",
    name: { en: "Train", he: "רכבת", es: "Tren", sv: "Tåg" },
    bg: "#FFD3A8",
    art:
      `<circle cx="28" cy="18" r="5" fill="#fff"/><circle cx="37" cy="11" r="6.5" fill="#fff"/>` +
      `<path d="M24 42 22 26h12l-2 16z" fill="#3A3355"/>` +
      `<rect x="14" y="40" width="46" height="24" rx="8" fill="#EF3E5B"/>` +
      `<path d="M34 40v24M46 40v24" stroke="#B8233A"/>` +
      `<rect x="56" y="30" width="30" height="36" rx="3" fill="#4F5BD5"/>` +
      `<rect x="52" y="24" width="38" height="7" rx="3" fill="#2E3A9E"/>` +
      `<rect x="63" y="36" width="15" height="12" rx="2" fill="${GLASS}"/>` +
      `<path d="M14 62 6 72h14z" fill="#FFC730"/>` +
      `<rect x="12" y="62" width="76" height="6" rx="2" fill="#3A3355"/>` +
      wheel(27, 72, 7) +
      wheel(45, 72, 7) +
      wheel(73, 70, 10),
  },
  {
    id: "tractor",
    name: { en: "Tractor", he: "טרקטור", es: "Tractor", sv: "Traktor" },
    bg: "#FFC2D4",
    art:
      `<rect x="72" y="26" width="5" height="16" rx="1" fill="${INK}"/>` +
      `<rect x="18" y="20" width="34" height="6" rx="3" fill="#0E8A66"/>` +
      `<rect x="22" y="24" width="26" height="32" rx="3" fill="#17B98A"/>` +
      `<rect x="27" y="29" width="16" height="14" rx="2" fill="${GLASS}"/>` +
      `<path d="M46 42h34c4 0 6 2 6 6v14H46z" fill="#17B98A"/>` +
      `<path d="M80 46v14M84 46v14" stroke-width="2"/>` +
      `<circle cx="32" cy="66" r="16" fill="${INK}"/><circle cx="32" cy="66" r="7" fill="#FFC730" stroke="none"/>` +
      `<circle cx="77" cy="70" r="9" fill="${INK}"/><circle cx="77" cy="70" r="4" fill="#FFC730" stroke="none"/>`,
  },
  {
    id: "bicycle",
    name: { en: "Bicycle", he: "אופניים", es: "Bicicleta", sv: "Cykel" },
    bg: "#B3E3FA",
    art:
      `<path d="M28 46v32M12 62h32M17 51l22 22M17 73l22-22M72 46v32M56 62h32M61 51l22 22M61 73l22-22" stroke="#9C94B8" stroke-width="1.2"/>` +
      `<circle cx="28" cy="62" r="16" stroke-width="4"/><circle cx="72" cy="62" r="16" stroke-width="4"/>` +
      `<path d="M28 62 42 40h24l6 22M42 40l10 22H28M52 62l14-22" stroke="#EF3E5B" stroke-width="4.4"/>` +
      `<path d="M42 40l-2-6M34 33h12" stroke-width="4"/>` +
      `<path d="M66 40l-2-10M60 29h9" stroke-width="3.2"/>` +
      `<circle cx="52" cy="62" r="4.5" fill="#FFC730"/>` +
      `<circle cx="28" cy="62" r="2.4" fill="${INK}"/><circle cx="72" cy="62" r="2.4" fill="${INK}"/>`,
  },
  {
    id: "rocket",
    name: { en: "Rocket", he: "טיל", es: "Cohete", sv: "Raket" },
    bg: "#E0C8F7",
    flies: true,
    art:
      `<g transform="rotate(35 50 52)">` +
      `<path d="M41 66c0 11 5 17 9 25 4-8 9-14 9-25z" fill="#FF8A3D"/>` +
      `<path d="M45.5 66c0 7 2.5 11 4.5 16 2-5 4.5-9 4.5-16z" fill="#FFD43B" stroke="none"/>` +
      `<path d="M37 50c-10 6-12 16-10 24l10-9zM63 50c10 6 12 16 10 24l-10-9z" fill="#EF3E5B"/>` +
      `<path d="M50 10c12 10 16 28 14 56H36c-2-28 2-46 14-56z" fill="#F7F5FC"/>` +
      `<path d="M50 10c7 6 11 14 12.5 22h-25C39 24 43 16 50 10z" fill="#EF3E5B"/>` +
      `<circle cx="50" cy="46" r="7.5" fill="#4FC3F7"/>` +
      shine("M46.5 43.5c1-2 2.5-3 4-3.2", 2.4) +
      `</g>`,
  },
  {
    id: "airplane",
    name: { en: "Airplane", he: "מטוס", es: "Avión", sv: "Flygplan" },
    bg: "#CDEFA5",
    flies: true,
    art:
      `<g transform="rotate(-10 50 52)">` +
      `<path d="M46 46h12l-8-13h-6z" fill="#1C8EC0"/>` +
      `<path d="M18 46 12 26h10l12 20z" fill="#26B0E6"/>` +
      `<path d="M12 53c0-6 6-8 14-8h50c10 0 16 4 16 8s-6 8-16 8H26c-8 0-14-2-14-8z" fill="#F7F5FC"/>` +
      `<path d="M80 47c5 1 8 3 9.5 5.5H80z" fill="#4FC3F7"/>` +
      `<path d="M20 57h58" stroke="#EF3E5B" stroke-width="2.4"/>` +
      [40, 49, 58, 67].map((x) => `<circle cx="${x}" cy="51" r="2.4" fill="#4F5BD5" stroke="none"/>`).join("") +
      `<path d="M42 55h22L50 77H40z" fill="#26B0E6"/>` +
      `</g>`,
  },
  {
    id: "helicopter",
    name: { en: "Helicopter", he: "מסוק", es: "Helicóptero", sv: "Helikopter" },
    bg: "#FFC0B3",
    flies: true,
    art:
      `<path d="M18 22h64" stroke-width="4.4"/><path d="M50 22v10"/>` +
      `<path d="M33 50 11 44v7l22 7z" fill="#FF8A3D"/>` +
      `<circle cx="11" cy="46" r="6" fill="none"/><path d="M11 40v12M5 46h12" stroke-width="2"/>` +
      `<path d="M30 50c0-11 10-18 22-18 14 0 22 10 22 21 0 9-8 13-20 13H40c-6 0-10-6-10-16z" fill="#FF8A3D"/>` +
      `<path d="M56 36c10 2 15 8 16 16H56z" fill="${GLASS}"/>` +
      `<path d="M42 66l-2 10M62 66l2 10M32 76h40c4 0 6-2 6-4"/>`,
  },
  {
    id: "sailboat",
    name: { en: "Sailboat", he: "סירת מפרש", es: "Velero", sv: "Segelbåt" },
    bg: "#EADBC8",
    art:
      `<path d="M50 16V64" stroke="#6B3E26" stroke-width="3.2"/>` +
      `<path d="M50 15V7l10 3.5z" fill="#26B0E6"/>` +
      `<path d="M53 18c14 12 22 28 24 42H53z" fill="#fff"/>` +
      `<path d="M47 22c-8 12-16 26-22 38h22z" fill="#FF8A3D"/>` +
      `<path d="M16 64h68l-10 14H26z" fill="#EF3E5B"/>` +
      `<path d="M22 70h56" stroke="#fff" stroke-width="2.4" opacity=".8"/>` +
      `<path d="M12 84c6-4 12 4 18 0s12 4 18 0 12 4 18 0 12 4 18 0" stroke="#26B0E6" stroke-width="3.2"/>`,
  },
  {
    id: "balloon",
    name: { en: "Hot air balloon", he: "כדור פורח", es: "Globo", sv: "Luftballong" },
    bg: "#9FE5EA",
    flies: true,
    art:
      `<path d="M50 8c20 0 32 14 32 30 0 16-18 26-24 32H42C36 64 18 54 18 38 18 22 30 8 50 8z" fill="#FF4D8D"/>` +
      `<path d="M50 8c-9 10-13 30-8 62h16c5-32 1-52-8-62z" fill="#FFC730" stroke="none"/>` +
      `<path d="M50 8c-18 4-22 30-12 58M50 8c18 4 22 30 12 58" stroke="#fff" stroke-width="2" opacity=".7"/>` +
      `<path d="M50 8c20 0 32 14 32 30 0 16-18 26-24 32H42C36 64 18 54 18 38 18 22 30 8 50 8z"/>` +
      `<path d="M42 70l1 9M58 70l-1 9" stroke-width="2"/>` +
      `<rect x="41" y="79" width="18" height="11" rx="2" fill="#B97A45"/>` +
      `<path d="M41 84h18" stroke-width="1.8"/>`,
  },
  {
    id: "submarine",
    name: { en: "Submarine", he: "צוללת", es: "Submarino", sv: "Ubåt" },
    bg: "#F7B9E3",
    art:
      `<path d="M56 30V18h9" stroke-width="3.2"/>` +
      `<path d="M41 42 44 28h18l3 14z" fill="#FFC730"/>` +
      `<path d="M18 58 9 51v14z" fill="#FF8A3D"/>` +
      `<path d="M17 57c0-12 13-16 33-16s35 6 35 16-15 13-35 13-33-2-33-13z" fill="#FFC730"/>` +
      [37, 51, 65].map((x) => `<circle cx="${x}" cy="56" r="5.2" fill="#4FC3F7"/>`).join("") +
      `<circle cx="85" cy="36" r="3.2" fill="#fff"/><circle cx="90" cy="27" r="2.2" fill="#fff"/><circle cx="83" cy="20" r="2.6" fill="#fff"/>`,
  },
];

/* ---------------------------------------------------------------------------
   NATURE - the sky, the weather and the things that grow. The sun and the
   moon smile, because they did in the set this replaces and nobody minded.
--------------------------------------------------------------------------- */

const sunRays = (): string => {
  let d = "";
  for (let k = 0; k < 12; k++) {
    const a = (k * Math.PI) / 6;
    d += `M${r2(50 + 27 * Math.cos(a))} ${r2(50 + 27 * Math.sin(a))}L${r2(50 + 37 * Math.cos(a))} ${r2(50 + 37 * Math.sin(a))}`;
  }
  return `<path d="${d}" stroke="${INK}" stroke-width="8"/><path d="${d}" stroke="#FF9F1C" stroke-width="4.4"/>`;
};

const rainbowBands = (): string => {
  const cols = ["#EF3E5B", "#FF8A3D", "#FFD43B", "#6FD44E", "#26B0E6", "#8E5BD8"];
  const arc = (r: number) => `M${r2(50 - r)} 68A${r2(r)} ${r2(r)} 0 0 1 ${r2(50 + r)} 68`;
  const band = 4.8;
  const outer = 42;
  return (
    `<path d="${arc(outer - 3 * band)}" stroke="${INK}" stroke-width="${6 * band + 5}" stroke-linecap="butt"/>` +
    cols.map((c, i) => `<path d="${arc(outer - band / 2 - band * i)}" stroke="${c}" stroke-width="${band}" stroke-linecap="butt"/>`).join("")
  );
};

const flake = (): string => {
  let d = "";
  for (let k = 0; k < 6; k++) {
    const a = (k * Math.PI) / 3 - Math.PI / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const at = (r: number, side: number) => `${r2(50 + r * c + side * -s)} ${r2(50 + r * s + side * c)}`;
    d += `M50 50L${at(34, 0)}M${at(20, 0)}L${at(28, 8)}M${at(20, 0)}L${at(28, -8)}`;
  }
  return `<path d="${d}" stroke="${INK}" stroke-width="8.4"/><path d="${d}" stroke="#8FD3FF" stroke-width="4.4"/>` +
    `<circle cx="50" cy="50" r="6" fill="#fff"/>`;
};

const NATURE: Face[] = [
  {
    id: "sun",
    name: { en: "Sun", he: "שמש", es: "Sol", sv: "Sol" },
    bg: "#B3E3FA",
    flies: true,
    art: sunRays() + `<circle cx="50" cy="50" r="21" fill="#FFC730"/>` + lid(42, 47) + lid(58, 47) + cheeks(38, 62, 55) + smile(50, 56, 10),
  },
  {
    id: "moon",
    name: { en: "Moon", he: "ירח", es: "Luna", sv: "Måne" },
    bg: "#C4CBFF",
    flies: true,
    art:
      `<path d="M58 14c-16 2-28 18-28 36 0 18 14 34 32 34 8 0 14-2 18-6-18 0-30-14-30-32 0-12 4-24 8-32z" fill="#FFE680"/>` +
      lid(43, 50) +
      cheek(40, 58) +
      star(72, 28, 7, "#FFC730") +
      star(80, 52, 4.5, "#FFC730"),
  },
  {
    id: "rainbow",
    name: { en: "Rainbow", he: "קשת", es: "Arcoíris", sv: "Regnbåge" },
    bg: "#FFC2D4",
    flies: true,
    art: rainbowBands() + cloud(22, 76, 28) + cloud(78, 76, 28),
  },
  {
    id: "rain",
    name: { en: "Rain cloud", he: "ענן גשם", es: "Nube de lluvia", sv: "Regnmoln" },
    bg: "#FFEB99",
    flies: true,
    art: drop(34, 76) + drop(50, 84) + drop(66, 76) + cloud(50, 62, 68, "#EEF1FB") + eyes(42, 58, 52, 2.8) + smile(50, 56, 6),
  },
  {
    id: "snowflake",
    name: { en: "Snowflake", he: "פתית שלג", es: "Copo de nieve", sv: "Snöflinga" },
    bg: "#E0C8F7",
    flies: true,
    art: flake(),
  },
  {
    id: "tulip",
    name: { en: "Tulip", he: "צבעוני", es: "Tulipán", sv: "Tulpan" },
    bg: "#CDEFA5",
    art:
      `<path d="M50 50v36" stroke="#3E8E41" stroke-width="3.6"/>` +
      `<path d="M49 84c-12-2-20-12-22-24 10 2 18 10 22 24z" fill="#4CB83A"/>` +
      `<path d="M51 84c12-2 20-12 22-24-10 2-18 10-22 24z" fill="#6FD44E"/>` +
      `<path d="M34 24c4 4 8 8 10 8 2-6 4-12 6-16 2 4 4 10 6 16 2 0 6-4 10-8 2 14 0 30-16 30s-18-16-16-30z" fill="#FF4D8D"/>` +
      `<path d="M44 32c0 10 2 16 6 22" stroke="#D12E6C" stroke-width="2"/>`,
  },
  {
    id: "tree",
    name: { en: "Tree", he: "עץ", es: "Árbol", sv: "Träd" },
    bg: "#FFD3A8",
    art:
      `<path d="M45 56h10l2 30H43z" fill="#9C6238"/>` +
      `<circle cx="34" cy="46" r="15" fill="#3FA34D"/><circle cx="66" cy="46" r="15" fill="#3FA34D"/>` +
      `<circle cx="50" cy="32" r="19" fill="#3FA34D"/><circle cx="50" cy="52" r="14" fill="#3FA34D"/>` +
      `<circle cx="42" cy="26" r="5" fill="#6FD44E" stroke="none"/><circle cx="28" cy="42" r="4" fill="#6FD44E" stroke="none"/>` +
      `<circle cx="62" cy="40" r="4" fill="#6FD44E" stroke="none"/>`,
  },
  {
    id: "mushroom",
    name: { en: "Mushroom", he: "פטרייה", es: "Seta", sv: "Svamp" },
    bg: "#A8EBD6",
    art:
      `<path d="M40 54c0 12-2 24-4 30 4 3 24 3 28 0-2-6-4-18-4-30z" fill="#FFF1DC"/>` +
      `<path d="M16 54c0-20 16-34 34-34s34 14 34 34c0 4-6 6-34 6s-34-2-34-6z" fill="#EF3E5B"/>` +
      `<circle cx="36" cy="38" r="6" fill="#fff" stroke="none"/><circle cx="58" cy="31" r="4.5" fill="#fff" stroke="none"/>` +
      `<circle cx="68" cy="46" r="5" fill="#fff" stroke="none"/><circle cx="46" cy="51" r="3.4" fill="#fff" stroke="none"/>` +
      `<circle cx="25" cy="50" r="3" fill="#fff" stroke="none"/>`,
  },
  {
    id: "cactus",
    name: { en: "Cactus", he: "קקטוס", es: "Cactus", sv: "Kaktus" },
    bg: "#FFC0B3",
    art:
      `<path d="M42 72V26c0-10 16-10 16 0v46z" fill="#4CB83A"/>` +
      `<path d="M42 56H32c-6 0-8-4-8-8V38c0-6 8-6 8 0v10h10zM58 48h10V34c0-6 8-6 8 0v14c0 4-2 8-8 8H58z" fill="#4CB83A"/>` +
      `<path d="M50 28v40" stroke="#2E8A3C" stroke-width="2"/>` +
      `<circle cx="50" cy="18" r="5" fill="#FF4D8D"/>` +
      `<path d="M32 70h36l-4 16H36z" fill="#E4572E"/><rect x="30" y="66" width="40" height="7" rx="2" fill="#F2744E"/>`,
  },
  {
    id: "leaf",
    name: { en: "Leaf", he: "עלה", es: "Hoja", sv: "Löv" },
    bg: "#9FE5EA",
    art:
      `<g transform="rotate(30 50 50)">` +
      `<path d="M50 88v8" stroke="#8A4B1E" stroke-width="3.4"/>` +
      `<path d="M50 10c22 14 30 38 20 58-6 12-20 20-20 20s-14-8-20-20c-10-20-2-44 20-58z" fill="#FF8A3D"/>` +
      `<path d="M50 20v68M50 44l-12-8M50 44l12-8M50 60l-14-8M50 60l14-8M50 75l-10-7M50 75l10-7" stroke="#C4520F" stroke-width="2.2"/>` +
      `</g>`,
  },
  {
    id: "volcano",
    name: { en: "Volcano", he: "הר געש", es: "Volcán", sv: "Vulkan" },
    bg: "#F7B9E3",
    art:
      `<circle cx="44" cy="16" r="6" fill="#DAD6E6"/><circle cx="56" cy="12" r="7" fill="#DAD6E6"/>` +
      `<path d="M38 36c2-6 6-6 8-2 2-6 6-6 8 0 2-4 6-4 8 2z" fill="#FF5A36"/>` +
      `<path d="M38 34h24l24 50H14z" fill="#A0673F"/>` +
      `<path d="M38 34h24l-4 10-4-4-4 12-4-10-4 6z" fill="#FF5A36"/>` +
      `<path d="M26 72c8-4 16 4 24 0s16 4 24 0" stroke="#7A4B2E" stroke-width="2.4"/>`,
  },
  {
    id: "wave",
    name: { en: "Wave", he: "גל", es: "Ola", sv: "Våg" },
    bg: "#EADBC8",
    art:
      `<path d="M10 84V62c8-26 30-40 52-36 16 3 26 16 22 28-3 9-14 11-20 5-4-4-2-11 4-11-2-6-14-8-22 0-8 8-10 22-4 36z" fill="#26B0E6"/>` +
      `<path d="M16 78c4-18 14-32 30-38" stroke="#fff" stroke-width="3" opacity=".75"/>` +
      `<path d="M10 84h80v4H10z" fill="#1C8EC0"/>`,
  },
];

/* ---------------------------------------------------------------------------
   The themes, and the scenery each one sets its faces in. Every deco is drawn
   in white or ink at low opacity, so it works on all twelve grounds.
--------------------------------------------------------------------------- */

export const THEMES: readonly Theme[] = [
  {
    id: "animals",
    name: { en: "Animals", he: "חיות", es: "Animales", sv: "Djur" },
    // A meadow hill, and a cloud in the sky above it.
    deco:
      `<path d="M0 80c20-10 40-10 58-5 16 4 30 2 42-4v29H0z" fill="${INK}" opacity=".08"/>` +
      `<g opacity=".7"><circle cx="14" cy="14" r="5" fill="#fff"/><circle cx="21" cy="12" r="6.5" fill="#fff"/><circle cx="28" cy="15" r="4.5" fill="#fff"/></g>`,
    back: `<path d="M50 74c-10 0-18-4-18-11 0-8 9-12 18-12s18 4 18 12c0 7-8 11-18 11z" fill="#fff"/>` +
      `<ellipse cx="33" cy="42" rx="6" ry="8" fill="#fff"/><ellipse cx="45" cy="33" rx="6" ry="8" fill="#fff"/>` +
      `<ellipse cx="57" cy="33" rx="6" ry="8" fill="#fff"/><ellipse cx="68" cy="42" rx="6" ry="8" fill="#fff"/>`,
    faces: ANIMALS,
  },
  {
    id: "food",
    name: { en: "Fruits & veggies", he: "פירות וירקות", es: "Frutas y verduras", sv: "Frukt och grönt" },
    // A plate, and a sparkle - "fresh".
    deco:
      `<ellipse cx="50" cy="86" rx="40" ry="9" fill="#fff" opacity=".6"/>` +
      star(16, 16, 5, "#fff", false).replace("/>", ' opacity=".8"/>') +
      star(86, 24, 3.4, "#fff", false).replace("/>", ' opacity=".8"/>'),
    back: `<path d="M50 38c-8-6-22-3-22 13 0 14 10 24 17 23 2 0 8 0 10 0 7 1 17-9 17-23 0-16-14-19-22-13z" fill="#fff"/>` +
      `<path d="M51 33c3-8 12-9 15-6-3 6-9 7-15 6z" fill="#fff"/>`,
    faces: FOOD,
  },
  {
    id: "vehicles",
    name: { en: "Things that go", he: "כלי תחבורה", es: "Cosas que se mueven", sv: "Fordon" },
    // A road along the bottom of every card.
    deco:
      `<rect y="80" width="100" height="20" fill="${INK}" opacity=".16"/>` +
      `<path d="M4 90h12M28 90h12M52 90h12M76 90h12" stroke="#fff" stroke-width="3" opacity=".85"/>`,
    back: `<circle cx="50" cy="50" r="22" fill="none" stroke="#fff" stroke-width="7"/><circle cx="50" cy="50" r="6" fill="#fff"/>` +
      `<path d="M50 44V30M44.8 53 32.7 60M55.2 53l12.1 7" stroke="#fff" stroke-width="5"/>`,
    faces: VEHICLES,
  },
  {
    id: "nature",
    name: { en: "Nature", he: "טבע", es: "Naturaleza", sv: "Natur" },
    // A soft halo of light behind every picture.
    deco: `<circle cx="50" cy="50" r="40" fill="#fff" opacity=".35"/><circle cx="50" cy="50" r="28" fill="#fff" opacity=".3"/>`,
    back: [0, 1, 2, 3, 4]
      .map((k) => `<ellipse cx="50" cy="34" rx="8" ry="14" transform="rotate(${k * 72} 50 50)" fill="#fff"/>`)
      .join("") + `<circle cx="50" cy="50" r="8" fill="#FFC730"/>`,
    faces: NATURE,
  },
];

export const THEME_IDS: readonly ThemeId[] = THEMES.map((t) => t.id);
export const DEFAULT_THEME: ThemeId = "animals";

export function themeOf(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function faceOf(theme: Theme, id: string): Face | undefined {
  return theme.faces.find((f) => f.id === id);
}

const SVG_OPEN = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="display:block;width:100%;height:100%">`;
// Drawn 6% up from the stage, about its middle: the pictures were authored a
// touch small for a 75px phone card, and one transform is cheaper than 48 edits.
const STROKE = `<g fill="none" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" transform="matrix(1.06 0 0 1.06 -3 -3.12)">`;

/**
 * One face, whole. `plain` is the hard level: the picture on a paper card,
 * with no ground colour and no scenery to match by.
 */
export function faceSvg(theme: Theme, face: Face, plain: boolean): string {
  const ground = plain ? `<rect width="100" height="100" fill="${PAPER}"/>` : `<rect width="100" height="100" fill="${face.bg}"/>${theme.deco}`;
  const shadow = face.flies ? "" : `<ellipse cx="50" cy="88" rx="27" ry="4.2" fill="${INK}" opacity=".14"/>`;
  return `${SVG_OPEN}${ground}${shadow}${STROKE}${face.art}</g></svg>`;
}

/** The back of a card: the brand's fill, with the theme's emblem on it. */
export function backSvg(theme: Theme): string {
  return `${SVG_OPEN}<g opacity=".42">${theme.back}</g></svg>`;
}
