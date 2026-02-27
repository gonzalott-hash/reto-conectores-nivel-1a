import { createClient } from "@libsql/client";

const url = "file:./sqlite.db";

async function check() {
    const client = createClient({ url });
    const res = await client.execute("SELECT COUNT(*) as total, SUM(CASE WHEN es_activo = 1 THEN 1 ELSE 0 END) as activos FROM ejercicios;");
    console.log(JSON.stringify(res.rows[0]));
}

check();
