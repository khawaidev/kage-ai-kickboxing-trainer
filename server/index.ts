import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import cors from 'cors'
import express from 'express'
import { env, isProd } from './env.js'
import { accountRouter } from './routes/account.js'
import { analysisRouter } from './routes/analysis.js'
import { chatRouter } from './routes/chat.js'
import { liveTokenRouter } from './routes/liveToken.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(
  cors({
    origin: isProd ? true : env.corsOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    liveModel: env.liveModel,
    analysisModel: env.analysisModel,
    chatModel: env.chatModel,
    keys: env.geminiKeys.length,
  })
})

app.use('/api', liveTokenRouter)
app.use('/api', analysisRouter)
app.use('/api', chatRouter)
app.use('/api', accountRouter)

// Serve the built PWA in production (single Render web service).
const distDir = join(__dirname, '..', 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
    res.sendFile(join(distDir, 'index.html'))
  })
}

app.use((_req, res) => {
  res.status(404).json({ error: 'not_found' })
})

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[kage] server listening on :${env.port} (${isProd ? 'production' : 'development'})`)
})
