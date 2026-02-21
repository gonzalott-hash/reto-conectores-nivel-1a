"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore, EjercicioBase } from "@/store/game-session";
import { ListChecks, Timer, AlertCircle, ArrowRight } from "lucide-react";

export default function Instrucciones() {
    const router = useRouter();
    const { nombreAlumno, iniciarReto } = useGameStore();
    const [ejercicios, setEjercicios] = useState<EjercicioBase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const NUMERO_EJERCICIOS = 10;
    const TIEMPO_MINUTOS = 10;

    useEffect(() => {
        if (!nombreAlumno) {
            router.push("/");
            return;
        }

        const loadEjercicios = async () => {
            try {
                const res = await fetch(`/api/ejercicios/random?limit=${NUMERO_EJERCICIOS}`);
                if (!res.ok) throw new Error("Error cargando ejercicios");

                const data = await res.json();

                if (data.length === 0) {
                    setError("No hay ejercicios disponibles en la base de datos.");
                } else {
                    setEjercicios(data);
                }
            } catch (err) {
                setError("Error de red al cargar el reto.");
            } finally {
                setLoading(false);
            }
        };

        loadEjercicios();
    }, [nombreAlumno, router]);

    const handleStartReto = () => {
        iniciarReto(ejercicios, TIEMPO_MINUTOS);
        router.push("/reto");
    };

    if (!nombreAlumno) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-8 text-center text-white">
                    <h1 className="text-2xl font-bold mb-2">Hola, {nombreAlumno} 👋</h1>
                    <p className="text-blue-100">Prepárate para iniciar el Reto de Conectores Lógicos</p>
                </div>

                <div className="p-8 sm:p-10">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-2">Reglas del Reto</h2>

                    <ul className="space-y-6 mb-8">
                        <li className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-4">
                                <ListChecks className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900">Múltiple Opción</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Enfrentarás <strong className="text-slate-700">{ejercicios.length} ejercicios</strong> consecutivos. Cada uno presenta un enunciado con un espacio en blanco y varias opciones de conectores.
                                </p>
                            </div>
                        </li>

                        <li className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mr-4">
                                <Timer className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900">Tiempo Limitado</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Tendrás exactamente <strong className="text-slate-700">{TIEMPO_MINUTOS} minutos</strong> para terminar. Si el tiempo se agota, el reto terminará automáticamente.
                                </p>
                            </div>
                        </li>

                        <li className="flex items-start">
                            <div className="flex-shrink-0 h-10 w-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-4">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-slate-900">Análisis Pedagógico</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Al finalizar, obtendrás una puntuación y podrás descargar un PDF con tus errores y la explicación de cada repuesta correcta.
                                </p>
                            </div>
                        </li>
                    </ul>

                    {loading ? (
                        <div className="text-center p-4 bg-slate-50 rounded-lg text-slate-500">
                            Cargando banco de preguntas...
                        </div>
                    ) : error ? (
                        <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                            {error}
                        </div>
                    ) : (
                        <button
                            onClick={handleStartReto}
                            className="w-full py-4 px-4 rounded-xl text-white font-medium bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all flex items-center justify-center group text-lg"
                        >
                            ¡Estoy listo, comenzar!
                            <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
