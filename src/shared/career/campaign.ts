// A CAREER is worlds of levels, and each world ends on a boss.
//
// Pure data and its checks: no DOM, no clock, no storage. A game writes one of
// these per career (Neon Survival: three worlds of three levels and a boss) and
// hands it to the rest of the kit; everything that draws a map or decides what
// is open reads the flat play order `nodesOf` builds from it.
//
// COPIED IN SPIRIT FROM THE TOYBOX (studio/toybox/campaign/flow.ts), never
// imported - studio/scripts/assert-boundary.mjs refuses an import either way.
// Two things changed on the way over: a level is an id plus a `boss` flag rather
// than a mode file (the site's games are not Toybox stages), and the unlock rule
// is one list across worlds rather than two nested rules, which is the same
// answer for a campaign whose boss is always last. `copied-rules.test.ts` holds
// the rules that were carried over against the Toybox's own lines.
//
// IDS ARE FOREVER. The save is keyed on level ids, so a renamed level is a
// level every player has lost. They are plain lowercase slugs, and unique across
// the whole campaign - two levels sharing an id share their stars.

export interface LevelDef {
  /** forever: the save records stars against it */
  id: string;
  /** the world's last level, and only that one */
  boss?: boolean;
}

export interface WorldDef {
  /** forever */
  id: string;
  levels: LevelDef[];
  /** which floor the trail map draws under this world ("city", "frost", "lava"); a name it does not know draws a plain floor */
  scenery?: string;
}

export interface CampaignFile {
  id: string;
  worlds: WorldDef[];
}

/** one level, placed in the play order */
export interface CareerNode {
  id: string;
  world: string;
  worldIndex: number;
  /** its index inside its world */
  index: number;
  /** its index in the whole campaign's play order */
  order: number;
  boss: boolean;
  /** 1, 2, 3 for a world's ordinary levels; a boss has no number */
  number: number | null;
}

const SLUG = /^[a-z0-9][a-z0-9-]*$/;

function worldProblems(w: WorldDef, seen: Map<string, string>): string[] {
  const out: string[] = [];
  if (!SLUG.test(w.id)) out.push(`world id "${w.id}" is not a lowercase slug`);
  if (!w.levels || w.levels.length === 0) return [...out, `world "${w.id}" has no levels`];
  w.levels.forEach((l, i) => {
    if (!SLUG.test(l.id)) out.push(`level id "${l.id}" in world "${w.id}" is not a lowercase slug`);
    const before = seen.get(l.id);
    if (before !== undefined) out.push(`level id "${l.id}" is used in both "${before}" and "${w.id}" - the save is keyed on it`);
    seen.set(l.id, w.id);
    const last = i === w.levels.length - 1;
    if (l.boss && !last) out.push(`world "${w.id}": the boss "${l.id}" must be the last level`);
    if (!l.boss && last) out.push(`world "${w.id}": its last level "${l.id}" must be its boss`);
  });
  return out;
}

/** every reason this campaign cannot be played, or an empty list */
export function campaignProblems(file: CampaignFile): string[] {
  const out: string[] = [];
  if (!SLUG.test(file.id)) out.push(`campaign id "${file.id}" is not a lowercase slug`);
  if (!file.worlds || file.worlds.length === 0) return [...out, `campaign "${file.id}" has no worlds`];
  const worldIds = new Set<string>();
  const levels = new Map<string, string>();
  for (const w of file.worlds) {
    if (worldIds.has(w.id)) out.push(`world id "${w.id}" is used twice`);
    worldIds.add(w.id);
    out.push(...worldProblems(w, levels));
  }
  return out;
}

/** the campaign back, or a thrown error naming every problem - a data mistake is found at load, never mid-game */
export function defineCampaign(file: CampaignFile): CampaignFile {
  const problems = campaignProblems(file);
  if (problems.length > 0) throw new Error(`campaign "${file.id}": ${problems.join("; ")}`);
  return file;
}

/** every level in play order: world by world, level by level */
export function nodesOf(file: CampaignFile): CareerNode[] {
  const out: CareerNode[] = [];
  file.worlds.forEach((w, worldIndex) => {
    w.levels.forEach((l, index) => {
      const boss = l.boss === true;
      out.push({ id: l.id, world: w.id, worldIndex, index, order: out.length, boss, number: boss ? null : index + 1 });
    });
  });
  return out;
}
