import { createClient } from "@libsql/client";

async function check(file) {
    try {
        const client = createClient({ url: `file:./${file}` });
        const res = await client.execute("SELECT COUNT(*) as total FROM ejercicios;");
        console.log(`${file}: ${res.rows[0].total}`);
    } catch (e) {
        console.log(`${file}: Error or No Table`);
    }
}

async function run() {
    await check("sqlite.db");
    await check("ejercicios.db");
    await check("ejercicio.db");
}

run();
