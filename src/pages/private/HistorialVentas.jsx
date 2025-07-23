// HistorialVentasPOS.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import {
    Table, Button, Space, Input, DatePicker, Card, Tag
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';
import useOrders from '../../hooks/useOrders';

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
    const [dateSearchTriggered, setDateSearchTriggered] = useState(false);

    const [queryParams, setQueryParams] = useState({
        storeId: user.storeId,
        origin: 'pos',
        deliveryType: 'mostrador',
        startDate: null,
        endDate: null
    });

    useEffect(() => {
        if (dateSearchTriggered && dateRange.length === 2) {
            setQueryParams(prev => ({
                ...prev,
                startDate: dayjs(dateRange[0]).startOf('day').toISOString(),
                endDate: dayjs(dateRange[1]).endOf('day').toISOString(),
            }));
        }
    }, [dateSearchTriggered, dateRange]);

    const { data, isLoading, refetch } = useOrders(queryParams);
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
                        onChange={(range) => {
                            setDateRange(range || []);
                            setDateSearchTriggered(false);
                        }}
                    />
                    <Button
                        type="primary"
                        onClick={() => {
                            setDateSearchTriggered(true);
                            refetch();
                        }}
                        disabled={dateRange.length !== 2}
                    >
                        Buscar por Fecha
                    </Button>
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
