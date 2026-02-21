"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, LogOut, CheckCircle2, XCircle, Upload, Info, Download, LayoutDashboard, ChevronDown, ChevronRight } from "lucide-react";

type Ejercicio = {
    id: number;
    enunciado_incorrecto: string;
    opciones: string[];
    conector_correcto: string;
    explicacion: string;
    es_activo: boolean;
};

export default function AdminPage() {
    const router = useRouter();
    const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [numEjercicios, setNumEjercicios] = useState("10");

    // Form states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showTable, setShowTable] = useState(false);
    const [bulkText, setBulkText] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        enunciado_incorrecto: "",
        opciones: "",
        conector_correcto: "",
        explicacion: "",
        es_activo: true,
    });

    // Verify Auth
    useEffect(() => {
        const isAuth = localStorage.getItem("admin_auth");
        if (!isAuth) {
            router.push("/admin/login");
        } else {
            fetchConfig();
            fetchEjercicios();
        }
    }, [router]);

    const fetchConfig = async () => {
        try {
            const res = await fetch("/api/config");
            if (res.ok) {
                const data = await res.json();
                if (data.num_ejercicios) {
                    setNumEjercicios(data.num_ejercicios);
                }
            }
        } catch (error) {
            console.error("Error fetching config", error);
        }
    };

    const updateConfig = async (clave: string, valor: string) => {
        setNumEjercicios(valor);
        try {
            await fetch("/api/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [clave]: valor })
            });
        } catch (error) {
            console.error("Error updating config", error);
        }
    };

    const fetchEjercicios = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/ejercicios");
            const data = await res.json();
            setEjercicios(data);
        } catch (error) {
            console.error("Error fetching ejercicios", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("admin_auth");
        router.push("/admin/login");
    };

    const openModal = (ejercicio?: Ejercicio) => {
        if (ejercicio) {
            setEditingId(ejercicio.id);
            setFormData({
                enunciado_incorrecto: ejercicio.enunciado_incorrecto,
                opciones: ejercicio.opciones.join(", "),
                conector_correcto: ejercicio.conector_correcto,
                explicacion: ejercicio.explicacion,
                es_activo: Boolean(ejercicio.es_activo),
            });
        } else {
            setEditingId(null);
            setFormData({
                enunciado_incorrecto: "",
                opciones: "",
                conector_correcto: "",
                explicacion: "",
                es_activo: true,
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Parse comma separated options
        const parsedOptions = formData.opciones.split(",").map(opt => opt.trim()).filter(Boolean);

        const payload = {
            ...formData,
            opciones: parsedOptions
        };

        try {
            const url = editingId ? `/api/ejercicios/${editingId}` : "/api/ejercicios";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                fetchEjercicios();
                closeModal();
            } else {
                alert("Error al guardar el ejercicio");
            }
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("¿Estás seguro de eliminar este ejercicio?")) {
            try {
                const res = await fetch(`/api/ejercicios/${id}`, {
                    method: "DELETE"
                });

                if (res.ok) {
                    fetchEjercicios();
                } else {
                    alert("Error al eliminar");
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">Cargando panel...</div>;

    const handleBulkImport = async () => {
        if (!bulkText.trim()) {
            alert("Por favor, ingresa el texto con los ejercicios.");
            return;
        }

        setIsImporting(true);
        try {
            // Parsing logic
            const blocks = bulkText.split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
            const parsedEjercicios = blocks.map(block => {
                const lines = block.split('\n').map(l => l.trim()).filter(Boolean);

                if (lines.length < 2) return null; // Needs at least one prompt and one option

                const enunciado_incorrecto = lines[0];
                let conector_correcto = "";

                const opcionesArray = lines.slice(1).map(opt => {
                    if (opt.endsWith('*')) {
                        const cleanOpt = opt.slice(0, -1).trim();
                        conector_correcto = cleanOpt;
                        return cleanOpt;
                    }
                    return opt;
                });

                return {
                    enunciado_incorrecto,
                    opcionesArray,
                    conector_correcto,
                    explicacion: ""
                };
            }).filter(ej => ej !== null && ej.enunciado_incorrecto && ej.opcionesArray.length > 0 && ej.conector_correcto);

            if (parsedEjercicios.length === 0) {
                alert("No se encontraron ejercicios válidos. Revisa el formato.");
                setIsImporting(false);
                return;
            }

            // Map it to what the API expects (the route we just created expects arr string in opciones but it's passed directly to stringify there, handled in the single item endpoint differently)
            // our new bulk API expects 'opciones' to be a comma separated string since we did `ej.opciones.split(",")` inside the bulk route.
            const payloadArray = parsedEjercicios.map(ej => ({
                enunciado_incorrecto: ej!.enunciado_incorrecto,
                opciones: ej!.opcionesArray.join(","),
                conector_correcto: ej!.conector_correcto,
                explicacion: ej!.explicacion
            }));

            const res = await fetch("/api/ejercicios/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ejercicios: payloadArray })
            });

            if (res.ok) {
                const data = await res.json();
                alert(`¡Éxito! Se importaron ${data.insertados} ejercicios nuevos.`);
                setBulkText("");
                setIsBulkModalOpen(false);
                fetchEjercicios();
            } else {
                const errData = await res.json();
                alert(`Error: ${errData.message || 'Error al importar'}`);
            }

        } catch (error) {
            console.error(error);
            alert("Hubo un error al procesar el texto. Revisa la consola para más detalles.");
        } finally {
            setIsImporting(false);
        }
    };


    const activosEjercicios = ejercicios.filter(e => e.es_activo).length;

    return (
        <div className="min-h-screen bg-slate-900 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-100">Panel de Administración</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center text-slate-400 hover:text-red-400 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Cerrar Sesión
                    </button>
                </div>

                {/* Dashboard Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex items-center">
                        <div className="bg-emerald-900/50 p-3 rounded-lg mr-4 border border-emerald-800/50">
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-slate-400 pl-1 text-sm font-medium">Ejercicios Activos</p>
                            <p className="text-3xl font-bold text-slate-100">{activosEjercicios}</p>
                        </div>
                    </div>
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg flex items-center">
                        <div className="bg-purple-900/50 p-3 rounded-lg mr-4 border border-purple-800/50">
                            <LayoutDashboard className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="w-full">
                            <p className="text-slate-400 pl-1 text-sm font-medium mb-1">Ejercicios por Reto</p>
                            <select
                                className="w-full bg-slate-900/50 border border-slate-600 text-purple-400 text-sm font-semibold rounded-md px-3 py-1.5 outline-none cursor-pointer focus:ring-1 focus:ring-purple-500 [&>option]:bg-slate-800"
                                value={numEjercicios}
                                onChange={(e) => updateConfig("num_ejercicios", e.target.value)}
                            >
                                <option value="10">10 ejercicios</option>
                                <option value="20">20 ejercicios</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden mb-8">
                <div className="p-6 border-b border-slate-700 lg:flex justify-between items-center space-y-4 lg:space-y-0">
                    <div className="flex max-sm:flex-col sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setShowTable(!showTable)}>
                        <div className="flex items-center">
                            {showTable ? <ChevronDown className="w-5 h-5 text-slate-400 mr-2" /> : <ChevronRight className="w-5 h-5 text-slate-400 mr-2" />}
                            <h2 className="text-xl font-semibold text-slate-200">Banco de Datos</h2>
                        </div>
                    </div>
                    <div className="flex space-x-3 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0 shrink-0">
                        <button
                            onClick={() => setIsBulkModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm ring-1 ring-emerald-500/50"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Importación Masiva
                        </button>
                        <button
                            onClick={() => openModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm ring-1 ring-blue-500/50"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo
                        </button>
                    </div>
                </div>

                {showTable && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-900/50 text-slate-300 font-medium border-b border-slate-700">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4 w-1/3">Enunciado</th>
                                    <th className="px-6 py-4">Respuesta</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50 text-slate-300">
                                {ejercicios.map((ej) => (
                                    <tr key={ej.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-500">#{ej.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="truncate w-64 md:w-96 text-slate-200" title={ej.enunciado_incorrecto}>
                                                {ej.enunciado_incorrecto}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-emerald-400">
                                            {ej.conector_correcto}
                                        </td>
                                        <td className="px-6 py-4">
                                            {ej.es_activo ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800/50">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900/50 text-slate-400 border border-slate-700">
                                                    <XCircle className="w-3 h-3 mr-1" /> Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openModal(ej)}
                                                className="text-blue-400 hover:text-blue-300 mr-4 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ej.id)}
                                                className="text-red-400 hover:text-red-300 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {ejercicios.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            No hay ejercicios registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>            {/* Modal Form */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
                            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                                <h3 className="text-xl font-bold text-slate-100">
                                    {editingId ? "Editar Ejercicio" : "Crear Ejercicio"}
                                </h3>
                                <button onClick={closeModal} className="text-slate-400 hover:text-slate-200 transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Enunciado (Usa &quot;__________&quot; para el espacio)</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={formData.enunciado_incorrecto}
                                        onChange={(e) => setFormData({ ...formData, enunciado_incorrecto: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="Ej: Caminaba rápido, __________ llegó tarde."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Opciones (separadas por coma)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.opciones}
                                        onChange={(e) => setFormData({ ...formData, opciones: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="pero, aunque, sin embargo, además"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Conector Correcto</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.conector_correcto}
                                        onChange={(e) => setFormData({ ...formData, conector_correcto: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="sin embargo"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Explicación Pedagógica (solo visible en el PDF)</label>
                                    <textarea
                                        required
                                        rows={2}
                                        value={formData.explicacion}
                                        onChange={(e) => setFormData({ ...formData, explicacion: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        placeholder="Explica brevemente por qué es la respuesta correcta."
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="activo"
                                        checked={formData.es_activo}
                                        onChange={(e) => setFormData({ ...formData, es_activo: e.target.checked })}
                                        className="h-4 w-4 text-blue-500 bg-slate-900 border-slate-600 rounded focus:ring-blue-500 focus:ring-offset-slate-800"
                                    />
                                    <label htmlFor="activo" className="ml-2 block text-sm text-slate-300">
                                        Ejercicio Activo
                                    </label>
                                </div>

                                <div className="pt-4 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm ring-1 ring-blue-500/50"
                                    >
                                        {editingId ? "Actualizar" : "Guardar"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Bulk Import Modal */}
            {
                isBulkModalOpen && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-700">
                            <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-100">
                                        Importación Masiva (Formato Word)
                                    </h3>
                                    <p className="text-sm text-slate-400 mt-1">
                                        Copia y pega los ejercicios desde Word usando el formato requerido.
                                    </p>
                                </div>
                                <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-200 transition-colors">
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto space-y-4">
                                <div className="flex justify-between items-center">
                                    <a
                                        href="/plantilla_ejercicios.txt"
                                        download
                                        className="text-sm bg-slate-700/50 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-md flex items-center transition-colors border border-slate-600 shadow-sm"
                                    >
                                        <Download className="w-4 h-4 mr-2 text-emerald-400" />
                                        Descargar Plantilla (.txt)
                                    </a>

                                    <button
                                        onClick={() => setShowInstructions(!showInstructions)}
                                        className="text-sm text-blue-400 hover:text-blue-300 flex items-center transition-colors"
                                    >
                                        <Info className="w-4 h-4 mr-1" />
                                        {showInstructions ? "Ocultar Instrucciones" : "Ver Instrucciones de Formato"}
                                    </button>
                                </div>

                                {showInstructions && (
                                    <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 font-mono text-sm text-slate-300">
                                        <p className="text-slate-400 mb-2 font-sans font-semibold">Formato requerido (separa ejercicios con una línea en blanco):</p>
                                        <p>Caminaba rápido, __________ llegó tarde.</p>
                                        <p>pero</p>
                                        <p>aunque</p>
                                        <p>sin embargo*</p>
                                        <p>además</p>
                                        <p className="mt-4 text-emerald-400/80 italic font-sans text-xs">Nota: Añade un asterisco (*) al final de la opción correcta.</p>
                                    </div>
                                )}

                                <div>
                                    <textarea
                                        className="w-full h-64 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-md text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-sm leading-relaxed"
                                        placeholder="Enunciado...&#10;opcion 1&#10;opcion 2*&#10;opcion 3"
                                        value={bulkText}
                                        onChange={(e) => setBulkText(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3 shrink-0">
                                <button
                                    onClick={() => setIsBulkModalOpen(false)}
                                    className="px-5 py-2.5 text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBulkImport}
                                    disabled={isImporting || !bulkText.trim()}
                                    className={`px-5 py-2.5 text-white rounded-lg transition-colors shadow-sm font-medium flex items-center ${isImporting || !bulkText.trim()
                                        ? "bg-emerald-600/50 cursor-not-allowed text-emerald-200"
                                        : "bg-emerald-600 hover:bg-emerald-700 ring-1 ring-emerald-500/50"
                                        }`}
                                >
                                    {isImporting ? "Procesando..." : "Importar Ejercicios"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
