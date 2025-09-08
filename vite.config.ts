import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { mdvPlugin } from './src/vite-plugin-mdv'

export default defineConfig({
    plugins: [
        vue(),
        mdvPlugin({
            extension: '.v.md',           // default
            cacheDir: '.mdv',       // default
            include: 'src/**/*.v.md'
        })
    ],
    resolve: {
        extensions: ['.ts', '.js', '.vue', '.v.md'],
    },
})
