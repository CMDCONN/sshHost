import { useState } from 'react'
import { Sidebar, SidebarItem } from '../sidebar'
import ClientDetails from './clientDetails'
import ClientForm from './clientForm'
import { useClients } from './useClients'

type Mode = 'view' | 'add' | 'edit'

export default function ClientsView() {
    const { clients, addClient, updateClient, removeClient } = useClients()
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [mode, setMode] = useState<Mode>('view')

    const selected = clients.find((c) => c.id === selectedId) ?? clients[0]

    const addButton = (
        <button type="button" onClick={() => setMode('add')}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white cursor-pointer hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 3v10M3 8h10" />
            </svg>
            Add
        </button>
    )

    return (
        <div className="h-full flex flex-col md:flex-row">
            <Sidebar title={`Clients (${clients.length})`} action={addButton}>
                {clients.length === 0 && (
                    <p className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No clients yet.</p>
                )}
                {clients.map((client) => (
                    <SidebarItem key={client.id} active={mode !== 'add' && client.id === selected?.id}
                        onClick={() => { setSelectedId(client.id); setMode('view') }}>
                        <div className="font-medium truncate">{client.name}</div>
                        <div className="font-mono text-xs truncate text-slate-500 dark:text-slate-400">{client.username}@{client.hostname}</div>
                    </SidebarItem>
                ))}
            </Sidebar>

            <main className="flex-1 overflow-y-auto p-6 md:p-10">
                {mode === 'add' ? (
                    <ClientForm title="Add client" submitLabel="Add client"
                        onSubmit={(input) => {
                            const client = addClient(input)
                            setSelectedId(client.id)
                            setMode('view')
                        }}
                        onCancel={() => setMode('view')} />
                ) : mode === 'edit' && selected ? (
                    <ClientForm key={selected.id} title="Edit client" submitLabel="Save changes" initial={selected}
                        onSubmit={(input) => {
                            updateClient(selected.id, input)
                            setMode('view')
                        }}
                        onCancel={() => setMode('view')} />
                ) : selected ? (
                    <ClientDetails key={selected.id} client={selected}
                        onEdit={() => setMode('edit')}
                        onDelete={() => {
                            removeClient(selected.id)
                            setSelectedId(null)
                        }} />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <h1 className="text-lg font-semibold">No clients yet</h1>
                        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                            Add a machine you can SSH into to keep its connection details here.
                        </p>
                        <button type="button" onClick={() => setMode('add')}
                            className="mt-6 py-2 px-4 text-sm rounded-md font-semibold cursor-pointer text-white bg-blue-600 hover:bg-blue-700">
                            Add your first client
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}
