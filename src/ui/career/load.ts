// The ONE way into the career kit's screens: a dynamic import, so a game that
// uses them fetches the `career` chunk when its lobby opens and nobody else
// ever does. Importing `./index` statically from a game would still keep the
// kit off the first visit (a game chunk is lazy itself), but it would fold the
// screens into that game's own chunk and every career game would ship its own
// copy. Call this instead.
//
// NO CALLER YET (P2). Neon Survival is wired onto the kit in P3; until then this
// function is armed and unreachable, and the build emits no `career-*.js` at all.
export const loadCareerKit = () => import("./index");
