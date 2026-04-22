import React, { useState, useMemo } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import {
    Table, Button, Card, Tag, Space, Input, DatePicker, Empty, Pagination, message, Modal, Segmented, Tooltip, Row, Col,
} from 'antd';
import {
    SearchOutlined,
    WhatsAppOutlined,
    CheckOutlined,
    DollarOutlined,
    TableOutlined,
    AppstoreOutlined,
    ClockCircleOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
} from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import useOrders from '../../hooks/useOrders';
import useStoreInfo from '../../hooks/useStoreInfo';
import Orders from '../../services/Orders.js';

const { Search } = Input;
const { RangePicker } = DatePicker;

const formatCLP = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

const Cobros = () => {
    const { user } = useAuth();
    const { data: storeInfoResp } = useStoreInfo();
    const transferMessageTemplate = storeInfoResp?.data?.transferWhatsappMessage || '';
    const isMobile = useMediaQuery({ maxWidth: 768 });

    const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchText, setSearchText] = useState('');
    const [dateRange, setDateRange] = useState([]);
    const [markingId, setMarkingId] = useState(null);

    const queryParams = useMemo(() => {
        const p = {
            page,
            limit,
            paymentMethod: 'transferencia',
            transferPay: false,
        };
        if (dateRange?.length === 2) {
            p.startDate = dayjs(dateRange[0]).startOf('day').toISOString();
            p.endDate = dayjs(dateRange[1]).endOf('day').toISOString();
        }
        return p;
    }, [page, limit, dateRange]);

    const { data: ordersResp, isLoading, refetch } = useOrders(queryParams);
    const orders = ordersResp?.data?.docs || [];
    const totalDocs = ordersResp?.data?.totalDocs || 0;

    // Filtro client-side por nombre/telefono/email
    const filteredOrders = useMemo(() => {
        if (!searchText) return orders;
        const q = searchText.toLowerCase();
        return orders.filter((o) =>
            o.customer?.name?.toLowerCase().includes(q) ||
            o.customer?.email?.toLowerCase().includes(q) ||
            String(o.customer?.phone || '').includes(q)
        );
    }, [orders, searchText]);

    // Días esperando desde createdAt
    const daysWaiting = (createdAt) => {
        if (!createdAt) return 0;
        return dayjs().diff(dayjs(createdAt), 'day');
    };

    const getWhatsappUrl = (order) => {
        const phone = order.customer?.phone?.replace(/[^0-9]/g, '');
        if (!phone || !transferMessageTemplate.trim()) return null;
        const formattedDate = dayjs(order.deliveryDate).format('DD/MM/YYYY');
        const total = formatCLP(order.finalPrice);
        const resolved = transferMessageTemplate
            .replaceAll('{{fecha}}', formattedDate)
            .replaceAll('{{monto}}', total);
        return `https://wa.me/56${phone}?text=${encodeURIComponent(resolved)}`;
    };

    const handleMarkAsPaid = (order) => {
        Modal.confirm({
            title: '¿Confirmar pago recibido?',
            content: (
                <div>
                    <p className="mb-1"><strong>{order.customer?.name}</strong></p>
                    <p className="mb-1">Monto: <strong>{formatCLP(order.finalPrice)}</strong></p>
                    <p className="text-sm text-gray-500 mt-2">Esta acción se puede revertir editando el pedido desde Historial de ventas.</p>
                </div>
            ),
            okText: 'Sí, marcar pagado',
            okType: 'primary',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    setMarkingId(order._id);
                    const response = await Orders.edit(order._id, { transferPay: true });
                    if (response?.success) {
                        message.success('Pedido marcado como pagado');
                        refetch();
                    } else {
                        message.warning(response?.message || 'No se pudo actualizar el pedido');
                    }
                } catch (err) {
                    message.error(err?.message || 'Error al marcar como pagado');
                } finally {
                    setMarkingId(null);
                }
            },
        });
    };

    const renderDaysBadge = (days) => {
        if (days > 7) return <Tag icon={<ClockCircleOutlined />} color="red">{days} días esperando</Tag>;
        if (days >= 3) return <Tag icon={<ClockCircleOutlined />} color="orange">{days} días</Tag>;
        return <Tag icon={<ClockCircleOutlined />} color="default">{days} {days === 1 ? 'día' : 'días'}</Tag>;
    };

    const renderActions = (order) => {
        const whatsappUrl = getWhatsappUrl(order);
        const missingTemplate = !transferMessageTemplate.trim();
        const whatsappBtn = (
            <Button
                type="primary"
                icon={<WhatsAppOutlined />}
                disabled={!whatsappUrl}
                onClick={() => whatsappUrl && window.open(whatsappUrl, '_blank')}
            >
                Cobrar
            </Button>
        );
        return (
            <Space>
                {missingTemplate ? (
                    <Tooltip title='Configura el mensaje en "Config. de pagos"'>
                        {whatsappBtn}
                    </Tooltip>
                ) : whatsappBtn}
                <Button
                    icon={<CheckOutlined />}
                    loading={markingId === order._id}
                    onClick={() => handleMarkAsPaid(order)}
                >
                    Marcar pagado
                </Button>
            </Space>
        );
    };

    const columns = [
        {
            title: 'Dirección',
            key: 'customer',
            render: (_, r) => (
                <div>
                    <div className="font-medium">{r.customer?.address || '—'}</div>
                    <div className="text-xs text-gray-500">{r.customer?.phone || 'Sin teléfono'}</div>
                </div>
            ),
        },
        {
            title: 'Fecha entrega',
            dataIndex: 'deliveryDate',
            key: 'deliveryDate',
            render: (d) => d ? dayjs(d).format('DD/MM/YYYY') : '—',
        },
        {
            title: 'Monto',
            dataIndex: 'finalPrice',
            key: 'finalPrice',
            render: (v) => <span className="font-semibold">{formatCLP(v)}</span>,
        },
        {
            title: 'Esperando',
            key: 'days',
            render: (_, r) => renderDaysBadge(daysWaiting(r.createdAt)),
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, r) => renderActions(r),
        },
    ];

    const renderCards = () => {
        if (filteredOrders.length === 0) {
            return <Empty description="No hay cobros pendientes" />;
        }
        return (
            <Row gutter={[16, 16]}>
                {filteredOrders.map((o) => {
                    const days = daysWaiting(o.createdAt);
                    return (
                        <Col key={o._id} xs={24} sm={24} md={12} lg={8}>
                            <Card bordered className="shadow-sm h-full" bodyStyle={{ padding: 20 }}>
                                <div className="flex justify-between items-start gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-800 flex items-start gap-2">
                                            <EnvironmentOutlined className="mt-1" />
                                            <span className="break-words">{o.customer?.address || '—'}</span>
                                        </div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <PhoneOutlined /> {o.customer?.phone || 'Sin teléfono'}
                                        </div>
                                    </div>
                                    {renderDaysBadge(days)}
                                </div>

                                <div className="text-sm text-gray-600 mb-1">
                                    Pedido del <strong>{o.deliveryDate ? dayjs(o.deliveryDate).format('DD/MM/YYYY') : '—'}</strong>
                                </div>
                                <div className="text-2xl font-bold text-blue-600 mb-4">
                                    {formatCLP(o.finalPrice)}
                                </div>

                                {renderActions(o)}
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        );
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-10 lg:px-10 pb-10 overflow-x-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                    <DollarOutlined />
                    Cobros pendientes
                </h1>
                <p className="text-gray-600 mb-6">
                    Pedidos con método de pago transferencia que aún no registran pago.
                </p>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                    <div className="flex flex-col md:flex-row gap-3 flex-1">
                        <Search
                            placeholder="Buscar por nombre, email o teléfono"
                            allowClear
                            enterButton={<SearchOutlined />}
                            onSearch={setSearchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            className="md:max-w-sm"
                        />
                        <RangePicker
                            format="DD/MM/YYYY"
                            value={dateRange?.length === 2 ? dateRange : null}
                            onChange={(vals) => setDateRange(vals || [])}
                            placeholder={['Desde', 'Hasta']}
                        />
                    </div>

                    {!isMobile && (
                        <Segmented
                            value={viewMode}
                            onChange={setViewMode}
                            options={[
                                { label: 'Tabla', value: 'table', icon: <TableOutlined /> },
                                { label: 'Cards', value: 'cards', icon: <AppstoreOutlined /> },
                            ]}
                        />
                    )}
                </div>

                {isMobile || viewMode === 'cards' ? (
                    <>
                        {isLoading ? (
                            <div className="py-8 text-center text-gray-500">Cargando…</div>
                        ) : renderCards()}
                        {totalDocs > limit && (
                            <div className="mt-6 flex justify-center">
                                <Pagination
                                    current={page}
                                    total={totalDocs}
                                    pageSize={limit}
                                    showSizeChanger
                                    onChange={(p, s) => { setPage(p); setLimit(s); }}
                                />
                            </div>
                        )}
                    </>
                ) : (
                    <Table
                        dataSource={filteredOrders}
                        columns={columns}
                        rowKey="_id"
                        loading={isLoading}
                        pagination={{
                            current: page,
                            pageSize: limit,
                            total: totalDocs,
                            showSizeChanger: true,
                            onChange: (p, s) => { setPage(p); setLimit(s); },
                            position: ['bottomCenter'],
                        }}
                        bordered
                        locale={{ emptyText: <Empty description="No hay cobros pendientes" /> }}
                    />
                )}
            </div>
        </div>
    );
};

export default Cobros;
