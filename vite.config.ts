import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Plugin to generate static HTML files after build
const staticFileGenerator = () => ({
  name: 'static-file-generator',
  async closeBundle() {
    console.log('\n🗺️  Generating static HTML files for SEO...');
    try {
      const { stdout, stderr } = await execAsync('node scripts/build-static.mjs');
      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
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
  },
}));
