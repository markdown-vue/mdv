<<<<<<< HEAD
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { u } from 'unist-builder'
import { visit } from 'unist-util-visit'
import { MDVNode } from './global.js'
import { CompileMDVOptions } from './types/mdv-config.js'
import { highlightCode } from './highlighter.js'
import path from 'path'


const codeBlockComponentPath = '../../src/components/code-block.vue';
=======
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import { u } from "unist-builder";
import { visit } from "unist-util-visit";
import { CompileMDVOptions, MDVNode } from "./types/mdv-config.js";
import { highlightCode } from "./highlighter.js";
import path from "path";

const codeBlockComponentPath = "../../src/components/code-block.vue";
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)

/**
 * Parse frontmatter
 */
export function parseFrontmatter(mdContent: string) {
<<<<<<< HEAD
    const { content, data } = matter(mdContent)
    return { content, meta: data }
}

const md = new MarkdownIt({ html: true, breaks: true })
=======
  const { content, data } = matter(mdContent);
  return { content, meta: data };
}

const md = new MarkdownIt({ html: true, breaks: true });
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)

/**
 * Markdown parser to AST
 */

export async function markdownToAST(
  mdContent: string,
  shikiPath: string,
<<<<<<< HEAD
  customComponents: Record<string, string> = {}
): Promise<{ ast: MDVNode, shikis: Record<string, string>, imports: string[], components: string[] }> {

    const tokens = md.parse(mdContent, {})
    const astChildren: MDVNode[] = []
    const stack: { tag: string; children: MDVNode[] }[] = []
    const shikis: Record<string, string> = {}
    const imports: string[] = []
    const components: string[] = []

    let i = 0
    while (i < tokens.length) {
        const token = tokens[i]

        // Table detection
        if (token.type === 'table_open') {
            let headers: string[] = []
            let propsLine: string | null = null
            let placeholder: string | null = null

            const oldI = i;

            i++
            while (i < tokens.length && tokens[i].type !== 'table_close') {
                const t = tokens[i]

                if (t.type === 'th_open') {
                    const textToken = tokens[i + 1]
                    headers.push(textToken.content)
                    i += 2
                    continue
                }

                if (t.type === 'tbody_open' && tokens[i + 1].type === 'tr_open' && tokens[i + 2].type === 'td_open' && tokens[i + 3].type === 'inline') {
                    const textToken = tokens[i + 3]
                    placeholder = textToken.content;
                }

                if (t.type === 'inline') {
                    const line = t.content.trim()
                    if (line.startsWith('{') && line.includes(':data-source') && line.endsWith('}')) {
                        propsLine = line
                    }
                }

                i++
            }

            if (propsLine) {
                astChildren.push(
                    u('table', {
                        headers,
                        propsLine,
                        placeholder
                    }) as MDVNode
                )
                i++
                continue
            } else {
                i = oldI
            }
        }

        // Handle opening tags
        if (token.type.endsWith('_open')) {
            const tag = token.tag
            stack.push({ tag, children: [] })
        } 
        // Handle closing tags
        else if (token.type.endsWith('_close')) {
            const node = stack.pop()
            if (!node) { i++; continue }

            // check if there is a custom component mapping
            const componentPath = customComponents[node.tag];
            const finalTag = componentPath ? getComponentName(componentPath) : node.tag;
            const importLine = `import ${finalTag} from '${componentPath}';`;
            if(componentPath && !imports.includes(importLine)) 
                imports.push(importLine);

            const html = `<${finalTag}>${node.children.map(c => c.value || '').join('')}</${finalTag}>`

            if(!components.includes(finalTag)) components.push(finalTag);

            if (stack.length > 0) stack[stack.length - 1].children.push(u('html', html) as MDVNode)
            else astChildren.push(u('html', html) as MDVNode)
        } 
        // Inline content
        else if (token.type === 'inline') {
            let inlineContent = ''
            for (const child of token.children || []) {
                if (child.type === 'text') inlineContent += child.content
                else if (child.type === 'softbreak') inlineContent += ' <br> '
                else if (child.type === 'code_inline') inlineContent += `<code>${escapeHtml(child.content)}</code>`
                else if (child.type === 'strong_open') inlineContent += '<strong>'
                else if (child.type === 'strong_close') inlineContent += '</strong>'
                else if (child.type === 'em_open') inlineContent += '<em>'
                else if (child.type === 'em_close') inlineContent += '</em>'
                else if (child.type === 'link_open') {
                    const href = child.attrs?.find(([k]) => k === 'href')?.[1] || '#'
                    inlineContent += `<a href="${href}">`
                }
                else if (child.type === 'link_close') inlineContent += '</a>'
                else inlineContent += child.content || ''
            }

            if (stack.length > 0) stack[stack.length - 1].children.push(u('html', inlineContent) as MDVNode)
            else astChildren.push(u('html', inlineContent) as MDVNode)
        } 
        // Fenced code blocks
        else if (token.type === 'fence') {
            const lang = token.info.trim()
            const shiki = { key: `shiki_${Object.keys(shikis).length}`, code: await highlightCode(token.content, lang) }
            shikis[shiki.key] = shiki.code

            const codeHtml = `<CodeBlock name="${shiki.key}" highlight-path="${shikiPath}" raw='${escapeHtml(token.content)}'></CodeBlock>`
            if (stack.length > 0) stack[stack.length - 1].children.push(u('html', codeHtml) as MDVNode)
            else astChildren.push(u('html', codeHtml) as MDVNode)
        }

        i++
    }

    return {
        ast: u('root', astChildren) as MDVNode,
        shikis,
        imports,
        components
    }
=======
  customComponents: Record<string, string> = {},
): Promise<{
  ast: MDVNode;
  shikis: Record<string, string>;
  imports: string[];
  components: string[];
}> {
  const tokens = md.parse(mdContent, {});
  const astChildren: MDVNode[] = [];
  const stack: { tag: string; children: MDVNode[] }[] = [];
  const shikis: Record<string, string> = {};
  const imports: string[] = [];
  const components: string[] = [];

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    // Table detection
    if (token.type === "table_open") {
      let headers: string[] = [];
      let propsLine: string | null = null;
      let placeholder: string | null = null;

      const oldI = i;

      i++;
      while (i < tokens.length && tokens[i].type !== "table_close") {
        const t = tokens[i];

        if (t.type === "th_open") {
          const textToken = tokens[i + 1];
          headers.push(textToken.content);
          i += 2;
          continue;
        }

        if (
          t.type === "tbody_open" &&
          tokens[i + 1].type === "tr_open" &&
          tokens[i + 2].type === "td_open" &&
          tokens[i + 3].type === "inline"
        ) {
          const textToken = tokens[i + 3];
          placeholder = textToken.content;
        }

        if (t.type === "inline") {
          const line = t.content.trim();
          if (
            line.startsWith("{") &&
            line.includes(":data-source") &&
            line.endsWith("}")
          ) {
            propsLine = line;
          }
        }

        i++;
      }

      if (propsLine) {
        astChildren.push(
          u("table", {
            headers,
            propsLine,
            placeholder,
          }) as MDVNode,
        );
        i++;
        continue;
      } else {
        i = oldI;
      }
    }

    // Handle opening tags
    if (token.type.endsWith("_open")) {
      const tag = token.tag;
      stack.push({ tag, children: [] });
    }
    // Handle closing tags
    else if (token.type.endsWith("_close")) {
      const node = stack.pop();
      if (!node) {
        i++;
        continue;
      }

      // check if there is a custom component mapping
      const componentPath = customComponents[node.tag];
      const finalTag = componentPath
        ? getComponentName(componentPath)
        : node.tag;
      const importLine = `import ${finalTag} from '${componentPath}';`;
      if (componentPath && !imports.includes(importLine))
        imports.push(importLine);

      const html = `<${finalTag}>${node.children.map((c) => c.value || "").join("")}</${finalTag}>`;

      if (!components.includes(finalTag)) components.push(finalTag);

      if (stack.length > 0)
        stack[stack.length - 1].children.push(u("html", html) as MDVNode);
      else astChildren.push(u("html", html) as MDVNode);
    }
    // Inline content
    else if (token.type === "inline") {
      let inlineContent = "";
      for (const child of token.children || []) {
        if (child.type === "text") inlineContent += child.content;
        else if (child.type === "softbreak") inlineContent += " <br> ";
        else if (child.type === "code_inline")
          inlineContent += `<code>${escapeHtml(child.content)}</code>`;
        else if (child.type === "strong_open") inlineContent += "<strong>";
        else if (child.type === "strong_close") inlineContent += "</strong>";
        else if (child.type === "em_open") inlineContent += "<em>";
        else if (child.type === "em_close") inlineContent += "</em>";
        else if (child.type === "link_open") {
          const href = child.attrs?.find(([k]) => k === "href")?.[1] || "#";
          inlineContent += `<a href="${href}">`;
        } else if (child.type === "link_close") inlineContent += "</a>";
        else inlineContent += child.content || "";
      }

      if (stack.length > 0)
        stack[stack.length - 1].children.push(
          u("html", inlineContent) as MDVNode,
        );
      else astChildren.push(u("html", inlineContent) as MDVNode);
    }
    // Fenced code blocks
    else if (token.type === "fence") {
      const lang = token.info.trim();
      const shiki = {
        key: `shiki_${Object.keys(shikis).length}`,
        code: await highlightCode(token.content, lang),
      };
      shikis[shiki.key] = shiki.code;

      const codeHtml = `<CodeBlock name="${shiki.key}" highlight-path="${shikiPath}" raw='${escapeHtml(token.content)}'></CodeBlock>`;
      if (stack.length > 0)
        stack[stack.length - 1].children.push(u("html", codeHtml) as MDVNode);
      else astChildren.push(u("html", codeHtml) as MDVNode);
    }

    i++;
  }

  return {
    ast: u("root", astChildren) as MDVNode,
    shikis,
    imports,
    components,
  };
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
}

/**
 * Transform AST for inline components, dynamic tables, etc.
 */
export function transformAST(ast: MDVNode): MDVNode {
<<<<<<< HEAD
    let tableCounter = 0
    const scriptHeaders: string[] = []

    visit(ast, (node: MDVNode) => {
        if (node.type === 'html' && node.value) {
            let value = node.value

            // Inline dynamic components :[expr]{::Component optional props optional}
            value = value.replace(
                /:\[([^\]]+)\](?:\{\s*(?:::(\w+))?([\s\S]*?)\})?/g,
                (_, expr: string, comp?: string, props?: string) => {
                    const tag = comp || 'span';
                    const propStr = props ? props.trim() : '';
                    return `<${tag}${propStr ? ' ' + propStr : ''}>{{ ${expr} }}</${tag}>`;
                }
            );

            // Inline static components [text]{::Component optional props optional}
            value = value.replace(
                /\[([^\]]+)\](?:\{\s*(?:::(\w+))?([\s\S]*?)\})?/g,
                (_, text: string, comp?: string, props?: string) => {
                    const tag = comp || 'span';
                    const propStr = props ? props.trim() : '';
                    return `<${tag}${propStr ? ' ' + propStr : ''}>${text}</${tag}>`;
                }
            );

            node.value = value
        }

        if (node.type === 'table' && node.propsLine) {
            const dataSource = node.propsLine.match(/:data-source="(.+?)"/)?.[1]
            const rowKey = node.propsLine.match(/row-key-prop="(.+?)"/)?.[1] || 'id'
            const cellValue = node.propsLine.match(/cell-value-prop="(.+?)"/)?.[1] || 'value'
            const placeholder = node.placeholder;

            const headersVar = `__mdv_headers_${tableCounter++}`
            scriptHeaders.push(`const ${headersVar} = ${JSON.stringify(node.headers ?? [])}`)

            node.value = `
<table>
  <thead>
    <tr>${node.headers?.map((h: string) => `<th>${h}</th>`).join('')}</tr>
=======
  let tableCounter = 0;
  const scriptHeaders: string[] = [];

  visit(ast, (node: MDVNode) => {
    if (node.type === "html" && node.value) {
      let value = node.value;

      // Inline dynamic components :[expr]{::Component optional props optional}
      value = value.replace(
        /:\[([^\]]+)\](?:\{\s*(?:::(\w+))?([\s\S]*?)\})?/g,
        (_, expr: string, comp?: string, props?: string) => {
          const tag = comp || "span";
          const propStr = props ? props.trim() : "";
          return `<${tag}${propStr ? " " + propStr : ""}>{{ ${expr} }}</${tag}>`;
        },
      );

      // Inline static components [text]{::Component optional props optional}
      value = value.replace(
        /\[([^\]]+)\](?:\{\s*(?:::(\w+))?([\s\S]*?)\})?/g,
        (_, text: string, comp?: string, props?: string) => {
          const tag = comp || "span";
          const propStr = props ? props.trim() : "";
          return `<${tag}${propStr ? " " + propStr : ""}>${text}</${tag}>`;
        },
      );

      node.value = value;
    }

    if (node.type === "table" && node.propsLine) {
      const dataSource = node.propsLine.match(/:data-source="(.+?)"/)?.[1];
      const rowKey = node.propsLine.match(/row-key-prop="(.+?)"/)?.[1] || "id";
      const cellValue =
        node.propsLine.match(/cell-value-prop="(.+?)"/)?.[1] || "value";
      const placeholder = node.placeholder;

      const headersVar = `__mdv_headers_${tableCounter++}`;
      scriptHeaders.push(
        `const ${headersVar} = ${JSON.stringify(node.headers ?? [])}`,
      );

      node.value = `
<table>
  <thead>
    <tr>${node.headers?.map((h: string) => `<th>${h}</th>`).join("")}</tr>
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
  </thead>
  <tbody>
    <tr v-if="${dataSource} && ${dataSource}.length > 0" v-for="item in (${dataSource} as any[])" :key="item.${rowKey}">
      <td v-for="h in ${headersVar}" :key="h">
          <template v-if="item[h]">
            <template v-if="typeof item[h] === 'object'">
                <component v-if="item[h].component" :is="item[h].component" v-bind="item" />
                <span v-else>{{ item[h].${cellValue} }}</span>
            </template>
            <span v-else>{{ item[h] }}</span>
          </template>
      </td>
    </tr>
<<<<<<< HEAD
    ${placeholder ?
                    `<tr v-if="!${dataSource} || ${dataSource}.length === 0">
            <td colspan="${node.headers?.length}">${placeholder}</td>
        </tr>` : ''
                }
  </tbody>
</table>
            `.trim()
        }
    })

    // Attach headers to AST for script injection later
    ast['tableHeadersScript'] = scriptHeaders

    return ast
=======
    ${
      placeholder
        ? `<tr v-if="!${dataSource} || ${dataSource}.length === 0">
            <td colspan="${node.headers?.length}">${placeholder}</td>
        </tr>`
        : ""
    }
  </tbody>
</table>
            `.trim();
    }
  });

  // Attach headers to AST for script injection later
  ast["tableHeadersScript"] = scriptHeaders;

  return ast;
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
}

/**
 * Convert AST to template
 */
export function astToTemplate(ast: MDVNode): string {
<<<<<<< HEAD
    let template = ''
    visit(ast, (node: MDVNode) => {
        if ((node.type === 'html' || node.type === 'table') && node.value) template += node.value + '\n'
    })
    return template
=======
  let template = "";
  visit(ast, (node: MDVNode) => {
    if ((node.type === "html" || node.type === "table") && node.value)
      template += node.value + "\n";
  });
  return template;
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
}

/**
 * Extract user <script setup> and <style> content along with their props/attributes
 */
export function extractScriptStyle(mdContent: string) {
<<<<<<< HEAD
    const stripped = stripCodeBlocks(mdContent);

    const scriptSetupMatch = stripped.match(/<script\s+setup([^>]*)>([\s\S]*?)<\/script>/)
    const styleMatch = stripped.match(/<style([^>]*)>([\s\S]*?)<\/style>/ig)


    return {
        scriptSetup: scriptSetupMatch ? scriptSetupMatch[2] : '',
        scriptSetupProps: scriptSetupMatch ? (scriptSetupMatch[1]?.trim() ? ' ' + scriptSetupMatch[1].trim() : '') : '',
        styles: [...styleMatch ?? []],
    }
}

export async function compileMDV(mdContent: string, metaPath: string, shikiPath:string, options: CompileMDVOptions = {}) {
    const { content, meta } = parseFrontmatter(mdContent)
    const { scriptSetup, scriptSetupProps: extractedScriptSetupProps, styles } = extractScriptStyle(content)



    const { ast, shikis, imports } = await markdownToAST(content, shikiPath, options.customComponents)
    const transformed = transformAST(ast)
    const template = astToTemplate(transformed)

    const tableHeadersScript = (transformed['tableHeadersScript'] ?? []).join('\n')

    const scriptImports = scriptSetup.split('\n').filter(line => line.match(/^import/)).join('\n')
    const cleanedScriptSetup = scriptSetup.split('\n').filter(line => !line.match(/^import/)).join('\n')

    // Use extracted scriptSetup props or fallback to options
    const finalScriptSetupProps = options.scriptSetupProps ?? extractedScriptSetupProps

    const vueSFC = `
=======
  const stripped = stripCodeBlocks(mdContent);

  const scriptSetupMatch = stripped.match(
    /<script\s+setup([^>]*)>([\s\S]*?)<\/script>/,
  );
  const styleMatch = stripped.match(/<style([^>]*)>([\s\S]*?)<\/style>/gi);

  return {
    scriptSetup: scriptSetupMatch ? scriptSetupMatch[2] : "",
    scriptSetupProps: scriptSetupMatch
      ? scriptSetupMatch[1]?.trim()
        ? " " + scriptSetupMatch[1].trim()
        : ""
      : "",
    styles: [...(styleMatch ?? [])],
  };
}

export async function compileMDV(
  mdContent: string,
  metaPath: string,
  shikiPath: string,
  options: CompileMDVOptions = {},
) {
  const { content, meta } = parseFrontmatter(mdContent);
  const {
    scriptSetup,
    scriptSetupProps: extractedScriptSetupProps,
    styles,
  } = extractScriptStyle(content);

  const { ast, shikis, imports } = await markdownToAST(
    content,
    shikiPath,
    options.customComponents,
  );
  const transformed = transformAST(ast);
  const template = astToTemplate(transformed);

  const tableHeadersScript = (transformed["tableHeadersScript"] ?? []).join(
    "\n",
  );

  const scriptImports = scriptSetup
    .split("\n")
    .filter((line) => line.match(/^import/))
    .join("\n");
  const cleanedScriptSetup = scriptSetup
    .split("\n")
    .filter((line) => !line.match(/^import/))
    .join("\n");

  // Use extracted scriptSetup props or fallback to options
  const finalScriptSetupProps =
    options.scriptSetupProps ?? extractedScriptSetupProps;

  const vueSFC = `
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
<template>
${template}
</template>

<script setup ${finalScriptSetupProps}>
import { provide as __mdvProvide } from 'vue'
<<<<<<< HEAD
import $meta from './${metaPath.substring(metaPath.lastIndexOf('/') + 1)}'
import CodeBlock from '${codeBlockComponentPath}'
${imports.join('\n')}
=======
import $meta from './${metaPath.substring(metaPath.lastIndexOf("/") + 1)}'
import CodeBlock from '${codeBlockComponentPath}'
${imports.join("\n")}
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
${scriptImports}

${tableHeadersScript}

__mdvProvide('meta', {
    ...$meta,
    metaPath: '${metaPath}'
})

${cleanedScriptSetup}

</script>

<<<<<<< HEAD
${styles.join('\n')}
`
    return { content: vueSFC, meta, shikis }
}


=======
${styles.join("\n")}
`;
  return { content: vueSFC, meta, shikis };
}

>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
/**
 * Component names need to be PascalCase and escape unsupported characters
 */
function pascalCase(str: string) {
<<<<<<< HEAD
    return str
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .split(' ')
        .map(s => s.charAt(0).toUpperCase() + s.substring(1))
        .join('')
}



=======
  return str
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join("");
}

>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
/**
 * Generate TypeScript GlobalComponents module string
 * @param componentNames PascalCase component names
 */
export function generateGlobalComponentsModule(paths: string[]): string {
  const imports = paths
<<<<<<< HEAD
    .map(p => {
      const name = getComponentName(p) // or shim path
      return `import ${name} from '${p.replace(/\.v.md$/, '.vue')}'`
    })
    .join('\n')

  const componentNames = paths.map(getComponentName)
=======
    .map((p) => {
      const name = getComponentName(p); // or shim path
      return `import ${name} from '${p.replace(/\.v.md$/, ".vue")}'`;
    })
    .join("\n");

  const componentNames = paths.map(getComponentName);
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)

  return `
import type { DefineComponent } from 'vue'
${imports}

declare module '@vue/runtime-core' {
  interface GlobalComponents {
    ${componentNames
<<<<<<< HEAD
      .map(c => `${c}: typeof ${c}`) // fallback to DefineComponent
      .join('\n    ')}
  }
}
  `.trim()
}

function getComponentName(rawPath: string) {
    return pascalCase(
        path
            .basename(rawPath)
            .replace(/(\.vue|\.v.md)$/g, '')
    );
=======
      .map((c) => `${c}: typeof ${c}`) // fallback to DefineComponent
      .join("\n    ")}
  }
}
  `.trim();
}

function getComponentName(rawPath: string) {
  return pascalCase(path.basename(rawPath).replace(/(\.vue|\.v.md)$/g, ""));
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
}

/**
 * Escape HTML
 */
function escapeHtml(str: string) {
<<<<<<< HEAD
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
=======
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
}

/**
 * Strip code blocks
<<<<<<< HEAD
 * 
 * @param mdContent 
 * @returns 
 */
function stripCodeBlocks(mdContent: string): string {
    // Replace fenced code blocks with placeholders
    return mdContent.replace(/```[\s\S]*?```/g, match => {
        return match.replace(/./g, ' '); // preserve line count for error reporting
    });
=======
 *
 * @param mdContent
 * @returns
 */
function stripCodeBlocks(mdContent: string): string {
  // Replace fenced code blocks with placeholders
  return mdContent.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/./g, " "); // preserve line count for error reporting
  });
>>>>>>> 0948ef6 (feat: initialize Markdown-Vue (MDV) project with core functionality)
}
