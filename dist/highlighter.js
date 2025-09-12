// highlight.ts
import { createHighlighter, } from "shiki";
let highlighterPromise = null;
export async function getMDVHighlighter() {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: ["github-light"], // load only needed themes
            langs: [
                "javascript",
                "typescript",
                "vue",
                "css",
                "html",
                "json",
                "markdown",
                "python",
                "rust",
                "toml",
                "yaml",
            ],
        });
    }
    return highlighterPromise;
}
export async function highlightCode(code, lang, theme = "github-light") {
    const highlighter = await getMDVHighlighter();
    return highlighter.codeToHtml(code, { lang, theme });
}
// Setup highlighter on startup
const setupHighlighter = () => {
    let executed = false;
    return () => {
        if (executed)
            return;
        executed = true;
        getMDVHighlighter();
    };
};
setupHighlighter();
export default { highlightCode, setupHighlighter };
