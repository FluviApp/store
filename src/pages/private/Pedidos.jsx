// Vista de administración de pedidos
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import {
    Table, Button, Space, Input, Modal, Form, Card, message, Empty, Select, Radio, DatePicker, Row, Col, Tag
} from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';
import usePendingOrders from '../../hooks/usePendingOrders.js';
import OrdersService from '../../services/Orders.js';
import useClients from '../../hooks/useClients.js'
import ClientMap from '../../components/ClientMap.jsx';
import useProducts from '../../hooks/useProducts';
import useProductsForSelect from '../../hooks/useProductsForSelect';
import useAllDealers from '../../hooks/useAllDealers';
import OrdersMap from '../../components/OrdersMap.jsx'
const { Search } = Input;
const { Option } = Select;

const orderOrigins = ['web', 'app', 'admin', 'pos'];
const orderStatuses = ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled', 'returned', 'delayed'];

// Reemplaza este arreglo por los ENUMS válidos del modelo
const paymentMethods = ['efectivo', 'transferencia', 'webpay', 'mercadopago', 'tarjeta', 'otro'];
const deliveryTypes = ['local', 'delivery']; // 'local' y 'delivery'
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


// 🆕 Para el autocomplete de dirección
import { Autocomplete } from '@react-google-maps/api';



const Pedidos = () => {
    const { user } = useAuth();
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingOrder, setEditingOrder] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [customProducts, setCustomProducts] = useState([]);
    const [dateSearchTriggered, setDateSearchTriggered] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');

    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const { startDate, endDate } = dateRange; // si lo necesitas

    const queryParams = {
        storeId: user?.storeId,
    };

    useEffect(() => {
        if (dateSearchTriggered && dateRange.length === 2) {
            setQueryParams({
                storeId: user.storeId,
                startDate: dayjs(dateRange[0]).startOf('day').toISOString(),
                endDate: dayjs(dateRange[1]).endOf('day').toISOString()
            });
        }
    }, [dateSearchTriggered, dateRange, user.storeId]);
    const { data, isLoading, refetch } = usePendingOrders(queryParams);

    console.log(data)

    console.log("Datos recibidos del backend:", data);

    // Asegúrate de que estamos accediendo correctamente a los pedidos
    const pedidos = data?.data || [];
    console.log('Pedidos:', pedidos); // Este debería ser el array de pedidos


    const pageSize = 5;
    const [autocompleteRef, setAutocompleteRef] = useState(null);
    const filteredPedidos = searchText
        ? pedidos.filter(p => p.client?.name?.toLowerCase().includes(searchText.toLowerCase()))
        : pedidos;

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const { data: clientsData, isLoading: isClientsLoading } = useClients({ page: 1, limit: 900 });
    const clients = clientsData?.data?.docs || [];
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
    const [newStatus, setNewStatus] = useState(null);



    const { data: productDataForSelect, isLoading: isLoadingProductsForSelect } = useProductsForSelect({
        storeId: user.storeId,
        search: productSearchTerm,
    });


    const products = productDataForSelect?.data || [];
    const [selectedProducts, setSelectedProducts] = useState([]);
    console.log(productDataForSelect)



    const { data: dealersData, isLoading: isLoadingDealers } = useAllDealers();
    const dealers = dealersData?.data || [];

    const handleAgregar = () => {
        setEditingOrder(null);
        form.resetFields();
        form.setFieldsValue({ deliveryType: 'delivery' });
        setCustomProducts([]);
        setIsModalVisible(true);
    };

    // Creamos una nueva función y modal para editar pedido
    // Puedes poner esto debajo de handleModalOk o incluso en un componente separado

    const handleEditarPedido = (pedido) => {
        const cliente = pedido.customer || {};
        setSelectedCustomer({
            id: cliente.id,
            name: cliente.name,
            phone: cliente.phone,
            address: cliente.address,
            block: cliente.block ?? cliente.deptoblock ?? '',
            lat: cliente.lat,
            lon: cliente.lon,
            observations: cliente.observations || '',
            notificationToken: cliente.notificationToken || '',
        });

        setSelectedProducts(pedido.products || []);

        form.setFieldsValue({
            paymentMethod: reversePaymentMethodMap[pedido.paymentMethod] || 'efectivo',
            deliveryType: reverseDeliveryTypeMap[pedido.deliveryType] || 'pickup',
            deliveryDay: dayjs(pedido.deliveryDate),
            deliveryHour: pedido.deliverySchedule?.hour || null,
            shippingCost: (pedido.finalPrice || 0) - (pedido.price || 0),
            merchantObservation: pedido.merchantObservation || '',
            dealerId: pedido.deliveryPerson?.id || null, // ✅ cambio aplicado
        });

        setEditingOrder(pedido);
        setIsModalVisible(true);
    };




    const reversePaymentMethodMap = {
        efectivo: 'efectivo',
        transferencia: 'transferencia',
        webpay: 'webpay',
        mercadopago: 'mercadopago',
        tarjeta_local: 'tarjeta',
        otro: 'otro',
    };

    const reverseDeliveryTypeMap = {
        domicilio: 'delivery',
        local: 'local',
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
                    const res = await OrdersService.delete(id);
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
            }
        });
    };


    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const isDelivery = values.deliveryType === 'delivery';

            if (isDelivery && !selectedCustomer) {
                message.error('Debes seleccionar un cliente');
                return;
            }

            if (selectedProducts.length === 0) {
                message.error('Debes agregar al menos un producto');
                return;
            }

            // Mapear enums a los valores válidos del modelo
            const paymentMethodMap = {
                efectivo: 'efectivo',
                transferencia: 'transferencia',
                webpay: 'webpay',
                mercadopago: 'mercadopago',
                tarjeta: 'tarjeta_local',
                otro: 'otro',
            };

            const deliveryTypeMap = {
                delivery: 'domicilio',
                local: 'local',
            };

            const products = selectedProducts.map(p => ({
                productId: p.productId,
                name: p.name,
                unitPrice: p.unitPrice,
                quantity: p.quantity,
                totalPrice: p.totalPrice,
                notes: p.notes || '',
            }));

            const totalProducts = products.reduce((acc, p) => acc + p.totalPrice, 0);
            const shipping = isDelivery ? Number(values.shippingCost || 0) : 0;
            const finalPrice = totalProducts + shipping;

            const payload = {
                storeId: user.storeId,
                commerceId: user.commerceId ?? 'default_commerce_id',
                origin: 'admin',
                paymentMethod: paymentMethodMap[values.paymentMethod] || 'efectivo',
                deliveryType: deliveryTypeMap[values.deliveryType] || 'local',
                status: 'pendiente',
                products,
                price: totalProducts,
                finalPrice,
                merchantObservation: values.merchantObservation || '',
            };

            if (isDelivery) {
                payload.customer = {
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
                };
                payload.deliverySchedule = {
                    day: dayjs(values.deliveryDay).format('dddd').toLowerCase(),
                    hour: values.deliveryHour,
                };
                payload.deliveryDate = dayjs(values.deliveryDay).startOf('day').toISOString();
                if (values.dealerId) {
                    payload.deliveryPerson = {
                        id: values.dealerId,
                        name: dealers.find(d => d._id === values.dealerId)?.name || '',
            };
                }
            }

            // 🔎 Logs solicitados
            console.log('🆔 ID (selectedCustomer):', selectedCustomer?.id);
            console.log('📧 Email (selectedCustomer):', selectedCustomer?.email);
            if (payload.customer) {
            console.log('📦 Payload.customer:', { id: payload.customer.id, email: payload.customer.email });
            }

            const res = editingOrder
                ? await OrdersService.edit(editingOrder._id, payload)
                : await OrdersService.create(payload);

            if (res.success) {
                message.success(editingOrder ? 'Pedido actualizado' : 'Pedido creado');
                setIsModalVisible(false);
                form.resetFields();
                setSelectedCustomer(null);
                setSelectedProducts([]);
                refetch();
            } else {
                throw new Error(res.message || 'Error al crear pedido');
            }

        } catch (err) {
            console.error('❌ Error al guardar pedido:', err);
            message.error('Error al guardar el pedido');
        }
    };





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
            title: 'Dirección',
            dataIndex: ['customer', 'address'],
        },
        {
            title: 'Precio',
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
            title: 'Estado',
            dataIndex: 'status',
            render: (status, record) => (
                <Tag
                    color={statusColorMap[status]}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openStatusModal(record)}
                >
                    {status.toUpperCase()}
                </Tag>
            )
        }
        ,

        {
            title: 'Acciones',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleEditarPedido(record)} />
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleEliminar(record._id)} />
                </Space>
            )
        }
    ];

    const openStatusModal = (order) => {
        setSelectedOrderForStatus(order);
        setNewStatus(order.status);
        setIsStatusModalVisible(true);
    };

    // 🆕 Maneja el cambio de dirección desde Autocomplete
    const handlePlaceChanged = () => {
        if (autocompleteRef) {
            const place = autocompleteRef.getPlace();
            if (place.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                setSelectedCustomer(prev => ({
                    ...prev,
                    address: place.formatted_address,
                    lat,
                    lon: lng,
                    // ✅ preserva el block si ya existía
                    block: prev?.block ?? prev?.deptoblock ?? '',
                }));
            }
        }
    };


    const hourBlocks = Array.from({ length: 24 }, (_, i) => {
        const hour = i % 12 === 0 ? 12 : i % 12;
        const period = i < 12 ? 'AM' : 'PM';
        return `${hour.toString().padStart(2, '0')}:00 ${period}`;
    });

    const handleAddProduct = (product) => {
        const exists = selectedProducts.find(p => p.productId === product._id);
        if (!exists) {
            const unitPrice = (product.priceDiscount && product.priceDiscount > 0)
                ? product.priceDiscount
                : product.priceBase ?? 0;


            setSelectedProducts(prev => [
                ...prev,
                {
                    productId: product._id,
                    name: product.name,
                    unitPrice,
                    quantity: 1,
                    totalPrice: unitPrice,
                    notes: '',
                }
            ]);
        }
    };


    const handleChangeQuantity = (productId, delta) => {
        setSelectedProducts(prev =>
            prev.map(p =>
                p.productId === productId
                    ? {
                        ...p,
                        quantity: Math.max(1, p.quantity + delta),
                        totalPrice: p.unitPrice * Math.max(1, p.quantity + delta),
                    }
                    : p
            )
        );
    };

    const handleRemoveProduct = (productId) => {
        setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
    };

    const paymentMethodStyles = {
        efectivo: { label: 'Efectivo', color: 'green' },
        transferencia: { label: 'Transferencia', color: 'blue' },
        webpay: { label: 'WebPay', color: 'purple' },
        mercadopago: { label: 'MercadoPago', color: 'cyan' },
        tarjeta_local: { label: 'Tarjeta Local', color: 'orange' },
        otro: { label: 'Otro', color: 'gray' },
    };

    const dayTranslations = {
        'monday': 'Lunes',
        'tuesday': 'Martes',
        'wednesday': 'Miércoles',
        'thursday': 'Jueves',
        'friday': 'Viernes',
        'saturday': 'Sábado',
        'sunday': 'Domingo'
    };

    // 👉 Totales por producto (sobre la lista filtrada que estás mostrando)
    const productCards = useMemo(() => {
        const map = new Map();
        (filteredPedidos || []).forEach((order) => {
            (order.products || []).forEach((prod) => {
                // clave por productId; si no viene, cae a nombre
                const key = String(prod.productId ?? prod.name);
                const prev = map.get(key) || {
                    productId: key,
                    name: prod.name,
                    quantity: 0,
                    revenue: 0,
                };
                const qty = Number(prod.quantity) || 0;
                const unit = Number(prod.unitPrice) || 0;
                const lineTotal = Number(prod.totalPrice ?? unit * qty) || 0;

                prev.quantity += qty;
                prev.revenue += lineTotal;
                map.set(key, prev);
            });
        });

        // Ordenar por cantidad descendente
        return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
    }, [filteredPedidos]);

    // Mostrar top N con opción de expandir
    const [showAllCards, setShowAllCards] = useState(false);
    const visibleCount = showAllCards ? productCards.length : Math.min(8, productCards.length);
    const showProductSummary = productCards.length > 0;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Pedidos</h1>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAgregar}>Agregar Pedido</Button>
                </div>


                {showProductSummary && (
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-semibold">Unidades por producto</h2>
                            {productCards.length > 8 && (
                                <Button size="small" onClick={() => setShowAllCards(s => !s)}>
                                    {showAllCards ? 'Ver menos' : 'Ver todos'}
                                </Button>
                            )}
                        </div>

                        <Row gutter={[12, 12]}>
                            {productCards.slice(0, visibleCount).map((item) => (
                                <Col key={item.productId} xs={12} sm={8} md={6} lg={6} xl={4}>
                                    <Card size="small" hoverable>
                                        <div className="text-sm text-gray-500 line-clamp-2">{item.name}</div>
                                        <div className="mt-1 flex items-baseline gap-2">
                                            <span className="text-2xl font-bold">{item.quantity}</span>
                                            <span className="text-xs text-gray-400">unid.</span>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Venta: ${Math.round(item.revenue).toLocaleString('es-CL')}
                                        </div>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </div>
                )}



                {isMobile ? (
                    <div className="grid gap-4">
                        {filteredPedidos.map(pedido => (
                            <Card key={pedido._id} title={
                                (() => {
                                    const addr = pedido.customer?.address || 'Sin nombre';
                                    const block = pedido.customer?.block ?? pedido.customer?.deptoblock;
                                    return block ? `${addr} · ${block}` : addr;
                                })()
                            }
                                style={{ marginBottom: '16px' }}>
                                <p><strong>Teléfono:</strong> +56 {pedido.customer?.phone || '—'}</p>
                                {/* <p><strong>Dirección:</strong> {pedido.customer?.address || '—'}</p> */}
                                <p>
                                    <strong>Día y hora de entrega:</strong>{' '}
                                    {dayTranslations[pedido.deliverySchedule?.day] || pedido.deliverySchedule?.day || '—'} a las {pedido.deliverySchedule?.hour || '—'}
                                </p>
                                <p><strong>Precio Total:</strong> ${pedido.finalPrice?.toLocaleString('es-CL') ?? 0}</p>
                                <p>
                                    <strong>Método de pago:</strong>{' '}
                                    <span
                                        style={{
                                            backgroundColor: `${paymentMethodStyles[pedido.paymentMethod]?.color || 'gray'}20`,
                                            color: paymentMethodStyles[pedido.paymentMethod]?.color || 'gray',
                                            padding: '2px 8px',
                                            borderRadius: '8px'
                                        }}
                                    >
                                        {paymentMethodStyles[pedido.paymentMethod]?.label || pedido.paymentMethod}
                                    </span>
                                </p>

                                <p>
                                    <strong>Estado:</strong>{' '}
                                    <Tag
                                        color={statusColorMap[pedido.status]}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => openStatusModal(pedido)}
                                    >
                                        {pedido.status.toUpperCase()}
                                    </Tag>
                                </p>

                                <Space className="mt-2">
                                    <Button type="primary" onClick={() => handleEditarPedido(pedido)}>Editar</Button>
                                    <Button danger onClick={() => handleEliminar(pedido._id)}>Eliminar</Button>
                                </Space>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 h-full">
                        {/* Mitad izquierda con los pedidos en formato de tarjetas */}
                        <div className="col-span-1 overflow-y-auto max-h-[calc(100vh-64px)]">  {/* Aquí se define el scroll */}
                            {filteredPedidos.length > 0 ? (
                                filteredPedidos.map(pedido => (
                                    <Card key={pedido._id} title={pedido.customer?.address || 'Sin nombre'} style={{ marginBottom: '16px' }}>
                                        <p><strong>Teléfono:</strong> +56 {pedido.customer?.phone || '—'}</p>
                                        {/* <p><strong>Dirección:</strong> {pedido.customer?.address || '—'}</p> */}
                                        <p>
                                            <strong>Día y hora de entrega:</strong>{' '}
                                            {dayTranslations[pedido.deliverySchedule?.day] || pedido.deliverySchedule?.day || '—'} a las {pedido.deliverySchedule?.hour || '—'}
                                        </p>
                                        <p><strong>Precio Total:</strong> ${pedido.finalPrice?.toLocaleString('es-CL') ?? 0}</p>
                                        <p>
                                            <strong>Método de pago:</strong>{' '}
                                            <span
                                                style={{
                                                    backgroundColor: `${paymentMethodStyles[pedido.paymentMethod]?.color || 'gray'}20`,
                                                    color: paymentMethodStyles[pedido.paymentMethod]?.color || 'gray',
                                                    padding: '2px 8px',
                                                    borderRadius: '8px'
                                                }}
                                            >
                                                {paymentMethodStyles[pedido.paymentMethod]?.label || pedido.paymentMethod}
                                            </span>
                                        </p>

                                        <p>
                                            <strong>Estado:</strong>{' '}
                                            <Tag
                                                color={statusColorMap[pedido.status]}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => openStatusModal(pedido)}
                                            >
                                                {pedido.status.toUpperCase()}
                                            </Tag>
                                        </p>

                                        <Space className="mt-2">
                                            <Button type="primary" onClick={() => handleEditarPedido(pedido)}>Editar</Button>
                                            <Button danger onClick={() => handleEliminar(pedido._id)}>Eliminar</Button>
                                        </Space>
                                    </Card>
                                ))
                            ) : (
                                <Empty description="No se encontraron pedidos" />
                            )}
                        </div>

                        {/* Mitad derecha con el mapa */}
                        <div className="col-span-1 h-full">  {/* Aquí se asegura de que ocupe el alto completo */}
                            <OrdersMap
                                locations={filteredPedidos.map(pedido => ({
                                    lat: pedido.customer.lat,
                                    lng: pedido.customer.lon,
                                }))}
                            />
                        </div>
                    </div>
                )}

                <Modal
                    title={editingOrder ? 'Editar Pedido' : 'Nuevo Pedido'}
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
                        <Form.Item name="deliveryType" label="Tipo de Entrega" rules={[{ required: true }]}>
                            <Radio.Group>
                                {deliveryTypes.map(t => <Radio key={t} value={t}>{t === 'local' ? 'Local' : 'Despacho'}</Radio>)}
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                                const isDelivery = getFieldValue('deliveryType') === 'delivery';
                                if (!isDelivery) return null;
                                return (
                                    <>
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
                                        <Option
                                            key={client._id}
                                            value={client._id}
                                            label={addressWithBlock}
                                        >
                                            {addressWithBlock}
                                        </Option>
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
                                                draggable={true}
                                                onDragEnd={(lat, lng) => setSelectedCustomer(prev => ({ ...prev, lat, lon: lng }))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                                    </>
                                );
                            }}
                        </Form.Item>


                        <Form.Item label="Productos">
                            <Select
                                showSearch
                                placeholder="Buscar productos..."
                                optionFilterProp="label"
                                filterOption={false} // 🔥 desactiva filtrado automático
                                onSearch={(val) => setProductSearchTerm(val)} // 🔥 usa input del usuario para buscar
                                loading={isLoadingProductsForSelect}
                                onSelect={(productId) => {
                                    const product = products.find(p => p._id === productId);
                                    if (product) handleAddProduct(product);
                                }}
                            >
                                {products.map((product) => (
                                    <Option
                                        key={product._id}
                                        value={product._id}
                                        label={`${product.name} - $${product.priceBase}${product.priceDiscount ? ` (desc: $${product.priceDiscount})` : ''}`}
                                    >
                                        {`${product.name} - $${product.priceBase}` +
                                            (product.priceDiscount ? ` (desc: $${product.priceDiscount})` : '')}
                                    </Option>

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
                                        extra={
                                            <Button
                                                size="small"
                                                danger
                                                onClick={() => handleRemoveProduct(product.productId)}
                                            >
                                                Quitar
                                            </Button>
                                        }
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
                                {paymentMethods.map(p => <Option key={p} value={p}>{p}</Option>)}
                            </Select>
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
                                        {hourBlocks.map((hour) => (
                                            <Option key={hour} value={hour}>
                                                {hour}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>
                                );
                            }}
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                                const isDelivery = getFieldValue('deliveryType') === 'delivery';
                                if (!isDelivery) return null;
                                return (
                        <Form.Item
                            name="shippingCost"
                            label="Costo de Envío"
                            rules={[
                                { required: false },
                                {
                                    pattern: /^\d+$/,
                                    message: 'Solo se permiten números sin puntos ni letras',
                                },
                            ]}
                        >
                            <Input
                                placeholder="Ej: 2000"
                                maxLength={6}
                                inputMode="numeric"
                                addonBefore="$"
                            />
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>

                        <Form.Item noStyle shouldUpdate>
                            {({ getFieldValue }) => {
                                const isDelivery = getFieldValue('deliveryType') === 'delivery';
                                if (!isDelivery) return null;
                                return (
                        <Form.Item
                            name="dealerId"
                            label="Repartidor"
                            rules={[{ required: false }]}
                        >
                            <Select
                                placeholder="Selecciona un repartidor"
                                allowClear
                                showSearch
                                optionFilterProp="children"
                                loading={isLoadingDealers}
                            >
                                {dealers.map(dealer => (
                                    <Option key={dealer._id} value={dealer._id}>
                                        {dealer.name}
                                    </Option>
                                ))}
                            </Select>
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>

                        <Form.Item
                            name="merchantObservation"
                            label="Observación del Pedido"
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder="Instrucciones especiales, notas internas, etc."
                                allowClear
                                showCount
                                maxLength={300}
                            />
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
                            const res = await OrdersService.edit(selectedOrderForStatus._id, { status: newStatus });
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
                    <p><strong>Estado actual:</strong>{' '}
                        <Tag color={statusColorMap[selectedOrderForStatus?.status]}>
                            {selectedOrderForStatus?.status.toUpperCase()}
                        </Tag>
                    </p>
                    <Select
                        value={newStatus}
                        onChange={setNewStatus}
                        style={{ width: '100%' }}
                    >
                        {Object.keys(statusColorMap).map(status => (
                            <Option key={status} value={status}>
                                {status.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}
                            </Option>
                        ))}
                    </Select>
                </Modal>

            </div>
        </div>
    );

};

export default Pedidos;
