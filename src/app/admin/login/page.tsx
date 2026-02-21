"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLogin() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/admin/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });

            if (res.ok) {
                // En una app real, el backend enviaría una cookie HTTP-only con un JWT
                // y este auth state no dependería de localStorage.
                localStorage.setItem("admin_auth", "true");
                router.push("/admin");
            } else {
                const data = await res.json();
                setError(data.message || "Contraseña incorrecta");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 sm:p-10">
                    <div className="flex justify-center mb-6">
                        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <Lock className="h-8 w-8 text-blue-600" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        Acceso Profesores
                    </h2>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña Administrativa
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                                placeholder="Ingresa la contraseña"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all ${loading
                                    ? "bg-blue-400 cursor-not-allowed"
                                    : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                                }`}
                        >
                            {loading ? "Verificando..." : "Ingresar al Panel"}
                        </button>
                        <div className="text-center mt-4">
                            <a href="/" className="text-sm text-gray-500 hover:text-gray-700">
                                Volver al inicio
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
