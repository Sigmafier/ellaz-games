// The joystick's maths, and nothing else. No DOM, no Phaser, no canvas - so the
// whole control tests in node, the same way `logic.ts` does.
//
// ONE STICK, BORN WHERE THE THUMB LANDS. There were two until 2026-09-22 - this
// one and a second bolted to the arena's lower corner, with a picker on the
// entrance screen to choose. The operator removed the choice: *"Lets remove the
// joystick/on screen buttons and just do the on screen"*.
//
// They differed only in where the origin came from, so the deletion took a
// parameter and a stored setting rather than an implementation. What is left is
// the one a thumb finds without looking, which is the argument the corner stick
// never had: on a phone the arena IS the control, and a fixed ring is a thing
// you have to aim at before you can aim with it.
//
// WHY DIRECTION AND NOT SPEED. `logic.ts` NORMALISES the steering vector it is
// handed - `const len = Math.hypot(dx, dy); ... (input.dx / len) * v` - so how
// far the knob is pushed cannot make the robot faster, and a half-tilt is not a
// walk. That is the existing contract and this control does not change it: the
// magnitude here exists to DRAW the knob, never to drive the ship. Anyone
// tempted to add variable speed must change `logic.ts`, deliberately, and say so.

/** Arena units from the origin to full tilt. The ring the knob is drawn on. */
export const STICK_RADIUS = 42;

/**
 * How far the thumb may stray before the robot moves at all, in arena units.
 *
 * Not a style choice: a finger resting on a touchscreen wanders by a few pixels
 * without the person intending anything, and the scene's own pointer path
 * already carries this idea - it holds the ship still inside 6 units of the
 * touch point. The same 6 is used here so the two paths cannot disagree about
 * what counts as "not moving".
 */
export const STICK_DEADZONE = 6;

export interface Stick {
  /** Where the stick was born, in arena units. */
  ox: number;
  oy: number;
  /** Where the thumb is now, in arena units. */
  px: number;
  py: number;
}

/**
 * The steering vector this stick is asking for.
 *
 * Returns a DIRECTION whose magnitude is 0..1 for the renderer's benefit; the
 * simulation normalises it away. Inside the deadzone it returns a true zero,
 * which `logic.ts` reads as "hold still" rather than as a tiny drift.
 */
export function stickVector(s: Stick): { dx: number; dy: number } {
  const dx = s.px - s.ox;
  const dy = s.py - s.oy;
  const d = Math.hypot(dx, dy);
  // The guard that matters: a thumb exactly on the origin gives d = 0, and
  // dividing by it yields NaN, which propagates into the ship's position and
  // removes the robot from the arena entirely. It is the first frame of every
  // tap-born stick, so this is the common case and not an edge one.
  if (d <= STICK_DEADZONE) return { dx: 0, dy: 0 };
  const mag = Math.min(d, STICK_RADIUS) / STICK_RADIUS;
  return { dx: (dx / d) * mag, dy: (dy / d) * mag };
}

/**
 * Where to draw the knob: on the thumb while it is inside the ring, pinned to
 * the ring's edge once it is outside. Clamped rather than followed, so dragging
 * far away keeps steering at full tilt instead of flinging the knob off screen.
 */
export function knobAt(s: Stick): { x: number; y: number } {
  const dx = s.px - s.ox;
  const dy = s.py - s.oy;
  const d = Math.hypot(dx, dy);
  if (d <= STICK_RADIUS || d === 0) return { x: s.px, y: s.py };
  return { x: s.ox + (dx / d) * STICK_RADIUS, y: s.oy + (dy / d) * STICK_RADIUS };
}

/**
 * Where a stick is born for a touch at (x, y): under the thumb, always.
 *
 * KEPT AS A FUNCTION rather than inlined at its one call site, even though it
 * now returns its own arguments. It is the seam the corner style lived behind,
 * and `stick.test.ts` asserts the property through it - that a stick is born
 * exactly where it was touched, anywhere on the arena - which is a claim about
 * the control rather than about an expression in the scene.
 */
export function originFor(x: number, y: number): { ox: number; oy: number } {
  return { ox: x, oy: y };
}
