/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** The commit this bundle was built from, injected by `vite.config.ts`.
 *  `-dirty` when the tree had uncommitted changes; "unknown" without git. */
declare const __BUILD_STAMP__: string;
/** `-<hash>.css`: a theme sheet is `BASE_URL + "assets/theme-" + id + this` (vite.config.ts). */
declare const __THEME_SHEET_SUFFIX__: string;
