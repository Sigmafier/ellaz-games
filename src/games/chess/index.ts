import { createElement } from "react";
import { reactGame } from "../reactHost";
import { meta } from "./meta";
import { Chess } from "./Chess";

export default reactGame(meta, (ctx) => createElement(Chess, { ctx }));
