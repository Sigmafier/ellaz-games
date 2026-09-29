// What is OPEN, what is DONE, and where the player is up to.
//
// ONE rule, over one list: a level is open when it is the first, or the level
// before it in play order has been cleared. Because every world ends on its
// boss, "the level before the first level of world two" IS world one's boss, so
// this single rule is also the world rule - world two opens when world one's
// boss falls, and not before. The Toybox wrote the same thing as two nested
// rules (flow.ts levelUnlocked + unlocked); copied-rules.test.ts holds the pair.
//
// Stars are 1 to 3 for a cleared level and only ever rise: a worse replay costs
// nothing. A win always earns at least one.

import { nodesOf } from "./campaign";
import type { CampaignFile, CareerNode } from "./campaign";
import type { CareerSave } from "./save";

/** `now` is the ONE level you are up to; `open` is kept for a list whose order is not the unlock order (none today) */
export type NodeState = "done" | "now" | "open" | "locked";

export interface LevelStateView { id: string; state: NodeState; stars: number }
export interface NodeStateView { node: CareerNode; state: NodeState; stars: number }

export const starsOf = (save: CareerSave, id: string): number => save.stars[id] ?? 0;

export const totalStars = (save: CareerSave): number => Object.values(save.stars).reduce((a, b) => a + b, 0);

/**
 * The map's states over any ordered list of level ids: done up to the first gap,
 * that one NOW, everything after it locked. A star recorded past the gap (a
 * hand-edited save) does not open anything.
 */
export function linearStates(ids: readonly string[], save: CareerSave): LevelStateView[] {
  let open = true;
  return ids.map((id) => {
    const stars = starsOf(save, id);
    if (!open) return { id, state: "locked", stars };
    if (stars > 0) return { id, state: "done", stars };
    open = false;
    return { id, state: "now", stars };
  });
}

/** the campaign's nodes, each with its state and stars */
export function nodeStates(file: CampaignFile, save: CareerSave): NodeStateView[] {
  const nodes = nodesOf(file);
  const states = linearStates(nodes.map((n) => n.id), save);
  return nodes.map((node, i) => ({ node, state: states[i].state, stars: states[i].stars }));
}

function orderOf(file: CampaignFile, id: string): CareerNode[] {
  const nodes = nodesOf(file);
  if (!nodes.some((n) => n.id === id)) throw new Error(`campaign "${file.id}" has no level "${id}"`);
  return nodes;
}

/** is this level open to play - the first, or the one before it cleared */
export function isUnlocked(file: CampaignFile, save: CareerSave, id: string): boolean {
  const nodes = orderOf(file, id);
  const i = nodes.findIndex((n) => n.id === id);
  return linearStates(nodes.map((n) => n.id), save)[i].state !== "locked";
}

/** the level you are up to, or null once every level is cleared */
export function currentNode(file: CampaignFile, save: CareerSave): CareerNode | null {
  const now = nodeStates(file, save).find((v) => v.state === "now");
  return now ? now.node : null;
}

/** a partial star is not a star: 2.6 earns two */
const clampStars = (n: number): number => (Number.isFinite(n) ? Math.min(3, Math.max(1, Math.floor(n))) : 1);

/** bank a won level: its best stars, never lower than before. A locked level records nothing and hands the same save back */
export function recordClear(file: CampaignFile, save: CareerSave, id: string, stars: number): CareerSave {
  if (!isUnlocked(file, save, id)) return save;
  const best = Math.max(starsOf(save, id), clampStars(stars));
  if (best === starsOf(save, id)) return save;
  return { ...save, stars: { ...save.stars, [id]: best } };
}
