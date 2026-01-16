import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8081,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  /* --- ADD THIS BUILD SECTION --- */
  build: {
    rollupOptions: {
      output: {
        // This takes heavy libraries out of index.js and into their own chunks
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-toast',
            'lucide-react'
          ],
          'vendor-utils': ['axios', 'date-fns'],
        },
      },
    },
    // Increases the warning limit slightly since you're managing chunks now
    chunkSizeWarningLimit: 1000,
  },
}));
