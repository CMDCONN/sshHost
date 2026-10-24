export type AuthMethod = 'key' | 'password'

export type Client = {
    id: string
    name: string
    hostname: string
    port: number
    username: string
    authMethod: AuthMethod
    keyPath: string
    tags: string[]
    notes: string
    createdAt: string
}

export type ClientInput = Omit<Client, 'id' | 'createdAt'>

export function sshCommand(client: ClientInput): string {
    const parts = ['ssh']
    if (client.port !== 22) parts.push(`-p ${client.port}`)
    if (client.authMethod === 'key' && client.keyPath) parts.push(`-i ${client.keyPath}`)
    parts.push(`${client.username}@${client.hostname}`)
    return parts.join(' ')
}
