import React, { useState, useMemo } from 'react';
import {
    Table, Button, Space, Input, Modal, Card, message, Empty, Row, Col, Select
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../context/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import useClients from '../../hooks/useClients';
import Notifications from '../../services/Notifications';
import Sidebar from '../../components/Sidebar';

const { Search } = Input;
const { Option } = Select;

const Notificaciones = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isMobile = useMediaQuery({ maxWidth: 768 });

    const { data: notificationsData, refetch, isLoading } = useNotifications();
    const notifications = notificationsData?.data || [];

    // Obtener todos los clientes con token válido
    const { data: clientsData } = useClients({ page: 1, limit: 1000 });
    const allClients = clientsData?.data?.docs || [];

    // Filtrar solo clientes con token válido (que empiece con ExponentPushToken)
    const clientsWithToken = useMemo(() => {
        return allClients.filter(client => 
            client.token && 
            typeof client.token === 'string' && 
            client.token.trim().startsWith('ExponentPushToken')
        );
    }, [allClients]);

    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formData, setFormData] = useState({ 
        title: '', 
        body: '', 
        recipientType: 'ALL', 
        selectedToken: '', 
        url: '' 
    });

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
            // Si tiene token, es un envío específico, si no, es ALL
            const hasToken = item.token && item.token.trim().startsWith('ExponentPushToken');
            setFormData({
                title: item.title,
                body: item.body,
                recipientType: hasToken ? 'SPECIFIC' : 'ALL',
                selectedToken: item.token || '',
                url: item.url || '',
            });
        } else {
            setFormData({ 
                title: '', 
                body: '', 
                recipientType: 'ALL', 
                selectedToken: '', 
                url: '' 
            });
        }
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setFormData({ 
            title: '', 
            body: '', 
            recipientType: 'ALL', 
            selectedToken: '', 
            url: '' 
        });
        setEditingItem(null);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.body) {
            message.error('El título y el cuerpo son obligatorios');
            return;
        }

        // Validar que si es específico, tenga token seleccionado
        if (formData.recipientType === 'SPECIFIC' && !formData.selectedToken) {
            message.error('Debes seleccionar un cliente o elegir "Enviar a todos"');
            return;
        }

        const data = {
            title: formData.title,
            body: formData.body,
            url: formData.url || '',
            recipientType: formData.recipientType,
            selectedToken: formData.recipientType === 'SPECIFIC' ? formData.selectedToken : undefined,
            storeId: user.storeId,
        };

        try {
            const response = editingItem
                ? await Notifications.edit(editingItem._id, data)
                : await Notifications.create(data);

            if (response?.success) {
                const successMessage = editingItem 
                    ? 'Notificación editada correctamente' 
                    : formData.recipientType === 'ALL'
                        ? `Notificación creada y enviada a ${response.data?.sentCount || clientsWithToken.length} usuarios`
                        : 'Notificación creada y enviada correctamente';
                message.success(successMessage);
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
                    width={600}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Título *</label>
                            <Input
                                placeholder="Título de la notificación"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Cuerpo *</label>
                            <Input.TextArea
                                placeholder="Mensaje de la notificación"
                                value={formData.body}
                                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Tipo de envío *</label>
                            <Select
                                style={{ width: '100%' }}
                                placeholder="Selecciona el tipo de envío"
                                value={formData.recipientType}
                                onChange={(value) => {
                                    setFormData({ 
                                        ...formData, 
                                        recipientType: value,
                                        selectedToken: value === 'ALL' ? '' : formData.selectedToken
                                    });
                                }}
                            >
                                <Option value="ALL">
                                    📢 Enviar a todos los usuarios ({clientsWithToken.length} usuarios con token)
                                </Option>
                                <Option value="SPECIFIC">
                                    👤 Enviar a un cliente específico
                                </Option>
                            </Select>
                            {formData.recipientType === 'ALL' && clientsWithToken.length === 0 && (
                                <p className="text-xs text-yellow-600 mt-1">
                                    ⚠️ No hay usuarios con tokens de notificación registrados
                                </p>
                            )}
                        </div>
                        {formData.recipientType === 'SPECIFIC' && (
                            <div>
                                <label className="block text-sm font-medium mb-2">Cliente específico *</label>
                                <Select
                                    style={{ width: '100%' }}
                                    placeholder="Selecciona un cliente"
                                    value={formData.selectedToken}
                                    onChange={(value) => setFormData({ ...formData, selectedToken: value })}
                                    showSearch
                                    filterOption={(input, option) =>
                                        option?.children?.toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {clientsWithToken.map(client => (
                                        <Option key={client._id} value={client.token}>
                                            {client.name || 'Sin nombre'} - {client.email}
                                        </Option>
                                    ))}
                                </Select>
                                {clientsWithToken.length === 0 && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                        ⚠️ No hay clientes con tokens de notificación disponibles
                                    </p>
                                )}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-2">URL (opcional)</label>
                            <Input
                                placeholder="URL a abrir al hacer clic (ej: /pedidos-usuario)"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            />
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default Notificaciones;
