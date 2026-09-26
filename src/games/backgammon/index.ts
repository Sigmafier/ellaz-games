import { createElement } from "react";
import { reactGame } from "../reactHost";
import { meta } from "./meta";
import { Backgammon } from "./Backgammon";

export default reactGame(meta, (ctx) => createElement(Backgammon, { ctx }));
