import React, { useState, useEffect } from 'react';
import {
    Table, Button, Space, Input, Modal, Card, message, Empty, Row, Col, Dropdown, Menu, Form, Breadcrumb
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, SearchOutlined, EyeOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../context/AuthContext';
import useProducts from '../../hooks/useProducts';
import Products from '../../services/Products';
import Sidebar from '../../components/Sidebar';
import ModalCreateProduct from '../../components/ModalCreateProduct';
import ModalEditProduct from '../../components/ModalEditProduct';
import ModalCreateProductWithVariants from '../../components/ModalCreateProductWithVariants';
import ModalEditProductWithVariants from '../../components/ModalEditProductWithVariants';
import { useLocation } from 'react-router-dom';
import useAllProducts from '../../hooks/useAllProducts';

const { Search } = Input;

const Productos = () => {
    const { user } = useAuth();
    const { subcategoryId } = useParams();
    const location = useLocation();
    const { categoryId, categoryName, subcategoryName } = location.state || {};


    const navigate = useNavigate();
    const isMobile = useMediaQuery({ maxWidth: 768 });

    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const [isAgregarExistenteVisible, setIsAgregarExistenteVisible] = useState(false);
    const [searchExistingProduct, setSearchExistingProduct] = useState('');

    const {
        data: unfilteredProductData,
        isLoading: loadingUnfiltered,
    } = useAllProducts({ page: 1, limit: 100, search: searchExistingProduct });

    const allProducts = unfilteredProductData?.data?.docs || [];

    // const { data: productData, refetch: refetchProducts, isLoading } = useProducts({
    //     storeId: user.storeId,
    //     categoryId: null,
    //     subcategoryId,
    // });

    const {
        data: productData,
        isLoading,
        refetch: refetchProducts,
    } = useProducts({
        storeId: user.storeId,
        subcategoryId,
    });


    const products = productData?.data?.docs || [];

    const filteredData = searchText
        ? products.filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
        : products;

    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const [formProduct] = Form.useForm(); // ✅

    const [isProductModalVisible, setIsProductModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [imageFile, setImageFile] = useState([]);
    const [hasVariants, setHasVariants] = useState(false);
    const [variantAttributes, setVariantAttributes] = useState([]);
    const [variantImageLists, setVariantImageLists] = useState({});
    const [removedVariantImages, setRemovedVariantImages] = useState({});
    const [hasVariantsLocked, setHasVariantsLocked] = useState(false);
    const [removedImages, setRemovedImages] = useState([]);


    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => {
                            const hasVar = record.variants && record.variants.length > 0;
                            hasVar ? openEditProductWithVariantsModal(record) : openEditProductModal(record);
                        }}
                    >Editar</Button>
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>Eliminar</Button>
                </Space>
            )
        }
    ];




    const handleDelete = (item) => {
        Modal.confirm({
            title: '¿Eliminar producto?',
            content: `Esta acción no se puede deshacer. Producto: ${item.name}`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const response = await Products.delete(item._id);
                    if (response?.success) {
                        message.success('Producto eliminado correctamente');
                        refetchProducts();
                    }
                } catch (error) {
                    message.error(error.message || 'Error al eliminar');
                }
            }
        });
    };







    const validateImageDimensions = async (file) => {
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    if (img.width === 400 && img.height === 400) {
                        resolve(true);
                    } else {
                        message.error(`La imagen "${file.name}" debe ser de 400x400 píxeles`);
                        resolve(false);
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const validateProductImageSize = async (file) => {
        const isValid = await validateImageDimensions(file);
        if (!isValid) return Upload.LIST_IGNORE;

        setImageFile(prev => {
            const newFile = {
                uid: file.uid || `img-${Date.now()}`,
                name: file.name,
                status: 'done',
                url: URL.createObjectURL(file),
                originFileObj: file,
            };

            const updated = [...(prev || []), newFile];
            if (updated.length > 5) {
                message.error('Solo puedes subir hasta 5 imágenes');
                return prev;
            }

            return updated;
        });

        return false;
    };



    const validateSubcategoryImage = async (file) => {
        const isValid = await validateImageDimensions(file);
        if (!isValid) return Upload.LIST_IGNORE;

        const newFile = {
            uid: file.uid || `img-${Date.now()}`,
            name: file.name,
            status: 'done',
            url: URL.createObjectURL(file),
            originFileObj: file,
        };

        setImageFile(newFile); // 👈 un solo objeto
        return false; // evitar upload automático
    };





    const openCreateProductModal = () => {
        formProduct.resetFields();
        setImageFile([]);
        setEditingItem(null);
        setHasVariants(false); // Asegura que sea producto simple
        setIsProductModalVisible(true);
    };
    const handleProductCancel = () => {
        setIsProductModalVisible(false);
        formProduct.resetFields();
        setImageFile([]);
    };
    const handleCreateProduct = async () => {
        const values = await formProduct.validateFields();

        if (!imageFile || imageFile.length === 0) {
            message.error('La imagen del producto es obligatoria');
            return;
        }

        const formData = new FormData();
        formData.append('name', values.nombre);
        formData.append('storeId', user.storeId);
        formData.append('subcategoryIds[]', subcategoryId); // ✅ CORREGIDO

        formData.append('detail', values.detail || '');
        formData.append('priceBase', values.priceBase || 0);
        formData.append('priceDiscount', values.priceDiscount || 0);
        formData.append('isFeatured', values.isFeatured || false);
        formData.append('available', values.available || false);

        imageFile.forEach(file => {
            if (file.originFileObj) {
                formData.append('image', file.originFileObj);
            }
        });

        formData.append('variants', JSON.stringify([])); // sin variantes

        try {
            const response = await Products.createSimple(formData);
            if (response?.success) {
                message.success('Producto creado correctamente');
                refetchProducts(); // react-query
                handleProductCancel();
            } else {
                message.warning(response?.message || 'No se pudo crear el producto');
            }
        } catch (err) {
            message.error(err.message || 'Error al crear el producto');
        }
    };






    const openEditProductModal = (item) => {
        formProduct.setFieldsValue({
            nombre: item.name,
            detail: item.detail,
            priceBase: item.priceBase,
            priceDiscount: item.priceDiscount,
            isFeatured: item.isFeatured,
            available: item.available,
            variants: item.variants || [],
        });

        const hasProductVariants = Array.isArray(item.variants) && item.variants.length > 0;
        setHasVariants(hasProductVariants);
        setHasVariantsLocked(hasProductVariants || (!hasProductVariants && item.priceBase));

        if (Array.isArray(item.images) && item.images.length > 0) {
            const files = item.images.map((url, index) => ({
                uid: `img-${index}`,
                name: url.split('/').pop(),
                status: 'done',
                url: url,
            }));
            setImageFile(files);
        } else {
            setImageFile([]);
        }

        setEditingItem(item);
        setIsProductModalVisible(true);
    };
    const handleEditProduct = async () => {
        const values = await formProduct.validateFields();

        if (!imageFile || imageFile.length === 0) {
            message.error('El producto debe tener al menos una imagen');
            return;
        }

        const formData = new FormData();
        formData.append('name', values.nombre);
        formData.append('storeId', user.storeId);
        formData.append('detail', values.detail || '');
        formData.append('priceBase', values.priceBase || 0);
        formData.append('priceDiscount', values.priceDiscount || 0);
        formData.append('isFeatured', values.isFeatured || false);
        formData.append('available', values.available || false);
        formData.append('variants', JSON.stringify([]));
        formData.append('subcategoryId', subcategoryId);
        // ✅ Agregar el categoryId
        //formData.append('categoryId', categoryId); // ← importante

        // ✅ Agregar imágenes nuevas
        imageFile.forEach((file) => {
            if (file.originFileObj) {
                formData.append('image', file.originFileObj);
            }
        });

        // ✅ Agregar imágenes eliminadas
        if (removedImages.length > 0) {
            formData.append('removedImages', JSON.stringify(removedImages));
        }

        try {
            const response = await Products.editSimple(editingItem._id, formData);

            if (response?.success) {
                message.success('Producto editado correctamente');
                refetchProducts?.(); // ← si tenés este refetch
                handleProductCancel();
            } else {
                message.warning(response?.message || 'No se pudo editar el producto');
            }
        } catch (err) {
            message.error(err.message || 'Error inesperado al editar producto');
        }
    };






    const openCreateProductWithVariantsModal = () => {
        formProduct.resetFields();
        setEditingItem(null);
        setImageFile([]);
        setHasVariants(true);
        setHasVariantsLocked(true);
        setVariantAttributes([]);
        setVariantImageLists({});
        setIsProductModalVisible(true);
    };


    const handleCreateProductWithVariants = async () => {
        const values = await formProduct.validateFields(['nombre', 'variants']).catch(err => {
            console.error("❌ Validación:", err);
            return;
        });
        if (!values) return;

        if (variantAttributes.length === 0 || !values.variants || values.variants.length === 0) {
            message.error('Debes configurar al menos una variante');
            return;
        }

        for (let i = 0; i < values.variants.length; i++) {
            const variant = values.variants[i];
            const images = variantImageLists[i] || [];

            if (!variant.price || isNaN(variant.price)) {
                message.error(`Variante #${i + 1} debe tener un precio válido`);
                return;
            }

            if (!variant.stock || isNaN(variant.stock)) {
                message.error(`Variante #${i + 1} debe tener stock válido`);
                return;
            }

            if (images.length === 0) {
                message.error(`Variante #${i + 1} debe tener al menos una imagen`);
                return;
            }
        }

        const formData = new FormData();
        formData.append('name', values.nombre);
        formData.append('storeId', user.storeId);
        formData.append('detail', values.detail || '');
        formData.append('variantAttributes', JSON.stringify(variantAttributes));
        formData.append('variants', JSON.stringify(values.variants));
        formData.append('isFeatured', values.isFeatured || false);
        formData.append('available', values.available || false);

        // ✅ CAMBIO AQUÍ: usar el nombre correcto esperado por el backend
        formData.append('subcategoryIds[]', subcategoryId);

        // ✅ Carga de imágenes por variante
        Object.entries(variantImageLists).forEach(([variantKey, files]) => {
            files.forEach((file) => {
                if (file.originFileObj) {
                    formData.append(`variantImages_${variantKey}`, file.originFileObj);
                }
            });
        });

        try {
            const response = await Products.createWithVariants(formData);
            if (response?.success) {
                message.success('Producto con variantes creado correctamente');
                refetchProducts();
                setIsProductModalVisible(false);
                formProduct.resetFields();
            } else {
                message.warning(response?.message || 'No se pudo crear el producto');
            }
        } catch (err) {
            message.error(err.message || 'Error al crear el producto');
        }
    };


    const openEditProductWithVariantsModal = (item) => {
        const attrs = Object.keys(item.variants?.[0] || {}).filter(key =>
            !['price', 'priceDiscount', 'stock', 'available', 'images', '_id'].includes(key)
        );

        formProduct.setFieldsValue({
            nombre: item.name,
            detail: item.detail,
            isFeatured: item.isFeatured,
            available: item.available,
            variants: item.variants || [],
        });

        const imageMap = {};
        (item.variants || []).forEach((variant, index) => {
            imageMap[index] = (variant.images || []).map((imgUrl, i) => ({
                uid: `img-${index}-${i}`,
                name: imgUrl.split('/').pop(),
                status: 'done',
                url: `${BACKEND_URL}${imgUrl}`,
            }));
        });

        setVariantImageLists(imageMap);
        setVariantAttributes(attrs);
        setEditingItem(item);
        setHasVariants(true);
        setHasVariantsLocked(true);
        setRemovedVariantImages({}); // si lo usás
        setIsProductModalVisible(true);
    };

    const handleEditProductWithVariants = async () => {
        console.log('🔧 INICIO edición producto con variantes');

        const values = await formProduct.validateFields(['nombre', 'variants']).catch(err => {
            console.error("❌ Validación fallida:", err);
            return;
        });
        if (!values) return;

        console.log('✅ Formulario validado:', values);

        if (variantAttributes.length === 0 || !values.variants || values.variants.length === 0) {
            message.error('Debes configurar al menos una variante');
            return;
        }

        for (let i = 0; i < values.variants.length; i++) {
            const variant = values.variants[i];
            const images = variantImageLists[i] || [];

            console.log(`🧪 Variante ${i}:`, variant);
            console.log(`📷 Imágenes asociadas:`, images);

            if (!variant.price || isNaN(variant.price)) {
                message.error(`Variante #${i + 1} debe tener un precio válido`);
                return;
            }

            if (!variant.stock || isNaN(variant.stock)) {
                message.error(`Variante #${i + 1} debe tener stock válido`);
                return;
            }

            if (images.length === 0) {
                message.error(`Variante #${i + 1} debe tener al menos una imagen`);
                return;
            }
        }

        const formData = new FormData();
        formData.append('name', values.nombre);
        formData.append('storeId', user.storeId);
        formData.append('detail', values.detail || '');
        formData.append('variantAttributes', JSON.stringify(variantAttributes));
        formData.append('variants', JSON.stringify(values.variants));
        formData.append('isFeatured', values.isFeatured || false);
        formData.append('available', values.available || false);
        formData.append('subcategoryId', subcategoryId);

        // ✅ Imágenes nuevas
        console.log('📦 Enviando imágenes nuevas por variante:');
        Object.entries(variantImageLists).forEach(([variantKey, files]) => {
            console.log(`➡️ VarianteKey: ${variantKey}`);
            files.forEach((file, j) => {
                if (file.originFileObj) {
                    formData.append(`variantImages_${variantKey}`, file.originFileObj);
                    console.log(`   📤 Imagen nueva agregada [${j}]:`, file.name);
                }
            });
        });

        // ✅ Imágenes eliminadas
        if (removedVariantImages && Object.keys(removedVariantImages).length > 0) {
            console.log('🗑️ Imágenes a eliminar (removedVariantImages):', removedVariantImages);
            formData.append('removedVariantImages', JSON.stringify(removedVariantImages));
        } else {
            console.log('📭 No hay imágenes a eliminar.');
        }

        try {
            const response = await Products.editWithVariants(editingItem._id, formData);
            console.log('📬 Respuesta del backend:', response);

            if (response?.success) {
                message.success('Producto con variantes editado correctamente');
                refetchProducts();
                handleProductCancel();
            } else {
                message.warning(response?.message || 'No se pudo editar el producto');
            }
        } catch (err) {
            console.error('❌ Error inesperado al editar producto con variantes:', err);
            message.error(err.message || 'Error al editar el producto');
        }
    };




    const productMenu = (
        <Menu
            items={[
                {
                    key: 'no-variants',
                    label: 'Producto sin variantes',
                    onClick: openCreateProductModal,
                },
                {
                    key: 'with-variants',
                    label: 'Producto con variantes',
                    onClick: openCreateProductWithVariantsModal,
                },
            ]}
        />
    );

    const handleAgregarExistente = async (product) => {
        Modal.confirm({
            title: '¿Agregar este producto a la subcategoría?',
            content: `Producto: ${product.name}`,
            okText: 'Sí, agregar',
            cancelText: 'Cancelar',
            async onOk() {
                try {
                    const res = await Products.addSubcategoryToProduct(product._id, subcategoryId);
                    if (res?.success) {
                        message.success('Producto agregado a la subcategoría');
                        refetchProducts();
                        setIsAgregarExistenteVisible(false);
                    } else {
                        message.warning(res?.message || 'No se pudo agregar');
                    }
                } catch (err) {
                    message.error(err.message || 'Error inesperado');
                }
            },
        });
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto">
                <div className="mb-6">
                    <Row gutter={[16, 16]}>
                        <Col span={24} className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-gray-800">Productos</h1>
                            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Volver</Button>
                        </Col>
                        <Col span={24} className="flex flex-col md:flex-row md:justify-start gap-4">
                            <div className="flex gap-2">
                                <Dropdown overlay={productMenu} trigger={['click']}>
                                    <Button type="primary" icon={<PlusOutlined />}>Agregar Producto</Button>
                                </Dropdown>

                                <Button onClick={() => setIsAgregarExistenteVisible(true)}>
                                    Agregar productos existentes
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </div>
                <Breadcrumb className="mb-4">
                    <Breadcrumb.Item
                        onClick={() => {
                            if (categoryId) {
                                navigate(`/categorias/${categoryId}/subcategorias`, {
                                    state: { categoryName }
                                });
                            } else {
                                navigate('/categorias');
                            }
                        }}
                        className="cursor-pointer"
                    >
                        {categoryName}
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>{subcategoryName}</Breadcrumb.Item>
                </Breadcrumb>




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
                    paginatedData.length > 0 ? (
                        <div className="grid gap-4">
                            {paginatedData.map(prod => (
                                <Card key={prod._id} title={prod.name} bordered>
                                    <Space wrap>
                                        <Button icon={<EditOutlined />} onClick={() => handleEdit(prod)}>Editar</Button>
                                        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(prod)}>Eliminar</Button>
                                    </Space>
                                </Card>
                            ))}
                        </div>
                    ) : <Empty description="No hay productos" />
                ) : (
                    <Table
                        dataSource={filteredData}
                        columns={columns}
                        rowKey="_id"
                        loading={isLoading}
                        pagination={{ pageSize, position: ['bottomCenter'] }}
                        bordered
                    />
                )}


                <ModalCreateProduct
                    visible={isProductModalVisible && !hasVariants && !editingItem}
                    onCancel={handleProductCancel}
                    onCreate={handleCreateProduct}
                    form={formProduct}
                    imageFile={imageFile}
                    setImageFile={setImageFile}
                    validateImage={validateProductImageSize}
                />

                <ModalEditProduct
                    visible={isProductModalVisible && !hasVariants && !!editingItem}
                    onCancel={handleProductCancel}
                    onEdit={handleEditProduct}
                    form={formProduct}
                    imageFile={imageFile}
                    setImageFile={setImageFile}
                    validateImage={validateProductImageSize}
                    onRemove={(file) => {
                        const filePath = file.url;
                        if (filePath) {
                            setRemovedImages(prev => [...prev, filePath]);
                        }
                        setImageFile(prev => prev.filter(f => f.uid !== file.uid));
                    }}
                    BACKEND_URL={BACKEND_URL}
                />



                <ModalCreateProductWithVariants
                    visible={isProductModalVisible && hasVariants && !editingItem}
                    onCancel={handleProductCancel}
                    onCreate={handleCreateProductWithVariants}
                    form={formProduct}
                    variantAttributes={variantAttributes}
                    setVariantAttributes={setVariantAttributes}
                    variantImageLists={variantImageLists}
                    setVariantImageLists={setVariantImageLists}
                    validateImage={validateProductImageSize}
                    onSubmit={handleCreateProductWithVariants}
                />

                <ModalEditProductWithVariants
                    visible={isProductModalVisible && hasVariants && !!editingItem}
                    onCancel={handleProductCancel}
                    onEdit={handleEditProductWithVariants}
                    form={formProduct}
                    imageFile={imageFile}
                    setImageFile={setImageFile}
                    validateImage={validateProductImageSize}
                    variantAttributes={variantAttributes}
                    setVariantAttributes={setVariantAttributes}
                    variantImageLists={variantImageLists}
                    setVariantImageLists={setVariantImageLists}
                    removedVariantImages={removedVariantImages}
                    setRemovedVariantImages={setRemovedVariantImages}
                    editingItem={editingItem}
                />
                <Modal
                    title="Agregar productos existentes"
                    visible={isAgregarExistenteVisible}
                    onCancel={() => setIsAgregarExistenteVisible(false)}
                    footer={null}
                    width={800}
                >
                    <Input.Search
                        placeholder="Buscar producto"
                        allowClear
                        enterButton="Buscar"
                        onSearch={setSearchExistingProduct}
                        className="mb-4"
                    />

                    <Table
                        dataSource={allProducts}
                        columns={[
                            { title: 'Nombre', dataIndex: 'name', key: 'name' },
                            {
                                title: 'Acción',
                                key: 'action',
                                render: (_, record) => (
                                    <Button type="primary" onClick={() => handleAgregarExistente(record)}>
                                        Agregar
                                    </Button>
                                ),
                            },
                        ]}
                        rowKey="_id"
                        loading={loadingUnfiltered}
                        pagination={false}
                        bordered
                    />
                </Modal>

            </div>
        </div>
    );
};

export default Productos;
