// HistorialVentasPOS.jsx
import React, { useState } from 'react'; // 'useEffect' ya no es necesario
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

        const formattedDate = dayjs(order.createdAt).format('DD/MM/YYYY HH:mm');
        const total = order.finalPrice?.toLocaleString('es-CL') ?? '0';

        const message = encodeURIComponent(
            `Hola ${order.customer?.name || ''}, te escribimos para recordarte que tu pedido del ${formattedDate} por un total de $${total} aún no ha sido confirmado por transferencia.\nPor favor envíanos el comprobante. ¡Gracias! 🙌`
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
            title: 'Cliente',
            dataIndex: ['customer', 'name'],
        },
        {
            title: 'Teléfono',
            dataIndex: ['customer', 'phone'],
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
            title: 'Fecha',
            dataIndex: 'createdAt',
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Fecha de Entrega',
            dataIndex: 'deliveryDate',
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Transferencia Pagada',
            dataIndex: 'transferPay',
            render: (_, record) => {
                const isTransfer = record.paymentMethod === 'transferencia';
                return (
                    <Switch
                        checked={record.transferPay}
                        onChange={() => {
                            console.log('✅ Click en switch de:', record._id);
                            handleTransferToggle(record)
                        }}
                        loading={loadingRowId === record._id}
                        disabled={!isTransfer}
                    />
                );
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
                                <p><strong>Teléfono:</strong> {venta.customer?.phone || '—'}</p>
                                <p><strong>Total:</strong> ${venta.finalPrice?.toLocaleString('es-CL') ?? 0}</p>
                                <p>
                                    <strong>Método de pago:</strong>{' '}
                                    <span
                                        style={{
                                            backgroundColor: `${paymentMethodStyles[venta.paymentMethod]?.color || 'gray'}20`,
                                            color: paymentMethodStyles[venta.paymentMethod]?.color || 'gray',
                                            padding: '2px 8px',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        {paymentMethodStyles[venta.paymentMethod]?.label || venta.paymentMethod}
                                    </span>
                                </p>
                                <p><strong>Fecha:</strong> {dayjs(venta.createdAt).format('DD/MM/YYYY HH:mm')}</p>
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