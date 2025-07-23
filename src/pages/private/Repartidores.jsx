// Dealers.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { Table, Button, Space, Input, Modal, Form, Card, message, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import useDealers from '../../hooks/useDealers.js';
import Dealers from '../../services/Dealers.js';
import { useAuth } from '../../context/AuthContext.jsx';

const { Search } = Input;

const Repartidores = () => {
    const { user } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingDealer, setEditingDealer] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const { data, isLoading, refetch } = useDealers({ page: 1, limit: 100 });
    const dealers = data?.data?.docs || [];
    const pageSize = 5;
    const isMobile = useMediaQuery({ maxWidth: 768 });

    const filteredDealers = searchText
        ? dealers.filter((item) =>
            item.name.toLowerCase().includes(searchText.toLowerCase()) ||
            item.mail.toLowerCase().includes(searchText.toLowerCase())
        )
        : dealers;

    const paginatedDealers = filteredDealers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Correo', dataIndex: 'mail', key: 'mail' },
        { title: 'Zona', dataIndex: 'zoneId', key: 'zoneId', render: (zoneId) => zoneId || 'Sin zona' },
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
        setEditingDealer(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEditar = (dealer) => {
        setEditingDealer(dealer);
        form.setFieldsValue({
            nombre: dealer.name,
            correo: dealer.mail,
            clave: dealer.password || '',
        });
        setIsModalVisible(true);
    };

    const handleModalOk = () => {
        form.validateFields().then(async (values) => {
            try {
                const payload = {
                    name: values.nombre.trim(),
                    mail: values.correo.trim(),
                    password: values.clave.trim(),
                    storeId: user.storeId,
                    zoneId: '',
                };

                let response;
                if (editingDealer) {
                    response = await Dealers.edit(editingDealer._id, payload);
                } else {
                    response = await Dealers.create(payload);
                }

                if (response?.success) {
                    message.success(response.message || (editingDealer ? 'Dealer actualizado' : 'Dealer creado'));
                    refetch();
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingDealer(null);
                } else {
                    message.warning(response.message || 'No se pudo completar la acción');
                }
            } catch (error) {
                const errorMessage = error?.response?.data?.message || error.message || 'Error de servidor';
                message.error(errorMessage);
            }
        }).catch(() => {
            message.error('Por favor completa el formulario correctamente.');
        });
    };

    const handleDelete = (dealer) => {
        Modal.confirm({
            title: '¿Eliminar dealer?',
            content: `Dealer: ${dealer.name}`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const response = await Dealers.delete(dealer._id);
                    if (response?.success) {
                        message.success(response.message || 'Dealer eliminado');
                        refetch();
                    } else {
                        message.warning(response.message || 'No se pudo eliminar');
                    }
                } catch (error) {
                    const errorMessage = error?.response?.data?.message || error.message || 'Error de servidor';
                    message.error(errorMessage);
                }
            }
        });
    };

    const handleBuscar = (value) => {
        setCurrentPage(1);
        setSearchText(value);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingDealer(null);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Dealers</h1>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAgregar}>Agregar Dealer</Button>
                </div>

                <div className="mb-6">
                    <Search
                        placeholder="Buscar dealer..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={handleBuscar}
                        onChange={(e) => handleBuscar(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    {isMobile ? (
                        paginatedDealers.length > 0 ? (
                            <div className="grid gap-4">
                                {paginatedDealers.map((dealer) => (
                                    <Card key={dealer._id} bordered>
                                        <p><strong>Nombre:</strong> {dealer.name}</p>
                                        <p><strong>Correo:</strong> {dealer.mail}</p>
                                        <p><strong>Zona:</strong> {dealer.zoneId || 'Sin zona'}</p>
                                        <div className="flex gap-2 mt-2">
                                            <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => handleEditar(dealer)}>Editar</Button>
                                            <Button size="small" type="danger" icon={<DeleteOutlined />} onClick={() => handleDelete(dealer)}>Eliminar</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex justify-center items-center min-h-[300px]">
                                <Empty description="No hay dealers" />
                            </div>
                        )
                    ) : (
                        <Table
                            dataSource={filteredDealers}
                            columns={columns}
                            loading={isLoading}
                            pagination={{ pageSize }}
                            bordered
                            rowKey="_id"
                        />
                    )}
                </div>

                <Modal
                    title={editingDealer ? 'Editar Dealer' : 'Agregar Dealer'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText={editingDealer ? 'Guardar Cambios' : 'Agregar'}
                    cancelText="Cancelar"
                    width={600}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}>
                            <Input placeholder="Nombre" />
                        </Form.Item>

                        <Form.Item name="correo" label="Correo" rules={[{ required: true, type: 'email', message: 'Por favor ingresa un correo válido' }]}>
                            <Input placeholder="Correo" />
                        </Form.Item>

                        <Form.Item name="clave" label="Clave" rules={[{ required: true, message: 'Por favor ingresa la clave' }]}>
                            <Input.Password placeholder="Clave" />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default Repartidores;
