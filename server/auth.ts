import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { Router, type NextFunction, type Request, type Response } from 'express'
import { db } from './db.ts'

const SESSION_COOKIE = 'sshhost_session'
const SESSION_MS = 12 * 60 * 60 * 1000
const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16)
    const hash = await scryptAsync(password, salt, 64)
    return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
    const [scheme, saltHex, hashHex] = stored.split('$')
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false
    const expected = Buffer.from(hashHex, 'hex')
    const actual = await scryptAsync(password, Buffer.from(saltHex, 'hex'), expected.length)
    return timingSafeEqual(actual, expected)
}

// Verified against when the email doesn't exist, so login takes the same time either way
const DUMMY_HASH = await hashPassword(randomBytes(16).toString('hex'))

function sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex')
}

function parseCookies(header: string | undefined): Map<string, string> {
    const cookies = new Map<string, string>()
    for (const part of header?.split(';') ?? []) {
        const index = part.indexOf('=')
        if (index === -1) continue
        cookies.set(part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim()))
    }
    return cookies
}

export function userIdFromCookieHeader(header: string | undefined): number | null {
    const token = parseCookies(header).get(SESSION_COOKIE)
    if (!token) return null
    const session = db.prepare('SELECT user_id, expires_at FROM sessions WHERE token_hash = ?')
        .get(sha256(token)) as { user_id: number; expires_at: number } | undefined
    if (!session || session.expires_at < Date.now()) return null
    return session.user_id
}

export function requireUser(req: Request, res: Response, next: NextFunction) {
    const userId = userIdFromCookieHeader(req.headers.cookie)
    if (!userId) {
        res.status(401).json({ error: 'Not signed in' })
        return
    }
    res.locals.userId = userId
    next()
}

function startSession(req: Request, res: Response, userId: number, remember: boolean) {
    const token = randomBytes(32).toString('base64url')
    const expiresAt = Date.now() + (remember ? REMEMBER_MS : SESSION_MS)
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
        .run(sha256(token), userId, expiresAt)
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: req.secure,
        path: '/',
        // without "remember me" it's a browser-session cookie
        ...(remember ? { expires: new Date(expiresAt) } : {}),
    })
}

function readCredentials(body: unknown) {
    const b = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
    return {
        email: typeof b.email === 'string' ? b.email.trim() : '',
        password: typeof b.password === 'string' ? b.password : '',
        remember: b.remember === true,
    }
}

export const authRouter = Router()

authRouter.post('/signup', async (req, res) => {
    const { email, password } = readCredentials(req.body)
    if (!EMAIL_RE.test(email) || email.length > 254) {
        res.status(400).json({ error: 'Enter a valid email address' })
        return
    }
    if (password.length < 8 || password.length > 1024) {
        res.status(400).json({ error: 'Password must be at least 8 characters' })
        return
    }
    if (db.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
        res.status(409).json({ error: 'An account with that email already exists' })
        return
    }

    const passwordHash = await hashPassword(password)
    const result = db.prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)')
        .run(email, passwordHash, new Date().toISOString())
    startSession(req, res, Number(result.lastInsertRowid), false)
    res.status(201).json({ email })
})

authRouter.post('/login', async (req, res) => {
    const { email, password, remember } = readCredentials(req.body)
    const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?')
        .get(email) as { id: number; email: string; password_hash: string } | undefined

    const valid = await verifyPassword(password, user?.password_hash ?? DUMMY_HASH)
    if (!user || !valid) {
        res.status(401).json({ error: 'Incorrect email or password' })
        return
    }

    startSession(req, res, user.id, remember)
    res.json({ email: user.email })
})

authRouter.post('/logout', (req, res) => {
    const token = parseCookies(req.headers.cookie).get(SESSION_COOKIE)
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token))
    res.clearCookie(SESSION_COOKIE, { path: '/' })
    res.status(204).end()
})

authRouter.get('/me', requireUser, (_req, res) => {
    const user = db.prepare('SELECT email FROM users WHERE id = ?')
        .get(res.locals.userId) as { email: string } | undefined
    if (!user) {
        res.status(401).json({ error: 'Not signed in' })
        return
    }
    res.json({ email: user.email })
})
