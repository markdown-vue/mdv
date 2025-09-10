import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { mdvPlugin } from './src/vite-plugin-mdv'
import path from 'path'

export default defineConfig({
    plugins: [
        vue(),
        mdvPlugin({
            extension: '.v.md',           // default
            cacheDir: '.mdv',       // default
            include: 'src/**/*.v.md'
        })
    ],
    base: '.',
    resolve: {
        extensions: ['.ts', '.js', '.vue', '.v.md'],
        alias: {
            '~': path.resolve(__dirname, 'src'),
            '@mdv': path.resolve(__dirname, '.mdv')
        }
    },
})
