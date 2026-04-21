import React, { useState, useMemo } from 'react';
import {
    Table, Button, Space, Input, Modal, Card, message, Empty, Row, Col, Select,
    Tabs, DatePicker, Switch, Upload, Image, Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import useClients from '../../hooks/useClients';
import useAnnouncements from '../../hooks/useAnnouncements';
import Notifications from '../../services/Notifications';
import Announcements from '../../services/Announcements';
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

    // ===== AVISOS STATE =====
    const { data: announcementsData, refetch: refetchAnnouncements, isLoading: isLoadingAnnouncements } = useAnnouncements();
    const announcements = announcementsData?.data?.data || [];
    const [avisoSearch, setAvisoSearch] = useState('');
    const [avisoModalVisible, setAvisoModalVisible] = useState(false);
    const [editingAviso, setEditingAviso] = useState(null);
    const [avisoForm, setAvisoForm] = useState({ title: '', message: '', endDate: null, active: true });
    const [avisoFile, setAvisoFile] = useState(null);
    const [avisoSubmitting, setAvisoSubmitting] = useState(false);

    const filteredNotifications = searchText
        ? notifications.filter(n => n.title.toLowerCase().includes(searchText.toLowerCase()))
        : notifications;

    const filteredAvisos = avisoSearch
        ? announcements.filter(a =>
            a.title?.toLowerCase().includes(avisoSearch.toLowerCase()) ||
            a.message?.toLowerCase().includes(avisoSearch.toLowerCase())
        )
        : announcements;

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
            const hasToken = item.token && item.token.trim().startsWith('ExponentPushToken');
            setFormData({
                title: item.title,
                body: item.body,
                recipientType: hasToken ? 'SPECIFIC' : 'ALL',
                selectedToken: item.token || '',
                url: item.url || '',
            });
        } else {
            setFormData({ title: '', body: '', recipientType: 'ALL', selectedToken: '', url: '' });
        }
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setFormData({ title: '', body: '', recipientType: 'ALL', selectedToken: '', url: '' });
        setEditingItem(null);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.body) {
            message.error('El título y el cuerpo son obligatorios');
            return;
        }

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

    // ===== AVISOS HANDLERS =====
    const handleOpenAvisoModal = (item = null) => {
        setEditingAviso(item);
        if (item) {
            setAvisoForm({
                title: item.title || '',
                message: item.message || '',
                endDate: item.endDate ? dayjs(item.endDate) : null,
                active: !!item.active,
            });
        } else {
            setAvisoForm({ title: '', message: '', endDate: null, active: true });
        }
        setAvisoFile(null);
        setAvisoModalVisible(true);
    };

    const handleCloseAvisoModal = () => {
        setAvisoModalVisible(false);
        setEditingAviso(null);
        setAvisoForm({ title: '', message: '', endDate: null, active: true });
        setAvisoFile(null);
    };

    const handleSubmitAviso = async () => {
        if (!avisoForm.title?.trim() || !avisoForm.message?.trim()) {
            message.error('Título y mensaje son obligatorios');
            return;
        }
        if (!avisoForm.endDate) {
            message.error('La fecha fin es obligatoria');
            return;
        }
        if (!editingAviso && !avisoFile) {
            message.error('La imagen es obligatoria');
            return;
        }

        const fd = new FormData();
        fd.append('title', avisoForm.title.trim());
        fd.append('message', avisoForm.message.trim());
        fd.append('endDate', avisoForm.endDate.toDate().toISOString());
        fd.append('active', avisoForm.active ? 'true' : 'false');
        fd.append('storeId', user.storeId);
        if (avisoFile) {
            fd.append('image', avisoFile);
        }

        try {
            setAvisoSubmitting(true);
            const response = editingAviso
                ? await Announcements.edit(editingAviso._id, fd)
                : await Announcements.create(fd);

            if (response?.data?.success) {
                message.success(editingAviso ? 'Aviso actualizado' : 'Aviso creado');
                refetchAnnouncements();
                handleCloseAvisoModal();
            } else {
                message.warning(response?.data?.message || 'No se pudo guardar el aviso');
            }
        } catch (err) {
            message.error(err?.response?.data?.message || err.message || 'Error al guardar el aviso');
        } finally {
            setAvisoSubmitting(false);
        }
    };

    const handleDeleteAviso = (item) => {
        Modal.confirm({
            title: '¿Eliminar aviso?',
            content: `Esta acción no se puede deshacer. Aviso: ${item.title}`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const response = await Announcements.delete(item._id);
                    if (response?.data?.success) {
                        message.success('Aviso eliminado');
                        refetchAnnouncements();
                    } else {
                        message.warning(response?.data?.message || 'No se pudo eliminar');
                    }
                } catch (err) {
                    message.error(err.message || 'Error al eliminar');
                }
            },
        });
    };

    const handleToggleAvisoActive = async (item, active) => {
        const fd = new FormData();
        fd.append('active', active ? 'true' : 'false');
        try {
            const response = await Announcements.edit(item._id, fd);
            if (response?.data?.success) {
                message.success(active ? 'Aviso activado' : 'Aviso desactivado');
                refetchAnnouncements();
            }
        } catch (err) {
            message.error('No se pudo actualizar el estado');
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

    const avisoColumns = [
        {
            title: 'Imagen',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            width: 90,
            render: (url) => url
                ? <Image src={url} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 6 }} />
                : <span className="text-gray-400">—</span>,
        },
        { title: 'Título', dataIndex: 'title', key: 'title' },
        {
            title: 'Mensaje',
            dataIndex: 'message',
            key: 'message',
            render: (text) => text?.length > 80 ? `${text.slice(0, 80)}...` : text,
        },
        {
            title: 'Fecha fin',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (d) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—',
        },
        {
            title: 'Estado',
            key: 'active',
            render: (_, record) => {
                const expired = record.endDate && dayjs(record.endDate).isBefore(dayjs());
                if (expired) return <Tag color="default">Expirado</Tag>;
                return <Switch checked={!!record.active} onChange={(val) => handleToggleAvisoActive(record, val)} />;
            },
        },
        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => handleOpenAvisoModal(record)}>Editar</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteAviso(record)}>Eliminar</Button>
                </Space>
            ),
        },
    ];

    const notificationsTab = (
        <>
            <div className="mb-4 flex flex-col md:flex-row md:justify-between gap-2">
                <Search
                    placeholder="Buscar por título"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={setSearchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="md:max-w-md w-full"
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Agregar Notificación</Button>
            </div>

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
        </>
    );

    const avisosTab = (
        <>
            <div className="mb-4 flex flex-col md:flex-row md:justify-between gap-2">
                <Search
                    placeholder="Buscar por título o mensaje"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={setAvisoSearch}
                    onChange={(e) => setAvisoSearch(e.target.value)}
                    className="md:max-w-md w-full"
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenAvisoModal()}>Agregar Aviso</Button>
            </div>

            {isMobile ? (
                filteredAvisos.length > 0 ? (
                    <div className="grid gap-4">
                        {filteredAvisos.map(a => {
                            const expired = a.endDate && dayjs(a.endDate).isBefore(dayjs());
                            return (
                                <Card key={a._id} bordered
                                    cover={a.imageUrl ? <img alt={a.title} src={a.imageUrl} style={{ maxHeight: 180, objectFit: 'cover' }} /> : null}>
                                    <p><strong>{a.title}</strong></p>
                                    <p>{a.message}</p>
                                    <p className="text-gray-500 text-sm">Fin: {dayjs(a.endDate).format('DD/MM/YYYY HH:mm')}</p>
                                    <div className="mb-2">
                                        {expired
                                            ? <Tag color="default">Expirado</Tag>
                                            : <Switch checked={!!a.active} onChange={(val) => handleToggleAvisoActive(a, val)} checkedChildren="Activo" unCheckedChildren="Inactivo" />}
                                    </div>
                                    <Space wrap>
                                        <Button icon={<EditOutlined />} onClick={() => handleOpenAvisoModal(a)}>Editar</Button>
                                        <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteAviso(a)}>Eliminar</Button>
                                    </Space>
                                </Card>
                            );
                        })}
                    </div>
                ) : <Empty description="No hay avisos" />
            ) : (
                <Table
                    dataSource={filteredAvisos}
                    columns={avisoColumns}
                    rowKey="_id"
                    loading={isLoadingAnnouncements}
                    pagination={{ pageSize: 5, position: ['bottomCenter'] }}
                    bordered
                />
            )}
        </>
    );

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
                    </Row>
                </div>

                <Tabs
                    defaultActiveKey="notifications"
                    items={[
                        { key: 'notifications', label: 'Notificaciones', children: notificationsTab },
                        { key: 'avisos', label: 'Avisos', children: avisosTab },
                    ]}
                />

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

                <Modal
                    open={avisoModalVisible}
                    onCancel={handleCloseAvisoModal}
                    onOk={handleSubmitAviso}
                    okText={editingAviso ? 'Guardar cambios' : 'Crear'}
                    cancelText="Cancelar"
                    title={editingAviso ? 'Editar Aviso' : 'Crear Aviso'}
                    width={600}
                    confirmLoading={avisoSubmitting}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Imagen {editingAviso ? '(opcional para reemplazar)' : '*'}</label>
                            <p className="text-xs text-gray-500 mb-2">La imagen debe ser cuadrada de exactamente 300×300 px.</p>
                            <Upload
                                beforeUpload={(file) => {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                        const img = new window.Image();
                                        img.onload = () => {
                                            if (img.width !== 300 || img.height !== 300) {
                                                message.error(`La imagen debe ser 300×300 px. Recibida: ${img.width}×${img.height} px.`);
                                                setAvisoFile(null);
                                            } else {
                                                setAvisoFile(file);
                                            }
                                        };
                                        img.onerror = () => {
                                            message.error('No se pudo leer la imagen.');
                                            setAvisoFile(null);
                                        };
                                        img.src = ev.target.result;
                                    };
                                    reader.readAsDataURL(file);
                                    return false;
                                }}
                                onRemove={() => setAvisoFile(null)}
                                maxCount={1}
                                listType="picture"
                                fileList={avisoFile ? [{ uid: '-1', name: avisoFile.name, status: 'done' }] : []}
                                accept="image/*"
                            >
                                <Button icon={<UploadOutlined />}>Seleccionar imagen</Button>
                            </Upload>
                            {editingAviso?.imageUrl && !avisoFile && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500 mb-1">Imagen actual:</p>
                                    <Image src={editingAviso.imageUrl} width={120} height={120} style={{ objectFit: 'cover', borderRadius: 6 }} />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Título *</label>
                            <Input
                                placeholder="Título del aviso"
                                value={avisoForm.title}
                                onChange={(e) => setAvisoForm({ ...avisoForm, title: e.target.value })}
                                maxLength={120}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Mensaje *</label>
                            <Input.TextArea
                                placeholder="Contenido completo del aviso"
                                value={avisoForm.message}
                                onChange={(e) => setAvisoForm({ ...avisoForm, message: e.target.value })}
                                rows={6}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Fecha fin *</label>
                            <DatePicker
                                showTime
                                format="DD/MM/YYYY HH:mm"
                                value={avisoForm.endDate}
                                onChange={(val) => setAvisoForm({ ...avisoForm, endDate: val })}
                                style={{ width: '100%' }}
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                            />
                            <p className="text-xs text-gray-500 mt-1">A partir de esta fecha, el aviso deja de mostrarse.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium">Activo</label>
                            <Switch checked={avisoForm.active} onChange={(val) => setAvisoForm({ ...avisoForm, active: val })} />
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default Notificaciones;
