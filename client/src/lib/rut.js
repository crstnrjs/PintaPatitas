// RUT chileno. Misma regla que el servidor (server/src/lib/rut.js); aquí solo sirve para
// avisar antes de enviar, la validación que vale es la del servidor.

const limpiar = (valor) => String(valor ?? "").replace(/[^0-9kK]/g, "").toUpperCase();

export function rutValido(valor) {
  const limpio = limpiar(valor);
  if (limpio.length < 2 || limpio.length > 9) return false;
  const cuerpo = limpio.slice(0, -1);
  if (!/^\d+$/.test(cuerpo)) return false;
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const esperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return limpio.slice(-1) === esperado;
}

// 111111111 → 11.111.111-1
export function formatearRut(valor) {
  const limpio = limpiar(valor);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpo}-${limpio.slice(-1)}`;
}
