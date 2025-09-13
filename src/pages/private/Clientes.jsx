// Clientes.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { Table, Button, Space, Input, Modal, Form, Card, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import ClientMap from '../../components/ClientMap.jsx';
import useClients from '../../hooks/useClients.js';
import Clients from '../../services/Clients.js';
import { useAuth } from '../../context/AuthContext.jsx';

const { Search } = Input;
const libraries = ['places'];

const Clientes = () => {
    const { user } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingClient, setEditingClient] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [direccion, setDireccion] = useState('');
    const [selectedLat, setSelectedLat] = useState(null);
    const [selectedLng, setSelectedLng] = useState(null);
    const [mapVisible, setMapVisible] = useState(false);
    const [autocompleteRef, setAutocompleteRef] = useState(null);

    const { data, isLoading, refetch } = useClients({ page: 1, limit: 100 });
    const clients = data?.data?.docs || [];
    const pageSize = 5;
    const isMobile = useMediaQuery({ maxWidth: 768 });

    // 🔹 Helper seguro para normalizar cualquier valor
    const norm = (v) => (v == null ? '' : String(v)).toLowerCase();

    const filteredClients = searchText
        ? clients
            .filter(Boolean)
            .filter((item) => {
                const q = norm(searchText).trim();
                return (
                    norm(item?.name).includes(q) ||
                    norm(item?.email).includes(q) ||
                    norm(item?.phone).includes(q) ||
                    norm(item?.address).includes(q)
                );
            })
        : clients;

    const paginatedClients = filteredClients.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Correo', dataIndex: 'email', key: 'email' },
        { title: 'Teléfono', dataIndex: 'phone', key: 'phone' },
        { title: 'Dirección', dataIndex: 'address', key: 'address' },
        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => handleEditar(record)}>Editar</Button>
                    <Button type="danger" icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>Eliminar</Button>
                </Space>
            ),
        },
    ];

    const handleAgregar = () => {
        setEditingClient(null);
        form.resetFields();
        setDireccion('');
        setSelectedLat(null);
        setSelectedLng(null);
        setMapVisible(false); // 👈 reiniciás visibilidad
        setIsModalVisible(true);
    };

    const handleEditar = (client) => {
        setEditingClient(client);
        form.setFieldsValue({
            nombre: client.name,
            email: client.email,
            clave: client.password || '',
            direccion: client.address, // esto es clave si usas el estado sincronizado
            bloque: client.block,
            telefono: client.phone,
        });
        setDireccion(client.address || ''); // sincroniza con el estado
        setSelectedLat(client.lat ?? null);
        setSelectedLng(client.lon ?? null);
        setMapVisible(client.lat !== null && client.lon !== null);
        setIsModalVisible(true);
    };

    const handleModalOk = () => {
        form.validateFields().then(async (values) => {
            try {
                const payload = {
                    name: values.nombre.trim(),
                    email: values.email.trim(),
                    password: values.clave.trim(),
                    address: values.direccion.trim(),
                    phone: values.telefono.trim(),
                    block: values.bloque?.trim() || '',
                    lat: selectedLat,
                    lon: selectedLng,
                    verified: false,
                    token: '',
                    storeId: user.storeId,
                };

                console.log('🚀 Payload a enviar:', payload);

                let response;
                if (editingClient) {
                    response = await Clients.edit(editingClient._id, payload);
                } else {
                    response = await Clients.create(payload);
                }

                if (response?.success) {
                    message.success(response.message || (editingClient ? 'Cliente actualizado' : 'Cliente creado'));
                    refetch();
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingClient(null);
                    setSelectedLat(null);
                    setSelectedLng(null);
                    setMapVisible(false);
                } else {
                    message.warning(response.message || 'No se pudo completar la acción');
                }
            } catch (error) {
                const errorMessage = error?.response?.data?.message || error.message || 'No se pudo conectar con el servidor';
                console.error('❌ Error capturado:', error);
                message.error(errorMessage);
            }
        }).catch(() => {
            message.error('Por favor completá correctamente el formulario.');
        });
    };

    const handleDelete = (client) => {
        Modal.confirm({
            title: '¿Eliminar cliente?',
            content: `Esta acción no se puede deshacer. Cliente: ${client.name}`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const response = await Clients.delete(client._id);
                    if (response?.success) {
                        message.success(response.message || 'Cliente eliminado exitosamente');
                        refetch();
                    } else {
                        message.warning(response.message || 'No se pudo eliminar el cliente');
                    }
                } catch (error) {
                    const errorMessage = error?.response?.data?.message || error.message || 'No se pudo conectar con el servidor';
                    message.error(errorMessage);
                }
            }
        });
    };

    const handleBuscar = (value) => {
        setCurrentPage(1);
        setSearchText(value ?? ''); // 🔹 evita undefined
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingClient(null);
        setSelectedLat(null);
        setSelectedLng(null);
        setMapVisible(false);
    };

    const onPlaceChanged = () => {
        if (autocompleteRef) {
            const place = autocompleteRef.getPlace();
            if (place.geometry) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setSelectedLat(lat);
                setSelectedLng(lng);
                setMapVisible(true); // 👈 Esto es crucial
                form.setFieldsValue({ direccion: place.formatted_address });
            }
        }
    };

    useEffect(() => {
        if (selectedLat && selectedLng) {
            console.log('🛰️ Coordenadas para el mapa:', selectedLat, selectedLng);
        }
    }, [selectedLat, selectedLng])

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAgregar}>
                        Agregar Cliente
                    </Button>
                </div>

                <div className="mb-6">
                    <Search
                        placeholder="Buscar cliente..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={handleBuscar}
                        onChange={(e) => handleBuscar(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    {isMobile ? (
                        paginatedClients.length > 0 ? (
                            <div className="grid gap-4">
                                {paginatedClients.map((client) => (
                                    <Card key={client._id} bordered>
                                        <p><strong>Nombre:</strong> {client.name}</p>
                                        <p><strong>Correo:</strong> {client.email}</p>
                                        <p><strong>Teléfono:</strong> {client.phone}</p>
                                        <div className="flex gap-2 mt-2">
                                            <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => handleEditar(client)}>Editar</Button>
                                            <Button size="small" type="danger" icon={<DeleteOutlined />} onClick={() => handleDelete(client)}>Eliminar</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex justify-center items-center min-h-[300px]">
                                <Empty description="No hay clientes" />
                            </div>
                        )
                    ) : (
                        <Table
                            dataSource={filteredClients}
                            columns={columns}
                            loading={isLoading}
                            pagination={{ pageSize }}
                            bordered
                            rowKey="_id"
                        />
                    )}
                </div>

                <Modal
                    title={editingClient ? 'Editar Cliente' : 'Agregar Cliente'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText={editingClient ? 'Guardar Cambios' : 'Agregar'}
                    cancelText="Cancelar"
                    width={800}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}>
                            <Input placeholder="Nombre" />
                        </Form.Item>

                        <Form.Item name="email" label="Correo" rules={[
                            { required: true, message: 'Por favor ingresa el correo' },
                            { type: 'email', message: 'Correo inválido' }
                        ]}>
                            <Input placeholder="Correo" />
                        </Form.Item>

                        <Form.Item name="clave" label="Clave" rules={[{ required: true, message: 'Por favor ingresa la clave' }]}>
                            <Input.Password placeholder="Clave" />
                        </Form.Item>

                        <Form.Item
                            name="direccion"
                            label="Dirección"
                            rules={[{ required: true, message: 'Por favor ingresa la dirección' }]}
                        >
                            <Autocomplete
                                onLoad={(ref) => setAutocompleteRef(ref)}
                                onPlaceChanged={onPlaceChanged}
                            >
                                <Input
                                    placeholder="Buscar dirección..."
                                    autoComplete="off"
                                    value={direccion}
                                    onChange={(e) => {
                                        setDireccion(e.target.value);
                                        form.setFieldsValue({ direccion: e.target.value }); // mantiene sincronización
                                    }}
                                />
                            </Autocomplete>
                        </Form.Item>

                        <Form.Item name="bloque" label="Block o Torre (opcional)">
                            <Input placeholder="Ej: Torre B, Block 5, Edificio Azul..." />
                        </Form.Item>

                        {mapVisible && typeof selectedLat === 'number' && typeof selectedLng === 'number' && (
                            <ClientMap
                                lat={selectedLat}
                                lng={selectedLng}
                                onDragEnd={(lat, lng) => {
                                    setSelectedLat(lat);
                                    setSelectedLng(lng);
                                }}
                            />
                        )}

                        <Form.Item name="telefono" label="Teléfono" rules={[{ required: true, message: 'Por favor ingresa el teléfono' }]}>
                            <Input addonBefore="+56" placeholder="123456789" />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default Clientes;
