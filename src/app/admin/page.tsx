"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, LogOut, CheckCircle2, XCircle } from "lucide-react";

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

    // Form states
    const [isModalOpen, setIsModalOpen] = useState(false);
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
            fetchEjercicios();
        }
    }, [router]);

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

    if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando panel...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
                    <button
                        onClick={handleLogout}
                        className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Cerrar Sesión
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">Banco de Ejercicios</h2>
                        <button
                            onClick={() => openModal()}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nuevo Ejercicio
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4 w-1/3">Enunciado</th>
                                    <th className="px-6 py-4">Respuesta</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ejercicios.map((ej) => (
                                    <tr key={ej.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">#{ej.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="truncate w-64 md:w-96" title={ej.enunciado_incorrecto}>
                                                {ej.enunciado_incorrecto}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-emerald-600">
                                            {ej.conector_correcto}
                                        </td>
                                        <td className="px-6 py-4">
                                            {ej.es_activo ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    <XCircle className="w-3 h-3 mr-1" /> Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => openModal(ej)}
                                                className="text-blue-600 hover:text-blue-800 mr-4 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4 inline" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(ej.id)}
                                                className="text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {ejercicios.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No hay ejercicios registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingId ? "Editar Ejercicio" : "Crear Ejercicio"}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enunciado (Usa "__________" para el espacio)</label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.enunciado_incorrecto}
                                    onChange={(e) => setFormData({ ...formData, enunciado_incorrecto: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Ej: Caminaba rápido, __________ llegó tarde."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Opciones (separadas por coma)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.opciones}
                                    onChange={(e) => setFormData({ ...formData, opciones: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="pero, aunque, sin embargo, además"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Conector Correcto</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.conector_correcto}
                                    onChange={(e) => setFormData({ ...formData, conector_correcto: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="sin embargo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Explicación Pedagógica (solo visible en el PDF)</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={formData.explicacion}
                                    onChange={(e) => setFormData({ ...formData, explicacion: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Explica brevemente por qué es la respuesta correcta."
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="activo"
                                    checked={formData.es_activo}
                                    onChange={(e) => setFormData({ ...formData, es_activo: e.target.checked })}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                                    Ejercicio Activo
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors shadow-sm"
                                >
                                    {editingId ? "Actualizar" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
