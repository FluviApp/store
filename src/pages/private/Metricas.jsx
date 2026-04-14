import React, { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Select, Spin, Typography, Table, Tag, Divider } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, UserOutlined, TrophyOutlined, LineChartOutlined, PieChartOutlined, BarChartOutlined } from '@ant-design/icons';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title as ChartTitle,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import useMetrics from '../../hooks/useMetrics.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Sidebar from '../../components/Sidebar.jsx';

// Registrar componentes de Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ChartTitle,
    Tooltip,
    Legend,
    ArcElement
);

const { Title, Text } = Typography;
const { Option } = Select;

/** Etiquetas según bucket del backend: YYYY-MM-DD, YYYY-MM o año-semana ISO (p. ej. 2026-W03). */
function formatChartBucketLabel(raw) {
    if (raw == null || raw === '') return 'Sin fecha';
    const s = String(raw).trim();

    if (/^\d{4}-W\d{1,2}$/i.test(s)) {
        const [, y, w] = s.match(/^(\d{4})-W(\d{1,2})$/i);
        return `Sem. ${Number(w)} · ${y}`;
    }

    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (ymd) {
        const date = new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
        return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    const ym = /^(\d{4})-(\d{2})$/.exec(s);
    if (ym) {
        const y = Number(ym[1]);
        const mo = Number(ym[2]);
        if (mo >= 1 && mo <= 12) {
            return new Date(y, mo - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
        }
    }

    return s;
}

const Metricas = () => {
    const { user } = useAuth();

    const [selectedPeriod, setSelectedPeriod] = useState('30d');

    const {
        useDashboardMetrics,
        useSalesTrend,
        useLocalSalesTrend,
        usePaymentMethodMetrics,
        useOrdersByDay,
        useGeneralMetrics
    } = useMetrics;

    const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useDashboardMetrics(selectedPeriod);
    const { data: trendData, isLoading: trendLoading } = useSalesTrend(selectedPeriod);
    const { data: localSalesData, isLoading: localSalesLoading } = useLocalSalesTrend(selectedPeriod);
    const { data: paymentData, isLoading: paymentLoading } = usePaymentMethodMetrics(selectedPeriod);
    const { data: ordersByDayData, isLoading: ordersByDayLoading } = useOrdersByDay(selectedPeriod);
    const { data: generalData, isLoading: generalLoading } = useGeneralMetrics();

    // Configuración del gráfico de tendencia de ventas
    const salesTrendConfig = useMemo(() => {
        if (!trendData?.data) return null;

        const labels = trendData.data.map(item => formatChartBucketLabel(item.period));

        const salesData = trendData.data.map(item => item.totalSales);

        return {
            labels,
            datasets: [
                {
                    label: 'Ventas ($)',
                    data: salesData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true,
                }
            ]
        };
    }, [trendData]);

    // Configuración del gráfico de ventas en local
    const localSalesConfig = useMemo(() => {
        if (!localSalesData?.data) return null;

        const labels = localSalesData.data.map(item => formatChartBucketLabel(item.period));

        const salesData = localSalesData.data.map(item => item.totalSales);

        return {
            labels,
            datasets: [
                {
                    label: 'Ventas en Local ($)',
                    data: salesData,
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    tension: 0.4,
                    fill: true,
                }
            ]
        };
    }, [localSalesData]);

    // Configuración del gráfico de métodos de pago
    const paymentMethodConfig = useMemo(() => {
        if (!paymentData?.data) return null;

        const labels = paymentData.data.map(item =>
            item.paymentMethod.charAt(0).toUpperCase() + item.paymentMethod.slice(1)
        );

        const data = paymentData.data.map(item => item.totalSales);
        const backgroundColors = [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
        ];

        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: backgroundColors.slice(0, data.length),
                    borderColor: backgroundColors.slice(0, data.length).map(color =>
                        color.replace('0.8', '1')
                    ),
                    borderWidth: 2,
                }
            ]
        };
    }, [paymentData]);

    // Configuración del gráfico de pedidos por día
    const ordersByDayConfig = useMemo(() => {
        if (!ordersByDayData?.data) return null;

        const labels = ordersByDayData.data.map(item =>
            formatChartBucketLabel(item.period ?? item.date)
        );

        const ordersData = ordersByDayData.data.map(item => item.orderCount);

        return {
            labels,
            datasets: [
                {
                    label: 'Pedidos',
                    data: ordersData,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                }
            ]
        };
    }, [ordersByDayData]);

    // Configuración de columnas para las tablas
    const productColumns = [
        {
            title: 'Producto',
            dataIndex: 'productName',
            key: 'productName',
        },
        {
            title: 'Cantidad Vendida',
            dataIndex: 'totalQuantity',
            key: 'totalQuantity',
        },
        {
            title: 'Ingresos',
            dataIndex: 'totalRevenue',
            key: 'totalRevenue',
            render: (value) => `$${value.toLocaleString('es-CL')}`,
        },
    ];

    const customerColumns = [
        {
            title: 'Cliente',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: 'Dirección',
            dataIndex: 'customerAddress',
            key: 'customerAddress',
        },
        {
            title: 'Total Gastado',
            dataIndex: 'totalSpent',
            key: 'totalSpent',
            render: (value) => `$${value.toLocaleString('es-CL')}`,
        },
        {
            title: 'Pedidos',
            dataIndex: 'orderCount',
            key: 'orderCount',
        },
    ];

    const newCustomersColumns = [
        {
            title: 'Cliente',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: 'Dirección',
            dataIndex: 'customerAddress',
            key: 'customerAddress',
        },
        {
            title: 'Total Gastado',
            dataIndex: 'totalSpent',
            key: 'totalSpent',
            render: (value) => `$${value.toLocaleString('es-CL')}`,
        },
        {
            title: 'Primer Pedido',
            dataIndex: 'firstOrderDate',
            key: 'firstOrderDate',
            render: (value) => new Date(value).toLocaleDateString('es-ES'),
        },
    ];

    const statusColumns = [
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (value) => {
                const statusMap = {
                    'entregado': { text: 'Entregado', color: 'green' },
                    'pendiente': { text: 'Pendiente', color: 'orange' },
                    'cancelado': { text: 'Cancelado', color: 'red' },
                    'devuelto': { text: 'Devuelto', color: 'red' },
                    'en_proceso': { text: 'En Proceso', color: 'blue' }
                };
                const status = statusMap[value] || { text: value, color: 'default' };
                return <Tag color={status.color}>{status.text}</Tag>;
            },
        },
        {
            title: 'Cantidad',
            dataIndex: 'count',
            key: 'count',
        },
        {
            title: 'Valor Total',
            dataIndex: 'totalValue',
            key: 'totalValue',
            render: (value) => `$${value.toLocaleString('es-CL')}`,
        },
    ];

    const ordersChartTitle =
        selectedPeriod === 'current_year' || selectedPeriod === '1y'
            ? 'Pedidos por mes'
            : selectedPeriod === '90d'
              ? 'Pedidos por semana'
              : 'Pedidos por día';

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <Title level={2} className="!mb-2">Métricas de Ventas</Title>
                        <Text type="secondary">Análisis completo del rendimiento de tu tienda</Text>
                    </div>
                    <div className="flex items-center gap-2">
                        <Text strong>Período:</Text>
                        <Select
                            value={selectedPeriod}
                            onChange={setSelectedPeriod}
                            style={{ width: 260 }}
                            size="large"
                        >
                            <Option value="today">Día — Hoy</Option>
                            <Option value="current_week">Semana actual</Option>
                            <Option value="current_month">Mes actual</Option>
                            <Option value="current_year">Año actual</Option>
                            <Option value="7d">Últimos 7 días</Option>
                            <Option value="30d">Últimos 30 días</Option>
                            <Option value="90d">Últimos 90 días (por semana)</Option>
                            <Option value="1y">Último año (por mes)</Option>
                        </Select>
                    </div>
                </div>

                {/* Tarjetas de Resumen */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Ventas Totales"
                                value={dashboardData?.data?.summary?.totalSales || 0}
                                prefix={<DollarOutlined />}
                                formatter={(value) => `$${value.toLocaleString('es-CL')}`}
                                loading={dashboardLoading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Pedidos Completados"
                                value={dashboardData?.data?.summary?.totalOrders || 0}
                                prefix={<ShoppingCartOutlined />}
                                loading={dashboardLoading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Clientes Únicos"
                                value={dashboardData?.data?.summary?.totalCustomers || 0}
                                prefix={<UserOutlined />}
                                loading={dashboardLoading}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card>
                            <Statistic
                                title="Valor Promedio"
                                value={dashboardData?.data?.summary?.avgOrderValue || 0}
                                prefix={<TrophyOutlined />}
                                formatter={(value) => `$${value.toLocaleString('es-CL')}`}
                                loading={dashboardLoading}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Gráficos */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24} lg={16}>
                        <Card title="Tendencia de Ventas" extra={<LineChartOutlined />}>
                            {salesTrendConfig ? (
                                <Line
                                    data={salesTrendConfig}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            },
                                            title: {
                                                display: false,
                                            },
                                        },
                                        scales: {
                                            x: {
                                                ticks: {
                                                    maxRotation: 45,
                                                    minRotation: 0,
                                                    autoSkip: true,
                                                },
                                            },
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: function (value) {
                                                        return '$' + value.toLocaleString('es-CL');
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {trendLoading ? <Spin size="large" /> : <Text type="secondary">No hay datos disponibles</Text>}
                                </div>
                            )}
                        </Card>
                    </Col>
                    <Col xs={24} lg={8}>
                        <Card title="Métodos de Pago" extra={<PieChartOutlined />}>
                            {paymentMethodConfig ? (
                                <Doughnut
                                    data={paymentMethodConfig}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'bottom',
                                            },
                                        }
                                    }}
                                />
                            ) : (
                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {paymentLoading ? <Spin size="large" /> : <Text type="secondary">No hay datos disponibles</Text>}
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* Gráfico de Ventas en Local */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24}>
                        <Card title="Ventas en Local" extra={<LineChartOutlined />}>
                            {localSalesConfig ? (
                                <Line
                                    data={localSalesConfig}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            },
                                            title: {
                                                display: false,
                                            },
                                        },
                                        scales: {
                                            x: {
                                                ticks: {
                                                    maxRotation: 45,
                                                    minRotation: 0,
                                                    autoSkip: true,
                                                },
                                            },
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    callback: function (value) {
                                                        return '$' + value.toLocaleString('es-CL');
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {localSalesLoading ? <Spin size="large" /> : <Text type="secondary">No hay datos disponibles</Text>}
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>

                {/* Gráfico de Pedidos por Día */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24}>
                        <Card title={ordersChartTitle} extra={<BarChartOutlined />}>
                            {ordersByDayConfig ? (
                                <Bar
                                    data={ordersByDayConfig}
                                    options={{
                                        responsive: true,
                                        plugins: {
                                            legend: {
                                                position: 'top',
                                            },
                                        },
                                        scales: {
                                            x: {
                                                ticks: {
                                                    maxRotation: 45,
                                                    minRotation: 0,
                                                    autoSkip: true,
                                                },
                                            },
                                            y: {
                                                beginAtZero: true,
                                                ticks: {
                                                    stepSize: 1
                                                }
                                            }
                                        }
                                    }}
                                />
                            ) : (
                                <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {ordersByDayLoading ? <Spin size="large" /> : <Text type="secondary">No hay datos disponibles</Text>}
                                </div>
                            )}
                        </Card>
                    </Col>
                </Row>


                {/* MÉTRICAS GENERALES - No cambian con filtros de fecha */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24}>
                        <Title level={4} className="!mb-4">
                            🏆 Métricas Generales del Sistema
                        </Title>
                        <Text type="secondary" className="mb-4 block">
                            Estas métricas muestran datos históricos generales sin filtros de fecha
                        </Text>
                    </Col>
                </Row>

                {/* Productos más vendidos históricos */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24} lg={12}>
                        <Card title="Productos Más Vendidos (Histórico)" extra={<TrophyOutlined />}>
                            <Table
                                columns={productColumns}
                                dataSource={generalData?.data?.topProducts || []}
                                loading={generalLoading}
                                pagination={{ pageSize: 5 }}
                                size="small"
                                rowKey="productId"
                            />
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card title="Mejores Clientes (Histórico)" extra={<UserOutlined />}>
                            <Table
                                columns={customerColumns}
                                dataSource={generalData?.data?.customerMetrics?.topCustomers || []}
                                loading={generalLoading}
                                pagination={{ pageSize: 5 }}
                                size="small"
                                rowKey="customerId"
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Clientes nuevos del mes actual */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24}>
                        <Card title="Clientes Nuevos Este Mes" extra={<UserOutlined />}>
                            <Table
                                columns={newCustomersColumns}
                                dataSource={generalData?.data?.customerMetrics?.newCustomersThisMonth || []}
                                loading={generalLoading}
                                pagination={{ pageSize: 10 }}
                                size="small"
                                rowKey="customerId"
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Distribución de estados general */}
                <Row gutter={[16, 16]} className="mb-6">
                    <Col xs={24} lg={12}>
                        <Card title="Distribución de Estados (General)" extra={<BarChartOutlined />}>
                            <Table
                                columns={statusColumns}
                                dataSource={generalData?.data?.ordersByStatus || []}
                                loading={generalLoading}
                                pagination={false}
                                size="small"
                                rowKey="status"
                            />
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card title="Resumen de Clientes (General)">
                            <div className="space-y-3">
                                <div>
                                    <Text type="secondary">Total de clientes históricos:</Text>
                                    <br />
                                    <Text strong className="text-lg">
                                        {generalData?.data?.customerMetrics?.summary?.totalCustomers || 0}
                                    </Text>
                                </div>
                                <Divider />
                                <div>
                                    <Text type="secondary">Clientes nuevos:</Text>
                                    <br />
                                    <Text strong className="text-lg">
                                        {generalData?.data?.customerMetrics?.summary?.newCustomers || 0}
                                    </Text>
                                </div>
                                <Divider />
                                <div>
                                    <Text type="secondary">Clientes recurrentes:</Text>
                                    <br />
                                    <Text strong className="text-lg">
                                        {generalData?.data?.customerMetrics?.summary?.recurringCustomers || 0}
                                    </Text>
                                </div>
                                <Divider />
                                <div>
                                    <Text type="secondary">Valor promedio por cliente:</Text>
                                    <br />
                                    <Text strong className="text-lg">
                                        ${generalData?.data?.customerMetrics?.summary?.avgCustomerValue?.toLocaleString() || 0}
                                    </Text>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>

            </div>
        </div>
    );
};

export default Metricas;
