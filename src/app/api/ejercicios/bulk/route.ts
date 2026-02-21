import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (!body.ejercicios || !Array.isArray(body.ejercicios)) {
            return NextResponse.json({ message: "Formato no válido. Se esperaba un array de ejercicios." }, { status: 400 });
        }

        const db = await getDb();

        const stmt = await db.prepare(`
            INSERT INTO ejercicios (enunciado_incorrecto, opciones, conector_correcto, explicacion)
            VALUES (?, ?, ?, ?)
        `);

        // Ejecutar inserciones, la librería `sqlite` (basada en promesas) no soporta transacciones síncronas simples
        // de la misma manera que `better-sqlite3`. Haremos prepared statements iterativos.
        let insertados = 0;

        await db.run('BEGIN TRANSACTION');
        try {
            for (const ej of body.ejercicios) {
                if (ej.enunciado_incorrecto && ej.opciones && ej.conector_correcto) {
                    await stmt.run(
                        ej.enunciado_incorrecto,
                        JSON.stringify(ej.opciones.split(",").map((o: string) => o.trim())),
                        ej.conector_correcto.trim(),
                        ej.explicacion || ""
                    );
                    insertados++;
                }
            }
            await db.run('COMMIT');
        } catch (txnErr) {
            await db.run('ROLLBACK');
            throw txnErr; // Rethrow to be caught by the outer catch
        } finally {
            await stmt.finalize();
        }

        return NextResponse.json({
            message: "Importación exitosa",
            insertados
        }, { status: 201 });

    } catch (error) {
        console.error("Error en bulk import:", error);
        return NextResponse.json({ message: "Error interno del servidor al importar" }, { status: 500 });
    }
}
