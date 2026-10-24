import { useEffect, useState } from 'react'
import type { Client, ClientInput } from './types'

// TODO: move to the backend once there is one; for now clients live in this browser only
const STORAGE_KEY = 'sshhost.clients'

function loadClients(): Client[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as Client[]) : []
    } catch {
        return []
    }
}

export function useClients() {
    const [clients, setClients] = useState<Client[]>(loadClients)

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(clients))
        } catch {
            // storage unavailable (e.g. private window); keep working in memory
        }
    }, [clients])

    function addClient(input: ClientInput): Client {
        const client: Client = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
        setClients((prev) => [...prev, client])
        return client
    }

    function updateClient(id: string, input: ClientInput) {
        setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...input } : c)))
    }

    function removeClient(id: string) {
        setClients((prev) => prev.filter((c) => c.id !== id))
    }

    return { clients, addClient, updateClient, removeClient }
}
