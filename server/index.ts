import { createServer } from 'node:http'
import express, { type NextFunction, type Request, type Response } from 'express'
import { authRouter } from './auth.ts'
import { clientsRouter } from './clients.ts'
import { attachSshGateway } from './ssh.ts'

const HOST = process.env.HOST ?? '127.0.0.1'
const PORT = Number(process.env.PORT ?? 3001)

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

app.use('/api/auth', authRouter)
app.use('/api/clients', clientsRouter)
app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' })
})

// Serves the built front end (`npm run build`) in production; in dev Vite serves it instead
app.use(express.static('dist'))

// Express only treats a handler as an error handler if it takes four arguments
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
})

const server = createServer(app)
attachSshGateway(server)

server.listen(PORT, HOST, () => {
    console.log(`SSHost server listening on http://${HOST}:${PORT}`)
})
