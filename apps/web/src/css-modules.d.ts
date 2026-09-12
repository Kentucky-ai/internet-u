// Side-effect CSS imports. Newer TypeScript defaults check these imports
// (noUncheckedSideEffectImports) and cannot resolve a `.css` subpath exported
// by a package, which broke the Netlify build; declare them so both the
// package stylesheet and local stylesheets type-check everywhere.
declare module "*.css";
