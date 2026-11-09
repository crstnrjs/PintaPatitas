import test from "node:test";
import assert from "node:assert/strict";
process.env.SUPABASE_URL ||= "https://example.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test-service-role-key";
const { aplicarConservacion } = await import("./conservacion.js");

function dbFalsa({ pedidos = [], errorFotos = null, anonimizados } = {}) {
  const llamadas = [];
  let entregados = false;
  return {
    llamadas,
    rpc: async (nombre, args) => {
      llamadas.push([nombre, args]);
      if (nombre === "pedidos_para_anonimizar") {
        const data = entregados ? [] : pedidos;
        entregados = true;
        return { data, error: null };
      }
      if (nombre === "anonimizar_pedidos") return { data: anonimizados ?? args.p_ids.length, error: null };
      if (nombre === "anonimizar_ventas_cuadros") return { data: 2, error: null };
      throw new Error(`rpc inesperado: ${nombre}`);
    },
    storage: {
      from: (bucket) => ({
        remove: async (rutas) => {
          llamadas.push(["remove", bucket, rutas]);
          return { error: errorFotos };
        },
      }),
    },
  };
}

test("borra las fotos antes de anonimizar los pedidos vencidos", async () => {
  const db = dbFalsa({
    pedidos: [
      { order_id: "a", fotos: ["a/1.webp", "a/2.webp"] },
      { order_id: "b", fotos: [] },
    ],
  });
  const r = await aplicarConservacion({ db });

  assert.deepEqual(r, { pedidos: 2, fotos: 2, ventas: 2 });
  assert.deepEqual(
    db.llamadas.map((l) => l[0]),
    ["pedidos_para_anonimizar", "remove", "anonimizar_pedidos", "anonimizar_ventas_cuadros"],
  );
  assert.deepEqual(db.llamadas[1], ["remove", "pet-photos", ["a/1.webp", "a/2.webp"]]);
  assert.deepEqual(db.llamadas[2][1].p_ids, ["a", "b"]);
});

test("si no se pueden borrar las fotos, no anonimiza (se reintenta después)", async () => {
  const db = dbFalsa({
    pedidos: [{ order_id: "a", fotos: ["a/1.webp"] }],
    errorFotos: new Error("storage caído"),
  });
  await assert.rejects(aplicarConservacion({ db }), /storage caído/);
  assert.ok(!db.llamadas.some((l) => l[0] === "anonimizar_pedidos"));
});

test("sin pedidos vencidos solo revisa las ventas de cuadros", async () => {
  const db = dbFalsa();
  const r = await aplicarConservacion({ db });
  assert.deepEqual(r, { pedidos: 0, fotos: 0, ventas: 2 });
  assert.ok(!db.llamadas.some((l) => l[0] === "remove"));
});

test("nunca pide un plazo menor al configurado", async () => {
  const db = dbFalsa();
  await aplicarConservacion({ db });
  assert.equal(db.llamadas[0][1].p_meses, 6);
});
