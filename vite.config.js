import { resolve, join, dirname } from 'node:path'
import fs from 'node:fs'
import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'

//embed bundle: the whole tree renders inside the rdh-app shadow root, so every
//component is compiled as a custom element (styles injected there, not emitted as css)
export default defineConfig({
    plugins: [
        svelte({
            preprocess: vitePreprocess(),
            compilerOptions: {
                customElement: true
            }
        }),
        rnCopyPlugin()
    ],
    build: {
        //minify: false,
        //electron preload: require('electron') must stay a runtime require
        rolldownOptions: { external: ['electron'] },
        lib: {
            entry: resolve(import.meta.dirname, 'src/embed/index.ts'),
            fileName: ()=>'highlight.js',
            formats: ['cjs']
        }
    },
    esbuild: {
        legalComments: 'none',
        // drop: ['console']
    }
})

function rnCopyPlugin() {
    return {
        name: 'rn-copy-plugin',
        generateBundle(options, bundle) {
            for (const fileName in bundle) {
                const file = bundle[fileName]
                if (file.type != 'chunk' || !fileName.endsWith('.js')) continue
                const path = join(options.dir, fileName.replace('.js', '.string.js'))
                fs.mkdirSync(dirname(path), { recursive: true })
                fs.writeFileSync(
                    path,
                    `export default ${JSON.stringify(file.code)}`,
                    'utf8'
                )
            }
        }
    }
}