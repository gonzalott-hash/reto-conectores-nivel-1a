import { createClient } from "@libsql/client";

async function list() {
    const url = "file:./sqlite.db";
    const client = createClient({ url });
    const res = await client.execute("SELECT id, enunciado_incorrecto FROM ejercicios ORDER BY id ASC;");
    console.log(`TOTAL RECORDS: ${res.rows.length}`);
    res.rows.forEach(row => {
        console.log(`ID: ${row.id} - ${row.enunciado_incorrecto.substring(0, 50)}...`);
    });
}

list();
