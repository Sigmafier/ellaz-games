// Snake's on-screen controls on a PHONE. A module of its own, with no DOM and
// no Phaser, so the sizes are testable in node (`snake-controls.test.ts`).

/**
 * THE PHONE'S CONTROLS, SMALLER, SO THE BOARD GETS THE SCREEN.
 *
 * Player report, 2026-09-29, Android 360x726: "Snake buttons are too big
 * joystick are too big". Snake's footer sits UNDER the board on a phone, so
 * every px the pad takes is a px the frame is taller than the screen - and
 * `fitStage` answers that by scaling the WHOLE game, board included. The pad
 * at `PAD_CELL` (88, three cells and two gaps = 280px) is the reason the board
 * was drawn smaller than the width it was given.
 *
 * 64 is `--tap-kids`, the platform's age-five target (tokens.css: "~2cm+"),
 * which `direction-pad.test.ts` pins as the pad's FLOOR - so every arrow still
 * clears it, with no margin spent, because this is exactly the trade the report
 * asks for. The pad drops to 3x64 + 2x8 = 208px. `snake-controls.test.ts` holds
 * the floor, so a later "smaller please" cannot take a key under it.
 *
 * A PC keeps `PAD_CELL`: its footer sits in a column BESIDE the board, where a
 * smaller pad buys the board nothing.
 *
 * Measured on the built page, 2026-09-29 (arrows mode; board and key are the
 * RENDERED sizes, after fitStage):
 *
 *               pad 88 (before)                 pad 64 (this)
 *   390x844     scale 0.917, board 315, key 81  scale 1, board 343, key 64
 *   360x726     scale 0.757, board 240, key 67  scale 0.825, board 262, key 53
 *   1536x639    board 407, key 88               unchanged
 *
 * THE 360 ROW IS A TRADE, NAMED HERE RATHER THAN HIDDEN. That screen is short
 * enough that fitStage scales the whole game whatever the pad is, so a 64px key
 * is DRAWN at 53px there, as the old 88px key was drawn at 67. The floor this
 * file holds is the layout size the shared pad's own test pins; no pad size
 * alone can keep a drawn key at 64 on that screen and still give the board
 * anything (84 would: board 243, key 64). The well below is sized so it stays
 * over two kids targets across even there: 156 is drawn at 138.
 */
export const PHONE_PAD_CELL = 64;

/**
 * The Joystick setting's well on a phone, px. DirectionPad's `STICK_SIZE` (200)
 * sits inside the 88px pad's 280px footprint; this one sits inside the 64px
 * pad's 208, so switching Arrows <-> Joystick still never makes the footer
 * taller. The whole well is the target, and it is more than twice `--tap-kids`
 * across. Measured: 360x726 board 264 -> 280 rendered, 390x844 unchanged at
 * 343 (the frame already fit), well 200 -> 156.
 *
 * DirectionPad takes no stick size, and it is a shared component outside this
 * game, so the well and its knob are resized from here by a scoped rule over
 * the inline size it draws (`snake-controls.test.ts` pins the shape this reads).
 * The stick maths read the well's RENDERED box, so a smaller well steers
 * correctly with no other change.
 */
export const PHONE_STICK = 156;
/** The knob stays the fraction of the well DirectionPad draws (its `KNOB`, 0.6). */
export const PHONE_KNOB = Math.round(PHONE_STICK * 0.6);
/** The scoped rule, rendered by SnakeGame only on a phone in Joystick mode. */
export const PHONE_STICK_CSS =
  `.snake-stick [aria-hidden="true"]{width:${PHONE_STICK}px!important;height:${PHONE_STICK}px!important}` +
  `.snake-stick [aria-hidden="true"]>div{width:${PHONE_KNOB}px!important;height:${PHONE_KNOB}px!important}`;
