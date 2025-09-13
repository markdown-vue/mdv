import { getCurrentInstance } from "vue";
import { Meta } from "@mdv/types/mdv-config";

export function useMeta<T extends string | undefined = undefined>(
    metaPath?: string | undefined,
    importType: 'import' | 'fetch' = 'import',
): T extends string ? Promise<Meta> : Meta {
    const instance = getCurrentInstance();
    if (!metaPath) {
        return (instance as any)?.provides?.meta as any;
    }

    const path = metaPath.replace(/(\.v\.md)|(\.vue)$/, ".mdv.json");

    if(importType === 'import') {
        return import(path).then((res) => res.default);;
    } else {
        return fetch(path).then((r) => r.json()) as any;
    }
}
