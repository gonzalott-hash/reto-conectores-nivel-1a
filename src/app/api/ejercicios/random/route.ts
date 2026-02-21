import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limite = searchParams.get('limit') || '10';
        const limitNum = parseInt(limite, 10);

        const db = await getDb();

        // Sólo trae ejercicios activos y ordenados al azar
        const ejercicios = await db.all(`
      SELECT id, enunciado_incorrecto, opciones, conector_correcto, explicacion 
      FROM ejercicios 
      WHERE es_activo = 1 
      ORDER BY RANDOM() 
      LIMIT ?
    `, [limitNum]);

        const parsedEjercicios = ejercicios.map(e => ({
            ...e,
            opciones: JSON.parse(e.opciones)
        }));

        return NextResponse.json(parsedEjercicios);
    } catch (error) {
        console.error("Error fetching random ejercicios:", error);
        return NextResponse.json({ error: 'Failed to fetch ejercicios' }, { status: 500 });
    }
}
