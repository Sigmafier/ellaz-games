// What the backup card counts, in the units a child recognises (P4).
//
// The diamond balance rides the backup as a RECORD-shaped key (see the header of
// src/sdk/diamonds.ts: that shape is what let backup carry it for zero shell
// bytes). So it is taken OUT of the record count - it is not a personal best -
// and shown as its own number. The key is written here rather than imported,
// because importing src/sdk/diamonds.ts would pull the lazy `career` chunk into
// every page that shows the room; `backup-tally.test.ts` pins the two equal.

import type { Records } from "@sdk/index";

export const DIAMOND_RECORD = "ellaz:diamonds:score:balance";

export function tallyRecords(records: Records): { records: number; diamonds: number } {
  const keys = Object.keys(records);
  const gems = records[DIAMOND_RECORD];
  return { records: keys.filter((k) => k !== DIAMOND_RECORD).length, diamonds: typeof gems === "number" ? gems : 0 };
}
