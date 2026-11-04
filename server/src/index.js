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
app.use(cors({ origin: process.env.FRONTEND_URL }))
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

app.listen(process.env.PORT, () => {
  console.log(`Servidor en http://localhost:${process.env.PORT}`)
})
