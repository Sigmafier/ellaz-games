// The title card's choices, remembered on this device: the level, the map and
// your colour each under its own key in the game's storage. The number of
// players is not remembered - two people at one keyboard is an occasion, and a
// lone player who opens the game should not find the arrows split in half.
import { useCallback, useState } from "react";
import type { GameContext } from "@sdk/index";
// The MODULE, not the `@shared/index` barrel.
import { LEVEL_KEY } from "@shared/useRememberedLevel";
import type { Choices } from "./ArenaScene";
import { colourFromSaved, type ColourId } from "./colours";
import { levelFromSaved, mapFromSaved, type Level, type MapId } from "./setup";

/**
 * Storage keys. NEW keys, never renamed: a persisted key is forever. The level
 * keeps the key every game's level lives under, so the bot count saved before
 * levels existed is read back and mapped (`levelFromSaved`).
 */
export const MAP_KEY = "map";
export const COLOUR_KEY = "colour";

export function useChoices(ctx: GameContext, pc: boolean) {
  const read = <T,>(key: string, parse: (v: unknown) => T) => parse(ctx.storage.get<unknown>(key, null));
  const [level, setLevelState] = useState<Level>(() => read(LEVEL_KEY, levelFromSaved));
  const [map, setMapState] = useState<MapId>(() => read(MAP_KEY, mapFromSaved));
  const [colour, setColourState] = useState<ColourId>(() => read(COLOUR_KEY, colourFromSaved));
  const [players, setPlayers] = useState<1 | 2>(1);
  // Two players is a PC thing: a phone never deals one, whatever was picked.
  const choices: Choices = { level, map, colour, humans: pc ? players : 1 };

  // Write through from the tap, as `useRememberedLevel` does: an effect could
  // be lost to an unmount on the same tap.
  const setLevel = useCallback((l: Level) => (setLevelState(l), ctx.storage.set(LEVEL_KEY, l)), [ctx]);
  const setMap = useCallback((m: MapId) => (setMapState(m), ctx.storage.set(MAP_KEY, m)), [ctx]);
  const setColour = useCallback((c: ColourId) => (setColourState(c), ctx.storage.set(COLOUR_KEY, c)), [ctx]);
  return { choices, players, setLevel, setMap, setColour, setPlayers };
}
