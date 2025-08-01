import React, { useState } from 'react';
import {
    Table, Button, Space, Input, Modal, Card, message, Empty, Row, Col, Select, Form
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../context/AuthContext';
import usePacks from '../../hooks/usePacks';
import useAllProducts from '../../hooks/useAllProducts';
import Packs from '../../services/Packs';
import Sidebar from '../../components/Sidebar';
import ModalCreatePack from '../../components/ModalCreatePack';
import ModalEditPack from '../../components/ModalEditPack';

const { Search } = Input;
const { Option } = Select;

const Paquetes = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const isMobile = useMediaQuery({ maxWidth: 768 });

    const { data: packsData, refetch, isLoading } = usePacks();
    const packs = packsData?.data || [];

    const { data: productsData, isLoading: isLoadingProducts } = useAllProducts({ page: 1, limit: 100 });
    const products = productsData?.data?.docs || [];
    console.log(productsData)

    const [searchText, setSearchText] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form] = Form.useForm();
    const [imageFile, setImageFile] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);

    const filteredPacks = searchText
        ? packs.filter(p => p.name.toLowerCase().includes(searchText.toLowerCase()))
        : packs;

    const validateImage = async (file) => {
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

    const handleDelete = (item) => {
        Modal.confirm({
            title: '¿Eliminar paquete?',
            content: `Esta acción no se puede deshacer. Paquete: ${item.name}`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const response = await Packs.delete(item._id);
                    if (response?.success) {
                        message.success('Paquete eliminado correctamente');
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
            form.setFieldsValue({ name: item.name, price: item.price });
            setSelectedProducts(item.products || []);
            if (item.image) {
                setImageFile({
                    uid: `existing-${item._id}`,
                    name: item.image.split('/').pop(),
                    status: 'done',
                    url: item.image,
                });
            }
        } else {
            form.resetFields();
            setImageFile(null);
            setSelectedProducts([]);
        }
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setEditingItem(null);
        setImageFile(null);
        setSelectedProducts([]);
        form.resetFields();
    };

    const handleAddProduct = (product) => {
        if (selectedProducts.some(p => p.productId === product._id)) {
            message.warning('Este producto ya está en el paquete');
            return;
        }

        // 🧠 Obtener imagen según prioridad
        const imageFromProduct = product.images?.[0];
        const imageFromVariant = product.variants?.[0]?.images?.[0];
        const imageToUse = imageFromProduct || imageFromVariant || '';

        if (!imageToUse) {
            message.warning(`El producto "${product.name}" no tiene imagen. Esto puede causar errores al guardar.`);
        }

        setSelectedProducts(prev => [
            ...prev,
            {
                productId: product._id,
                name: product.name,
                price: product.priceBase,
                quantity: 1,
                productImage: imageToUse
            }
        ]);
    };



    const handleRemoveProduct = (productId) => {
        setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
    };

    const handleChangeQuantity = (productId, delta) => {
        setSelectedProducts(prev =>
            prev.map(p =>
                p.productId === productId
                    ? { ...p, quantity: Math.max(1, p.quantity + delta) }
                    : p
            )
        );
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (selectedProducts.length === 0) {
                message.error('Debes agregar al menos un producto al paquete');
                return;
            }

            const data = new FormData();
            data.append('storeId', user.storeId);
            data.append('name', values.name.trim());
            data.append('price', parseFloat(values.price));
            data.append('products', JSON.stringify(selectedProducts));
            if (imageFile?.originFileObj) {
                data.append('image', imageFile.originFileObj);
            }
            console.log('Selected products to send:', selectedProducts);
            const response = editingItem
                ? await Packs.edit(editingItem._id, data)
                : await Packs.create(data);
            console.log('Selected products to send:', selectedProducts);
            if (response?.success) {
                message.success(editingItem ? 'Paquete editado correctamente' : 'Paquete creado correctamente');
                refetch();
                handleCloseModal();
            } else {
                message.warning(response?.message || 'No se pudo guardar el paquete');
            }
        } catch (err) {
            message.error(err.message || 'Error al guardar el paquete');
        }
    };

    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Precio', dataIndex: 'price', key: 'price' },
        { title: 'Productos', dataIndex: 'products', key: 'products', render: (products) => products?.length || 0 },
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
                            <h1 className="text-3xl font-bold text-gray-800">Paquetes</h1>
                            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Volver</Button>
                        </Col>
                        <Col span={24} className="flex flex-col md:flex-row md:justify-end gap-2">
                            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Agregar Paquete</Button>
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
                    filteredPacks.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredPacks.map(pack => (
                                <Card key={pack._id} title={pack.name} bordered>
                                    <p>Precio: ${pack.price}</p>
                                    <p>Productos: {pack.products?.length || 0}</p>
                                    <Space wrap>
                                        <Button icon={<EditOutlined />} onClick={() => handleOpenModal(pack)}>Editar</Button>
                                        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(pack)}>Eliminar</Button>
                                    </Space>
                                </Card>
                            ))}
                        </div>
                    ) : <Empty description="No hay paquetes" />
                ) : (
                    <Table
                        dataSource={filteredPacks}
                        columns={columns}
                        rowKey="_id"
                        loading={isLoading}
                        pagination={{ pageSize: 5, position: ['bottomCenter'] }}
                        bordered
                    />
                )}

                {editingItem ? (
                    <ModalEditPack
                        visible={isModalVisible}
                        onCancel={handleCloseModal}
                        onSubmit={handleSubmit}
                        form={form}
                        imageFile={imageFile}
                        setImageFile={setImageFile}
                        validateImage={validateImage}
                        products={products}
                        selectedProducts={selectedProducts}
                        handleAddProduct={handleAddProduct}
                        handleRemoveProduct={handleRemoveProduct}
                        handleChangeQuantity={handleChangeQuantity}
                        isLoadingProducts={isLoadingProducts}
                    />
                ) : (
                    <ModalCreatePack
                        visible={isModalVisible}
                        onCancel={handleCloseModal}
                        onSubmit={handleSubmit}
                        form={form}
                        imageFile={imageFile}
                        setImageFile={setImageFile}
                        validateImage={validateImage}
                        products={products}
                        selectedProducts={selectedProducts}
                        handleAddProduct={handleAddProduct}
                        handleRemoveProduct={handleRemoveProduct}
                        handleChangeQuantity={handleChangeQuantity}
                        isLoadingProducts={isLoadingProducts}
                    />
                )}


            </div>
        </div>
    );
};

export default Paquetes;
