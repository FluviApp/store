import React, { useState } from 'react';
import {
    Table, Button, Space, Input, Modal, Card, message, Empty, Row, Col, Upload, Form
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../context/AuthContext';
import useBanners from '../../hooks/useBanners';
import Banners from '../../services/Banners';
import Sidebar from '../../components/Sidebar';
import ModalCreateBanner from '../../components/ModalCreateBanner';
import ModalEditBanner from '../../components/ModalEditBanner';

const { Search } = Input;

const BannersPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    const { data: bannersData, refetch, isLoading } = useBanners();
    const banners = bannersData?.data || [];

    const [searchText, setSearchText] = useState('');
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [form] = Form.useForm();

    const filteredBanners = searchText
        ? banners.filter(b => b.name.toLowerCase().includes(searchText.toLowerCase()))
        : banners;

    const handleDelete = (item) => {
        Modal.confirm({
            title: '¿Eliminar banner?',
            content: `Esta acción no se puede deshacer. Banner: ${item.name}`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const response = await Banners.delete(item._id);
                    if (response?.success) {
                        message.success('Banner eliminado correctamente');
                        refetch();
                    }
                } catch (err) {
                    message.error(err.message || 'Error al eliminar');
                }
            },
        });
    };

    const openCreateModal = () => {
        form.resetFields();
        setImageFile(null);
        setIsCreateModalVisible(true);
    };

    const openEditModal = (item) => {
        form.setFieldsValue({ name: item.name, link: item.link });
        setImageFile({
            uid: `existing-${item._id}`,
            name: item.image.split('/').pop(),
            status: 'done',
            url: `${BACKEND_URL}${item.image}`,
        });
        setEditingItem(item);
        setIsEditModalVisible(true);
    };

    const closeModals = () => {
        setIsCreateModalVisible(false);
        setIsEditModalVisible(false);
        setImageFile(null);
        setEditingItem(null);
        form.resetFields();
    };

    const validateBannerImageSize = async (file) => {
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    if (img.width === 1200 && img.height === 500) {
                        resolve(true);
                    } else {
                        message.error(`La imagen "${file.name}" debe ser de 1200x500 píxeles`);
                        resolve(false);
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleCreateBanner = async () => {
        const values = await form.validateFields();
        if (!imageFile?.originFileObj) {
            message.error('La imagen del banner es obligatoria');
            return;
        }

        const data = new FormData();
        data.append('name', values.name);
        data.append('link', values.link || '');
        data.append('storeId', user.storeId);
        data.append('image', imageFile.originFileObj);

        try {
            const response = await Banners.create(data);
            if (response?.success) {
                message.success('Banner creado correctamente');
                refetch();
                closeModals();
            } else {
                message.warning(response?.message || 'No se pudo crear el banner');
            }
        } catch (err) {
            message.error(err.message || 'Error al crear el banner');
        }
    };

    const handleEditBanner = async () => {
        const values = await form.validateFields();

        const data = new FormData();
        data.append('name', values.name);
        data.append('link', values.link || '');
        data.append('storeId', user.storeId);
        if (imageFile?.originFileObj) {
            data.append('image', imageFile.originFileObj);
        }

        try {
            const response = await Banners.edit(editingItem._id, data);
            if (response?.success) {
                message.success('Banner editado correctamente');
                refetch();
                closeModals();
            } else {
                message.warning(response?.message || 'No se pudo editar el banner');
            }
        } catch (err) {
            message.error(err.message || 'Error al editar el banner');
        }
    };

    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Link', dataIndex: 'link', key: 'link' },
        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => openEditModal(record)}>Editar</Button>
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
                            <h1 className="text-3xl font-bold text-gray-800">Banners</h1>
                            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Volver</Button>
                        </Col>
                        <Col span={24} className="flex flex-col md:flex-row md:justify-end gap-2">
                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>Agregar Banner</Button>
                        </Col>
                    </Row>
                </div>

                <Search
                    placeholder="Buscar por nombre"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={setSearchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="mb-4"
                />

                {isMobile ? (
                    filteredBanners.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredBanners.map(banner => (
                                <Card key={banner._id} title={banner.name} bordered>
                                    <img src={`${BACKEND_URL}${banner.image}`} alt={banner.name} style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                                    <p className="mt-2 text-blue-600">{banner.link}</p>
                                    <Space wrap>
                                        <Button icon={<EditOutlined />} onClick={() => openEditModal(banner)}>Editar</Button>
                                        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(banner)}>Eliminar</Button>
                                    </Space>
                                </Card>
                            ))}
                        </div>
                    ) : <Empty description="No hay banners" />
                ) : (
                    <Table
                        dataSource={filteredBanners}
                        columns={columns}
                        rowKey="_id"
                        loading={isLoading}
                        pagination={{ pageSize: 5, position: ['bottomCenter'] }}
                        bordered
                    />
                )}

                <ModalCreateBanner
                    visible={isCreateModalVisible}
                    onCancel={closeModals}
                    onCreate={handleCreateBanner}
                    form={form}
                    imageFile={imageFile}
                    setImageFile={setImageFile}
                    validateImage={validateBannerImageSize}
                />

                <ModalEditBanner
                    visible={isEditModalVisible}
                    onCancel={closeModals}
                    onEdit={handleEditBanner}
                    form={form}
                    imageFile={imageFile}
                    setImageFile={setImageFile}
                    validateImage={validateBannerImageSize}
                    BACKEND_URL={BACKEND_URL}
                />
            </div>
        </div>
    );
};

export default BannersPage;
