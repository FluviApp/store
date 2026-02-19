import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import {
    Table, Button, Modal, Space, Input, DatePicker, Card, Tag, Switch, Form, Select, Radio, Row, Col, message
} from 'antd';
import { SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';
import useOrders from '../../hooks/useOrders';
import Orders from '../../services/Orders.js';
import ClientMap from '../../components/ClientMap.jsx';
import useClients from '../../hooks/useClients.js';
import useProductsForSelect from '../../hooks/useProductsForSelect.js';
import useAllDealers from '../../hooks/useAllDealers.js';
import { Autocomplete } from '@react-google-maps/api';

const { Search } = Input;

const paymentMethodStyles = {
    efectivo: { label: 'Efectivo', color: 'green' },
    transferencia: { label: 'Transferencia', color: 'blue' },
    webpay: { label: 'WebPay', color: 'purple' },
    mercadopago: { label: 'MercadoPago', color: 'cyan' },
    tarjeta: { label: 'Tarjeta', color: 'orange' },
    tarjeta_local: { label: 'Tarjeta Local', color: 'orange' },
    otro: { label: 'Otro', color: 'gray' },
};

const statusColorMap = {
    pendiente: 'orange',
    confirmado: 'blue',
    preparando: 'cyan',
    en_camino: 'geekblue',
    entregado: 'green',
    retrasado: 'gold',
    devuelto: 'magenta',
    cancelado: 'red',
};


const HistorialVentas = () => {
    const { user } = useAuth();
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const [searchText, setSearchText] = useState('');
    const [dateRange, setDateRange] = useState([]);
    const [loadingRowId, setLoadingRowId] = useState(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
    const [newStatus, setNewStatus] = useState(null);

    const [queryParams, setQueryParams] = useState({
        storeId: user.storeId,
        startDate: null,
        endDate: null,
        status: null,
        transferPay: undefined,
        deliveryType: undefined,
        page: 1,
        limit: 10,
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
                page: 1,
            }));
            setPage(1);
            refetch();
        }
    };



    const { data, isLoading, refetch } = useOrders({ ...queryParams, page, limit });
    console.log('🔍 QueryParams enviados:', queryParams);
    console.log('🔍 Data recibida:', data);
    console.log('🔍 Ventas encontradas:', data?.data?.docs?.length || 0);
    console.log('🔍 Ventas con deliveryType local:', data?.data?.docs?.filter(v => v.deliveryType === 'local').length || 0);
    const ventas = data?.data?.docs || [];
    const total = data?.data?.totalDocs ?? data?.data?.total ?? 0;

    const filteredVentas = searchText
        ? ventas.filter(p => {
            // Si es pedido local, incluirlo siempre (no tiene cliente)
            if (p.deliveryType === 'local') return true;
            // Para otros pedidos, filtrar por teléfono o dirección
            const searchLower = searchText.toLowerCase();
            return p.customer?.phone?.toLowerCase().includes(searchLower) ||
                p.customer?.address?.toLowerCase().includes(searchLower);
        })
        : ventas;


    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingOrder, setEditingOrder] = useState(null);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [autocompleteRef, setAutocompleteRef] = useState(null);

    const { data: clientsData, isLoading: isClientsLoading } = useClients({ page: 1, limit: 900 });
    const clients = clientsData?.data?.docs || [];

    const { data: productDataForSelect, isLoading: isLoadingProductsForSelect } =
        useProductsForSelect({ storeId: user.storeId, search: productSearchTerm });
    const products = productDataForSelect?.data || [];

    const { data: dealersData, isLoading: isLoadingDealers } = useAllDealers();
    const dealers = dealersData?.data || [];

    // Helpers
    const reversePaymentMethodMap = {
        efectivo: 'efectivo',
        transferencia: 'transferencia',
        webpay: 'webpay',
        mercadopago: 'mercadopago',
        tarjeta_local: 'tarjeta',
        otro: 'otro',
    };
    const reverseDeliveryTypeMap = { domicilio: 'delivery', local: 'local' };

    const paymentMethodMap = {
        efectivo: 'efectivo',
        transferencia: 'transferencia',
        webpay: 'webpay',
        mercadopago: 'mercadopago',
        tarjeta: 'tarjeta',
        otro: 'otro',
    };
    const deliveryTypeMap = { delivery: 'domicilio', local: 'local' };

    const hourBlocks = React.useMemo(() =>
        Array.from({ length: 24 }, (_, i) => {
            const h = i % 12 === 0 ? 12 : i % 12;
            const period = i < 12 ? 'AM' : 'PM';
            return `${h.toString().padStart(2, '0')}:00 ${period}`;
        }), []
    );

    const dayTranslations = {
        monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
        thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
    };

    const openStatusModal = (order) => {
        setSelectedOrderForStatus(order);
        setNewStatus(order.status);
        setIsStatusModalVisible(true);
    };
    const handleEditarVenta = (pedido) => {
        const cliente = pedido.customer || {};
        setSelectedCustomer({
            id: cliente.id,
            name: cliente.name,
            email: cliente.email,
            phone: cliente.phone,
            address: cliente.address,
            lat: cliente.lat,
            lon: cliente.lon,
            observations: cliente.observations || '',
            notificationToken: cliente.notificationToken || '',
            block: cliente.block ?? cliente.deptoblock ?? '',
        });


        setSelectedProducts(pedido.products || []);

        form.setFieldsValue({
            paymentMethod: reversePaymentMethodMap[pedido.paymentMethod] || 'efectivo',
            deliveryType: reverseDeliveryTypeMap[pedido.deliveryType] || 'pickup',
            deliveryDay: dayjs(pedido.deliveryDate),
            deliveryHour: pedido.deliverySchedule?.hour || null,
            shippingCost: Math.max(0, (pedido.finalPrice || 0) - (pedido.price || 0)),
            merchantObservation: pedido.merchantObservation || '',
            dealerId: pedido.deliveryPerson?.id || null,
        });

        setEditingOrder(pedido);
        setIsModalVisible(true);
    };

    const handleEliminar = (id) => {
        Modal.confirm({
            title: '¿Eliminar pedido?',
            content: 'Esta acción no se puede deshacer.',
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            async onOk() {
                try {
                    const res = await Orders.delete(id); // mismo service que en Pedidos
                    if (res.success) {
                        message.success('Pedido eliminado correctamente');
                        refetch();
                    } else {
                        message.error(res.message || 'No se pudo eliminar el pedido');
                    }
                } catch (err) {
                    console.error('❌ Error al eliminar pedido:', err);
                    message.error('Ocurrió un error al intentar eliminar el pedido');
                }
            },
        });
    };


    const handlePlaceChanged = () => {
        if (autocompleteRef) {
            const place = autocompleteRef.getPlace();
            if (place?.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setSelectedCustomer(prev => ({
                    ...prev,
                    address: place.formatted_address,
                    lat,
                    lon: lng,
                    // ✅ preservar block si ya existía
                    block: prev?.block ?? prev?.deptoblock ?? '',
                }));
            }
        }
    };


    const handleAddProduct = (product) => {
        const exists = selectedProducts.find(p => p.productId === product._id);
        if (!exists) {
            const unitPrice = (product.priceDiscount && product.priceDiscount > 0)
                ? product.priceDiscount
                : (product.priceBase ?? 0);
            setSelectedProducts(prev => [...prev, {
                productId: product._id, name: product.name, unitPrice,
                quantity: 1, totalPrice: unitPrice, notes: '',
            }]);
        }
    };

    const handleChangeQuantity = (productId, delta) => {
        setSelectedProducts(prev => prev.map(p =>
            p.productId === productId
                ? { ...p, quantity: Math.max(1, p.quantity + delta), totalPrice: p.unitPrice * Math.max(1, p.quantity + delta) }
                : p
        ));
    };

    const handleRemoveProduct = (productId) => {
        setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (!selectedCustomer) return message.error('Debes seleccionar un cliente');
            if (selectedProducts.length === 0) return message.error('Debes agregar al menos un producto');

            const prods = selectedProducts.map(p => ({
                productId: p.productId, name: p.name, unitPrice: p.unitPrice,
                quantity: p.quantity, totalPrice: p.totalPrice, notes: p.notes || '',
            }));
            const totalProducts = prods.reduce((acc, p) => acc + p.totalPrice, 0);
            const shipping = Number(values.shippingCost || 0);
            const finalPrice = totalProducts + shipping;

            const payload = {
                storeId: user.storeId,
                commerceId: editingOrder?.commerceId || user.commerceId || 'default_commerce_id',
                origin: editingOrder?.origin || 'admin',
                paymentMethod: paymentMethodMap[values.paymentMethod] || 'efectivo',
                deliveryType: deliveryTypeMap[values.deliveryType] || 'retiro',
                status: editingOrder?.status || 'pendiente',
                products: prods,
                price: totalProducts,
                finalPrice,
                merchantObservation: values.merchantObservation || '',
                customer: {
                    id: selectedCustomer.id,
                    name: selectedCustomer.name,
                    email: selectedCustomer.email,
                    phone: selectedCustomer.phone,
                    address: selectedCustomer.address,
                    block: selectedCustomer.block || '',
                    lat: selectedCustomer.lat,
                    lon: selectedCustomer.lon,
                    observations: selectedCustomer.observations || '',
                    notificationToken: selectedCustomer.notificationToken || '',
                },
                deliverySchedule: {
                    day: dayjs(values.deliveryDay).format('dddd').toLowerCase(),
                    hour: values.deliveryHour,
                },
                deliveryDate: dayjs(values.deliveryDay).startOf('day').toISOString(),
                deliveryPerson: values.dealerId
                    ? { id: values.dealerId, name: dealers.find(d => d._id === values.dealerId)?.name || '' }
                    : null,
            };

            const res = await Orders.edit(editingOrder._id, payload); // 👈 MISMO service
            if (res.success) {
                message.success('Pedido actualizado');
                setIsModalVisible(false);
                form.resetFields();
                setSelectedCustomer(null);
                setSelectedProducts([]);
                setEditingOrder(null);
                refetch();
            } else {
                throw new Error(res.message || 'Error al actualizar');
            }
        } catch (err) {
            console.error('❌ Error al guardar:', err);
            message.error('Error al guardar el pedido');
        }
    };


    const columns = [
        {
            title: 'Teléfono',
            dataIndex: ['customer', 'phone'],
            render: (phone, record) => {
                // Si es pedido local, mostrar "—"
                if (record.deliveryType === 'local') {
                    return '—';
                }
                return phone || '—';
            },
        },
        {
            title: 'Dirección',
            dataIndex: ['customer', 'address'],
            render: (address, record) => {
                // Si es pedido local, mostrar "Local"
                if (record.deliveryType === 'local') {
                    return <span style={{ color: '#1890ff', fontWeight: 500 }}>Local</span>;
                }
                const block = record?.customer?.block ?? record?.customer?.deptoblock;
                const addr = address || '—';
                return block ? `${addr} · ${block}` : addr;
            },
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
                const { label, color } =
                    paymentMethodStyles[method] || { label: method, color: 'default' };
                return (
                    <span style={{ backgroundColor: `${color}20`, color, padding: '2px 8px', borderRadius: '8px' }}>
                        {label}
                    </span>
                );
            },
        },

        // ✅ Tipo de Entrega
        {
            title: 'Tipo de Entrega',
            dataIndex: 'deliveryType',
            render: (type) => {
                const deliveryTypeStyles = {
                    domicilio: { label: 'Despacho', color: 'geekblue' },
                    local: { label: 'Local', color: 'cyan' },
                    delivery: { label: 'Despacho', color: 'geekblue' },
                    mostrador: { label: 'Local', color: 'cyan' },
                };
                const { label, color } =
                    deliveryTypeStyles[type] || { label: type || '—', color: 'default' };
                return <Tag color={color}>{label}</Tag>;
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
                return deliveryTime
                    ? `${dayjs(date).format('DD/MM/YYYY')} ${deliveryTime}`
                    : dayjs(date).format('DD/MM/YYYY HH:mm');
            },
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            render: (status, record) => (
                <Tag
                    color={statusColorMap[status] || 'default'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openStatusModal(record)}
                >
                    {status?.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Transf Pago',
            dataIndex: 'transferPay',
            render: (_, record) => {
                if (record.paymentMethod === 'transferencia') {
                    const isDelivered = record.status === 'entregado';
                    const isTransferPaidAndDelivered = record.transferPay && isDelivered;
                    return (
                        <Switch
                            checked={isTransferPaidAndDelivered}
                            onChange={() => handleTransferToggle(record)}
                            loading={loadingRowId === record._id}
                            disabled={!isDelivered}
                        />
                    );
                }
                return null;
            },
        },

        // 🟦 Editar
        {
            title: 'Editar',
            key: 'editar',
            render: (_, record) => (
                <Button type="default" onClick={() => handleEditarVenta(record)}>
                    Editar
                </Button>
            ),
        },

        // 🟥 Eliminar
        {
            title: 'Eliminar',
            key: 'eliminar',
            render: (_, record) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => handleEliminar(record._id)} />
            ),
        },

        // 🟩 Cobrar por WhatsApp
        {
            title: 'Cobrar por WhatsApp',
            key: 'whatsapp',
            render: (_, record) => {
                const whatsappUrl = getWhatsappUrl(record);
                return (
                    <Button
                        type="default"
                        disabled={!whatsappUrl}
                        onClick={() => whatsappUrl && window.open(whatsappUrl, '_blank')}
                    >
                        Cobrar por WhatsApp
                    </Button>
                );
            },
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
                            page: 1,
                        }));
                        setPage(1);
                        refetch();
                    }}>
                        Ver Entregados
                    </Button>

                    <Button onClick={() => {
                        setQueryParams(prev => ({
                            ...prev,
                            status: 'pendiente',
                            transferPay: undefined,
                            page: 1,
                        }));
                        setPage(1);
                        refetch();
                    }}>
                        Ver Pendientes
                    </Button>

                    <Button onClick={() => {
                        setQueryParams(prev => ({
                            ...prev,
                            status: 'entregado',
                            transferPay: false,
                            page: 1,
                        }));
                        setPage(1);
                        refetch();
                    }}>
                        No Pagados Transferencia
                    </Button>

                    <Select
                        placeholder="Tipo de entrega"
                        allowClear
                        style={{ minWidth: 180 }}
                        value={queryParams.deliveryType}
                        onChange={(val) => {
                            setQueryParams(prev => ({ ...prev, deliveryType: val || undefined, page: 1 }));
                            setPage(1);
                            refetch();
                        }}
                    >
                        <Select.Option value="domicilio">Despacho</Select.Option>
                        <Select.Option value="local">Local</Select.Option>
                    </Select>


                    <Button onClick={() => {
                        // Limpia filtros y vuelve a traer todo
                        setQueryParams({
                            storeId: user.storeId,
                            startDate: null,
                            endDate: null,
                            status: null,
                            transferPay: undefined,
                            deliveryType: undefined,
                            page: 1,
                            limit,
                        });
                        setDateRange([]);
                        setPage(1);
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
                    {queryParams.deliveryType && (
                        <Tag
                            color="geekblue"
                            closable
                            onClose={(e) => {
                                e.preventDefault(); // evita que AntD lo quite antes de actualizar estado
                                setQueryParams(prev => ({ ...prev, deliveryType: undefined, page: 1 }));
                                setPage(1);
                                refetch();
                            }}
                        >
                            Entrega: {queryParams.deliveryType === 'domicilio' ? 'Despacho' : 'Local'}
                        </Tag>
                    )}
                </div>

                <Search
                    placeholder="Buscar por teléfono o dirección"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={setSearchText}
                    className="mb-6"
                />

                {isMobile ? (
                    <div className="grid gap-4">
                        {filteredVentas.map((venta) => {
                            const whatsappUrl = getWhatsappUrl(venta);

                            // Map de tipo de entrega (acepta dos convenciones)
                            const deliveryTypeStyles = {
                                domicilio: { label: 'Despacho', color: 'geekblue' },
                                local: { label: 'Local', color: 'cyan' },
                                delivery: { label: 'Despacho', color: 'geekblue' },
                                mostrador: { label: 'Local', color: 'cyan' },
                            };
                            const deliveryKey =
                                venta.deliveryType || venta.delivery_type || venta.delivery; // fallbacks
                            const { label: deliveryLabel, color: deliveryColor } =
                                deliveryTypeStyles[deliveryKey] ||
                                { label: deliveryKey || '—', color: 'default' };

                            // Determinar si es pedido local
                            const isLocal = venta.deliveryType === 'local';

                            return (
                                <Card key={venta._id} title={isLocal ? 'Venta Local' : 'Pedido'}>
                                    <div className="space-y-2">
                                        <p>
                                            <strong>Teléfono:</strong> {isLocal ? '—' : (venta.customer?.phone || '—')}
                                        </p>
                                        <p>
                                            <strong>Dirección:</strong>{' '}
                                            {isLocal ? (
                                                <span style={{ color: '#1890ff', fontWeight: 500 }}>Local</span>
                                            ) : (
                                                (() => {
                                                    const addr = venta.customer?.address || '—';
                                                    const block = venta.customer?.block ?? venta.customer?.deptoblock;
                                                    return block ? `${addr} · ${block}` : addr;
                                                })()
                                            )}
                                        </p>
                                        <p>
                                            <strong>Total:</strong> ${venta.finalPrice?.toLocaleString('es-CL') ?? 0}
                                        </p>

                                        <p>
                                            <strong>Método de pago:</strong>{' '}
                                            {(() => {
                                                const { label, color } =
                                                    paymentMethodStyles[venta.paymentMethod] ||
                                                    { label: venta.paymentMethod, color: 'gray' };
                                                return (
                                                    <span
                                                        style={{
                                                            backgroundColor: `${color}20`,
                                                            color,
                                                            padding: '2px 8px',
                                                            borderRadius: '8px',
                                                        }}
                                                    >
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                        </p>

                                        {/* ✅ Tipo de Entrega */}
                                        <p>
                                            <strong>Tipo de Entrega:</strong>{' '}
                                            <Tag color={deliveryColor}>{deliveryLabel}</Tag>
                                        </p>

                                        {/* Estado */}
                                        <p>
                                            <strong>Estado:</strong>{' '}
                                            <Tag
                                                color={statusColorMap[venta.status] || 'default'}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openStatusModal(venta)}
                                            >
                                                {venta.status?.toUpperCase()}
                                            </Tag>
                                        </p>

                                        <p>
                                            <strong>Fecha de Venta:</strong>{' '}
                                            {dayjs(venta.createdAt).format('DD/MM/YYYY HH:mm')}
                                        </p>
                                        <p>
                                            <strong>Fecha de Entrega:</strong>{' '}
                                            {venta.deliverySchedule?.hour
                                                ? `${dayjs(venta.deliveryDate).format('DD/MM/YYYY')} ${venta.deliverySchedule.hour}`
                                                : dayjs(venta.deliveryDate).format('DD/MM/YYYY HH:mm')}
                                        </p>

                                        {/* Transferencia Pagada */}
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

                                        {/* Botones separados */}
                                        <Space className="mt-2">
                                            <Button type="default" onClick={() => handleEditarVenta(venta)}>
                                                Editar
                                            </Button>
                                            <Button
                                                danger
                                                icon={<DeleteOutlined />}
                                                onClick={() => handleEliminar(venta._id)}
                                            >
                                                Eliminar
                                            </Button>
                                            <Button
                                                type="default"
                                                disabled={!whatsappUrl}
                                                onClick={() => whatsappUrl && window.open(whatsappUrl, '_blank')}
                                            >
                                                Cobrar por WhatsApp
                                            </Button>
                                        </Space>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>


                ) : (
                    <Table
                        dataSource={filteredVentas}
                        columns={columns}
                        rowKey="_id"
                        loading={isLoading}
                        pagination={{
                            current: page,
                            pageSize: limit,
                            total,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            onChange: (p, l) => {
                                setPage(p);
                                setLimit(l);
                                setQueryParams(prev => ({ ...prev, page: p, limit: l }));
                            },
                        }}
                        bordered
                        scroll={{ y: 520, x: 'max-content' }}
                    />
                )}

                <Modal
                    title={editingOrder ? 'Editar Pedido' : 'Editar Pedido'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={() => {
                        setIsModalVisible(false);
                        setEditingOrder(null);
                        form.resetFields();
                        setSelectedCustomer(null);
                        setSelectedProducts([]);
                        setProductSearchTerm('');
                    }}
                    width={800}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item label="Cliente" required>
                            <Select
                                showSearch
                                placeholder="Buscar cliente por dirección"
                                optionFilterProp="label"
                                onChange={(value) => {
                                    const client = clients.find(c => c._id === value);
                                    if (client) {
                                        const block = client.block ?? client.deptoblock ?? '';
                                        setSelectedCustomer({
                                            id: client._id,
                                            name: client.name,
                                            email: client.email,
                                            phone: client.phone,
                                            address: client.address,
                                            lat: client.lat,
                                            lon: client.lon,
                                            observations: '',
                                            notificationToken: client.token,
                                            // ✅ guardar siempre como `block`
                                            block,
                                        });
                                    }
                                }}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                loading={isClientsLoading}
                                value={selectedCustomer?.id}
                            >
                                {clients.map(client => {
                                    const block = client.block ?? client.deptoblock;
                                    const addressWithBlock = block ? `${client.address} · ${block}` : client.address;
                                    return (
                                        <Select.Option
                                            key={client._id}
                                            value={client._id}
                                            label={addressWithBlock}
                                        >
                                            {addressWithBlock}
                                        </Select.Option>
                                    );
                                })}
                            </Select>

                        </Form.Item>

                        {selectedCustomer && (
                            <Card
                                size="small"
                                title="Cliente Seleccionado"
                                className="mb-4"
                                extra={<Button type="text" danger onClick={() => setSelectedCustomer(null)}>Quitar</Button>}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        value={selectedCustomer.name}
                                        onChange={(e) => setSelectedCustomer(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Nombre"
                                        addonBefore="👤"
                                    />
                                    <Input
                                        value={selectedCustomer.email || ''}
                                        onChange={(e) => setSelectedCustomer(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="Correo"
                                        addonBefore="✉️"
                                    />
                                    <Input
                                        value={selectedCustomer.phone}
                                        onChange={(e) => setSelectedCustomer(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="Teléfono"
                                        addonBefore="📞"
                                    />
                                    <div className="col-span-2">
                                        <Autocomplete onLoad={ref => setAutocompleteRef(ref)} onPlaceChanged={handlePlaceChanged}>
                                            <Input
                                                value={selectedCustomer.address}
                                                onChange={(e) => setSelectedCustomer(prev => ({ ...prev, address: e.target.value }))}
                                                placeholder="Dirección"
                                                addonBefore="📍"
                                            />
                                        </Autocomplete>
                                        <Input
                                            value={selectedCustomer?.block || ''}
                                            onChange={(e) => setSelectedCustomer(prev => ({ ...prev, block: e.target.value }))}
                                            placeholder="Depto / Block (opcional)"
                                            addonBefore="🏢"
                                        />

                                    </div>

                                    {typeof selectedCustomer.lat === 'number' && typeof selectedCustomer.lon === 'number' && (
                                        <div className="col-span-2 border rounded overflow-hidden" style={{ height: '220px' }}>
                                            <ClientMap
                                                lat={selectedCustomer.lat}
                                                lng={selectedCustomer.lon}
                                                draggable
                                                onDragEnd={(lat, lng) => setSelectedCustomer(prev => ({ ...prev, lat, lon: lng }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}

                        <Form.Item label="Productos">
                            <Select
                                showSearch
                                placeholder="Buscar productos..."
                                optionFilterProp="label"
                                filterOption={false}
                                onSearch={(val) => setProductSearchTerm(val)}
                                loading={isLoadingProductsForSelect}
                                onSelect={(productId) => {
                                    const product = products.find(p => p._id === productId);
                                    if (product) handleAddProduct(product);
                                }}
                            >
                                {products.map((product) => (
                                    <Select.Option
                                        key={product._id}
                                        value={product._id}
                                        label={`${product.name} - $${product.priceBase}${product.priceDiscount ? ` (desc: $${product.priceDiscount})` : ''}`}
                                    >
                                        {`${product.name} - $${product.priceBase}` + (product.priceDiscount ? ` (desc: $${product.priceDiscount})` : '')}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {selectedProducts.length > 0 && (
                            <div className="mt-2 space-y-2">
                                {selectedProducts.map(product => (
                                    <Card
                                        key={product.productId}
                                        size="small"
                                        className="border border-gray-200"
                                        title={product.name}
                                        extra={<Button size="small" danger onClick={() => handleRemoveProduct(product.productId)}>Quitar</Button>}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2">
                                                <Button onClick={() => handleChangeQuantity(product.productId, -1)}>-</Button>
                                                <span>{product.quantity}</span>
                                                <Button onClick={() => handleChangeQuantity(product.productId, 1)}>+</Button>
                                            </div>
                                            <span className="font-semibold">
                                                ${typeof product.totalPrice === 'number' ? product.totalPrice.toFixed(0) : '0'}
                                            </span>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}

                        <div className="text-right font-bold text-lg mt-4">
                            Total: ${selectedProducts.reduce((acc, p) => acc + p.totalPrice, 0).toFixed(0)}
                        </div>

                        <Form.Item name="paymentMethod" label="Método de Pago" rules={[{ required: true }]}>
                            <Select>
                                {Object.keys(paymentMethodStyles).map(p => (
                                    <Select.Option key={p} value={p}>
                                        {paymentMethodStyles[p]?.label || p}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="deliveryType" label="Tipo de Entrega" rules={[{ required: true }]}>
                            <Radio.Group>
                                <Radio value="local">Local</Radio>
                                <Radio value="delivery">Despacho</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                                const isDelivery = getFieldValue('deliveryType') === 'delivery';
                                return (
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="deliveryDay"
                                                label="Día de Entrega"
                                                rules={[{ required: isDelivery, message: 'Selecciona el día de entrega' }]}
                                            >
                                                <DatePicker
                                                    format="YYYY-MM-DD"
                                                    style={{ width: '100%' }}
                                                    placeholder="Selecciona una fecha"
                                                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="deliveryHour"
                                                label="Horario de Entrega"
                                                rules={[{ required: isDelivery, message: 'Selecciona un horario' }]}
                                            >
                                                <Select placeholder="Selecciona un horario" disabled={!isDelivery}>
                                                    {hourBlocks.map((h) => <Select.Option key={h} value={h}>{h}</Select.Option>)}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                );
                            }}
                        </Form.Item>

                        <Form.Item
                            name="shippingCost"
                            label="Costo de Envío"
                            rules={[{ pattern: /^\d+$/, message: 'Solo números' }]}
                        >
                            <Input placeholder="Ej: 2000" maxLength={6} inputMode="numeric" addonBefore="$" />
                        </Form.Item>

                        <Form.Item name="dealerId" label="Repartidor">
                            <Select placeholder="Selecciona un repartidor" allowClear showSearch loading={isLoadingDealers}>
                                {dealers.map(dealer => (
                                    <Select.Option key={dealer._id} value={dealer._id}>{dealer.name}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="merchantObservation" label="Observación del Pedido">
                            <Input.TextArea rows={3} placeholder="Instrucciones, notas internas, etc." allowClear showCount maxLength={300} />
                        </Form.Item>
                    </Form>
                </Modal>

                <Modal
                    title="Cambiar Estado del Pedido"
                    open={isStatusModalVisible}
                    onCancel={() => setIsStatusModalVisible(false)}
                    onOk={async () => {
                        if (!newStatus || !selectedOrderForStatus) return;
                        try {
                            const res = await Orders.edit(selectedOrderForStatus._id, { status: newStatus });
                            if (res.success) {
                                message.success('Estado actualizado correctamente');
                                refetch();
                                setIsStatusModalVisible(false);
                                setSelectedOrderForStatus(null);
                            } else {
                                message.error(res.message || 'Error al actualizar estado');
                            }
                        } catch (err) {
                            console.error('❌ Error al cambiar estado:', err);
                            message.error('Error al cambiar estado');
                        }
                    }}
                >
                    <p>
                        <strong>Estado actual:</strong>{' '}
                        <Tag color={statusColorMap[selectedOrderForStatus?.status] || 'default'}>
                            {selectedOrderForStatus?.status?.toUpperCase()}
                        </Tag>
                    </p>

                    <Select
                        value={newStatus}
                        onChange={setNewStatus}
                        style={{ width: '100%' }}
                        placeholder="Selecciona nuevo estado"
                    >
                        {Object.keys(statusColorMap).map((status) => (
                            <Select.Option key={status} value={status}>
                                {status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}
                            </Select.Option>
                        ))}
                    </Select>
                </Modal>

            </div>
        </div>
    );
};

export default HistorialVentas;