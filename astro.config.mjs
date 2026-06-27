import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://ashit-upadhyay.vercel.app",
  output: "static",
  devToolbar: {
    enabled: false,
  },
  redirects: {
    "/research": "/projects",
  },
  integrations: [
    react(),
    sitemap({
      changefreq: "weekly",
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        if (item.url === "https://ashit-upadhyay.vercel.app/") {
          return { ...item, priority: 1.0, changefreq: "weekly" };
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
