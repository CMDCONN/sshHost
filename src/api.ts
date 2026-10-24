export class ApiError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
    const hasBody = options.body !== undefined
    const res = await fetch(`/api${path}`, {
        method: options.method ?? 'GET',
        headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
        body: hasBody ? JSON.stringify(options.body) : undefined,
    })

    if (!res.ok) {
        let message = res.status === 502 || res.status === 504
            ? "Can't reach the SSHost server. Make sure it's running (npm run dev starts it)."
            : `Request failed (${res.status})`
        try {
            const data = await res.json()
            if (typeof data.error === 'string') message = data.error
        } catch {
            // not JSON (e.g. the server isn't running and the dev proxy answered)
        }
        throw new ApiError(res.status, message)
    }

    return (res.status === 204 ? undefined : await res.json()) as T
}
