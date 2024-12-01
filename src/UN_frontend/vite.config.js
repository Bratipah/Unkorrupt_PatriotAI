import { fileURLToPath, URL } from 'url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';
import commonjs from 'vite-plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

dotenv.config({ path: '../../.env' });

export default defineConfig({
  build: {
    emptyOutDir: true,
    rollupOptions: {
      external: ['@dfinity/use-auth-client']
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
    commonjs(),
    nodeResolve({
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
  ],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(
          new URL("../declarations", import.meta.url)
        ),
      },
    ],
  },
});