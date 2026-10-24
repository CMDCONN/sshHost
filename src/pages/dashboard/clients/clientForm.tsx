import { useState } from 'react'
import type { AuthMethod, ClientInput } from './types'

const emptyClient: ClientInput = {
    name: '',
    hostname: '',
    port: 22,
    username: '',
    authMethod: 'key',
    keyPath: '',
    tags: [],
    notes: '',
}

const labelClass = 'mb-1.5 block text-sm font-medium text-slate-900 dark:text-slate-50'
const inputClass = 'px-3 py-2 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 dark:text-slate-50 dark:bg-neutral-800 dark:outline-neutral-700'
const hintClass = 'mt-1.5 text-xs text-slate-500 dark:text-slate-400'

type ClientFormProps = {
    title: string
    submitLabel: string
    initial?: ClientInput
    onSubmit: (input: ClientInput) => void
    onCancel: () => void
}

export default function ClientForm({ title, submitLabel, initial = emptyClient, onSubmit, onCancel }: ClientFormProps) {
    const [name, setName] = useState(initial.name)
    const [hostname, setHostname] = useState(initial.hostname)
    const [port, setPort] = useState(String(initial.port))
    const [username, setUsername] = useState(initial.username)
    const [authMethod, setAuthMethod] = useState<AuthMethod>(initial.authMethod)
    const [keyPath, setKeyPath] = useState(initial.keyPath)
    const [tags, setTags] = useState(initial.tags.join(', '))
    const [notes, setNotes] = useState(initial.notes)

    return (
        <form className="max-w-2xl space-y-8" onSubmit={(e) => {
            e.preventDefault()
            onSubmit({
                name: name.trim(),
                hostname: hostname.trim(),
                port: Number(port),
                username: username.trim(),
                authMethod,
                keyPath: authMethod === 'key' ? keyPath.trim() : '',
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
                notes: notes.trim(),
            })
        }}>
            <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Connection details for a machine you can SSH into.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className={labelClass}>Name</label>
                    <input id="name" required placeholder="Web server" className={inputClass}
                        value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="grid gap-4 grid-cols-[1fr_7rem]">
                    <div>
                        <label htmlFor="hostname" className={labelClass}>Hostname or IP</label>
                        <input id="hostname" required placeholder="192.168.1.10" spellCheck={false} className={`${inputClass} font-mono`}
                            value={hostname} onChange={(e) => setHostname(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="port" className={labelClass}>Port</label>
                        <input id="port" type="number" required min={1} max={65535} className={`${inputClass} font-mono`}
                            value={port} onChange={(e) => setPort(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label htmlFor="username" className={labelClass}>Username</label>
                    <input id="username" required placeholder="root" spellCheck={false} className={`${inputClass} font-mono`}
                        value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
            </div>

            <fieldset className="space-y-4">
                <legend className={labelClass}>Authentication</legend>
                <div className="flex gap-6">
                    {([['key', 'SSH key'], ['password', 'Password']] as const).map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" name="authMethod" value={value} className="accent-blue-600"
                                checked={authMethod === value} onChange={() => setAuthMethod(value)} />
                            {label}
                        </label>
                    ))}
                </div>
                {authMethod === 'key' ? (
                    <div>
                        <label htmlFor="keyPath" className={labelClass}>Private key path</label>
                        <input id="keyPath" placeholder="~/.ssh/id_ed25519" spellCheck={false} className={`${inputClass} font-mono`}
                            value={keyPath} onChange={(e) => setKeyPath(e.target.value)} />
                        <p className={hintClass}>Optional. Leave blank to use your default key.</p>
                    </div>
                ) : (
                    <p className={hintClass}>Passwords are never stored. You'll be asked for it when you connect.</p>
                )}
            </fieldset>

            <div className="space-y-4">
                <div>
                    <label htmlFor="tags" className={labelClass}>Tags</label>
                    <input id="tags" placeholder="production, eu-west" className={inputClass}
                        value={tags} onChange={(e) => setTags(e.target.value)} />
                    <p className={hintClass}>Separate tags with commas.</p>
                </div>
                <div>
                    <label htmlFor="notes" className={labelClass}>Notes</label>
                    <textarea id="notes" rows={3} className={inputClass}
                        value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
            </div>

            <div className="flex gap-3">
                <button type="submit"
                    className="py-2 px-4 text-sm rounded-md font-semibold cursor-pointer text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    {submitLabel}
                </button>
                <button type="button" onClick={onCancel}
                    className="py-2 px-4 text-sm rounded-md font-medium cursor-pointer text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-neutral-700 dark:hover:bg-neutral-800">
                    Cancel
                </button>
            </div>
        </form>
    )
}
