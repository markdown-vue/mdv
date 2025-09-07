import { getCurrentInstance, getCurrentScope, inject, reactive, ref, unref } from 'vue'

type Meta = Record<string, any>

export function useMeta<T extends string | undefined = undefined>(metaPath?: string | undefined): T extends string ? Promise<Meta> : Meta {
    const instance = (getCurrentInstance() as any)
    if(!metaPath) {
        return instance.provides?.meta as any
    }

    if(instance.provides?.meta?.metaPath) {
        const importerMetaPath = instance.provides.meta.metaPath as string;
        const importeeMetaPath = importerMetaPath.substring(0, importerMetaPath.lastIndexOf('/')) + '/' + metaPath
        return fetch(importeeMetaPath).then(res => res.json())
    }

    return fetch(metaPath).then(res => res.json())
}
