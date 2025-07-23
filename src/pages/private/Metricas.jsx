import React from 'react';
import Sidebar from '../../components/Sidebar';

const Metricas = () => {
    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar />

            {/* Contenido principal */}
            <div className="flex-1 p-8">
                {/* Título */}
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Métricas</h1>

                {/* Tarjetas de métricas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Tarjeta 1: Ventas Totales */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-semibold text-gray-700">Ventas Totales</h2>
                        <p className="text-3xl font-bold text-gray-900 mt-2">$12,345</p>
                        <p className="text-sm text-gray-500 mt-1">+5.2% vs último mes</p>
                    </div>

                    {/* Tarjeta 2: Pedidos Completados */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-semibold text-gray-700">Pedidos Completados</h2>
                        <p className="text-3xl font-bold text-gray-900 mt-2">189</p>
                        <p className="text-sm text-gray-500 mt-1">+10% vs último mes</p>
                    </div>

                    {/* Tarjeta 3: Tasa de Conversión */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h2 className="text-xl font-semibold text-gray-700">Tasa de Conversión</h2>
                        <p className="text-3xl font-bold text-gray-900 mt-2">8.5%</p>
                        <p className="text-sm text-gray-500 mt-1">+1.3% vs último mes</p>
                    </div>
                </div>

                {/* Gráfico (Placeholder) */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Desempeño Mensual</h2>
                    <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">Gráfico aquí</span>
                    </div>
                </div>

                {/* Tabla de datos recientes (Placeholder) */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Datos Recientes</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b text-left text-gray-700">ID</th>
                                    <th className="py-2 px-4 border-b text-left text-gray-700">Fecha</th>
                                    <th className="py-2 px-4 border-b text-left text-gray-700">Monto</th>
                                    <th className="py-2 px-4 border-b text-left text-gray-700">Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="py-2 px-4 border-b text-gray-600">#1234</td>
                                    <td className="py-2 px-4 border-b text-gray-600">2023-10-01</td>
                                    <td className="py-2 px-4 border-b text-gray-600">$1,234</td>
                                    <td className="py-2 px-4 border-b text-green-600 font-semibold">Completado</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-4 border-b text-gray-600">#1235</td>
                                    <td className="py-2 px-4 border-b text-gray-600">2023-10-02</td>
                                    <td className="py-2 px-4 border-b text-gray-600">$567</td>
                                    <td className="py-2 px-4 border-b text-yellow-600 font-semibold">Pendiente</td>
                                </tr>
                                <tr>
                                    <td className="py-2 px-4 border-b text-gray-600">#1236</td>
                                    <td className="py-2 px-4 border-b text-gray-600">2023-10-03</td>
                                    <td className="py-2 px-4 border-b text-gray-600">$890</td>
                                    <td className="py-2 px-4 border-b text-red-600 font-semibold">Cancelado</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Metricas;