import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

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
  /* --- ADD THIS SECTION --- */
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Move all node_modules into a separate vendor chunk
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('@radix-ui')) return 'vendor-ui';
            return 'vendor-libs';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB after splitting
  },
}));
