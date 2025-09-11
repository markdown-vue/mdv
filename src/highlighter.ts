// highlight.ts
<<<<<<< HEAD
import { BundledLanguage, BundledTheme, createHighlighter, HighlighterGeneric } from 'shiki'

let highlighterPromise: Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> | null = null

export async function getMDVHighlighter() {
    if (!highlighterPromise) {
        highlighterPromise = createHighlighter({
            themes: ['github-light'], // load only needed themes
            langs: ['javascript', 'typescript', 'vue', 'css', 'html', 'json', 'markdown', 'python', 'rust', 'toml', 'yaml'],
        })
    }
    return highlighterPromise
}

export async function highlightCode(code: string, lang: string, theme: string = 'github-light') {
    const highlighter = await getMDVHighlighter()
    return highlighter.codeToHtml(code, { lang, theme })
}

// Setup highlighter on startup
const setupHighlighter = (() => {
    let executed = false
    return () => {
        if (executed) return
        executed = true
        getMDVHighlighter()
    }
})

setupHighlighter()
=======
import {
  BundledLanguage,
  BundledTheme,
  createHighlighter,
  HighlighterGeneric,
} from "shiki";

let highlighterPromise: Promise<
  HighlighterGeneric<BundledLanguage, BundledTheme>
> | null = null;

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

export async function highlightCode(
  code: string,
  lang: string,
  theme: string = "github-light",
) {
  const highlighter = await getMDVHighlighter();
  return highlighter.codeToHtml(code, { lang, theme });
}

// Setup highlighter on startup
const setupHighlighter = () => {
  let executed = false;
  return () => {
    if (executed) return;
    executed = true;
    getMDVHighlighter();
  };
};

setupHighlighter();
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
