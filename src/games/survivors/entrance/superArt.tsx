import type { ReactElement } from "react";
import type { WeaponId } from "../types";

// Each weapon's SUPER POWER, drawn as the weapon's own line art grown up - the
// same 24-unit canvas and the same hand as weaponArt.tsx, in `currentColor`, so
// the super is drawn in its weapon's ink and reads as YOUR weapon evolved
// rather than a new thing arriving (the reading evolve.ts gives an evolution).
//
// NEW ART (2026-09-30): no evolved-weapon drawing existed in the repo. The
// railgun is the approved mock's; the other four follow it - the base
// silhouette plus the one BEHAVIOUR its evolution adds (evolve.ts), because a
// distinct power gets its own motion, never one shape drawn bigger.
//
// A `Record<WeaponId, ...>`, so a sixth weapon without a super drawing fails
// the build by name.

const svg = (size: number, children: ReactElement | ReactElement[]) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block", overflow: "visible" }}
  >
    {children}
  </svg>
);

export const SUPER_ART: Record<WeaponId, (size?: number) => ReactElement> = {
  // RAILGUN: the bolt's streak become a beam, with rungs along it and a white-hot head.
  bolt: (size = 28) =>
    svg(size, [
      <path key="glow" d="M1 23L20 4" strokeWidth={7} opacity={0.25} />,
      <path key="beam" d="M1 23L20 4" strokeWidth={3.2} />,
      <path key="core" d="M1 23L20 4" stroke="#fff" strokeWidth={1.2} />,
      <path key="rungs" d="M5 15l4 4M9 11l4 4M13 7l4 4" strokeWidth={1.6} />,
      <circle key="head" cx="20.5" cy="3.5" r="3.4" fill="#fff" />,
    ]),
  // STORM: the arc's curve, and a jagged jump from its head to the next shape.
  arc: (size = 28) =>
    svg(size, [
      <path key="glow" d="M3 21C3 11 8 6 15 6" strokeWidth={6} opacity={0.25} />,
      <path key="curve" d="M3 21C3 11 8 6 15 6" strokeWidth={2.6} />,
      <path key="jump" d="M15 6l3 3-2 1 4 4" stroke="#fff" strokeWidth={1.6} />,
      <circle key="a" cx="15.5" cy="5.5" r="2.4" fill="currentColor" />,
      <circle key="b" cx="20.5" cy="14.5" r="2.4" fill="#fff" />,
    ]),
  // NOVA: the burst's ring of dots, and the ring of fire it leaves burning.
  burst: (size = 28) =>
    svg(size, [
      <circle key="fire" cx="12" cy="12" r="10.5" strokeWidth={3} strokeDasharray="2 3" opacity={0.55} />,
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        return <circle key={i} cx={12 + 7 * Math.cos(a)} cy={12 + 7 * Math.sin(a)} r="1.9" fill="currentColor" stroke="none" />;
      }),
      <circle key="core" cx="12" cy="12" r="2.2" fill="#fff" stroke="none" />,
    ]),
  // SAWSTORM: the blades' crescents, flung out onto a wider ring.
  blades: (size = 28) =>
    svg(size, [
      <circle key="reach" cx="12" cy="12" r="10.5" strokeWidth={1.4} strokeDasharray="1.5 2.5" opacity={0.7} />,
      <circle key="hub" cx="12" cy="12" r="2" fill="#fff" />,
      ...[0, 120, 240].map((d) => (
        <path key={d} transform={`rotate(${d} 12 12)`} d="M5.5 4Q12 -2.5 18.5 4Q12 1.5 5.5 4Z" fill="currentColor" />
      )),
    ]),
  // SWARM: one saucer become three, each firing.
  drone: (size = 28) =>
    svg(
      size,
      ([[12, 6], [5, 17], [19, 17]] as const).flatMap(([x, y], i) => [
        <path key={`d${i}`} d={`M${x - 2.4} ${y}a2.4 2.4 0 014.8 0`} strokeWidth={1.4} />,
        <ellipse key={`b${i}`} cx={x} cy={y + 0.9} rx={4.6} ry={1.6} fill="currentColor" stroke="none" />,
        <circle key={`s${i}`} cx={x} cy={y + 4} r={0.9} fill="#fff" stroke="none" />,
      ]),
    ),
  // The barrier: a wide double ring and arrows pushing out.
  halo: (size = 28) =>
    svg(size, [
      <circle key="glow" cx="12" cy="12" r="10.5" strokeWidth={4} opacity={0.3} />,
      <circle key="ring" cx="12" cy="12" r="10.5" strokeWidth={2} />,
      <circle key="core" cx="12" cy="12" r="2.6" fill="#fff" />,
      <path key="push" d="M12 5V1M12 19v4M5 12H1M19 12h4" stroke="#fff" strokeWidth={1.6} />,
    ]),
  // The thunderhead: a cloud and three bolts under it.
  zap: (size = 28) =>
    svg(size, [
      <path key="cloud" d="M5 10a4 4 0 017-3 4 4 0 017 3z" fill="currentColor" />,
      <path key="b1" d="M7 12l-2 5h3l-1 5" stroke="#fff" strokeWidth={1.6} />,
      <path key="b2" d="M13 12l-2 5h3l-1 5" stroke="#fff" strokeWidth={1.6} />,
      <path key="b3" d="M19 12l-2 4h3" stroke="#fff" strokeWidth={1.6} />,
    ]),
  // The firestorm: three flames side by side.
  flask: (size = 28) =>
    svg(size, [0, 7, 14].map((x) => <path key={x} d={`M${x + 2} 22c-2-3 0-6 2-9 2 3 4 6 2 9z`} fill="currentColor" />)),
  // The pinball: a big ball and a long bouncing path.
  bouncer: (size = 28) =>
    svg(size, [
      <path key="path" d="M1 22l4-7 4 5 4-7 4 5" strokeWidth={1.8} strokeDasharray="2 2" />,
      <circle key="glow" cx="18" cy="7" r="6" fill="currentColor" opacity={0.3} />,
      <circle key="ball" cx="18" cy="7" r="4.2" fill="currentColor" />,
      <circle key="shine" cx="16.6" cy="5.6" r="1.2" fill="#fff" />,
    ]),
};
