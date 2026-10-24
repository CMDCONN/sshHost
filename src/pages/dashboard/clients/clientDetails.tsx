import { useState } from 'react'
import { sshCommand, type Client } from './types'

type ClientDetailsProps = {
    client: Client
    onEdit: () => void
    onDelete: () => void
}

export default function ClientDetails({ client, onEdit, onDelete }: ClientDetailsProps) {
    const [copied, setCopied] = useState(false)
    const command = sshCommand(client)

    const details: [string, string][] = [
        ['Hostname', client.hostname],
        ['Port', String(client.port)],
        ['Username', client.username],
        ['Authentication', client.authMethod === 'key' ? 'SSH key' : 'Password'],
        ...(client.authMethod === 'key' ? [['Private key', client.keyPath || 'Default key'] as [string, string]] : []),
        ['Added', new Date(client.createdAt).toLocaleDateString()],
    ]

    return (
        <div className="max-w-3xl space-y-8">
            <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold truncate">{client.name}</h1>
                    {client.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {client.tags.map((tag) => (
                                <span key={tag} className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="ml-auto flex gap-2">
                    <button type="button" onClick={onEdit}
                        className="py-1.5 px-3 text-sm rounded-md font-medium cursor-pointer text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-neutral-700 dark:hover:bg-neutral-800">
                        Edit
                    </button>
                    <button type="button" onClick={() => { if (confirm(`Delete ${client.name}?`)) onDelete() }}
                        className="py-1.5 px-3 text-sm rounded-md font-medium cursor-pointer text-red-700 ring-1 ring-red-200 hover:bg-red-50 dark:text-red-400 dark:ring-red-900 dark:hover:bg-red-950">
                        Delete
                    </button>
                </div>
            </div>

            <div>
                <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Connect</h2>
                <div className="flex items-center gap-2 rounded-lg bg-slate-900 pl-4 pr-2 py-2 dark:bg-black dark:ring-1 dark:ring-neutral-800">
                    <code className="flex-1 overflow-x-auto whitespace-nowrap text-sm text-slate-100">
                        <span className="select-none text-slate-500">$ </span>{command}
                    </code>
                    <button type="button" onClick={() => {
                        navigator.clipboard.writeText(command).then(() => {
                            setCopied(true)
                            setTimeout(() => setCopied(false), 1500)
                        })
                    }}
                        className="shrink-0 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer text-slate-300 hover:bg-slate-700 hover:text-white">
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>

            <div>
                <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Details</h2>
                <dl className="divide-y divide-slate-200 rounded-lg ring-1 ring-slate-200 dark:divide-neutral-800 dark:ring-neutral-800">
                    {details.map(([label, value]) => (
                        <div key={label} className="grid grid-cols-[9rem_1fr] gap-4 px-4 py-3 text-sm">
                            <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                            <dd className="font-mono break-all">{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>

            {client.notes && (
                <div>
                    <h2 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Notes</h2>
                    <p className="whitespace-pre-wrap text-sm">{client.notes}</p>
                </div>
            )}
        </div>
    )
}
