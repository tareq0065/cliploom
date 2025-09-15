import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()] },
  preload: { plugins: [externalizeDepsPlugin()] },
  renderer: {
    // 👇 important so Vite/Tailwind resolve from the renderer app
    root: resolve(__dirname, 'src/renderer'),

    resolve: {
      alias: {
        '@renderer': resolve(__dirname, 'src/renderer/src'),
      },
    },

    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.(js|jsx|ts|tsx)$/,
      jsx: 'automatic',
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx', '.ts': 'ts', '.tsx': 'tsx' },
      },
    },

    plugins: [
      react({
        include: [/\.js$/, /\.jsx$/, /\.ts$/, /\.tsx$/],
        babel: {
          plugins: [
            ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
          ],
        },
      }),
      tailwind(), // ✅ Tailwind v4 plugin
    ],
  },
});
