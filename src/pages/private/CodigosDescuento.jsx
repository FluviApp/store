// CodigosDescuento.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { Table, Button, Space, Input, Modal, Form, Card, message, Empty, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import useDiscountCodes from '../../hooks/useDiscountCodes.js';
import DiscountCodes from '../../services/DiscountCodes.js';
import { useAuth } from '../../context/AuthContext.jsx';

const { Search } = Input;

const CodigosDescuento = () => {
    const { user } = useAuth();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingCode, setEditingCode] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const { data, isLoading, refetch } = useDiscountCodes({ page: 1, limit: 100 });
    const codes = data?.data?.docs || [];
    const pageSize = 5;
    const isMobile = useMediaQuery({ maxWidth: 768 });

    const filteredCodes = searchText
        ? codes.filter((item) =>
            item.name.toLowerCase().includes(searchText.toLowerCase()) ||
            item.code.toLowerCase().includes(searchText.toLowerCase())
        )
        : codes;

    const paginatedCodes = filteredCodes.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Código', dataIndex: 'code', key: 'code' },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status) => status ? 'Activo' : 'Inactivo'
        },
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
        setEditingCode(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEditar = (code) => {
        setEditingCode(code);
        form.setFieldsValue({
            nombre: code.name,
            codigo: code.code,
            estado: code.status,
        });
        setIsModalVisible(true);
    };

    const handleModalOk = () => {
        form.validateFields().then(async (values) => {
            try {
                const payload = {
                    name: values.nombre.trim(),
                    code: values.codigo.trim(),
                    status: values.estado,
                    storeId: user.storeId,
                };

                let response;
                if (editingCode) {
                    response = await DiscountCodes.edit(editingCode._id, payload);
                } else {
                    response = await DiscountCodes.create(payload);
                }

                if (response?.success) {
                    message.success(response.message || (editingCode ? 'Código actualizado' : 'Código creado'));
                    refetch();
                    setIsModalVisible(false);
                    form.resetFields();
                    setEditingCode(null);
                } else {
                    message.warning(response.message || 'No se pudo completar la acción');
                }
            } catch (error) {
                const errorMessage = error?.response?.data?.message || error.message || 'No se pudo conectar con el servidor';
                message.error(errorMessage);
            }
        }).catch(() => {
            message.error('Por favor completá correctamente el formulario.');
        });
    };

    const handleDelete = (code) => {
        Modal.confirm({
            title: '¿Eliminar código?',
            content: `Esta acción no se puede deshacer. Código: ${code.name}`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const response = await DiscountCodes.delete(code._id);
                    if (response?.success) {
                        message.success(response.message || 'Código eliminado exitosamente');
                        refetch();
                    } else {
                        message.warning(response.message || 'No se pudo eliminar el código');
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
        setSearchText(value);
    };

    const handleModalCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingCode(null);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Códigos de Descuento</h1>
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAgregar}>
                        Agregar Código
                    </Button>
                </div>

                <div className="mb-6">
                    <Search
                        placeholder="Buscar código..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={handleBuscar}
                        onChange={(e) => handleBuscar(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    {isMobile ? (
                        paginatedCodes.length > 0 ? (
                            <div className="grid gap-4">
                                {paginatedCodes.map((code) => (
                                    <Card key={code._id} bordered>
                                        <p><strong>Nombre:</strong> {code.name}</p>
                                        <p><strong>Código:</strong> {code.code}</p>
                                        <p><strong>Estado:</strong> {code.status ? 'Activo' : 'Inactivo'}</p>
                                        <div className="flex gap-2 mt-2">
                                            <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => handleEditar(code)}>Editar</Button>
                                            <Button size="small" type="danger" icon={<DeleteOutlined />} onClick={() => handleDelete(code)}>Eliminar</Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex justify-center items-center min-h-[300px]">
                                <Empty description="No hay códigos" />
                            </div>
                        )
                    ) : (
                        <Table
                            dataSource={filteredCodes}
                            columns={columns}
                            loading={isLoading}
                            pagination={{ pageSize }}
                            bordered
                            rowKey="_id"
                        />
                    )}
                </div>

                <Modal
                    title={editingCode ? 'Editar Código' : 'Agregar Código'}
                    open={isModalVisible}
                    onOk={handleModalOk}
                    onCancel={handleModalCancel}
                    okText={editingCode ? 'Guardar Cambios' : 'Agregar'}
                    cancelText="Cancelar"
                    width={800}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item name="nombre" label="Nombre" rules={[{ required: true, message: 'Por favor ingresa el nombre' }]}>
                            <Input placeholder="Nombre del código" />
                        </Form.Item>

                        <Form.Item name="codigo" label="Código" rules={[{ required: true, message: 'Por favor ingresa el código' }]}>
                            <Input placeholder="Ej: VERANO2024" />
                        </Form.Item>

                        <Form.Item name="estado" label="Estado" valuePropName="checked">
                            <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default CodigosDescuento;
