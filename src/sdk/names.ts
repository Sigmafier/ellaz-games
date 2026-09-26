// The name pool — every player gets a name, and no child ever types one.
//
// WHY A POOL AND NOT A TEXT FIELD
// A free-text name on a kids' platform is a moderation problem: someone types
// something, it appears on a leaderboard, and now this project needs a review
// queue. Picking from a fixed list removes that entirely — there is nothing to
// moderate, nothing to report, and no keyboard on the screen. It is also
// friendlier: a five-year-old who cannot spell still gets a name they like.
//
// WHY IDS AND NOT A STRING
// A stored "נמר זריז" would still say נמר זריז after the child switches the app
// to English. The profile keeps the two WORD IDS and this module renders them
// in whatever locale is current, so one player has one name in two languages.
//
// WHY HEBREW NEEDS THE GENDER COLUMN
// Hebrew adjectives agree with their noun and follow it, so an English-shaped
// adjective+noun pool produces broken Hebrew twice over: "זריז נמר" is the
// wrong order and "לטאה זריז" is the wrong gender. Every noun therefore
// declares its gender and every adjective carries both forms. This is not
// polish — it is the difference between the app's default language reading as
// written by a person or by a machine.
//
// WHY THE GENDER COLUMN IS PER LANGUAGE
// Because grammatical gender is a property of the WORD, not of the animal, and
// the languages disagree. FIVE of the twenty nouns below flip between Hebrew
// and Spanish — turtle, butterfly, squirrel, whale and panda. פרפר is
// masculine and "mariposa" is feminine. One shared column would therefore
// render "mariposa rápido": correct-looking data producing wrong Spanish in a
// quarter of the pool, with nothing thrown and no test to notice. Adding a
// third gendered language means adding its own key here, which reds all twenty
// rows by name rather than quietly reusing somebody else's grammar. Swedish
// arrived on 2026-09-22 and did exactly that: its split is utrum/neutrum, which
// is a DIFFERENT AXIS rather than a renaming of this one, so it brought
// `svGender` instead of a third key in `gender`. Two of its twenty nouns are
// neuter - lejon and bi - and those two rows are the whole reason the column
// exists.
//
// NEVER REMOVE OR RENAME A WORD ID.
// Ids are persisted in `profile.name` forever, exactly like the shop item ids
// in `portal/world/items.ts`. Removing one silently un-names every player who
// had it. Words are ADDED; the ratchet in names.test.ts fails on a shrink.
// No i18n import here any more, and that absence is the point: this module is
// in the SHELL and knows nothing about any language. The words live in
// `nameWords.ts`, which is lazy. See its header.
// Deep import, deliberately, and sanctioned by the barrel's own doc comment.
// `@shared/index` re-exports winMoment, which reaches @juice and the portal's
// WalletChip, which imports the wallet — and the wallet imports the profile,
// which imports THIS file. Through the barrel that is a runtime cycle around a
// module-level singleton constructed at import time, which is the shape that
// yields `undefined` at construction rather than a loud error. `@shared/rng`
// is a leaf with no imports of its own, so it cannot close a loop.
import { randInt } from "@shared/rng";

/**
 * The pool, as IDS ONLY. The words are in `nameWords.ts`, which the shell does
 * not import.
 *
 * Two hand-kept lists of the same thing is a shape this repo has been bitten by,
 * so `names-split.test.ts` asserts these are exactly `ADJECTIVES.map(a => a.id)`
 * and `NOUNS.map(n => n.id)`, in order. ORDER IS LOAD-BEARING: `decode()` maps an
 * index onto a name, so re-sorting either list hands every existing player a
 * different name.
 *
 * NEVER REMOVE OR RENAME AN ID - see the file header. Words are ADDED, and they
 * are added in BOTH places.
 */
export const ADJECTIVE_IDS: readonly string[] = [
  "swift", "brave", "happy", "clever", "gentle", "glowing", "tiny", "mighty",
  "curious", "cheerful", "golden", "quiet", "funny", "kind", "sparkly", "dancing",
];

export const NOUN_IDS: readonly string[] = [
  "tiger", "lion", "fox", "bear", "rabbit", "turtle", "dolphin", "owl",
  "butterfly", "hedgehog", "penguin", "squirrel", "whale", "monkey", "bee",
  "lizard", "giraffe", "panda", "zebra", "frog",
];

/**
 * How many distinct names exist.
 *
 * Collisions are expected and fine: two children can both be Swift Tiger. The
 * name is what a player is CALLED, not who they are - identity is the anonymous
 * uid. Appending a discriminator number would buy uniqueness nobody asked for
 * and make the name read like a username, which is the opposite of the point.
 */
export const NAME_COMBINATIONS = ADJECTIVE_IDS.length * NOUN_IDS.length;

/** What the profile stores. Two ids, nothing else. */
export interface PlayerName {
  adj: string;
  noun: string;
}

/**
 * Is this the right SHAPE for a stored name?
 *
 * Shape only, on purpose — it does NOT check the words exist. A profile written
 * by a newer build (another tab mid-deploy, a device that updated first) carries
 * words this build has never heard of, and deleting the child's name over that
 * would be a worse bug than briefly not rendering it. Resolution is where
 * unknown words are handled, and it degrades to "no name" rather than throwing.
 */
export function isPlayerName(value: unknown): value is PlayerName {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const { adj, noun } = value as Record<string, unknown>;
  return typeof adj === "string" && adj !== "" && typeof noun === "string" && noun !== "";
}

/** Index into the flattened adjective × noun space. */
function decode(index: number): PlayerName {
  return {
    adj: ADJECTIVE_IDS[Math.floor(index / NOUN_IDS.length)],
    noun: NOUN_IDS[index % NOUN_IDS.length],
  };
}

function encode(name: PlayerName | undefined): number | undefined {
  if (!isPlayerName(name)) return undefined;
  const adjIndex = ADJECTIVE_IDS.indexOf(name.adj);
  const nounIndex = NOUN_IDS.indexOf(name.noun);
  // An id this build does not know excludes nothing, which is right: any real
  // name is already a change from an unrenderable one.
  if (adjIndex < 0 || nounIndex < 0) return undefined;
  return adjIndex * NOUN_IDS.length + nounIndex;
}

/** A name, uniformly drawn from the whole pool. */
export function pickName(rng: () => number = Math.random): PlayerName {
  return decode(randInt(0, NAME_COMBINATIONS - 1, rng));
}

/**
 * A name that is GUARANTEED not to be the one passed in.
 *
 * The reroll button's whole job is that something changes, so it must not be
 * able to hand back the current name. That is done by drawing from the pool
 * with the current name REMOVED — not by drawing and retrying, which is
 * unbounded on a degenerate rng and would hang the button rather than fail it.
 *
 * A name that doesn't resolve (a word this build doesn't know) excludes nothing,
 * which is right: any real name is already a change from an unrenderable one.
 */
export function rerollName(current: PlayerName | undefined, rng: () => number = Math.random): PlayerName {
  const skip = encode(current);
  if (skip === undefined) return pickName(rng);
  const drawn = randInt(0, NAME_COMBINATIONS - 2, rng);
  return decode(drawn >= skip ? drawn + 1 : drawn);
}
