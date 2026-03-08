import { setHeader } from 'h3'

const BASE_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self'",
  "font-src 'self' data:"
].join('; ')

export default defineEventHandler((event) => {
  setHeader(event, 'Content-Security-Policy', BASE_CSP)
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'X-Frame-Options', 'DENY')
  setHeader(
    event,
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=()'
  )
})
