import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { mdvPlugin } from './src/vite-plugin-mdv'
import path from 'path'
import mdvConfig from './mdv.config'

export default defineConfig({
    plugins: [
        vue(),
        mdvPlugin(mdvConfig)
    ],
    resolve: {
        extensions: ['.ts', '.js', '.vue', '.v.md'],
        alias: {
            '~': path.resolve(__dirname, 'src'),
            '@mdv': path.resolve(__dirname, '.mdv')
        }
    },
})
