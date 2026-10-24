import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { Client, ClientInput } from '../src/pages/dashboard/clients/types.ts'
import { requireUser } from './auth.ts'
import { db } from './db.ts'

export type ClientRow = {
    id: string
    user_id: number
    name: string
    hostname: string
    port: number
    username: string
    auth_method: 'key' | 'password'
    key_path: string
    tags: string
    notes: string
    host_key: string | null
    created_at: string
}

const NO_SPACES_RE = /^\S+$/

function toClient(row: ClientRow): Client {
    return {
        id: row.id,
        name: row.name,
        hostname: row.hostname,
        port: row.port,
        username: row.username,
        authMethod: row.auth_method,
        keyPath: row.key_path,
        tags: JSON.parse(row.tags) as string[],
        notes: row.notes,
        hostKeyFingerprint: row.host_key,
        createdAt: row.created_at,
    }
}

function parseClientInput(body: unknown): ClientInput | { error: string } {
    const b = (typeof body === 'object' && body !== null ? body : {}) as Record<string, unknown>
    const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

    const name = text(b.name, 100)
    const hostname = text(b.hostname, 255)
    const username = text(b.username, 100)
    const port = Number(b.port)
    const authMethod = b.authMethod === 'key' || b.authMethod === 'password' ? b.authMethod : null

    if (!name) return { error: 'Name is required' }
    if (!NO_SPACES_RE.test(hostname)) return { error: 'Enter a valid hostname or IP' }
    if (!NO_SPACES_RE.test(username)) return { error: 'Enter a valid username' }
    if (!Number.isInteger(port) || port < 1 || port > 65535) return { error: 'Port must be between 1 and 65535' }
    if (!authMethod) return { error: 'Choose an authentication method' }

    return {
        name,
        hostname,
        port,
        username,
        authMethod,
        keyPath: authMethod === 'key' ? text(b.keyPath, 255) : '',
        tags: Array.isArray(b.tags)
            ? b.tags.map((tag) => text(tag, 40)).filter(Boolean).slice(0, 20)
            : [],
        notes: text(b.notes, 5000),
    }
}

export function getClientRow(userId: number, clientId: string): ClientRow | undefined {
    return db.prepare('SELECT * FROM clients WHERE id = ? AND user_id = ?')
        .get(clientId, userId) as ClientRow | undefined
}

export function saveHostKey(clientId: string, fingerprint: string) {
    db.prepare('UPDATE clients SET host_key = ? WHERE id = ?').run(fingerprint, clientId)
}

export const clientsRouter = Router()

clientsRouter.use(requireUser)

clientsRouter.get('/', (_req, res) => {
    const rows = db.prepare('SELECT * FROM clients WHERE user_id = ? ORDER BY created_at')
        .all(res.locals.userId) as ClientRow[]
    res.json(rows.map(toClient))
})

clientsRouter.post('/', (req, res) => {
    const input = parseClientInput(req.body)
    if ('error' in input) {
        res.status(400).json(input)
        return
    }

    const id = randomUUID()
    db.prepare(`
        INSERT INTO clients (id, user_id, name, hostname, port, username, auth_method, key_path, tags, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, res.locals.userId, input.name, input.hostname, input.port, input.username, input.authMethod,
        input.keyPath, JSON.stringify(input.tags), input.notes, new Date().toISOString())

    res.status(201).json(toClient(getClientRow(res.locals.userId, id)!))
})

clientsRouter.put('/:id', (req, res) => {
    const existing = getClientRow(res.locals.userId, req.params.id)
    if (!existing) {
        res.status(404).json({ error: 'Client not found' })
        return
    }
    const input = parseClientInput(req.body)
    if ('error' in input) {
        res.status(400).json(input)
        return
    }

    // A different address is a different machine, so its saved host key no longer applies
    const sameMachine = existing.hostname === input.hostname && existing.port === input.port
    db.prepare(`
        UPDATE clients
        SET name = ?, hostname = ?, port = ?, username = ?, auth_method = ?, key_path = ?, tags = ?, notes = ?, host_key = ?
        WHERE id = ?
    `).run(input.name, input.hostname, input.port, input.username, input.authMethod, input.keyPath,
        JSON.stringify(input.tags), input.notes, sameMachine ? existing.host_key : null, existing.id)

    res.json(toClient(getClientRow(res.locals.userId, existing.id)!))
})

clientsRouter.delete('/:id', (req, res) => {
    const result = db.prepare('DELETE FROM clients WHERE id = ? AND user_id = ?').run(req.params.id, res.locals.userId)
    if (result.changes === 0) {
        res.status(404).json({ error: 'Client not found' })
        return
    }
    res.status(204).end()
})

clientsRouter.delete('/:id/host-key', (req, res) => {
    const existing = getClientRow(res.locals.userId, req.params.id)
    if (!existing) {
        res.status(404).json({ error: 'Client not found' })
        return
    }
    db.prepare('UPDATE clients SET host_key = NULL WHERE id = ?').run(existing.id)
    res.json(toClient({ ...existing, host_key: null }))
})
