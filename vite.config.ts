import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  optimizeDeps: {
    // Prebundle React entrypoints so Vite can provide correct ESM named exports (e.g. Fragment)
    // while our `resolve.dedupe` below ensures there is still only ONE React instance.
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
    ],
    // Force re-optimization so stale prebundles can't keep reintroducing multiple instances.
    force: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Fixes "Invalid hook call" / "dispatcher is null" by ensuring the app and all deps
    // share a single React instance.
    dedupe: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "@elevenlabs/react",
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor';
          if (id.includes('@monaco-editor') || id.includes('monaco-editor')) return 'monaco';
          if (id.includes('@tiptap')) return 'tiptap';
          if (id.includes('recharts') || id.includes('d3-')) return 'charts';
          if (id.includes('@xyflow')) return 'xyflow';
          if (id.includes('framer-motion')) return 'motion';
          return undefined;
        },
      },
    },
    minify: mode === 'production',
    chunkSizeWarningLimit: 2000,
  },
  // Enable gzip compression
  preview: {
    port: 8080,
    host: "::",
  },
}));
