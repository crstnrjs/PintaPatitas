export function crearSupabaseFalso({ payments = [], orders = [], failOrderUpdate = false } = {}) {
  const state = { payments: structuredClone(payments), orders: structuredClone(orders) };
  let nextId = 1;

  function queryFor(table) {
    let filters = [];
    let operation = "select";
    let payload;
    let selectRequested = false;
    const query = {
      select() { selectRequested = true; return query; },
      update(values) { operation = "update"; payload = values; return query; },
      insert(values) { operation = "insert"; payload = values; return query; },
      delete() { operation = "delete"; payload = null; return query; },
      async single() {
        const result = await query.maybeSingle();
        return result;
      },
      eq(key, value) { filters.push([key, value]); return query; },
      matches(row) { return filters.every(([key, value]) => row[key] === value); },
      async maybeSingle() {
        const rows = state[table].filter(query.matches);
        const row = rows[0] ?? null;
        if (operation === "select") return { data: row, error: null };
        if (operation === "update") {
          if (table === "orders" && failOrderUpdate) return { data: null, error: new Error("db unavailable") };
          if (row) Object.assign(row, payload);
          if (row && !selectRequested) return { data: null, error: null };
          return { data: row ?? null, error: null };
        }
        if (operation === "insert") {
          const rowsToInsert = (Array.isArray(payload) ? payload : [payload]).map((item) => ({ id: item.id ?? `mock-${nextId++}`, ...item }));
          const duplicate = rowsToInsert.some((item) => state[table].some((existing) =>
            existing.order_id === item.order_id && existing.type === item.type));
          if (duplicate) return { data: null, error: { code: "23505" } };
          state[table].push(...structuredClone(rowsToInsert));
          return { data: selectRequested ? rowsToInsert[0] : null, error: null };
        }
        if (operation === "delete") {
          const matched = state[table].filter(query.matches);
          state[table] = state[table].filter((item) => !query.matches(item));
          return { data: matched, error: null };
        }
        return { data: row, error: null };
      },
      async then(resolve, reject) {
        const rows = state[table].filter(query.matches);
        if (operation === "select") return resolve({ data: structuredClone(rows), error: null });
        if (operation === "update") {
          if (table === "orders" && failOrderUpdate) return resolve({ data: null, error: new Error("db unavailable") });
          rows.forEach((row) => Object.assign(row, payload));
        }
        if (operation === "insert") {
          const rowsToInsert = (Array.isArray(payload) ? payload : [payload]).map((item) => ({ id: item.id ?? `mock-${nextId++}`, ...item }));
          const duplicate = rowsToInsert.some((item) => state[table].some((existing) =>
            existing.order_id === item.order_id && existing.type === item.type));
          if (duplicate) return resolve({ data: null, error: { code: "23505" } });
          state[table].push(...structuredClone(rowsToInsert));
          return resolve({ data: rowsToInsert, error: null });
        }
        if (operation === "delete") {
          const matched = state[table].filter(query.matches);
          state[table] = state[table].filter((item) => !query.matches(item));
          return resolve({ data: matched, error: null });
        }
        return resolve({ data: rows, error: null });
      },
    };
    return query;
  }

  return { state, from: queryFor };
}
