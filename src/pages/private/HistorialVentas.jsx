import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import {
    Table, Button, Space, Input, DatePicker, Card, Tag, Switch
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';
import useOrders from '../../hooks/useOrders';
import Orders from '../../services/Orders.js';

const { Search } = Input;

const paymentMethodStyles = {
    efectivo: { label: 'Efectivo', color: 'green' },
    transferencia: { label: 'Transferencia', color: 'blue' },
    webpay: { label: 'WebPay', color: 'purple' },
    mercadopago: { label: 'MercadoPago', color: 'cyan' },
    tarjeta_local: { label: 'Tarjeta Local', color: 'orange' },
    otro: { label: 'Otro', color: 'gray' },
};

const HistorialVentas = () => {
    const { user } = useAuth();
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const [searchText, setSearchText] = useState('');
    const [dateRange, setDateRange] = useState([]);
    const [loadingRowId, setLoadingRowId] = useState(null);

    const [queryParams, setQueryParams] = useState({
        storeId: user.storeId,
        startDate: null,
        endDate: null,
        status: null,
        transferPay: undefined,
    });

    const handleTransferToggle = async (order) => {
        console.log('🧪 Toggle transferPay para:', order._id);

        setLoadingRowId(order._id);
        try {
            const updated = await Orders.edit(order._id, {
                transferPay: !order.transferPay,
                status: order.status,
                paymentMethod: order.paymentMethod
            });
            console.log('✅ Pedido actualizado:', updated.data);
            refetch();
        } catch (err) {
            console.error('❌ Error al actualizar:', err.response?.data || err.message);
        } finally {
            setLoadingRowId(null);
        }
    };

    const getWhatsappUrl = (order) => {
        const isTransfer = order.paymentMethod === 'transferencia';
        const notPaid = order.transferPay === false;
        const phone = order.customer?.phone?.replace(/[^0-9]/g, '');

        if (!isTransfer || !notPaid || !phone) return null;

        // Use the delivery date for the message, as requested
        const formattedDate = dayjs(order.deliveryDate).format('DD/MM/YYYY');
        const total = order.finalPrice?.toLocaleString('es-CL') ?? '0';

        const message = encodeURIComponent(
            `Holaaaaa! Espero estés súper! Te hablo de Fluvi para enviarte los datos de transferencia para el pago del pedido del ${formattedDate} por un monto de $${total} 😊💦💧.\n\n` +
            `Si ya efectuaste el pago te agradeceríamos nos enviaras el comprobante! Que tengas un excelente día 🙌\n\n` +
            `Cesar Barahona\n` +
            `18.125.988-4\n` +
            `Banco de Chile\n` +
            `Cuenta Vista\n` +
            `00-012-55212-17\n` +
            `cesarabel44@gmail.com`
        );

        return `https://wa.me/56${phone}?text=${message}`;
    };

    const handleDateSearch = () => {
        if (dateRange.length === 2) {
            setQueryParams(prev => ({
                ...prev,
                startDate: dayjs(dateRange[0]).startOf('day').toISOString(),
                endDate: dayjs(dateRange[1]).endOf('day').toISOString(),
            }));
            refetch();
        }
    };

    const { data, isLoading, refetch } = useOrders(queryParams);
    console.log(data)
    const ventas = data?.data?.docs || [];
    const pageSize = 10;

    const filteredVentas = searchText
        ? ventas.filter(p => p.customer?.name?.toLowerCase().includes(searchText.toLowerCase()))
        : ventas;

    const columns = [
        {
            title: 'Teléfono',
            dataIndex: ['customer', 'phone'],
        },
        {
            title: 'Dirección',
            dataIndex: ['customer', 'address'],
        },
        {
            title: 'Total',
            dataIndex: 'finalPrice',
            render: (price) => `$${price?.toLocaleString('es-CL') ?? 0}`,
        },
        {
            title: 'Método de Pago',
            dataIndex: 'paymentMethod',
            render: (method) => {
                const { label, color } = paymentMethodStyles[method] || { label: method, color: 'default' };
                return <span style={{ backgroundColor: `${color}20`, color, padding: '2px 8px', borderRadius: '8px' }}>{label}</span>;
            },
        },
        {
            title: 'Fecha de Venta',
            dataIndex: 'createdAt',
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Fecha de Entrega',
            dataIndex: 'deliveryDate',
            render: (date, record) => {
                const deliveryTime = record.deliverySchedule?.hour;
                return deliveryTime ? `${dayjs(date).format('DD/MM/YYYY')} ${deliveryTime}` : dayjs(date).format('DD/MM/YYYY HH:mm');
            },
        },
        // --- New Status Column ---
        {
            title: 'Estado',
            dataIndex: 'status',
            render: (status) => {
                let color = 'gray';
                if (status === 'entregado') {
                    color = 'green';
                } else if (status === 'pendiente') {
                    color = 'volcano';
                }
                return (
                    <Tag color={color}>
                        {status?.toUpperCase()}
                    </Tag>
                );
            },
        },
        // --- End of New Column ---
        {
            title: 'Transferencia Pagada',
            dataIndex: 'transferPay',
            render: (_, record) => {
                if (record.paymentMethod === 'transferencia') {
                    const isDelivered = record.status === 'entregado';
                    const isTransferPaidAndDelivered = record.transferPay && isDelivered;

                    return (
                        <Switch
                            checked={isTransferPaidAndDelivered}
                            onChange={() => {
                                console.log('✅ Click en switch de:', record._id);
                                handleTransferToggle(record);
                            }}
                            loading={loadingRowId === record._id}
                            disabled={!isDelivered}
                        />
                    );
                }
                return null;
            },
        },
        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => {
                const whatsappUrl = getWhatsappUrl(record);
                if (!whatsappUrl) return null;

                return (
                    <Button
                        type="default"
                        onClick={() => window.open(whatsappUrl, '_blank')}
                    >
                        Cobrar por WhatsApp
                    </Button>
                );
            }
        }
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Historial Ventas POS</h1>
                </div>

                <div className="mb-6 flex flex-wrap gap-4 items-center">
                    <DatePicker.RangePicker
                        format="YYYY-MM-DD"
                        onChange={(range) => setDateRange(range || [])}
                        value={dateRange}
                    />
                    <Button
                        type="primary"
                        onClick={handleDateSearch}
                        disabled={dateRange.length !== 2}
                    >
                        Buscar por Fecha
                    </Button>
                </div>

                <div className="flex flex-wrap gap-4 mb-6">
                    <Button onClick={() => {
                        setQueryParams(prev => ({
                            ...prev,
                            status: 'entregado',
                            transferPay: undefined,
                        }));
                        refetch();
                    }}>
                        Ver Entregados
                    </Button>

                    <Button onClick={() => {
                        setQueryParams(prev => ({
                            ...prev,
                            status: 'pendiente',
                            transferPay: undefined,
                        }));
                        refetch();
                    }}>
                        Ver Pendientes
                    </Button>

                    <Button onClick={() => {
                        setQueryParams(prev => ({
                            ...prev,
                            status: 'entregado',
                            transferPay: false,
                        }));
                        refetch();
                    }}>
                        No Pagados Transferencia
                    </Button>

                    <Button onClick={() => {
                        // Limpia filtros y vuelve a traer todo
                        setQueryParams({
                            storeId: user.storeId,
                            startDate: null,
                            endDate: null,
                            status: null,
                            transferPay: undefined,
                        });
                        setDateRange([]);
                        refetch();
                    }}>
                        Limpiar Filtros
                    </Button>
                </div>

                <div className="mb-4 flex flex-wrap gap-2 items-center">
                    {queryParams.status && (
                        <Tag color="blue">Estado: {queryParams.status}</Tag>
                    )}
                    {queryParams.transferPay === false && (
                        <Tag color="red">Transferencia no pagada</Tag>
                    )}
                    {dateRange.length === 2 && (
                        <Tag color="purple">
                            Rango: {dayjs(dateRange[0]).format('DD/MM')} - {dayjs(dateRange[1]).format('DD/MM')}
                        </Tag>
                    )}
                </div>

                <Search
                    placeholder="Buscar cliente"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={setSearchText}
                    className="mb-6"
                />

                {isMobile ? (
                    <div className="grid gap-4">
                        {filteredVentas.map(venta => (
                            <Card key={venta._id} title={venta.customer?.name || 'Sin nombre'}>
                                <div className="space-y-2">
                                    <p>
                                        <strong>Teléfono:</strong> {venta.customer?.phone || '—'}
                                    </p>
                                    <p>
                                        <strong>Dirección:</strong> {venta.customer?.address || '—'}
                                    </p>
                                    <p>
                                        <strong>Total:</strong> ${venta.finalPrice?.toLocaleString('es-CL') ?? 0}
                                    </p>
                                    <p>
                                        <strong>Método de pago:</strong>{' '}
                                        {(() => {
                                            const { label, color } = paymentMethodStyles[venta.paymentMethod] || { label: venta.paymentMethod, color: 'gray' };
                                            return (
                                                <span
                                                    style={{
                                                        backgroundColor: `${color}20`,
                                                        color,
                                                        padding: '2px 8px',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    {label}
                                                </span>
                                            );
                                        })()}
                                    </p>
                                    {/* --- New Status Field for Mobile --- */}
                                    <p>
                                        <strong>Estado:</strong>{' '}
                                        {(() => {
                                            let color = 'gray';
                                            if (venta.status === 'entregado') {
                                                color = 'green';
                                            } else if (venta.status === 'pendiente') {
                                                color = 'volcano';
                                            }
                                            return (
                                                <Tag color={color}>
                                                    {venta.status?.toUpperCase()}
                                                </Tag>
                                            );
                                        })()}
                                    </p>
                                    {/* --- End of New Field --- */}
                                    <p>
                                        <strong>Fecha de Venta:</strong> {dayjs(venta.createdAt).format('DD/MM/YYYY HH:mm')}
                                    </p>
                                    <p>
                                        <strong>Fecha de Entrega:</strong>{' '}
                                        {venta.deliverySchedule?.hour
                                            ? `${dayjs(venta.deliveryDate).format('DD/MM/YYYY')} ${venta.deliverySchedule.hour}`
                                            : dayjs(venta.deliveryDate).format('DD/MM/YYYY HH:mm')}
                                    </p>

                                    {/* Transferencia Pagada logic */}
                                    {venta.paymentMethod === 'transferencia' && (
                                        <div className="flex items-center space-x-2">
                                            <strong>Transferencia Pagada:</strong>
                                            <Switch
                                                checked={venta.transferPay && venta.status === 'entregado'}
                                                onChange={() => handleTransferToggle(venta)}
                                                loading={loadingRowId === venta._id}
                                                disabled={venta.status !== 'entregado'}
                                            />
                                        </div>
                                    )}

                                    {/* Acciones button logic */}
                                    {getWhatsappUrl(venta) && (
                                        <Button
                                            type="default"
                                            onClick={() => window.open(getWhatsappUrl(venta), '_blank')}
                                            className="mt-2"
                                        >
                                            Cobrar por WhatsApp
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Table
                        dataSource={filteredVentas}
                        columns={columns}
                        rowKey="_id"
                        loading={isLoading}
                        pagination={{ pageSize }}
                        bordered
                    />
                )}
            </div>
        </div>
    );
};

export default HistorialVentas;