// Vista de ventas POS rediseñada (3 columnas con Sidebar, productos y carrito estilo POS)
import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import {
    Input, Button, Card, Select, message, Collapse, Radio, DatePicker, Form, AutoComplete, Drawer, Segmented
} from 'antd';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';
import useOrders from '../../hooks/useOrders.js';
import useProducts from '../../hooks/useProducts';
import OrdersService from '../../services/Orders.js';
import useClients from '../../hooks/useClients.js'
import ClientMap from '../../components/ClientMap.jsx';
// 🆕 Para el autocomplete de dirección
import { Autocomplete } from '@react-google-maps/api';

const { Option } = Select;
const { Panel } = Collapse;

const paymentMethods = ['efectivo', 'transferencia', 'webpay', 'mercadopago', 'tarjeta', 'otro'];
const hourBlocks = [
    '09:00 - 11:00',
    '11:00 - 13:00',
    '13:00 - 15:00',
    '15:00 - 17:00',
    '17:00 - 19:00',
    '19:00 - 21:00',
];

const VentasPOS = () => {
    const { user } = useAuth();
    const [cliente, setCliente] = useState({ name: '', phone: '' });
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [observation, setObservation] = useState('');
    const [amountReceived, setAmountReceived] = useState('');

    const { data: orderData, refetch } = useOrders({ storeId: user.storeId, origin: 'pos' });
    const ventas = orderData?.data?.docs || [];

    const { data: productData } = useProducts({ storeId: user.storeId, limit: 100 });
    const products = productData?.data?.docs || [];
    const [productSearch, setProductSearch] = useState('');
    const [gridDensity, setGridDensity] = useState('comfortable'); // 'comfortable' | 'compact'
    const [sortBy, setSortBy] = useState('name_asc'); // name_asc | price_asc | price_desc
    const filteredProducts = React.useMemo(() => {
        const list = !productSearch
            ? products
            : products.filter(p => (p.name || '').toLowerCase().includes(productSearch.toLowerCase()));
        const sorted = [...list];
        if (sortBy === 'name_asc') {
            sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else if (sortBy === 'price_asc') {
            sorted.sort((a, b) => (a.priceDiscount ?? a.priceBase ?? 0) - (b.priceDiscount ?? b.priceBase ?? 0));
        } else if (sortBy === 'price_desc') {
            sorted.sort((a, b) => (b.priceDiscount ?? b.priceBase ?? 0) - (a.priceDiscount ?? a.priceBase ?? 0));
        }
        return sorted;
    }, [products, productSearch, sortBy]);

    const [deliveryType, setDeliveryType] = useState('local');
    const [deliveryDate, setDeliveryDate] = useState(null);
    const [deliveryHour, setDeliveryHour] = useState(null);
    const [shippingCost, setShippingCost] = useState('');

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const { data: clientsData, isLoading: isClientsLoading } = useClients({ page: 1, limit: 100 });
    const clients = clientsData?.data?.docs || [];
    const [autocompleteRef, setAutocompleteRef] = useState(null); // 🆕
    const [drawerVisible, setDrawerVisible] = useState(false);

    const handleAddProduct = (productId) => {
        const product = products.find(p => p._id === productId);
        if (!product) return;
        const exists = selectedProducts.find(p => p.productId === productId);
        if (!exists) {
            const unitPrice = product.priceDiscount ?? product.priceBase ?? 0;
            setSelectedProducts(prev => [...prev, {
                productId,
                name: product.name,
                quantity: 1,
                unitPrice,
                discount: 0,
                totalPrice: unitPrice
            }]);
        }
    };

    const handleChangeQuantity = (productId, quantity) => {
        setSelectedProducts(prev => prev.map(p => p.productId === productId
            ? { ...p, quantity, totalPrice: p.unitPrice * quantity * (1 - (p.discount || 0) / 100) }
            : p));
    };

    const handleChangeDiscount = (productId, discount) => {
        setSelectedProducts(prev => prev.map(p => p.productId === productId
            ? { ...p, discount, totalPrice: p.unitPrice * p.quantity * (1 - discount / 100) }
            : p));
    };

    const handleRemoveProduct = (productId) => {
        setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
    };

    const subtotal = selectedProducts.reduce((sum, p) => sum + p.totalPrice, 0);
    const tax = 0; // Si deseas agregar IVA u otro impuesto, ajusta aquí
    const total = subtotal + tax;
    const vuelto = amountReceived ? Math.max(0, parseFloat(amountReceived) - total) : 0;

    const handleSubmit = async () => {
        // Validaciones generales
        if (selectedProducts.length === 0) {
            message.error('Debes agregar al menos un producto');
            return;
        }

        if (!paymentMethod) {
            message.error('Debes seleccionar un método de pago');
            return;
        }

        if (!amountReceived || isNaN(amountReceived) || parseFloat(amountReceived) < total) {
            message.error('El monto recibido es inválido o insuficiente');
            return;
        }

        // Validaciones según tipo de entrega
        if (deliveryType === 'domicilio') {
            if (!selectedCustomer || !selectedCustomer.name || !selectedCustomer.phone) {
                message.error('Debes seleccionar un cliente válido');
                return;
            }
            if (!deliveryDate) {
                message.error('Debes seleccionar el día de entrega');
                return;
            }
            if (!deliveryHour) {
                message.error('Debes seleccionar el horario de entrega');
                return;
            }
        }

        if (deliveryType === 'domicilio') {
            if (!shippingCost || isNaN(shippingCost)) {
                message.error('Debes ingresar un costo de envío válido');
                return;
            }
        }

        // Mapeo para normalizar
        const paymentMethodMap = {
            efectivo: 'efectivo',
            transferencia: 'transferencia',
            webpay: 'webpay',
            mercadopago: 'mercadopago',
            tarjeta: 'tarjeta_local',
            otro: 'otro',
        };

        const deliveryTypeMap = {
            local: 'local',
            domicilio: 'domicilio',
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
        const shipping = parseFloat(shippingCost || 0);
        const finalPrice = totalProducts + (deliveryType === 'domicilio' ? shipping : 0);

        const payload = {
            storeId: user.storeId,
            commerceId: user.commerceId ?? 'default_commerce_id',
            origin: 'pos',
            status: 'entregado',
            deliveryType: deliveryTypeMap[deliveryType],
            paymentMethod: paymentMethodMap[paymentMethod],
            products,
            price: totalProducts,
            finalPrice,
            merchantObservation: observation || '',
            deliveryDate: dayjs(deliveryDate || new Date()).startOf('day').toISOString(),
            deliverySchedule:
                deliveryType === 'domicilio'
                    ? {
                        day: dayjs(deliveryDate).format('dddd').toLowerCase(),
                        hour: deliveryHour,
                    }
                    : undefined,
            customer:
                deliveryType === 'domicilio' && selectedCustomer
                    ? {
                        id: selectedCustomer.id,
                        name: selectedCustomer.name,
                        phone: selectedCustomer.phone,
                        address: selectedCustomer.address,
                        lat: selectedCustomer.lat,
                        lon: selectedCustomer.lon,
                        observations: selectedCustomer.observations || '',
                        notificationToken: selectedCustomer.notificationToken || '',
                    }
                    : undefined,
        };

        const res = await OrdersService.create(payload);
        if (res.success) {
            message.success('Venta registrada');
            setSelectedProducts([]);
            setPaymentMethod(null);
            setObservation('');
            setAmountReceived('');
            setSelectedCustomer(null);
            setDeliveryDate(null);
            setDeliveryHour(null);
            setShippingCost('');
            setDeliveryType('local');
            refetch();
        } else {
            message.error(res.message || 'Error al registrar venta');
        }
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
                }));
            }
        }
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-white">
            <Sidebar />
            <div className="flex flex-1 flex-col md:flex-row overflow-hidden">


                {/* Panel izquierdo: productos (solo visible en desktop) */}
                <div className="hidden md:block w-3/5 p-6 overflow-y-auto">
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                        <Input.Search
                            placeholder="Buscar productos"
                            allowClear
                            onSearch={setProductSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            value={productSearch}
                            className="flex-1"
                        />
                        <Select
                            placeholder="Ordenar"
                            value={sortBy}
                            onChange={setSortBy}
                            className="w-full md:w-48"
                        >
                            <Option value="name_asc">Nombre A–Z</Option>
                            <Option value="price_asc">Precio ↑</Option>
                            <Option value="price_desc">Precio ↓</Option>
                        </Select>
                        <Segmented
                            value={gridDensity}
                            onChange={setGridDensity}
                            options={[
                                { label: 'Amplia', value: 'comfortable' },
                                { label: 'Compacta', value: 'compact' },
                            ]}
                        />
                    </div>
                    <div className={gridDensity === 'compact'
                        ? 'grid grid-cols-2 lg:grid-cols-4 gap-3'
                        : 'grid grid-cols-2 md:grid-cols-3 gap-4'}>
                        {filteredProducts.map(p => (
                            <Card
                                key={p._id}
                                hoverable
                                onClick={() => handleAddProduct(p._id)}
                                className="cursor-pointer rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition"
                                cover={
                                    <div className="relative">
                                        <img alt={p.name} src={p.image || '/placeholder.jpg'} className="h-36 w-full object-cover" />
                                        {(p.priceDiscount && p.priceDiscount > 0) && (
                                            <span className="absolute top-2 left-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full shadow">
                                                Oferta
                                            </span>
                                        )}
                                    </div>
                                }
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="font-medium text-slate-800 line-clamp-2">{p.name}</div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-900">
                                            ${((p.priceDiscount ?? p.priceBase) ?? 0).toLocaleString('es-CL')}
                                        </div>
                                        {p.priceDiscount && (
                                            <div className="text-xs text-gray-400 line-through">
                                                ${Number(p.priceBase ?? 0).toLocaleString('es-CL')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                <Drawer
                    title="Productos"
                    placement="left"
                    onClose={() => setDrawerVisible(false)}
                    open={drawerVisible}
                    width="100%"
                    className="md:hidden"
                >
                    <div className="flex gap-2 mb-4">
                        <Input.Search
                            placeholder="Buscar productos"
                            allowClear
                            onSearch={setProductSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            value={productSearch}
                        />
                        <Select
                            placeholder="Ordenar"
                            value={sortBy}
                            onChange={setSortBy}
                            className="w-40"
                        >
                            <Option value="name_asc">Nombre A–Z</Option>
                            <Option value="price_asc">Precio ↑</Option>
                            <Option value="price_desc">Precio ↓</Option>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {filteredProducts.map(p => (
                            <Card
                                key={p._id}
                                hoverable
                                onClick={() => handleAddProduct(p._id)}
                                className="cursor-pointer rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition"
                                cover={<img alt={p.name} src={p.image || '/placeholder.jpg'} className="h-32 w-full object-cover" />}
                            >
                                <Card.Meta title={p.name} description={`$${p.priceBase}`} />
                            </Card>
                        ))}
                    </div>
                </Drawer>


                {/* Panel derecho: carrito */}
                <div className="flex-1 bg-white/70 backdrop-blur-md flex flex-col justify-between h-screen relative overflow-y-auto border-l border-gray-100">
                    <div className="p-6 overflow-y-auto pb-40">
                        <div className="mb-4">
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">Punto de Venta</h1>
                            <p className="text-slate-500">Registra ventas en Local o despachos con una experiencia moderna.</p>
                        </div>

                        {/* Cliente */}
                        <div className="mb-4">
                            <Button onClick={() => setCliente({ name: '', phone: '' })} className="rounded-full">+ Agregar Cliente</Button>
                        </div>

                        <Form.Item label="Cliente" required>
                            <Select
                                showSearch
                                placeholder="Buscar cliente por nombre"
                                optionFilterProp="label"
                                onChange={(value) => {
                                    const client = clients.find(c => c._id === value);
                                    if (client) {
                                        setSelectedCustomer({
                                            id: client._id,
                                            name: client.name,
                                            phone: client.phone,
                                            address: client.address,
                                            lat: client.lat,
                                            lon: client.lon,
                                            observations: '',
                                            notificationToken: client.token,
                                        });
                                    }
                                }}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                loading={isClientsLoading}
                                value={selectedCustomer?.id}
                            >
                                {clients.map(client => (
                                    <Option
                                        key={client._id}
                                        value={client._id}
                                        label={`${client.name} - ${client.phone}`}
                                    >
                                        {client.name} - {client.phone}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        {selectedCustomer && (
                            <Card
                                size="small"
                                title="Cliente Seleccionado"
                                className="mb-4 rounded-2xl border border-gray-100 shadow-sm"
                                extra={
                                    <Button
                                        type="text"
                                        danger
                                        onClick={() => setSelectedCustomer(null)}
                                    >
                                        Quitar
                                    </Button>
                                }
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        value={selectedCustomer.name}
                                        onChange={(e) => setSelectedCustomer(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Nombre"
                                        addonBefore="👤"
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
                                                onChange={(e) =>
                                                    setSelectedCustomer(prev => ({ ...prev, address: e.target.value }))
                                                }
                                                placeholder="Dirección"
                                                addonBefore="📍"
                                            />
                                        </Autocomplete>
                                    </div>

                                    {typeof selectedCustomer.lat === 'number' && typeof selectedCustomer.lon === 'number' && (
                                        <div className="col-span-2 border border-gray-100 rounded-xl overflow-hidden shadow-sm" style={{ height: '220px' }}>
                                            <ClientMap
                                                lat={selectedCustomer.lat}
                                                lng={selectedCustomer.lon}
                                                draggable={true}
                                                onDragEnd={(lat, lng) =>
                                                    setSelectedCustomer(prev => ({
                                                        ...prev,
                                                        lat,
                                                        lon: lng,
                                                    }))
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                        <div className="md:hidden p-2">
                            <Button type="primary" onClick={() => setDrawerVisible(true)} block className="rounded-full">
                                Ver Productos
                            </Button>
                        </div>
                        {/* Carrito */}
                        <div className="mb-6">
                            <Collapse accordion bordered={false} className="bg-white/70 backdrop-blur rounded-2xl border border-gray-100 shadow-sm">
                                {selectedProducts.map(product => (
                                    <Panel
                                        header={`${product.quantity} x ${product.name} - $${product.totalPrice.toFixed(0)}`}
                                        key={product.productId}
                                        extra={
                                            <Button
                                                danger
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveProduct(product.productId);
                                                }}
                                            >
                                                🗑️
                                            </Button>
                                        }
                                    >
                                        <Input
                                            type="number"
                                            min={1}
                                            value={product.quantity}
                                            onChange={e => handleChangeQuantity(product.productId, parseInt(e.target.value))}
                                            addonBefore="Cantidad"
                                            className="mb-2"
                                        />
                                        <Input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={product.discount}
                                            onChange={e => handleChangeDiscount(product.productId, parseInt(e.target.value))}
                                            addonBefore="Descuento %"
                                            className="mb-2"
                                        />
                                        <Input.TextArea
                                            rows={2}
                                            placeholder="Observación del producto (opcional)"
                                            value={product.notes || ''}
                                            onChange={e => {
                                                const value = e.target.value;
                                                setSelectedProducts(prev =>
                                                    prev.map(p =>
                                                        p.productId === product.productId ? { ...p, notes: value } : p
                                                    )
                                                );
                                            }}
                                            className="mt-2"
                                        />
                                    </Panel>
                                ))}
                            </Collapse>
                        </div>

                        {/* Tipo de entrega */}
                        <div className="mb-4">
                            <div className="text-sm text-gray-500 mb-2">Tipo de entrega</div>
                            <Radio.Group value={deliveryType} onChange={e => setDeliveryType(e.target.value)}>
                                <Radio value="local">Local</Radio>
                                <Radio value="domicilio">Despacho</Radio>
                            </Radio.Group>
                        </div>

                        {(deliveryType === 'domicilio') && (
                            <div className="mb-6 grid grid-cols-1 gap-4">
                                <DatePicker
                                    format="YYYY-MM-DD"
                                    placeholder="Día de entrega"
                                    style={{ width: '100%' }}
                                    value={deliveryDate ? dayjs(deliveryDate) : null}
                                    onChange={(date) => setDeliveryDate(date ? date.toDate() : null)}
                                />
                                <Select
                                    placeholder="Horario de entrega"
                                    value={deliveryHour}
                                    onChange={setDeliveryHour}
                                    style={{ width: '100%' }}
                                >
                                    {hourBlocks.map(hour => (
                                        <Option key={hour} value={hour}>{hour}</Option>
                                    ))}
                                </Select>
                                {deliveryType === 'domicilio' && (
                                    <Input
                                        placeholder="Costo de Envío"
                                        value={shippingCost}
                                        onChange={e => setShippingCost(e.target.value)}
                                        addonBefore="$"
                                    />
                                )}
                            </div>
                        )}

                        <div className="mb-6">
                            <Input.TextArea
                                rows={2}
                                placeholder="Observación general (opcional)"
                                value={observation}
                                onChange={e => setObservation(e.target.value)}
                            />
                        </div>

                        <div className="mb-4">
                            <Select
                                className="w-full"
                                placeholder="Método de Pago"
                                value={paymentMethod}
                                onChange={setPaymentMethod}
                            >
                                {paymentMethods.map(m => (
                                    <Option key={m} value={m}>{m}</Option>
                                ))}
                            </Select>
                        </div>

                        <div className="mb-4">
                            <div className="text-sm text-gray-500 mb-2">Método de pago</div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {paymentMethods.map(m => (
                                    <Button
                                        key={m}
                                        type={paymentMethod === m ? 'primary' : 'default'}
                                        onClick={() => setPaymentMethod(m)}
                                        block
                                        className={paymentMethod === m ? 'shadow-md' : 'bg-white'}
                                    >
                                        {m === 'efectivo' && '💵 '}
                                        {m === 'transferencia' && '🏦 '}
                                        {m === 'tarjeta' && '💳 '}
                                        {m !== 'efectivo' && m !== 'transferencia' && m !== 'tarjeta' && '🧾 '}
                                        {m.charAt(0).toUpperCase() + m.slice(1)}
                                    </Button>
                                ))}
                            </div>
                            <Input
                                placeholder="Monto recibido"
                                value={amountReceived}
                                onChange={e => setAmountReceived(e.target.value)}
                                addonBefore="$"
                            />
                        </div>

                        <div className="mb-6">
                            <div>Subtotal: ${subtotal.toFixed(0)}</div>
                            <div>Impuesto: ${tax.toFixed(0)}</div>
                            <div className="font-bold text-lg">Total: ${total.toFixed(0)}</div>
                            <div className="text-green-600 font-semibold mt-2">Vuelto: ${vuelto.toFixed(0)}</div>
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-5 bg-white/80 backdrop-blur border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-gray-500">Total</div>
                            <div className="text-3xl font-extrabold tracking-tight text-slate-900">${total.toFixed(0)}</div>
                        </div>
                        <div className="flex gap-4">
                            <Button type="default" block className="rounded-full">
                                Guardar (pendiente)
                            </Button>
                            <Button type="primary" block onClick={handleSubmit} className="rounded-full shadow-md">
                                Cobrar
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default VentasPOS;
