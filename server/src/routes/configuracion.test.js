import test from "node:test";
import assert from "node:assert/strict";
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
const { porcentajesCobro } = await import("./configuracion.js");

test("entrega la comisión y el abono que usa el servidor al cobrar", () => {
  assert.deepEqual(porcentajesCobro({ COMISION_PORCENTAJE: "7", ABONO_PORCENTAJE: "50" }), {
    comision_porcentaje: 7,
    abono_porcentaje: 50,
  });
});

test("la comisión cae en 7 % si no está configurada, igual que el cobro del saldo", () => {
  assert.equal(porcentajesCobro({ ABONO_PORCENTAJE: "40" }).comision_porcentaje, 7);
});

test("marca como no configurado un valor inválido en vez de inventarlo", () => {
  assert.deepEqual(porcentajesCobro({ COMISION_PORCENTAJE: "abc", ABONO_PORCENTAJE: "" }), {
    comision_porcentaje: null,
    abono_porcentaje: null,
  });
});
