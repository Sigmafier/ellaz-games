import { createElement } from "react";
import { reactGame } from "../reactHost";
import { meta } from "./meta";
import { LineGame } from "./LineGame";

// Like snake and survivors, this is a React game that HOSTS a Phaser canvas
// rather than a bare Phaser GameModule. That is what lets it wear `ArcadeChrome`
// - the HUD, the entrance and the pause - instead of drawing its own numbers
// into a canvas corner.
//
// Phaser itself stays lazy: `LineGame` imports it inside an effect, so the
// engine is downloaded when this game mounts and never on a first visit.
export default reactGame(meta, (ctx) => createElement(LineGame, { ctx }));
