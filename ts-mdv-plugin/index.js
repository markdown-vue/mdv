const path = require('path');
const ts = require('typescript');

function create(info) {
    // Save reference to the old resolver
    const oldResolve = info.languageServiceHost.resolveModuleNameLiterals?.bind(info.languageServiceHost);

    return {
        ...info.languageService,

        resolveModuleNameLiterals(moduleLiterals, containingFile, ...rest) {
            const results = [];

            for (const mod of moduleLiterals) {
                let text = mod.text;

                if (text.endsWith('.v.md')) {
                    // Map to .vue in cache dir
                    const cachePath = path.resolve(
                        process.cwd(),
                        '.mdv-cache',
                        path.relative(process.cwd() + '/src', path.resolve(path.dirname(containingFile), text))
                    ).replace(/\.v\.md$/, '.vue');

                    results.push({
                        resolvedModule: {
                            extension: ts.Extension.Ts, // TS should treat it like .ts/.vue shim
                            resolvedFileName: cachePath,
                            isExternalLibraryImport: false,
                        }
                    });
                } else {
                    // Fallback to default
                    results.push(
                        oldResolve
                            ? oldResolve([mod], containingFile, ...rest)[0]
                            : ts.resolveModuleName(mod.text, containingFile, info.languageServiceHost.getCompilationSettings(), ts.sys).resolvedModule
                    );
                }
            }

            return results;
        }
    };
}

module.exports = { create };
