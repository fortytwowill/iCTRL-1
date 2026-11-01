import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
 server: {
 host: "::",
 allowedHosts: true,
 port: 8080,
 hmr: {
 overlay: false,
 clientPort: 8080,
 protocol: 'ws',
 },
 proxy: {
 '/api': {
 target: 'http://localhost:3001',
 changeOrigin: true,
 },
 },
 fs: {
 allow: [
 // Allow serving files from node_modules for Mantine styles
 path.resolve(__dirname, 'node_modules'),
 ],
 },
 },
 plugins: [
   // Polyfill Node.js built-ins (Buffer, stream, zlib, etc.) required by ExcelJS
   // ExcelJS is a Node-first library; this plugin makes it work in the browser.
   nodePolyfills({
     globals: {
       Buffer: true,
       process: true,
     },
   }),
   react(),
 ].filter(Boolean),
 resolve: {
   alias: {
     "@": path.resolve(__dirname, "./src"),
   },
 },
}));
