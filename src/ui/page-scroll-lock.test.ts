// The page-scroll lock is a COUNT, and every way a count goes wrong is a page
// a player cannot scroll back to the article on, or a run that scrolls under a
// thumb again. See pageScrollLock.ts for the measurement it came from.
import { describe, expect, it } from "vitest";
import { holdPageScroll, pageScrollHolds, type ScrollRoot } from "./pageScrollLock";

const root = (overflow = "", gutter = ""): ScrollRoot => ({ style: { overflow, scrollbarGutter: gutter } });

describe("the page-scroll lock", () => {
  it("hides the page's overflow while held and puts back exactly what was there", () => {
    const r = root("clip");
    const release = holdPageScroll(r, 0);
    expect(r.style.overflow).toBe("hidden");
    release();
    expect(r.style.overflow).toBe("clip");
    expect(pageScrollHolds(r)).toBe(0);
  });

  it("stays locked until the LAST holder lets go", () => {
    const r = root();
    const run = holdPageScroll(r, 0);
    const shop = holdPageScroll(r, 0);
    expect(pageScrollHolds(r)).toBe(2);
    run();
    expect(r.style.overflow).toBe("hidden");
    shop();
    expect(r.style.overflow).toBe("");
  });

  it("a release called twice never releases somebody else's hold", () => {
    const r = root();
    const a = holdPageScroll(r, 0);
    const b = holdPageScroll(r, 0);
    a();
    a();
    expect(pageScrollHolds(r)).toBe(1);
    expect(r.style.overflow).toBe("hidden");
    b();
    expect(r.style.overflow).toBe("");
  });

  it("remembers the page as it was before the FIRST hold, not the second", () => {
    const r = root("auto");
    const a = holdPageScroll(r, 0);
    const b = holdPageScroll(r, 0);
    b();
    a();
    expect(r.style.overflow).toBe("auto");
  });

  it("keeps a desktop scrollbar's gutter while held, so nothing sized to the window moves", () => {
    const r = root("", "auto");
    const release = holdPageScroll(r, 15);
    expect(r.style.scrollbarGutter).toBe("stable");
    release();
    expect(r.style.scrollbarGutter).toBe("auto");
  });

  it("leaves the gutter alone on a phone, whose scrollbar takes no width", () => {
    const r = root();
    const release = holdPageScroll(r, 0);
    expect(r.style.scrollbarGutter).toBe("");
    release();
  });

  it("can be taken again after it has been fully released", () => {
    const r = root();
    holdPageScroll(r, 0)();
    const again = holdPageScroll(r, 0);
    expect(r.style.overflow).toBe("hidden");
    again();
    expect(r.style.overflow).toBe("");
  });
});
