import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

// Cliente con privilegios totales: SOLO usar en el servidor
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: ws }
  }
)