import { createClient } from "@libsql/client";

async function check() {
    const file = "src/app/api/ejercicios/ejercicios.db";
    try {
        const client = createClient({ url: `file:./${file}` });
        const res = await client.execute("SELECT COUNT(*) as total FROM ejercicios;");
        console.log(`${file}: ${res.rows[0].total}`);
    } catch (e) {
        console.log(`${file}: Error or No Table`);
    }
}

check();
