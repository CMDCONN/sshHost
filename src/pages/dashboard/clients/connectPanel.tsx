import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import type { Client } from './types'

type Phase = 'idle' | 'connecting' | 'connected' | 'ended'

type ConnectError = {
    message: string
    code?: 'host-key-mismatch'
    expected?: string
    received?: string
}

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-50'
const inputClass = 'px-3 py-2 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 dark:text-slate-50 dark:bg-neutral-800 dark:outline-neutral-700'
const secondaryButtonClass = 'py-1 px-2.5 text-xs rounded-md font-medium cursor-pointer text-slate-200 ring-1 ring-slate-600 hover:bg-slate-800'

type ConnectPanelProps = {
    client: Client
    onHostKeyRecorded: (fingerprint: string) => void
    onForgetHostKey: () => Promise<void>
}

export default function ConnectPanel({ client, onHostKeyRecorded, onForgetHostKey }: ConnectPanelProps) {
    const [phase, setPhase] = useState<Phase>('idle')
    const [session, setSession] = useState(0)
    const [error, setError] = useState<ConnectError | null>(null)
    const [password, setPassword] = useState('')
    const [privateKey, setPrivateKey] = useState('')
    const [passphrase, setPassphrase] = useState('')
    const terminalRef = useRef<HTMLDivElement>(null)
    const disconnectRef = useRef<() => void>(() => {})
    const clientId = client.id

    // Credentials stay in memory only, so Reconnect works without retyping them
    const credentials = useEffectEvent(() =>
        client.authMethod === 'password' ? { password } : { privateKey, passphrase })

    const handleConnected = useEffectEvent((fingerprint: string) => {
        if (client.hostKeyFingerprint !== fingerprint) onHostKeyRecorded(fingerprint)
    })

    useEffect(() => {
        const container = terminalRef.current
        if (session === 0 || !container) return

        const term = new Terminal({
            cursorBlink: true,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 13,
            theme: { background: '#020617', foreground: '#e2e8f0' },
        })
        const fit = new FitAddon()
        term.loadAddon(fit)
        term.open(container)
        fit.fit()

        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
        const socket = new WebSocket(`${protocol}//${location.host}/api/ssh?clientId=${encodeURIComponent(clientId)}`)
        socket.binaryType = 'arraybuffer'
        let connected = false
        let closedByUser = false
        disconnectRef.current = () => {
            closedByUser = true
            socket.close()
        }

        let failure: ConnectError | null = null
        const send = (message: object) => {
            if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message))
        }

        socket.onopen = () => send({ type: 'connect', ...credentials(), cols: term.cols, rows: term.rows })
        socket.onmessage = (event) => {
            if (typeof event.data !== 'string') {
                term.write(new Uint8Array(event.data as ArrayBuffer))
                return
            }
            const message = JSON.parse(event.data)
            if (message.type === 'connected') {
                connected = true
                setPhase('connected')
                handleConnected(message.hostKeyFingerprint)
                term.focus()
            } else if (message.type === 'error') {
                failure = message
            }
        }
        socket.onclose = () => {
            if (connected) {
                // keep the terminal on screen so its output can still be read
                setPhase('ended')
                setError(failure)
            } else {
                setPhase('idle')
                setError(closedByUser ? null : failure ?? { message: 'Could not reach the SSHost server.' })
            }
        }

        term.onData((data) => send({ type: 'data', data }))
        term.onResize(({ cols, rows }) => send({ type: 'resize', cols, rows }))
        const observer = new ResizeObserver(() => fit.fit())
        observer.observe(container)

        return () => {
            observer.disconnect()
            socket.onclose = null
            socket.close()
            term.dispose()
        }
    }, [session, clientId])

    function connect() {
        setError(null)
        setPhase('connecting')
        setSession((s) => s + 1)
    }

    const target = `${client.username}@${client.hostname}`

    if (phase === 'idle') {
        return (
            <div className="flex flex-col rounded-lg ring-1 ring-slate-200 dark:ring-neutral-800">
                <div className="flex items-center gap-2 px-4 h-12 border-b border-slate-200 dark:border-neutral-800">
                    <span className="size-2 rounded-full bg-slate-300 dark:bg-neutral-600" />
                    <h2 className="text-sm font-medium">Terminal</h2>
                    <span className="ml-auto font-mono text-xs text-slate-500 dark:text-slate-400 truncate">{target}</span>
                </div>

                <form className="p-4 space-y-4" onSubmit={(e) => {
                    e.preventDefault()
                    connect()
                }}>
                    {error && <ErrorMessage error={error} onForgetHostKey={async () => {
                        await onForgetHostKey()
                        setError(null)
                    }} />}

                    {client.authMethod === 'password' ? (
                        <div>
                            <label htmlFor="connectPassword" className={labelClass}>Password</label>
                            <input id="connectPassword" type="password" required autoComplete="off" className={inputClass}
                                value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    ) : (
                        <>
                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label htmlFor="privateKey" className="text-sm font-medium text-slate-900 dark:text-slate-50">Private key</label>
                                    <label className="text-xs font-medium text-blue-700 cursor-pointer hover:underline dark:text-blue-500">
                                        Load from file
                                        <input type="file" className="sr-only" onChange={async (e) => {
                                            const file = e.target.files?.[0]
                                            if (file) setPrivateKey(await file.text())
                                            e.target.value = ''
                                        }} />
                                    </label>
                                </div>
                                <textarea id="privateKey" required rows={4} spellCheck={false}
                                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                                    className={`${inputClass} font-mono text-xs`}
                                    value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
                                {client.keyPath && (
                                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        This client uses <span className="font-mono">{client.keyPath}</span>
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="passphrase" className={labelClass}>Key passphrase</label>
                                <input id="passphrase" type="password" autoComplete="off" placeholder="Only if the key has one" className={inputClass}
                                    value={passphrase} onChange={(e) => setPassphrase(e.target.value)} />
                            </div>
                        </>
                    )}

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sent to the SSHost server for this connection only. Never stored.
                    </p>

                    <button type="submit"
                        className="w-full py-2 px-4 text-sm rounded-md font-semibold cursor-pointer text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                        Connect
                    </button>
                </form>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[32rem] xl:h-full min-h-[24rem] rounded-lg overflow-hidden bg-slate-950 ring-1 ring-slate-800">
            <div className="flex items-center gap-2 px-4 h-12 shrink-0 border-b border-slate-800 text-slate-200">
                <span className={`size-2 rounded-full ${phase === 'connected' ? 'bg-emerald-500' : phase === 'connecting' ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                <h2 className="text-sm font-medium">
                    {phase === 'connected' ? 'Connected' : phase === 'connecting' ? 'Connecting…' : 'Disconnected'}
                </h2>
                <span className="font-mono text-xs text-slate-400 truncate">{target}</span>
                <div className="ml-auto flex gap-2 shrink-0">
                    {phase === 'ended' ? (
                        <>
                            <button type="button" onClick={connect} className={secondaryButtonClass}>Reconnect</button>
                            <button type="button" onClick={() => setPhase('idle')} className={secondaryButtonClass}>Close</button>
                        </>
                    ) : (
                        <button type="button" onClick={() => disconnectRef.current()} className={secondaryButtonClass}>
                            {phase === 'connecting' ? 'Cancel' : 'Disconnect'}
                        </button>
                    )}
                </div>
            </div>
            {phase === 'ended' && error && (
                <p className="px-4 py-2 text-xs text-red-300 bg-red-950/50 border-b border-slate-800">{error.message}</p>
            )}
            <div ref={terminalRef} className="flex-1 min-h-0 p-2" />
        </div>
    )
}

type ErrorMessageProps = {
    error: ConnectError
    onForgetHostKey: () => Promise<void>
}

function ErrorMessage({ error, onForgetHostKey }: ErrorMessageProps) {
    return (
        <div role="alert" className="rounded-md p-3 text-sm bg-red-50 text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900">
            <p className="font-medium">{error.message}</p>
            {error.code === 'host-key-mismatch' && (
                <>
                    <p className="mt-1">
                        This happens when a machine is reinstalled, but it can also mean someone is intercepting the connection.
                        Only trust the new key if you expected the change.
                    </p>
                    <dl className="mt-2 space-y-1 font-mono text-xs break-all">
                        <div><dt className="inline">Saved: </dt><dd className="inline">{error.expected}</dd></div>
                        <div><dt className="inline">Received: </dt><dd className="inline">{error.received}</dd></div>
                    </dl>
                    <button type="button" onClick={onForgetHostKey}
                        className="mt-3 py-1 px-2.5 text-xs rounded-md font-medium cursor-pointer ring-1 ring-red-300 hover:bg-red-100 dark:ring-red-800 dark:hover:bg-red-900">
                        Trust the new key
                    </button>
                </>
            )}
        </div>
    )
}
