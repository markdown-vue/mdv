import matter from "gray-matter";
import MarkdownIt, { Token } from "markdown-it";
import { u } from "unist-builder";
import { visit } from "unist-util-visit";
import { CompileMDVOptions, MDVNode } from "@mdv/types/mdv-config";
import { highlightCode } from "@mdv/highlighter";
import path from "path";
import { pathToFileURL } from "url";


/**
 * Parse frontmatter
 * 
 * Extracts YAML frontmatter from markdown and returns content and metadata
 * 
 * @param mdContent
 * @returns content, meta
 */
export function parseFrontmatter(mdContent: string) {
    const { content, data } = matter(mdContent);
    return { content, meta: data };
}

const md = new MarkdownIt({ html: true, breaks: true });


/**
 * Markdown parser to AST
 * 
 * Converts markdown to Abstract Syntax Tree
 * 
 * @returns ast, shikis, imports, components
 * 
 * @param mdContent
 * @param shikiPath
 * @param customComponents
 */

export async function markdownToAST(
    mdContent: string,
    shikiPath: string,
    customComponents: Record<string, string> = {},
): Promise<{
    ast: MDVNode;
    shikis: Record<string, string>;
    imports: string[];
    components: string[];
}> {
    const tokens = md.parse(mdContent, {});

    // Run validation before doing anything else
    validateMDVContainers(tokens);

    const astChildren: MDVNode[] = [];
    const stack: { tag: string; children: MDVNode[], props?: string }[] = [];
    const shikis: Record<string, string> = {};
    const imports: string[] = [];
    const components: string[] = [];


    let i = 0;
    while (i < tokens.length) {
        const token = tokens[i];

        // Container syntax detection
        if (token.type === "paragraph_open" && tokens[i + 1]?.type === "inline" && tokens[i + 1]?.content.trim() === "[") {
            let j = i + 3; // skip opening line
            const { node, newIndex } = await parseContainer(tokens, j, shikiPath, customComponents);
            if (node) {
                stack.push(node);
                i = newIndex;
                continue;
            }
        }


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
            
            // Check for Trailing syntaxes - { ...props } at end of blocks
            const nodeValue = node.children[node.children?.length - 1]?.value;
            let trailingLine = nodeValue; 
            const { start, props: trailingProps } = extractTrailingProps(trailingLine) ?? {};
            trailingLine = trailingProps;

            if (trailingLine && !trailingLine.trim().startsWith("{") && !nodeValue?.substring(0, start).trim().endsWith("]")) {
                const { tag, type, slotProps, props: otherProps } = compilePropsLine(trailingLine);
                if( tag ) {
                    if( type === "slot" ) {
                        node.tag = "template";
                        node.props = `#${tag}=${slotProps} ${otherProps}`;
                    } else if(tag) {
                        node.tag = tag;
                        node.props = otherProps;
                    }
                }
                else if( otherProps ) node.props = otherProps;

                node.children[node.children.length - 1].value = node.children[node.children.length - 1].value?.substring(0, start).trim();
                if(node.children[node.children.length - 1].value?.endsWith('<br>')) {
                    node.children[node.children.length - 1].value = node.children[node.children.length - 1].value?.slice(0, -4);
                }
            }

            // check if there is a custom component mapping
            const componentPath = customComponents[node.tag];
            const finalTag = (componentPath
                ? getComponentName(componentPath)
                : node.tag).trim();
            const importLine = `import ${finalTag} from '${componentPath}';`;
            if (componentPath && !imports.includes(importLine))
                imports.push(importLine);

            const props = node.props?.trim();
            const children = node.children.map((c) => c.value || "").join("");

            const html = `<${finalTag}${props ? ` ${props}` : ''}>${children}</${finalTag}>`;

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
}

/**
 * Parse a container
 * 
 * Checks for containers recursively
 * 
 * @param tokens 
 * @param startIndex 
 * @param shikiPath 
 * @param customComponents 
 * @returns 
 */
async function parseContainer(
    tokens: Token[],
    startIndex: number,
    shikiPath: string,
    customComponents: Record<string, string>
) {
    const openToken = tokens[startIndex - 2]; // the opening paragraph token with '['
    const regex = /\s*\](?:\s*\{\s*([\s\S]*)\})?/
    

    const innerTokens: Token[] = [];
    let depth = 1;
    let j = startIndex;

    while (j < tokens.length && depth > 0) {
        const t = tokens[j];

        // detect nested container opening
        if (
            t.type === "paragraph_open" &&
            tokens[j + 1]?.type === "inline" &&
            tokens[j + 1]?.content.trim() === "["
        ) {
            depth++;
            innerTokens.push(t, tokens[j + 1], tokens[j + 2]); // include opening tokens
            j += 3;
            continue;
        }

        // detect closing for current depth
        if (t.type === "inline" && t.content.trim().match(regex)) {
            depth--;
            if (depth === 0) break; // found the matching closing
        }

        innerTokens.push(t);
        j++;
    }

    const [match, props] = tokens[j]?.content.trim().match(regex) ?? [];
    if (!match) return { newIndex: j, node: null };

    const { ast } = await markdownToAST(
        innerTokens.map((t) => t.content).join("\n"),
        shikiPath,
        customComponents
    );

    let { tag, type, slotProps, props: otherProps } = compilePropsLine(props);

    if(type === 'slot') {
        otherProps = `#${tag}${slotProps ? `="${slotProps}"` : ''} ${otherProps}`;
        tag = 'template';
    }

    return {
        newIndex: j + 1,
        node: { tag: tag || "div", type, children: ast.children ?? [], props: otherProps },
    };
}


/**
 * Validate MDV containers
 * 
 * Checks for unmatched closing containers
 * 
 * Checks for missing closing containers
 * 
 * Throws error if validation fails
 * 
 * @param tokens 
 */
export function validateMDVContainers(tokens: Token[]) {
    const stack: { idx: number; line: number }[] = [];
    const regex = /^\s*\]\s*\{\s*(?:::(\w+))?([\s\S]*)\}/;

    tokens.forEach((t, i) => {
        if (i === 0 || tokens[i - 1].type !== "paragraph_open" || tokens[i + 1].type !== "paragraph_close" || t.type !== "inline") return;

        if (t.content.trim() === "[") {
            stack.push({ idx: i, line: t.map ? t.map[0] + 1 : -1 });
        } else if (t.content.trim() === "]" || regex.test(t.content.trim())) {
            if (stack.length === 0) {
                const line = t.map ? t.map[0] + 1 : -1;
                throw new Error(
                    `[MDV] Unmatched closing container at line ${line}
...
${
    tokens
        .map((t, i) => t.content + (i === (line-1) ? "      <----- UNMATCHED " : ""))
        .slice(line - 5, line + 5)
        .join("\n").replace(/\n\n+/g, "\n\n")
}
...`
                );
            } else {
                stack.pop();
            }
        }
    });

    if (stack.length > 0) {
        const unclosed = stack.pop()!;
        throw new Error(
            `[MDV] Unclosed container opened at line ${unclosed.line}: 
...
${
    tokens
        .map((t, i) => t.content + (i === unclosed.idx ? "      <----- UNCLOSED " : ""))
        .slice(unclosed.idx - 5, unclosed.idx + 5)
        .join("\n").replace(/\n\n+/g, "\n\n")
}
...`
        );
    }
}



/**
 * Transform AST for inline and blocked components, dynamic tables, etc.
 * 
 * @param ast 
 * @returns
 */
export function transformAST(ast: MDVNode): MDVNode {
    let tableCounter = 0;
    const scriptHeaders: string[] = [];

    visit(ast, (node: MDVNode) => {
        if (node.type === "html" && node.value) {
            let value = node.value;

            // --- Inline components/slots [content]{ ::component ...props } or :[expr]{ ::component ...props }, with or without { ... } props block
            value = value.replace(
            //  /(.)(:)?\[\s*([^\]]+)\s*\](?:\s*\{\s*([\s\S]+)\})?/g,
                /(.)?(:)?\[\s*([^\]]+)\s*\](?:\s*\{\s*([\s\S]*)\})?/g,
                (_, escape, expr: string, text: string, props?: string) => {
                    if(escape === '\\') return escapeHtml(_.substring(1));
                    const { tag: comp, type, slotProps, props: propStr } = compilePropsLine(props || "");
                    // const propStr = props ? props.trim() : "";
                    // does it have any props or custom component?
                    const isExpression = !!expr;

                    if(type === 'slot') {
                        // It's not component. it's SLOT
                        return `<template #${comp}${slotProps ? `="${slotProps}"` : ''}${propStr ? " " + propStr : ""}>${ isExpression ? `{{ ${text.trim()} }}` : text}</template>`;
                    }

                    const tag = comp || "span";

                    if(propStr || comp) {
                        // Yes, so return full component tag
                        return `<${tag}${propStr ? " " + propStr : ""}>${isExpression ? `{{ ${text.trim()} }}` : text}</${tag}>`;
                    }
                    // No props or custom component
                    if(isExpression) return `{{ ${text.trim()} }}`;
                    // It's just [text]. No need to change
                    return _;
                },
            );

            node.value = value;
        }

        // Container syntax
        if (node.type === "mdv-container") {
            const tag = node.tag || "div";
            const propStr = node.propsLine ? node.propsLine.trim() : "";
            node.value = `<${tag}${propStr ? " " + propStr : ""}>${astToTemplate({
                ...node,
                children: node.children?.map(transformAST),
            })}</${tag}>`;
        }

        // Table handling unchanged
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
    ${placeholder
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

    ast["tableHeadersScript"] = scriptHeaders;


    return ast;
}


/**
 * Merge custom syntaxes for props line e.g. classes, ids, etc. (.class, #id, etc.)
 * 
 */
export function compilePropsLine(propsLine?: string): { tag?: string, type?: 'component' | 'slot', slotProps?: string, props?: string } {
    if (!propsLine) return {};
    // const regex = /\s*[^\.]?(?:([\.|#])([^\s]+))|(.*)\s*/gm;
    const props: { component?: string, slot?: string, slotProps?: string, classes: string[], id?: string } = {
        classes: []
    }
//  -->                  #ID       |    .CLASS      |   ::SLOTNAME::SLOTPROPSOBJ::   |   ::COMPONENT   <---
//  const regex = /\s*(?:#([\w-]+))|(?:\.([^\s\.]+))|(?:::([\w-]+)::(?:([\s\S]+)::)?)|(?:::([\w-]+))\s*/gm;
    const regex = /\s*(?:#([\w-]+))|(?:\.([^\s\.]+))|(?:::([\w-]+)::(?:([\s\S]+)::)?)|(?:::([\w-]+))\s*/gm;

    propsLine = propsLine.replace(regex, (_, id, cls, slot, slotProps, comp) => {
        if(slot) {
            props.slot = slot;
            props.slotProps = slotProps?.trim();
        }
        else if(comp) props.component = comp;
        else if(id) props.id = id;
        else if(cls) props.classes.push(cls);
        return "";
    })

    // Step 2: whatever remains is “other props”
    let otherProps = propsLine.trim();

    const propsStr = `${props.id ? `id="${props.id}"` : ""}${props.classes.length ? ` class="${props.classes.join(" ")}"` : ""} ${otherProps}`.trim();
    return {
        tag: props.component || props.slot,
        type: props.component ? 'component' : props.slot ? 'slot' : undefined,
        slotProps: props.slotProps,
        props: propsStr
    }
}

export function extractTrailingProps(line?: string) {
    if(!line) return undefined;
    line = line.trimEnd();
    if (!line.endsWith("}")) return undefined;

    let start = line.length - 1;
    if (start === -1) return undefined;

    let depth = 0;
    for (let i = start; i < line.length; i--) {
        const char = line[i];
        if (char === "}") depth++;
        else if (char === "{") depth--; 
        if (depth === 0) {
            start = i;
            break;
        };
    }

    

    if (depth === 0) {
        return {
            start,
            props: line.slice(start + 1, line.length - 1).replace(/<br\s*\/?>/g, " ").trim()
        };
    }

    return undefined; // unmatched braces
}


/**
 * Convert AST to template
 * 
 * @returns 
 * @param ast
 */
export function astToTemplate(ast: MDVNode): string {
    let template = "";
    visit(ast, (node: MDVNode) => {
        if ((node.type === "html" || node.type === "table" || node.type === "mdv-container") && node.value)
            template += node.value + "\n";
    });
    return template;
}

/**
 * Extract user <script setup> and <style> content along with their props/attributes
 * 
 * @returns
 * @param mdContent
 */
export function extractScriptStyle(mdContent: string) {
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

/**
 * Compile MDV
 * 
 * Compiles a single MDV content to Vue SFC string
 * 
 * @param mdContent 
 * @param metaPath 
 * @param shikiPath 
 * @param componentsPath 
 * @param options 
 * @returns 
 */
export async function compileMDV(
    mdContent: string,
    metaPath: string,
    shikiPath: string,
    componentsPath: string,
    options: CompileMDVOptions = {},
) {
    const { content: _content, meta } = parseFrontmatter(mdContent);
    const {
        scriptSetup,
        scriptSetupProps: extractedScriptSetupProps,
        styles,
    } = extractScriptStyle(_content);


    const content = _content.replace(
        /\n\s*\[\s*\n/g,
        "\n\n[\n\n"
    ).replace(
        /\n\s*\]\s*\{([\s\S]*?)\}\s*\n/g,
        "\n\n]{$1}\n\n"
    );

    const { ast, shikis, imports } = await markdownToAST(
        content,
        shikiPath,
        options.customComponents,
    );
    const transformed = transformAST(ast);

    let template = astToTemplate(transformed)

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
<template>
${template}
</template>

<script setup ${finalScriptSetupProps}>
${Object.keys(meta).length ? `
import { provide as __mdvProvide } from 'vue'
import $meta from './${metaPath.substring(metaPath.lastIndexOf("/") + 1)}'
`.trim() : ''}
${Object.keys(shikis).length ? `
import CodeBlock from '${componentsPath}/code-block.vue'
`.trim() : ''}
${imports.join("\n")}
${scriptImports}

${tableHeadersScript}

${Object.keys(meta).length ? `
__mdvProvide('$meta', $meta)
`.trim() : ''}

${cleanedScriptSetup}

</script>

${styles.join("\n")}
`.trim().replace(/\n+/g, "\n");

    return { content: vueSFC, meta, shikis };
}

/**
 * Component names need to be PascalCase and escape unsupported characters
 * 
 * @returns string
 * @param str
 */
function pascalCase(str: string) {
    return str
        .replace(/[^a-zA-Z0-9]+/g, " ")
        .split(" ")
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join("");
}

/**
 * Generate TypeScript GlobalComponents module string
 * @param componentNames PascalCase component names
 * @returns string
 */
export function generateGlobalComponentsModule(paths: string[]): string {
    const imports = paths
        .map((p) => {
            const name = getComponentName(p); // or shim path
            return `import ${name} from '${p.replace(/\.v\.md$/, ".vue")}'`;
        })
        .join("\n");

    const componentNames = paths.map(getComponentName);

    return `
${imports}

declare module '@vue/runtime-core' {
  interface GlobalComponents {
    ${componentNames
            .map((c) => `${c}: typeof ${c}`) // fallback to DefineComponent
            .join("\n    ")}
  }
}
  `.trim();
}


/**
 * Generate TypeScript Components module string
 * 
 * @param paths 
 * @returns string
 */
export function generateComponentsModule(paths: string[]): string {
    return paths
        .map((p) => {
            const name = getComponentName(p);
            const vuePath = p.replace(/\.v\.md$/, ".vue");
            return `
import ${name} from './${vuePath}'
declare module '@mdv/${vuePath.replace(/\.vue$/, "")}' {
  export default ${name}
}`;
        })
        .join("\n")
        .trim();
}


function getComponentName(rawPath: string) {
    return pascalCase(path.basename(rawPath).replace(/(\.vue|\.v\.md)$/g, ""));
}

/**
 * Escape HTML
 */
function escapeHtml(str: string) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/{/g, "&#123;")
        .replace(/}/g, "&#125;")
        .replace(/\[/g, "&#91;")
        .replace(/\]/g, "&#93;")
}

/**
 * Strip code blocks
 *
 * @param mdContent
 * @returns
 */
function stripCodeBlocks(mdContent: string): string {
    // Replace fenced code blocks with placeholders
    return mdContent.replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/./g, " "); // preserve line count for error reporting
    });
}

export default {
    parseFrontmatter,
    extractScriptStyle,
    markdownToAST,
    transformAST,
    astToTemplate,
    generateGlobalComponentsModule,
    getComponentName,
    escapeHtml,
    stripCodeBlocks,
}