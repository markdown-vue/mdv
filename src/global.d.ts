/**
 * MDVNode
 * 
 * @typedef {Object} MDVNode
 * @property {string} type - Node type
 * @property {string} value - Node value
 * @property {MDVNode[]} children - Child nodes
 */
export type MDVNode = Node & {
    type: string
    value?: string
    children?: MDVNode[]
    headers?: string[]      // for table
    propsLine?: string      // for table
    placeholder?: string   // for table
    tableHeadersScript?: string[]
    shiki?: { key: string, code: string }
}

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
