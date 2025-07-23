import React, { useState } from 'react';
import {
    Table, Button, Space, Input, Modal, Card, message, Empty, Row, Col
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../context/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import Notifications from '../../services/Notifications';
import Sidebar from '../../components/Sidebar';

const { Search } = Input;

const Notificaciones = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isMobile = useMediaQuery({ maxWidth: 768 });

    const { data: notificationsData, refetch, isLoading } = useNotifications();
    const notifications = notificationsData?.data || [];

    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ title: '', body: '', token: '', url: '' });

    const filteredNotifications = searchText
        ? notifications.filter(n => n.title.toLowerCase().includes(searchText.toLowerCase()))
        : notifications;

    const handleDelete = (item) => {
        Modal.confirm({
            title: '¿Eliminar notificación?',
            content: `Esta acción no se puede deshacer. Notificación: ${item.title}`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const response = await Notifications.delete(item._id);
                    if (response?.success) {
                        message.success('Notificación eliminada correctamente');
                        refetch();
                    }
                } catch (err) {
                    message.error(err.message || 'Error al eliminar');
                }
            },
        });
    };

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        if (item) {
            setFormData({
                title: item.title,
                body: item.body,
                token: item.token || '',
                url: item.url || '',
            });
        } else {
            setFormData({ title: '', body: '', token: '', url: '' });
        }
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setFormData({ title: '', body: '', token: '', url: '' });
        setEditingItem(null);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.body) {
            message.error('El título y el cuerpo son obligatorios');
            return;
        }

        const data = {
            ...formData,
            storeId: user.storeId,
        };

        try {
            const response = editingItem
                ? await Notifications.edit(editingItem._id, data)
                : await Notifications.create(data);

            if (response?.success) {
                message.success(editingItem ? 'Notificación editada correctamente' : 'Notificación creada correctamente');
                refetch();
                handleCloseModal();
            } else {
                message.warning(response?.message || 'No se pudo guardar la notificación');
            }
        } catch (err) {
            message.error(err.message || 'Error al guardar la notificación');
        }
    };

    const columns = [
        { title: 'Título', dataIndex: 'title', key: 'title' },
        { title: 'Cuerpo', dataIndex: 'body', key: 'body' },
        { title: 'URL', dataIndex: 'url', key: 'url' },
        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>Editar</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>Eliminar</Button>
                </Space>
            ),
        },
    ];

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto">
                <div className="mb-6">
                    <Row gutter={[16, 16]}>
                        <Col span={24} className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-gray-800">Notificaciones</h1>
                            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Volver</Button>
                        </Col>
                        <Col span={24} className="flex flex-col md:flex-row md:justify-end gap-2">
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Agregar Notificación</Button>
                        </Col>
                    </Row>
                </div>

                <Search
                    placeholder="Buscar por título"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={setSearchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="mb-4"
                />

                {isMobile ? (
                    filteredNotifications.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredNotifications.map(n => (
                                <Card key={n._id} title={n.title} bordered>
                                    <p>{n.body}</p>
                                    {n.url && <p className="mt-2 text-blue-600">{n.url}</p>}
                                    <Space wrap>
                                        <Button icon={<EditOutlined />} onClick={() => handleOpenModal(n)}>Editar</Button>
                                        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(n)}>Eliminar</Button>
                                    </Space>
                                </Card>
                            ))}
                        </div>
                    ) : <Empty description="No hay notificaciones" />
                ) : (
                    <Table
                        dataSource={filteredNotifications}
                        columns={columns}
                        rowKey="_id"
                        loading={isLoading}
                        pagination={{ pageSize: 5, position: ['bottomCenter'] }}
                        bordered
                    />
                )}

                <Modal
                    open={isModalVisible}
                    onCancel={handleCloseModal}
                    onOk={handleSubmit}
                    okText={editingItem ? 'Guardar cambios' : 'Crear'}
                    cancelText="Cancelar"
                    title={editingItem ? 'Editar Notificación' : 'Crear Notificación'}
                >
                    <Input
                        placeholder="Título"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="mb-4"
                    />
                    <Input
                        placeholder="Cuerpo"
                        value={formData.body}
                        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                        className="mb-4"
                    />
                    <Input
                        placeholder="Token (opcional)"
                        value={formData.token}
                        onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                        className="mb-4"
                    />
                    <Input
                        placeholder="URL (opcional)"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="mb-4"
                    />
                </Modal>
            </div>
        </div>
    );
};

export default Notificaciones;
