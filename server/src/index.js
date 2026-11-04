import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { supabaseAdmin } from './lib/supabase.js'
import pedidosRouter from './routes/pedidos.js'
import ordersRouter from './routes/orders.js'
import webhooksRouter from './routes/webhooks.js'
import oauthRouter from './routes/oauth.js'

const app = express()
app.use(helmet())

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://pintapatitas.com",
  "https://www.pintapatitas.com",
  "http://localhost:5173",
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite peticiones sin origen (como Postman, webhooks de Mercado Pago, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    credentials: true,
  })
)
app.use(express.json())

app.get('/api/health', async (_req, res) => {
  try {
    const { error } = await supabaseAdmin.from('_health_check').select('*').limit(1)
    res.json({ ok: true, supabase: error ? error.code : 'conectado' })
  } catch (e) {
    res.json({ ok: true, supabase: e?.message })
  }
})

app.use('/api/pedidos', pedidosRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/webhooks', webhooksRouter)
app.use('/api/oauth', oauthRouter)

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en http://0.0.0.0:${PORT}`)
})
