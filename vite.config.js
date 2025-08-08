import { resolve, join, dirname } from 'path'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import fs from 'fs'

export default defineConfig({
    plugins: [svelte(), rnCopyPlugin()],
    resolve: {
        alias: {
            '@': resolve(__dirname, '/src')
        }
    },
    build: {
        //minify: false,
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
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