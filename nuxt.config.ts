export default defineNuxtConfig({
  compatibilityDate: '2026-03-04',
  srcDir: 'app/',
  serverDir: 'app/server',
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    authSecret: '',
    bootstrapAdminPassword: ''
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
        },
        {
          name: 'theme-color',
          content: '#0f172a'
        },
        {
          name: 'apple-mobile-web-app-capable',
          content: 'yes'
        },
        {
          name: 'apple-mobile-web-app-status-bar-style',
          content: 'default'
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/brand-icon.svg'
        },
        {
          rel: 'manifest',
          href: '/manifest.webmanifest'
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
