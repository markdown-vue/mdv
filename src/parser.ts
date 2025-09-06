import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { u } from 'unist-builder'
import { visit } from 'unist-util-visit'
import { MDVNode } from './global'

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
export function markdownToAST(mdContent: string): MDVNode {
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
                if(t.type === 'tbody_open' && tokens[i + 1].type === 'tr_open' && tokens[i + 2].type === 'td_open' && tokens[i + 3].type === 'inline') {
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

            if(propsLine) {
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
            const codeHtml = `<pre><code${lang ? ` class="language-${lang}"` : ''}>${escapeHtml(token.content)}</code></pre>`
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

            const headersVar = `mdv_headers_${tableCounter++}`
            scriptHeaders.push(`const ${headersVar} = ${JSON.stringify(node.headers ?? [])}`)

            node.value = `
<table>
  <thead>
    <tr>${node.headers?.map((h: string) => `<th>${h}</th>`).join('')}</tr>
  </thead>
  <tbody>
    <tr v-if="${dataSource} && ${dataSource}.length > 0" v-for="item in ${dataSource}" :key="item.${rowKey}">
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
    ${
        placeholder ?
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
 * Extract script and style
 */
export function extractScriptStyle(mdContent: string) {
    const scriptMatch = mdContent.match(/<script[^>]*>([\s\S]*?)<\/script>/)
    const styleMatch = mdContent.match(/<style[^>]*>([\s\S]*?)<\/style>/)

    return {
        script: scriptMatch ? scriptMatch[1] : '',
        style: styleMatch ? styleMatch[1] : ''
    }
}

/**
 * Compile MDV
 */
export function compileMDV(mdContent: string) {
    const { content, meta } = parseFrontmatter(mdContent)
    const { script, style } = extractScriptStyle(content)
    const cleanedContent = content.replace(
        /<script[^>]*>[\s\S]*?<\/script>|<style[^>]*>[\s\S]*?<\/style>/g,
        ''
    )
    const ast = markdownToAST(cleanedContent)
    const transformed = transformAST(ast)
    const template = astToTemplate(transformed)

    // Inject table headers script if exists
    const tableHeadersScript = (transformed['tableHeadersScript'] ?? []).join('\n')

    const vueSFC = `
<template>
${template}
</template>

<script setup>
${script}
</script>

<script>
${tableHeadersScript}
const $meta = ${JSON.stringify(meta)}
</script>

<style scoped>
${style}
</style>
`
    return { content: vueSFC, meta }
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
