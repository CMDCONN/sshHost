import { createHash } from 'node:crypto'
import type { IncomingMessage, Server } from 'node:http'
import type { Duplex } from 'node:stream'
import ssh2, { type ClientChannel } from 'ssh2'
import { WebSocketServer, type WebSocket } from 'ws'
import { userIdFromCookieHeader } from './auth.ts'
import { getClientRow, saveHostKey, type ClientRow } from './clients.ts'

const { Client: SshClient } = ssh2

const CONNECT_MESSAGE_TIMEOUT_MS = 30_000

// Messages from the browser. Terminal output goes the other way as binary frames.
type BrowserMessage =
    | { type: 'connect'; password?: string; privateKey?: string; passphrase?: string; cols?: number; rows?: number }
    | { type: 'data'; data: string }
    | { type: 'resize'; cols: number; rows: number }

type GatewayMessage =
    | { type: 'connected'; hostKeyFingerprint: string }
    | { type: 'error'; code?: 'host-key-mismatch'; message: string; expected?: string; received?: string }

function fingerprint(key: Buffer): string {
    return `SHA256:${createHash('sha256').update(key).digest('base64').replace(/=+$/, '')}`
}

function terminalSize(value: unknown, fallback: number): number {
    const n = Number(value)
    return Number.isInteger(n) && n > 0 && n <= 1000 ? n : fallback
}

function reject(socket: Duplex, status: string) {
    socket.write(`HTTP/1.1 ${status}\r\nConnection: close\r\n\r\n`)
    socket.destroy()
}

// Browsers send cookies on cross-site WebSocket requests, so the Origin must match the Host
function isSameOrigin(req: IncomingMessage): boolean {
    const origin = req.headers.origin
    if (!origin || !req.headers.host) return false
    try {
        return new URL(origin).host === req.headers.host
    } catch {
        return false
    }
}

function describeError(err: Error & { level?: string; code?: string }): string {
    if (err.level === 'client-authentication') return 'Authentication failed. Check the username and credentials.'
    switch (err.code) {
        case 'ECONNREFUSED': return 'Connection refused. Is SSH running on that port?'
        case 'ENOTFOUND': return 'Host not found. Check the hostname.'
        case 'ETIMEDOUT':
        case 'EHOSTUNREACH':
        case 'ENETUNREACH': return 'Could not reach the host.'
    }
    if (err.level === 'client-timeout') return 'Timed out while connecting.'
    return err.message
}

export function attachSshGateway(server: Server) {
    const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 * 1024 })

    server.on('upgrade', (req, socket, head) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname !== '/api/ssh') return reject(socket, '404 Not Found')
        if (!isSameOrigin(req)) return reject(socket, '403 Forbidden')

        const userId = userIdFromCookieHeader(req.headers.cookie)
        if (!userId) return reject(socket, '401 Unauthorized')

        const client = getClientRow(userId, url.searchParams.get('clientId') ?? '')
        if (!client) return reject(socket, '404 Not Found')

        wss.handleUpgrade(req, socket, head, (ws) => handleSession(ws, client))
    })
}

function handleSession(ws: WebSocket, client: ClientRow) {
    const ssh = new SshClient()
    let stream: ClientChannel | null = null
    let started = false
    let hostKeyError: GatewayMessage | null = null
    let receivedFingerprint = ''

    const send = (message: GatewayMessage) => {
        if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(message))
    }

    const connectTimeout = setTimeout(() => ws.close(1008, 'No connect message'), CONNECT_MESSAGE_TIMEOUT_MS)

    ws.on('message', (raw) => {
        let message: BrowserMessage
        try {
            message = JSON.parse(raw.toString()) as BrowserMessage
        } catch {
            return
        }

        if (!started) {
            if (message.type !== 'connect') return
            started = true
            clearTimeout(connectTimeout)
            connect(message)
        } else if (message.type === 'data' && typeof message.data === 'string') {
            stream?.write(message.data)
        } else if (message.type === 'resize') {
            stream?.setWindow(terminalSize(message.rows, 24), terminalSize(message.cols, 80), 0, 0)
        }
    })

    ws.on('close', () => {
        clearTimeout(connectTimeout)
        ssh.end()
    })

    function connect(message: Extract<BrowserMessage, { type: 'connect' }>) {
        const password = typeof message.password === 'string' ? message.password : undefined

        ssh.on('keyboard-interactive', (_name, _instructions, _lang, prompts, finish) => {
            // Servers that ask for the password this way get the one the user typed in
            finish(prompts.map(() => password ?? ''))
        })

        ssh.on('ready', () => {
            if (!client.host_key) saveHostKey(client.id, receivedFingerprint)

            ssh.shell({
                term: 'xterm-256color',
                cols: terminalSize(message.cols, 80),
                rows: terminalSize(message.rows, 24),
            }, (err, channel) => {
                if (err) {
                    send({ type: 'error', message: `Could not open a shell: ${err.message}` })
                    ws.close()
                    return
                }
                stream = channel
                send({ type: 'connected', hostKeyFingerprint: receivedFingerprint })

                const forward = (data: Buffer) => {
                    if (ws.readyState === ws.OPEN) ws.send(data, { binary: true })
                }
                channel.on('data', forward)
                channel.stderr.on('data', forward)
                channel.on('close', () => {
                    ws.close(1000, 'Session ended')
                    ssh.end()
                })
            })
        })

        ssh.on('error', (err) => {
            send(hostKeyError ?? { type: 'error', message: describeError(err) })
            ws.close()
        })

        ssh.on('close', () => ws.close())

        try {
            ssh.connect({
                host: client.hostname,
                port: client.port,
                username: client.username,
                password: client.auth_method === 'password' ? password : undefined,
                privateKey: client.auth_method === 'key' && message.privateKey ? message.privateKey : undefined,
                passphrase: message.passphrase || undefined,
                tryKeyboard: client.auth_method === 'password',
                readyTimeout: 20_000,
                keepaliveInterval: 15_000,
                // Trust on first use: remember the key the first time, refuse if it ever changes
                hostVerifier: (key: Buffer) => {
                    receivedFingerprint = fingerprint(key)
                    if (!client.host_key || client.host_key === receivedFingerprint) return true
                    hostKeyError = {
                        type: 'error',
                        code: 'host-key-mismatch',
                        message: 'The host key for this machine has changed.',
                        expected: client.host_key,
                        received: receivedFingerprint,
                    }
                    return false
                },
            })
        } catch (err) {
            // ssh2 throws synchronously for things like an unreadable private key
            send({ type: 'error', message: err instanceof Error ? err.message : 'Could not connect' })
            ws.close()
        }
    }
}
