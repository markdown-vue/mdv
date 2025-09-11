import { getCurrentInstance } from 'vue'
import { Meta } from './types/mdv-config.js';

const cacheDir = '.mdv'

export function useMeta<T extends string | undefined = undefined>(metaPath?: `~/${string}` | undefined): T extends string ? Promise<Meta> : Meta {
    const instance = (getCurrentInstance() as any)
    if(!metaPath) {
        return instance.provides?.meta as any
    }

    if(instance.provides?.meta?.metaPath) {
        const importerMetaPath = instance.provides.meta.metaPath as string;
        const importeeMetaPath = importerMetaPath.substring(0, importerMetaPath.lastIndexOf('/')) + '/' + metaPath
        return fetch(importeeMetaPath).then(res => res.json())
    }

    let path = metaPath.startsWith('~/') ? `/${cacheDir}/${metaPath.substring(2)}` : `/${cacheDir}/${metaPath}`
    if(path.endsWith('.v.md')) path = path.replace(/\.v\.md$/, '.mdv.json')
    else if(!path.endsWith('.mdv.json')) path += '.mdv.json'

    return fetch(path).then(res => res.json())
}
