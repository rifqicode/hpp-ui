import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"

function generateRobotsTxt(siteUrl: string): string {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /dashboard",
    "Disallow: /settings",
    "Disallow: /inventory",
    "Disallow: /recipes",
    "Disallow: /production",
    "Disallow: /sales",
    "Disallow: /suppliers",
    "Disallow: /purchase-orders",
    "Disallow: /overheads",
    "Disallow: /accept-invite",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n")
}

function generateSitemapXml(siteUrl: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${siteUrl}/</loc>`,
    '    <changefreq>weekly</changefreq>',
    '    <priority>1.0</priority>',
    '  </url>',
    '  <url>',
    `    <loc>${siteUrl}/login</loc>`,
    '    <changefreq>monthly</changefreq>',
    '    <priority>0.8</priority>',
    '  </url>',
    '  <url>',
    `    <loc>${siteUrl}/register</loc>`,
    '    <changefreq>monthly</changefreq>',
    '    <priority>0.8</priority>',
    '  </url>',
    '</urlset>',
    '',
  ].join("\n")
}

function seoFilesPlugin(rawSiteUrl: string): Plugin {
  const siteUrl = rawSiteUrl.replace(/\/+$/, "")
  const robotsTxt = generateRobotsTxt(siteUrl)
  const sitemapXml = generateSitemapXml(siteUrl)

  return {
    name: "vite-plugin-seo-files",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0]
        if (url === "/robots.txt") {
          res.setHeader("Content-Type", "text/plain; charset=utf-8")
          res.end(robotsTxt)
          return
        }
        if (url === "/sitemap.xml") {
          res.setHeader("Content-Type", "application/xml; charset=utf-8")
          res.end(sitemapXml)
          return
        }
        next()
      })
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: robotsTxt,
      })
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: sitemapXml,
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  process.env.VITE_APP_NAME = env.VITE_APP_NAME || "Curo"
  const siteUrl = env.VITE_SITE_URL || "https://hpptracker.com"

  return {
    plugins: [react(), seoFilesPlugin(siteUrl)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      allowedHosts: ["localhost"],
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
                return "vendor-react"
              }
              if (id.includes("@tanstack/react-query")) {
                return "vendor-query"
              }
              if (id.includes("lucide-react") || id.includes("@radix-ui")) {
                return "vendor-ui"
              }
            }
          },
        },
      },
    },
  }
})
