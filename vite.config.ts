import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Plugin to generate static HTML files and inject SEO content after build
const staticFileGenerator = () => ({
  name: 'static-file-generator',
  async closeBundle() {
    console.log('\n🗺️  Generating static HTML files for SEO...');
    try {
      // Generate route-specific static files (sitemaps, etc.)
      const { stdout, stderr } = await execAsync('node scripts/build-static.mjs');
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
      
      // Inject SEO content and loading overlay into main index.html
      console.log('\n📄 Injecting SEO content into index.html...');
      const { stdout: injectOut, stderr: injectErr } = await execAsync('node scripts/inject-homepage-content.mjs');
      if (injectOut) console.log(injectOut);
      if (injectErr) console.error(injectErr);
    } catch (error) {
      console.error('❌ Error generating static files:', error);
      throw error;
    }
  }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && staticFileGenerator()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"],
  },
  optimizeDeps: {
    include: ["@tanstack/react-query"],
  },
}));
