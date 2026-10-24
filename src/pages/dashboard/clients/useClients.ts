import { useEffect, useState } from 'react'
import { api } from '../../../api'
import type { Client, ClientInput } from './types'

export function useClients() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        api<Client[]>('/clients')
            .then(setClients)
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false))
    }, [])

    function replace(client: Client) {
        setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)))
    }

    async function addClient(input: ClientInput): Promise<Client> {
        const client = await api<Client>('/clients', { method: 'POST', body: input })
        setClients((prev) => [...prev, client])
        return client
    }

    async function updateClient(id: string, input: ClientInput) {
        replace(await api<Client>(`/clients/${id}`, { method: 'PUT', body: input }))
    }

    async function removeClient(id: string) {
        await api(`/clients/${id}`, { method: 'DELETE' })
        setClients((prev) => prev.filter((c) => c.id !== id))
    }

    async function forgetHostKey(id: string) {
        replace(await api<Client>(`/clients/${id}/host-key`, { method: 'DELETE' }))
    }

    function hostKeyRecorded(id: string, fingerprint: string) {
        setClients((prev) => prev.map((c) => (c.id === id ? { ...c, hostKeyFingerprint: fingerprint } : c)))
    }

    return { clients, loading, error, addClient, updateClient, removeClient, forgetHostKey, hostKeyRecorded }
}
