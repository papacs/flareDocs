export default defineNuxtConfig({
  compatibilityDate: '2026-03-04',
  srcDir: 'app/',
  serverDir: 'app/server',
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    authSecret: ''
  },
  ui: {
    fonts: false
  },
  devtools: {
    enabled: true
  },
  app: {
    head: {
      title: 'flareDocs',
      titleTemplate: '%s · flareDocs',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, viewport-fit=cover'
        },
        {
          name: 'description',
          content:
            'A lightweight Markdown-first team knowledge base built for Cloudflare Pages, D1, and R2.'
        }
      ]
    }
  },
  nitro: {
    preset: 'cloudflare-pages'
  },
  typescript: {
    strict: true
  }
})
