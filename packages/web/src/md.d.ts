// Markdown files are imported as raw text (webpack `asset/source`, see next.config.mjs).
// Used to load Oia's editable brain from packages/shared/src/oia/*.md.
declare module '*.md' {
  const content: string;
  export default content;
}
