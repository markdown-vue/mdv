import { getCurrentInstance } from "vue";
const cacheDir = ".mdv";
export function useMeta(metaPath) {
    const instance = getCurrentInstance();
    if (!metaPath) {
        return instance.provides?.meta;
    }
    if (instance.provides?.meta?.metaPath) {
        const importerMetaPath = instance.provides.meta.metaPath;
        const importeeMetaPath = importerMetaPath.substring(0, importerMetaPath.lastIndexOf("/")) +
            "/" +
            metaPath;
        return fetch(importeeMetaPath).then((res) => res.json());
    }
    let path = metaPath.startsWith("~/")
        ? `/${cacheDir}/${metaPath.substring(2)}`
        : `/${cacheDir}/${metaPath}`;
    if (path.endsWith(".v.md"))
        path = path.replace(/\.v\.md$/, ".mdv.json");
    else if (!path.endsWith(".mdv.json"))
        path += ".mdv.json";
    return fetch(path).then((res) => res.json());
}
