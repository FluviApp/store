import React, { useState, useMemo } from 'react';
import {
    Table, Button, Space, Input, Modal, Card, message, Empty, Row, Col, Select,
    Tabs, DatePicker, Switch, Upload, Image, Tag, Pagination
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import useClients from '../../hooks/useClients';
import useAnnouncements from '../../hooks/useAnnouncements';
import useStoreEmails from '../../hooks/useStoreEmails';
import useFilteredClients from '../../hooks/useFilteredClients';
import Notifications from '../../services/Notifications';
import Announcements from '../../services/Announcements';
import StoreEmails from '../../services/StoreEmails';
import Sidebar from '../../components/Sidebar';
import BackToAjustes from '../../components/BackToAjustes.jsx';
import ClientFiltersForm from '../../components/ClientFiltersForm.jsx';

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
    const announcements = announcementsData?.data || [];
    const [avisoSearch, setAvisoSearch] = useState('');
    const [avisoModalVisible, setAvisoModalVisible] = useState(false);
    const [editingAviso, setEditingAviso] = useState(null);
    const [avisoForm, setAvisoForm] = useState({ title: '', message: '', endDate: null, active: true });
    const [avisoFile, setAvisoFile] = useState(null);
    const [avisoSubmitting, setAvisoSubmitting] = useState(false);

    // ===== CORREOS STATE =====
    const [emailPage, setEmailPage] = useState(1);
    const [emailPageSize, setEmailPageSize] = useState(10);
    const { data: emailsData, refetch: refetchEmails, isLoading: isLoadingEmails } = useStoreEmails(emailPage, emailPageSize);
    const emails = emailsData?.data?.docs || [];
    const emailsTotal = emailsData?.data?.totalDocs || 0;
    const [emailSearch, setEmailSearch] = useState('');
    const [emailModalVisible, setEmailModalVisible] = useState(false);
    const [emailForm, setEmailForm] = useState({
        recipientType: 'SINGLE', // SINGLE, MULTIPLE, ALL o FILTERED
        selectedClient: '',
        selectedClients: [],
        subject: '',
        message: ''
    });
    const [emailSubmitting, setEmailSubmitting] = useState(false);
    const [confirmSendAll, setConfirmSendAll] = useState(false);
    const [showFiltersModal, setShowFiltersModal] = useState(false);
    const { filteredClients } = useFilteredClients();

    const filteredNotifications = searchText
        ? notifications.filter(n => n.title.toLowerCase().includes(searchText.toLowerCase()))
        : notifications;

    const filteredAvisos = avisoSearch
        ? announcements.filter(a =>
            a.title?.toLowerCase().includes(avisoSearch.toLowerCase()) ||
            a.message?.toLowerCase().includes(avisoSearch.toLowerCase())
        )
        : announcements;

    const filteredEmails = emailSearch
        ? emails.filter(e =>
            e.recipientEmail?.toLowerCase().includes(emailSearch.toLowerCase()) ||
            e.subject?.toLowerCase().includes(emailSearch.toLowerCase())
        )
        : emails;

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

            if (response?.success) {
                message.success(editingAviso ? 'Aviso actualizado' : 'Aviso creado');
                refetchAnnouncements();
                handleCloseAvisoModal();
            } else {
                message.warning(response?.message || 'No se pudo guardar el aviso');
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
                    if (response?.success) {
                        message.success('Aviso eliminado');
                        refetchAnnouncements();
                    } else {
                        message.warning(response?.message || 'No se pudo eliminar');
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
            if (response?.success) {
                message.success(active ? 'Aviso activado' : 'Aviso desactivado');
                refetchAnnouncements();
            }
        } catch (err) {
            message.error('No se pudo actualizar el estado');
        }
    };

    // ===== CORREOS HANDLERS =====
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleOpenEmailModal = () => {
        setEmailForm({
            recipientType: 'SINGLE',
            selectedClient: '',
            selectedClients: [],
            subject: '',
            message: ''
        });
        setEmailModalVisible(true);
    };

    const handleCloseEmailModal = () => {
        setEmailModalVisible(false);
        setConfirmSendAll(false);
        setEmailForm({
            recipientType: 'SINGLE',
            selectedClient: '',
            selectedClients: [],
            subject: '',
            message: ''
        });
    };

    const handleSubmitEmail = async () => {
        if (!emailForm.subject?.trim()) {
            message.error('El asunto es obligatorio');
            return;
        }
        if (!emailForm.message?.trim()) {
            message.error('El mensaje es obligatorio');
            return;
        }

        // Si es envío a todos, pedir confirmación
        if (emailForm.recipientType === 'ALL' && !confirmSendAll) {
            Modal.confirm({
                title: '⚠️ Enviar a todos los clientes',
                content: `¿Estás seguro de que quieres enviar este correo a ${allClients.length} clientes?`,
                okText: 'Sí, enviar',
                okType: 'danger',
                cancelText: 'Cancelar',
                onOk: () => setConfirmSendAll(true),
            });
            return;
        }

        if (emailForm.recipientType === 'SINGLE') {
            if (!emailForm.selectedClient) {
                message.error('Debes seleccionar un cliente');
                return;
            }

            const selectedClientObj = allClients.find(c => c._id === emailForm.selectedClient);
            if (!selectedClientObj?.email) {
                message.error('El cliente no tiene email registrado');
                return;
            }

            if (!validateEmail(selectedClientObj.email)) {
                message.error(`El email "${selectedClientObj.email}" no tiene un formato válido`);
                return;
            }

            try {
                setEmailSubmitting(true);
                const response = await StoreEmails.send({
                    storeId: user.storeId,
                    recipientEmail: selectedClientObj.email,
                    recipientName: selectedClientObj.name || '',
                    subject: emailForm.subject.trim(),
                    message: emailForm.message.trim()
                });

                if (response?.success) {
                    message.success('Correo enviado exitosamente');
                    refetchEmails();
                    handleCloseEmailModal();
                } else {
                    message.error(response?.message || 'No se pudo enviar el correo');
                }
            } catch (err) {
                message.error(err.message || 'Error al enviar el correo');
            } finally {
                setEmailSubmitting(false);
            }
        } else if (emailForm.recipientType === 'MULTIPLE') {
            if (emailForm.selectedClients.length === 0) {
                message.error('Debes seleccionar al menos un cliente');
                return;
            }

            try {
                setEmailSubmitting(true);
                const response = await StoreEmails.sendMultiple({
                    storeId: user.storeId,
                    clientIds: emailForm.selectedClients,
                    subject: emailForm.subject.trim(),
                    message: emailForm.message.trim()
                });

                if (response?.success) {
                    message.success(`Correos enviados: ${response?.data?.sent}/${response?.data?.total}`);
                    refetchEmails();
                    handleCloseEmailModal();
                    setConfirmSendAll(false);
                } else {
                    message.error(response?.message || 'No se pudieron enviar los correos');
                }
            } catch (err) {
                message.error(err.message || 'Error al enviar los correos');
            } finally {
                setEmailSubmitting(false);
            }
        } else if (emailForm.recipientType === 'FILTERED') {
            if (emailForm.selectedClients.length === 0) {
                message.error('Debes aplicar filtros y seleccionar clientes');
                return;
            }

            try {
                setEmailSubmitting(true);
                const response = await StoreEmails.sendMultiple({
                    storeId: user.storeId,
                    clientIds: emailForm.selectedClients,
                    subject: emailForm.subject.trim(),
                    message: emailForm.message.trim()
                });

                if (response?.success) {
                    message.success(`✅ ¡Correos enviados a ${response?.data?.sent}/${response?.data?.total} clientes!`);
                    refetchEmails();
                    handleCloseEmailModal();
                } else {
                    message.error(response?.message || 'No se pudieron enviar los correos');
                }
            } catch (err) {
                message.error(err.message || 'Error al enviar los correos');
            } finally {
                setEmailSubmitting(false);
            }
        } else if (emailForm.recipientType === 'ALL') {
            try {
                setEmailSubmitting(true);
                const allClientIds = allClients.map(c => c._id);
                const response = await StoreEmails.sendMultiple({
                    storeId: user.storeId,
                    clientIds: allClientIds,
                    subject: emailForm.subject.trim(),
                    message: emailForm.message.trim()
                });

                if (response?.success) {
                    message.success(`✅ ¡Correos enviados a ${response?.data?.sent}/${response?.data?.total} clientes!`);
                    refetchEmails();
                    handleCloseEmailModal();
                    setConfirmSendAll(false);
                } else {
                    message.error(response?.message || 'No se pudieron enviar los correos');
                }
            } catch (err) {
                message.error(err.message || 'Error al enviar los correos');
            } finally {
                setEmailSubmitting(false);
            }
        }
    };

    const handleDeleteEmail = (item) => {
        Modal.confirm({
            title: '¿Eliminar historial?',
            content: `Esta acción no se puede deshacer. Correo a: ${item.recipientEmail}`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const response = await StoreEmails.delete(item._id);
                    if (response?.success) {
                        message.success('Registro eliminado');
                        refetchEmails();
                    }
                } catch (err) {
                    message.error(err.message || 'Error al eliminar');
                }
            }
        });
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

    const emailColumns = [
        { title: 'Destinatario', dataIndex: 'recipientEmail', key: 'recipientEmail' },
        { title: 'Asunto', dataIndex: 'subject', key: 'subject' },
        {
            title: 'Mensaje',
            dataIndex: 'message',
            key: 'message',
            render: (text) => text?.length > 60 ? `${text.slice(0, 60)}...` : text,
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const statusColors = { sent: 'green', failed: 'red', pending: 'orange' };
                const statusLabels = { sent: 'Enviado', failed: 'Error', pending: 'Pendiente' };
                return <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>;
            },
        },
        {
            title: 'Fecha',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (d) => d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—',
        },
        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => (
                <Space>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteEmail(record)}>Eliminar</Button>
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

    const correosTab = (
        <>
            <div className="mb-4 flex flex-col md:flex-row md:justify-between gap-2">
                <Search
                    placeholder="Buscar por email o asunto"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={setEmailSearch}
                    onChange={(e) => setEmailSearch(e.target.value)}
                    className="md:max-w-md w-full"
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenEmailModal()}>Enviar Correo</Button>
            </div>

            {isMobile ? (
                filteredEmails.length > 0 ? (
                    <div className="grid gap-4">
                        {filteredEmails.map(e => (
                            <Card key={e._id} bordered>
                                <p><strong>Para:</strong> {e.recipientEmail}</p>
                                <p><strong>Asunto:</strong> {e.subject}</p>
                                <p className="text-gray-600">{e.message.substring(0, 100)}...</p>
                                <div className="mt-2 mb-2">
                                    <Tag color={e.status === 'sent' ? 'green' : e.status === 'failed' ? 'red' : 'orange'}>
                                        {e.status === 'sent' ? 'Enviado' : e.status === 'failed' ? 'Error' : 'Pendiente'}
                                    </Tag>
                                </div>
                                <p className="text-xs text-gray-500">{dayjs(e.createdAt).format('DD/MM/YYYY HH:mm')}</p>
                                <Space>
                                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteEmail(e)}>Eliminar</Button>
                                </Space>
                            </Card>
                        ))}
                        <Pagination
                            className="text-center mt-2"
                            current={emailPage}
                            pageSize={emailPageSize}
                            total={emailsTotal}
                            showTotal={(total) => `${total} correos enviados`}
                            onChange={(page, size) => {
                                setEmailPage(page);
                                setEmailPageSize(size);
                            }}
                        />
                    </div>
                ) : <Empty description="No hay correos" />
            ) : (
                <Table
                    dataSource={filteredEmails}
                    columns={emailColumns}
                    rowKey="_id"
                    loading={isLoadingEmails}
                    pagination={{
                        current: emailPage,
                        pageSize: emailPageSize,
                        total: emailsTotal,
                        position: ['bottomCenter'],
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total) => `${total} correos enviados`,
                        onChange: (page, size) => {
                            setEmailPage(page);
                            setEmailPageSize(size);
                        },
                    }}
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
                <BackToAjustes />
                <div className="mb-6">
                    <Row gutter={[16, 16]}>
                        <Col span={24} className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-gray-800">Notificaciones</h1>
                        </Col>
                    </Row>
                </div>

                <Tabs
                    defaultActiveKey="notifications"
                    items={[
                        { key: 'notifications', label: 'Notificaciones', children: notificationsTab },
                        { key: 'avisos', label: 'Avisos', children: avisosTab },
                        { key: 'correos', label: '📧 Correos de Aviso', children: correosTab },
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
                    open={emailModalVisible}
                    onCancel={handleCloseEmailModal}
                    onOk={handleSubmitEmail}
                    okText="Enviar"
                    cancelText="Cancelar"
                    title="Enviar Correo de Aviso"
                    width={1200}
                    style={{ maxHeight: '90vh' }}
                    confirmLoading={emailSubmitting}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Tipo de envío *</label>
                            <Select
                                style={{ width: '100%' }}
                                value={emailForm.recipientType}
                                onChange={(value) => setEmailForm({ ...emailForm, recipientType: value, confirmSendAll: false })}
                            >
                                <Option value="SINGLE">👤 Enviar a un cliente específico</Option>
                                <Option value="MULTIPLE">👥 Enviar a múltiples clientes</Option>
                                <Option value="FILTERED">🔍 Enviar a clientes con filtros</Option>
                                <Option value="ALL">📢 Enviar a TODOS ({allClients.length} clientes)</Option>
                            </Select>
                        </div>

                        {emailForm.recipientType === 'SINGLE' && (
                            <div key="single-client">
                                <label className="block text-sm font-medium mb-2">Cliente *</label>
                                <Select
                                    key={`select-single-${allClients.length}`}
                                    style={{ width: '100%' }}
                                    placeholder="Selecciona un cliente"
                                    value={emailForm.selectedClient || undefined}
                                    onChange={(value) => setEmailForm({ ...emailForm, selectedClient: value })}
                                    showSearch
                                    optionFilterProp="label"
                                >
                                    {allClients.map(client => (
                                        <Option key={client._id} value={client._id} label={`${client.name || 'Sin nombre'} - ${client.email}`}>
                                            {client.name || 'Sin nombre'} - {client.email}
                                        </Option>
                                    ))}
                                </Select>
                                {allClients.length === 0 && <p className="text-xs text-yellow-600 mt-1">⚠️ No hay clientes disponibles</p>}
                            </div>
                        )}

                        {emailForm.recipientType === 'MULTIPLE' && (
                            <div key="multiple-clients">
                                <label className="block text-sm font-medium mb-2">Clientes *</label>
                                <Select
                                    key={`select-multiple-${allClients.length}`}
                                    mode="multiple"
                                    style={{ width: '100%' }}
                                    placeholder="Selecciona clientes"
                                    value={emailForm.selectedClients || []}
                                    onChange={(value) => setEmailForm({ ...emailForm, selectedClients: value })}
                                    showSearch
                                    optionFilterProp="label"
                                >
                                    {allClients.map(client => (
                                        <Option key={client._id} value={client._id} label={`${client.name || 'Sin nombre'} - ${client.email}`}>
                                            {client.name || 'Sin nombre'} - {client.email}
                                        </Option>
                                    ))}
                                </Select>
                                {allClients.length === 0 && <p className="text-xs text-yellow-600 mt-1">⚠️ No hay clientes disponibles</p>}
                            </div>
                        )}

                        {emailForm.recipientType === 'FILTERED' && (
                            <div key="filtered-clients" className="space-y-4">
                                <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
                                    <p className="text-sm text-blue-900">
                                        <strong>📋 Filtrar clientes:</strong> Usa los filtros abajo para seleccionar a qué clientes quieres enviar este correo.
                                    </p>
                                </div>

                                <ClientFiltersForm
                                    onClientsFound={(clients) => {
                                        setEmailForm({ ...emailForm, selectedClients: clients.map(c => c._id) });
                                    }}
                                    onLoading={(loading) => setEmailSubmitting(loading)}
                                />

                                {emailForm.selectedClients.length > 0 && (
                                    <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-green-900 font-medium mb-1">
                                                    ✅ Clientes seleccionados
                                                </p>
                                                <p className="text-2xl font-bold text-green-700">
                                                    {emailForm.selectedClients.length} clientes
                                                </p>
                                            </div>
                                            <div className="text-4xl text-green-600">📬</div>
                                        </div>
                                        <p className="text-xs text-green-700 mt-2">
                                            Se enviará a todos estos clientes cuando hagas clic en "Enviar"
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {emailForm.recipientType === 'ALL' && (
                            <div key="all-clients" className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900 font-medium">
                                    📢 Este correo será enviado a <strong>{allClients.length} clientes</strong>
                                </p>
                                <p className="text-xs text-blue-700 mt-2">Se enviará únicamente a clientes con email válido.</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-2">Asunto *</label>
                            <Input
                                placeholder="Ej: Actualización importante de tu cuenta"
                                value={emailForm.subject}
                                onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                                maxLength={120}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Mensaje *</label>
                            <Input.TextArea
                                placeholder="Escribe el mensaje que deseas enviar..."
                                value={emailForm.message}
                                onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                                rows={6}
                            />
                        </div>

                        {emailForm.selectedClients.length > 0 && emailForm.recipientType === 'FILTERED' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <p className="text-sm text-yellow-900 font-medium">
                                    ⚠️ <strong>Confirmación de envío:</strong> Se enviarán <strong className="text-lg text-yellow-700">{emailForm.selectedClients.length} correos</strong> a los clientes seleccionados
                                </p>
                            </div>
                        )}

                        {emailForm.message && (
                            <div className="border rounded-lg p-4 bg-gray-50">
                                <p className="text-sm font-medium mb-3">📧 Preview del correo:</p>
                                <div
                                    style={{
                                        fontFamily: 'Arial, sans-serif',
                                        maxWidth: '600px',
                                        margin: 'auto',
                                        background: '#fefefe',
                                        borderRadius: '12px',
                                        padding: '24px',
                                        border: '1px solid #eee'
                                    }}
                                >
                                    <h2 style={{ color: '#0099FF', marginTop: '0' }}>📢 Notificación de Fluvi</h2>

                                    <div style={{ fontSize: '16px', color: '#333', lineHeight: '1.6' }}>
                                        {emailForm.message.split('\n').map((line, idx) => {
                                            const trimmed = line.trim();
                                            if (!trimmed) {
                                                return <p key={idx} style={{ margin: '12px 0' }}>&nbsp;</p>;
                                            }
                                            return (
                                                <p key={idx} style={{ margin: '12px 0', color: '#333' }}>
                                                    {line}
                                                </p>
                                            );
                                        })}
                                    </div>

                                    <div style={{ marginTop: '24px', background: '#f1faff', padding: '16px', borderRadius: '8px' }}>
                                        <p style={{ fontSize: '14px', color: '#0099FF', margin: '0' }}>
                                            ✨ Gracias por confiar en Fluvi 💧
                                        </p>
                                    </div>

                                    <p style={{ fontSize: '12px', color: '#aaa', marginTop: '24px', borderTop: '1px solid #eee', paddingTop: '16px', margin: '24px 0 0 0' }}>
                                        Este correo fue generado automáticamente. No respondas a esta dirección.
                                    </p>
                                </div>
                            </div>
                        )}
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
                            <label className="block text-sm font-medium mb-2">Imagen (opcional)</label>
                            <p className="text-xs text-gray-500 mb-2">Si subes una, debe ser cuadrada de exactamente 300×300 px.</p>
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
