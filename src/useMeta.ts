import { getCurrentInstance } from 'vue'

type Meta = Record<string, any>

const cacheDir = '.mdv-cache'

export function useMeta<T extends string | undefined = undefined>(metaPath?: `~/${string}.mdv.json` | undefined): T extends string ? Promise<Meta> : Meta {
    const instance = (getCurrentInstance() as any)
    if(!metaPath) {
        return instance.provides?.meta as any
    }

    if(instance.provides?.meta?.metaPath) {
        const importerMetaPath = instance.provides.meta.metaPath as string;
        const importeeMetaPath = importerMetaPath.substring(0, importerMetaPath.lastIndexOf('/')) + '/' + metaPath
        return fetch(importeeMetaPath).then(res => res.json())
    }

    const path = metaPath.startsWith('~/') ? `/${cacheDir}/${metaPath.substring(2)}` : `/${cacheDir}/${metaPath}`

    return fetch(path).then(res => res.json())
}
