import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { u } from 'unist-builder'
import { visit } from 'unist-util-visit'
import { MDVNode } from './global'
import { CompileMDVOptions } from './types/mdv-config'
import { highlightCode } from './highlighter'

/**
 * Parse frontmatter
 */
export function parseFrontmatter(mdContent: string) {
    const { content, data } = matter(mdContent)
    return { content, meta: data }
}

const md = new MarkdownIt({ html: true, breaks: true })

/**
 * Markdown parser to AST
 */
export async function markdownToAST(mdContent: string): Promise<MDVNode> {
    const tokens = md.parse(mdContent, {})
    const astChildren: MDVNode[] = []
    const stack: { tag: string; children: MDVNode[] }[] = []

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

                // placeholder
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
                // if is dynamic table
                astChildren.push(
                    u('table', {
                        headers,
                        propsLine,
                        placeholder
                    }) as MDVNode
                )
                i++
                continue
            }
            else {
                // back to static table
                i = oldI
            }
        }

        if (token.type.endsWith('_open')) {
            stack.push({ tag: token.tag, children: [] })
        } else if (token.type.endsWith('_close')) {
            const node = stack.pop()
            if (!node) { i++; continue }
            let html = `<${node.tag}>${node.children.map(c => c.value || '').join('')}</${node.tag}>`

            if (stack.length > 0) stack[stack.length - 1].children.push(u('html', html) as MDVNode)
            else astChildren.push(u('html', html) as MDVNode)
        } else if (token.type === 'inline') {
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
                else inlineContent += escapeHtml(child.content || '')
            }

            if (stack.length > 0) stack[stack.length - 1].children.push(u('html', inlineContent) as MDVNode)
            else astChildren.push(u('html', inlineContent) as MDVNode)
        } else if (token.type === 'fence') {
            const lang = token.info.trim()
            const codeHtml = await highlightCode(token.content, lang)
            if (stack.length > 0) stack[stack.length - 1].children.push(u('html', codeHtml) as MDVNode)
            else astChildren.push(u('html', codeHtml) as MDVNode)

        }

        i++
    }

    return u('root', astChildren) as MDVNode
}

/**
 * Transform AST for inline components, dynamic tables, etc.
 */
export function transformAST(ast: MDVNode): MDVNode {
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
}

/**
 * Convert AST to template
 */
export function astToTemplate(ast: MDVNode): string {
    let template = ''
    visit(ast, (node: MDVNode) => {
        if ((node.type === 'html' || node.type === 'table') && node.value) template += node.value + '\n'
    })
    return template
}

/**
 * Extract user <script setup> and <style> content along with their props/attributes
 */
export function extractScriptStyle(mdContent: string) {
    const stripped = stripCodeBlocks(mdContent);

    const scriptSetupMatch = stripped.match(/<script\s+setup([^>]*)>([\s\S]*?)<\/script>/)
    const styleMatch = stripped.match(/<style([^>]*)>([\s\S]*?)<\/style>/ig)


    return {
        scriptSetup: scriptSetupMatch ? scriptSetupMatch[2] : '',
        scriptSetupProps: scriptSetupMatch ? (scriptSetupMatch[1]?.trim() ? ' ' + scriptSetupMatch[1].trim() : '') : '',
        styles: [...styleMatch ?? []],
    }
}

export async function compileMDV(mdContent: string, metaPath: string, options: CompileMDVOptions = {}) {
    const { content, meta } = parseFrontmatter(mdContent)
    const { scriptSetup, scriptSetupProps: extractedScriptSetupProps, styles } = extractScriptStyle(content)



    const ast = await markdownToAST(content)
    const transformed = transformAST(ast)
    const template = astToTemplate(transformed)

    const tableHeadersScript = (transformed['tableHeadersScript'] ?? []).join('\n')

    const scriptImports = scriptSetup.split('\n').filter(line => line.match(/^import/)).join('\n')
    const cleanedScriptSetup = scriptSetup.split('\n').filter(line => !line.match(/^import/)).join('\n')

    // Use extracted scriptSetup props or fallback to options
    const finalScriptSetupProps = options.scriptSetupProps ?? extractedScriptSetupProps

    const vueSFC = `
<template>
${template}
</template>

<script setup ${finalScriptSetupProps}>
import { provide as __mdvProvide } from 'vue'
import $meta from './${metaPath.substring(metaPath.lastIndexOf('/') + 1)}'
${scriptImports}

${tableHeadersScript}

__mdvProvide('meta', {
    ...$meta,
    metaPath: '${metaPath}'
})

${cleanedScriptSetup}

</script>

${styles.join('\n')}
`
    return { content: vueSFC, meta }
}


export function createTSDeclare(mdPath: string, componentPath: string) {
    let componentName = mdPath.substring(mdPath.lastIndexOf('/') + 1, mdPath.lastIndexOf('.v.md'));
    componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    return `declare module '${mdPath}' {
        import ${componentName} from '${componentPath}'
        export default ${componentName}
    }`
}

export function createShim(componentPath: string) {
    let componentName = componentPath.substring(componentPath.lastIndexOf('/') + 1, componentPath.lastIndexOf('.vue'));
    componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    return `import ${componentName} from '${componentPath}';
export default ${componentName}
`
}

/**
 * Escape HTML
 */
function escapeHtml(str: string) {
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

/**
 * Strip code blocks
 * 
 * @param mdContent 
 * @returns 
 */
function stripCodeBlocks(mdContent: string): string {
    // Replace fenced code blocks with placeholders
    return mdContent.replace(/```[\s\S]*?```/g, match => {
        return match.replace(/./g, ' '); // preserve line count for error reporting
    });
}
