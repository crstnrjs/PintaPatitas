// RUT chileno: se valida el dígito verificador y se guarda como 12345678-5.

export function normalizarRut(valor) {
  const limpio = String(valor ?? "").replace(/[^0-9kK]/g, "").toUpperCase();
  if (limpio.length < 2 || limpio.length > 9) return null;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return null;
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === esperado ? `${Number(cuerpo)}-${dv}` : null;
}
