import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "sounds/*.mp3"],
      manifest: {
        name: "Timbó Fala",
        short_name: "Timbó Fala",
        description: "A rede social exclusiva de Timbó, SC. Conecte-se com vizinhos, descubra eventos, apoie comércios locais e encontre pessoas especiais!",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0a0b",
        theme_color: "#ff4f0a",
        orientation: "portrait-primary",
        scope: "/",
        lang: "pt-BR",
        categories: ["social", "lifestyle", "shopping", "food"],
        icons: [
          {
            src: "/favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        shortcuts: [
          {
            name: "Feed",
            short_name: "Feed",
            description: "Veja as últimas publicações",
            url: "/feed",
            icons: [{ src: "/favicon.png", sizes: "96x96" }]
          },
          {
            name: "Empresas",
            short_name: "Lojas",
            description: "Descubra comércios locais",
            url: "/empresas",
            icons: [{ src: "/favicon.png", sizes: "96x96" }]
          },
          {
            name: "Paquera",
            short_name: "Paquera",
            description: "Encontre pessoas especiais",
            url: "/paquera",
            icons: [{ src: "/favicon.png", sizes: "96x96" }]
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fuwhwxmlqaxkhsviywwg\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
