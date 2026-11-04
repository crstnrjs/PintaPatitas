import { supabaseAdmin } from "../lib/supabase.js";

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Falta la sesión." });

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: "Sesión no válida." });

  const { data: admin, error: errAdmin } = await supabaseAdmin
    .from("admins")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (errAdmin) return res.status(500).json({ error: "No se pudo verificar el permiso." });
  if (!admin) return res.status(403).json({ error: "No tienes permiso para esta acción." });

  req.admin = data.user;
  next();
}