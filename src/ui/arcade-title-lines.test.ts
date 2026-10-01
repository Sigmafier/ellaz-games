import { describe, expect, it } from "vitest";
import { balancedLines } from "./ArcadeTitle";

/**
 * A HEADING on the title-style card ("Out of tail", "The keep fell") splits at
 * the space nearest its middle, as the approved mock set them - "OUT OF / TAIL",
 * never "OUT / OF TAIL". The game's NAME keeps `titleLines` (first space), which
 * the approved titles were drawn with.
 */
describe("a heading splits at the space nearest its middle", () => {
  it("the four the mock drew", () => {
    expect(balancedLines("Out of tail", "en")).toEqual(["OUT OF", "TAIL"]);
    expect(balancedLines("Out of hearts", "en")).toEqual(["OUT OF", "HEARTS"]);
    expect(balancedLines("The keep fell", "en")).toEqual(["THE KEEP", "FELL"]);
    expect(balancedLines("Snake Arena", "en")).toEqual(["SNAKE", "ARENA"]);
  });

  it("one word stays one line, Hebrew is left as written, and other languages balance too", () => {
    expect(balancedLines("Fästet", "sv")).toEqual(["FÄSTET"]);
    expect(balancedLines("הזנב נגמר", "he")).toEqual(["הזנב", "נגמר"]);
    expect(balancedLines("Slut på svans", "sv")).toEqual(["SLUT PÅ", "SVANS"]);
  });

  it("THE CONTROL: a first-space split would have read OUT / OF TAIL", () => {
    expect(balancedLines("Out of tail", "en")).not.toEqual(["OUT", "OF TAIL"]);
  });
});
