// The career kit's screens - everything the lazy `career` chunk holds.
//
// A game never imports this file statically. It calls `loadCareerKit()` from
// ./load, which is the dynamic import that keeps the kit off the first visit
// (the first of the three changes precache-glob-sweeps-new-chunks.md names; the
// named `career` branch in vite.config.ts manualChunks and the
// `**/career-*.js` globIgnores entry are the other two).
export { TrailMap } from "./TrailMap";
export type { MapTier, TrailMapProps } from "./TrailMap";
export { BoardMap } from "./BoardMap";
export type { BoardMapProps } from "./BoardMap";
export { VendingShop } from "./VendingShop";
export type { Shelf, VendingShopProps } from "./VendingShop";
export { Gear, TIER_COLOR } from "./Gear";
export type { GearScreenProps, StatBar } from "./Gear";
export type { Currency, Purse } from "./parts";
export type { ItemInfo } from "./InfoCard";
export { CareerIcon } from "./icons";
export { careerWords } from "./words";
export type { CareerSkin } from "./skin";
