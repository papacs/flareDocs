import { SignJWT, jwtVerify, errors } from 'jose'
import {
  deleteCookie,
  getCookie,
  getRequestURL,
  type H3Event
} from 'h3'
import { eq } from 'drizzle-orm'
import { useRuntimeConfig } from '#imports'

import { users } from '../../../db/schema'
import { getDb } from './db'

const AUTH_COOKIE_NAME = 'fd_session'
const AUTH_TOKEN_TTL = '7d'
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

type AuthTokenPayload = {
  userId: number
  username: string
}

function getAuthSecret(event: H3Event) {
  const secret = useRuntimeConfig(event).authSecret

  if (!secret) {
    throw new Error('Missing runtime config `authSecret`.')
  }

  return new TextEncoder().encode(secret)
}

export function getAuthCookieName() {
  return AUTH_COOKIE_NAME
}

function shouldUseSecureCookies(event: H3Event) {
  const requestUrl = getRequestURL(event)
  return requestUrl.protocol === 'https:'
}

export async function issueAuthToken(event: H3Event, payload: AuthTokenPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(AUTH_TOKEN_TTL)
    .sign(getAuthSecret(event))
}

export async function verifyAuthToken(event: H3Event, token: string) {
  const { payload } = await jwtVerify<AuthTokenPayload>(token, getAuthSecret(event), {
    algorithms: ['HS256']
  })

  return payload
}

export async function getSessionFromRequest(event: H3Event) {
  const token = getCookie(event, AUTH_COOKIE_NAME)

  if (!token) {
    return null
  }

  try {
    const payload = await verifyAuthToken(event, token)

    if (typeof payload.userId !== 'number' || typeof payload.username !== 'string') {
      return null
    }

    return {
      userId: payload.userId,
      username: payload.username
    }
  } catch (error) {
    if (error instanceof errors.JWTExpired || error instanceof errors.JWTInvalid) {
      return null
    }

    return null
  }
}

export async function getAuthenticatedUser(event: H3Event) {
  const session = await getSessionFromRequest(event)

  if (!session) {
    return null
  }

  const db = getDb(event)
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  return user ?? null
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'strict',
    secure: shouldUseSecureCookies(event),
    path: '/'
  })
}

export function getAuthCookieOptions(event: H3Event) {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: shouldUseSecureCookies(event),
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE
  }
}
