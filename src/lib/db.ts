import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Ruta al archivo SQLite en la raíz del proyecto
const dbPath = path.join(process.cwd(), 'sqlite.db');

let dbInstance: Database | null = null;

/**
 * Retorna la instancia de la base de datos abierta.
 * Si no está abierta, la abre.
 */
export async function getDb(): Promise<Database> {
    if (dbInstance) {
        return dbInstance;
    }

    dbInstance = await open({
        filename: dbPath,
        driver: sqlite3.Database,
    });

    return dbInstance;
}
