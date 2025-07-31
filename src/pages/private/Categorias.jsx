// Categorias.jsx
import React, { useState } from 'react';
import { Table, Button, Space, Input, Modal, Form, Card, message, Upload, Empty, Checkbox, Row, Col, Select, Dropdown, Menu } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, SearchOutlined, ShoppingOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useMediaQuery } from 'react-responsive';
import { useAuth } from '../../context/AuthContext.jsx';
import useCategories from '../../hooks/useCategories.js';
import useProducts from '../../hooks/useProducts.js';
import Categories from '../../services/Categories.js';
import Products from '../../services/Products.js';
import Sidebar from '../../components/Sidebar.jsx';
import ModalCreateCategory from '../../components/ModalCreateCategory.jsx'
import ModalEditCategory from '../../components/ModalEditCategory.jsx'
import ModalCreateProduct from '../../components/ModalCreateProduct.jsx'; // Ajusta el path según ubicación
import ModalEditProduct from '../../components/ModalEditProduct.jsx'; // Ajusta la ruta si es necesario
import ModalCreateProductWithVariants from '../../components/ModalCreateProductWithVariants.jsx'
import ModalEditProductWithVariants from '../../components/ModalEditProductWithVariants.jsx'
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

const Categorias = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemType, setItemType] = useState('');
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const isMobile = useMediaQuery({ maxWidth: 768 });
    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const { data: productData, refetch: refetchProducts } = useProducts({ storeId: user.storeId, ungrouped: true });
    const { data: categoryData, isLoading, refetch: refetchCategories } = useCategories({ page, limit, storeId: user?.storeId });
    console.log(productData)
    const categories = categoryData?.data?.docs || [];
    const products = productData?.data?.docs || [];

    const combinedData = [...categories.map(cat => ({ ...cat, type: 'Categoría' })), ...products.map(prod => ({ ...prod, type: 'Producto suelto' }))];

    const filteredData = searchText
        ? combinedData.filter(item => item.name.toLowerCase().includes(searchText.toLowerCase()))
        : combinedData;

    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
    const [isProductModalVisible, setIsProductModalVisible] = useState(false);
    const [formProduct] = Form.useForm();
    const [hasVariants, setHasVariants] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
    const [variantAttributes, setVariantAttributes] = useState([]);
    const [variantImageLists, setVariantImageLists] = useState({});
    const [hasVariantsLocked, setHasVariantsLocked] = useState(false);
    // const [imageFile, setImageFile] = useState([]);


    const variantOptions = [
        { label: 'Color', value: 'color' },
        { label: 'Tamaño', value: 'size' },
        { label: 'Peso', value: 'weight' },
        { label: 'Sabor', value: 'flavor' },
        { label: 'Material', value: 'material' },
        { label: 'Presentación', value: 'presentation' },
        { label: 'Envase', value: 'container' },
        { label: 'Edad', value: 'age' },
        { label: 'Raza', value: 'breed' },
    ];









    const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] = useState(false); // para mostrar el modal de edición
    const [formCategory] = Form.useForm(); // formulario compartido para crear/editar
    const [imageFile, setImageFile] = useState(null); // imagen actual de la categoría

    const [removedImages, setRemovedImages] = useState([]);
    const [removedVariantImages, setRemovedVariantImages] = useState({});


    const validateImageSize = async (file) => {
        const isValid = await new Promise((resolve) => {
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

        if (isValid) {
            setImageFile({
                uid: file.uid || '-1',
                name: file.name,
                status: 'done',
                url: URL.createObjectURL(file),  // 👉 esto se usará para vista previa
                originFileObj: file              // 👈 lo necesitas para el envío real
            });
            return false; // Previene carga automática por Upload
        }

        return Upload.LIST_IGNORE;
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
    const validateCategoryImageSize = async (file) => {
        const isValid = await validateImageDimensions(file);
        if (!isValid) return Upload.LIST_IGNORE;

        setImageFile({
            uid: file.uid || '-1',
            name: file.name,
            status: 'done',
            url: URL.createObjectURL(file),
            originFileObj: file
        });

        return false;
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




    // CATEGORIAS
    // CREAR CATEGORIAS
    const openCreateCategoryModal = () => {
        formCategory.resetFields();
        setImageFile(null);
        setEditingItem(null);
        setIsCategoryModalVisible(true);
    };
    const handleCreateCategory = async () => {
        const values = await formCategory.validateFields();

        if (!imageFile?.originFileObj) {
            message.error('La imagen de la categoría es obligatoria');
            return;
        }

        const formData = new FormData();
        formData.append('name', values.nombre);
        formData.append('storeId', user.storeId);
        formData.append('image', imageFile.originFileObj);

        try {
            const response = await Categories.create(formData);

            if (response?.success) {
                message.success('Categoría creada correctamente');
                refetchCategories();
                setIsCategoryModalVisible(false);
                formCategory.resetFields();
                setImageFile(null);
                setEditingItem(null);
            } else {
                message.warning(response?.message || 'No se pudo crear la categoría');
            }
        } catch (err) {
            message.error(err.message || 'Error al crear la categoría');
        }
    };
    const handleCategoryCancel = () => {
        setIsCategoryModalVisible(false);
        formCategory.resetFields();
        setImageFile(null);
        setEditingItem(null);
    };


    // EDITAR CATEGORIAS
    const openEditCategoryModal = (category) => {
        formCategory.setFieldsValue({ nombre: category.name });

        const imageObj = category.image
            ? {
                uid: `existing-${category._id}`,
                name: category.image.split('/').pop(),
                status: 'done',
                url: `${BACKEND_URL}${category.image}`
            }
            : null;

        setImageFile(imageObj);
        setEditingItem(category);
        setIsEditCategoryModalVisible(true);
    };
    const handleEditCategory = async () => {
        const values = await formCategory.validateFields();

        const formData = new FormData();
        formData.append('name', values.nombre);
        formData.append('storeId', user.storeId);

        if (imageFile?.originFileObj) {
            formData.append('image', imageFile.originFileObj);
        }

        try {
            const response = await Categories.edit(editingItem._id, formData);

            if (response?.success) {
                message.success('Category updated successfully');
                refetchCategories();
                setIsEditCategoryModalVisible(false);
                formCategory.resetFields();
                setImageFile(null);
                setEditingItem(null);
            } else {
                message.warning(response?.message || 'Failed to update category');
            }
        } catch (err) {
            message.error(err.message || 'Unexpected error');
        }
    };
    const handleEditCategoryCancel = () => {
        setIsEditCategoryModalVisible(false);
        formCategory.resetFields();
        setImageFile(null);
        setEditingItem(null);
    };



    //PRODUCTOS SIN VARIANTES
    // CREAR PRODUCTOS SIN VARIANTES
    const openCreateProductModal = () => {
        formProduct.resetFields();
        setEditingItem(null);
        setImageFile([]);
        setHasVariants(false);
        setVariantAttributes([]);
        setVariantImageLists({});
        setHasVariantsLocked(false);
        setIsProductModalVisible(true);
    };
    const handleCreateProduct = async () => {
        const values = await formProduct.validateFields();

        if (!imageFile || imageFile.length === 0) {
            message.error('La imagen del producto es obligatoria');
            return;
        }

        // 👇 Este producto se crea como suelto (sin categorías ni subcategorías)
        values.categoryIds = [];
        values.subcategoryIds = [];

        const formData = new FormData();
        formData.append('name', values.nombre);
        formData.append('storeId', user.storeId);
        formData.append('detail', values.detail || '');
        formData.append('priceBase', values.priceBase || 0);
        formData.append('priceDiscount', values.priceDiscount || 0);
        formData.append('isFeatured', values.isFeatured || false);
        formData.append('available', values.available || false);

        (values.categoryIds || []).forEach(id => {
            formData.append('categoryIds[]', id);
        });
        (values.subcategoryIds || []).forEach(id => {
            formData.append('subcategoryIds[]', id);
        });

        imageFile.forEach((file) => {
            if (file.originFileObj) {
                formData.append('image', file.originFileObj);
            }
        });

        formData.append('variants', JSON.stringify([])); // sin variantes

        try {
            const response = await Products.createSimple(formData);
            if (response?.success) {
                message.success('Producto creado correctamente');
                refetchProducts();
                refetchCategories();
                handleProductCancel();
            } else {
                message.warning(response?.message || 'No se pudo crear el producto');
            }
        } catch (err) {
            message.error(err.message || 'Error al crear el producto');
        }
    };


    const handleProductCancel = () => {
        setIsProductModalVisible(false);
        formProduct.resetFields();
        setRemovedImages([]); // 👈 limpia al cerrar
    };
    //EDITAR PRODUCTOS SIN VARIANTES
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
                url: `${BACKEND_URL}${url}`,
            }));
            setImageFile(files);
        } else {
            setImageFile([]);
        }

        setEditingItem(item);
        setIsProductModalVisible(true);
    };
    const handleEditProduct = async () => {
        console.log('✅ handleEditProduct se ejecuta');

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

        // ✅ Agregar imágenes nuevas
        imageFile.forEach((file) => {
            if (file.originFileObj) {
                formData.append('image', file.originFileObj);
            }
        });

        // ✅ Agregar imágenes eliminadas (si hay)
        if (removedImages.length > 0) {
            formData.append('removedImages', JSON.stringify(removedImages));
        }

        // ✅ Sin variantes
        formData.append('variants', JSON.stringify([]));

        try {
            const response = await Products.editSimple(editingItem._id, formData);
            if (response?.success) {
                message.success('Producto editado correctamente');
                refetchProducts();
                refetchCategories();
                handleProductCancel();
            } else {
                message.warning(response?.message || 'No se pudo editar el producto');
            }
        } catch (err) {
            message.error(err.message || 'Error al editar el producto');
        }
    };


    //PRODUCTOS CON VARIANTES
    // CREAR PRODUCTOS CON VARIANTES
    const openCreateProductWithVariantsModal = () => {
        formProduct.resetFields();
        setEditingItem(null);
        setImageFile([]);
        setHasVariants(true);
        setVariantAttributes([]);
        setVariantImageLists({});
        setHasVariantsLocked(true); // 🔒 fuerza variantes
        setIsProductModalVisible(true);
    };
    const handleCreateProductWithVariants = async () => {
        const values = await formProduct.validateFields(['nombre', 'variants']).catch((err) => {
            console.error("❌ Error en validación de nombre o variantes:", err);
            return;
        });
        if (!values) return;

        if (variantAttributes.length === 0 || !values.variants || values.variants.length === 0) {
            message.error('Debes configurar al menos una variante');
            return;
        }

        // Validación de cada variante
        for (let i = 0; i < values.variants.length; i++) {
            const variant = values.variants[i];
            const images = variantImageLists[i] || [];

            if (!variant.price || isNaN(variant.price)) {
                message.error(`La variante #${i + 1} debe tener un precio válido`);
                return;
            }

            if (!variant.stock || isNaN(variant.stock)) {
                message.error(`La variante #${i + 1} debe tener stock válido`);
                return;
            }

            if (images.length === 0) {
                message.error(`La variante #${i + 1} debe tener al menos una imagen`);
                return;
            }
        }

        // 👇 Se crean como productos sueltos (sin categorías)
        const formData = new FormData();
        formData.append('name', values.nombre);
        formData.append('storeId', user.storeId);
        formData.append('detail', values.detail || '');
        formData.append('variants', JSON.stringify(values.variants));
        formData.append('variantAttributes', JSON.stringify(variantAttributes));
        formData.append('isFeatured', values.isFeatured || false);
        formData.append('available', values.available || false);

        // Agrega arrays vacíos explícitamente
        formData.append('categoryIds[]', '');
        formData.append('subcategoryIds[]', '');

        // Agrega imágenes de variantes
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
                refetchCategories();
                handleProductCancel();
            } else {
                message.warning(response?.message || 'No se pudo crear el producto');
            }
        } catch (err) {
            message.error(err.message || 'Error al crear producto');
        }
    };








    const openEditProductWithVariantsModal = (product) => {
        // Setea valores del formulario
        formProduct.setFieldsValue({
            nombre: product.name,
            detail: product.detail,
            priceBase: product.priceBase,
            priceDiscount: product.priceDiscount,
            isFeatured: product.isFeatured,
            available: product.available,
            variants: product.variants || [],
        });

        setHasVariants(true);
        setHasVariantsLocked(true);

        // Filtra solo los atributos válidos según las opciones disponibles
        const productAttrs = product.variantAttributes || [];
        const validAttrs = (product.variantAttributes || []).filter(attr =>
            variantOptions.some(opt => opt.value === attr)
        );
        console.log('Atributos válidos del producto:', validAttrs);

        setVariantAttributes(validAttrs);

        // Construye mapa de imágenes por índice de variante
        const variantImagesMap = {};
        (product.variants || []).forEach((variant, index) => {
            if (Array.isArray(variant.images)) {
                variantImagesMap[index] = variant.images.map((url, i) => {
                    const fullUrl = `${BACKEND_URL}${url}`;
                    return {
                        uid: `v-${index}-${i}`,
                        name: url.split('/').pop(),
                        status: 'done',
                        url: fullUrl,
                        thumbUrl: fullUrl // 👈 importante para miniatura
                    };
                });
            }
        });
        setVariantImageLists(variantImagesMap);

        setEditingItem(product);
        setIsProductModalVisible(true);
    };





    const handleEditProductWithVariants = async () => {
        const values = await formProduct.validateFields();
        if (!editingItem) return;

        for (let i = 0; i < values.variants.length; i++) {
            const images = variantImageLists[i] || [];
            if (images.length === 0) {
                message.error(`La variante #${i + 1} debe tener al menos una imagen`);
                return;
            }
        }

        // 🧪 LOGS
        console.log('🧪 Variantes a guardar:', values.variants);
        console.log('🧪 Imágenes actuales por variante:', variantImageLists);
        console.log('🧪 Imágenes marcadas para eliminar (original):', removedVariantImages);

        const formData = new FormData();
        formData.append('name', values.nombre);
        formData.append('storeId', user.storeId);
        formData.append('detail', values.detail || '');
        formData.append('priceBase', values.priceBase || 0);
        formData.append('priceDiscount', values.priceDiscount || 0);
        formData.append('isFeatured', values.isFeatured || false);
        formData.append('available', values.available || false);
        formData.append('variants', JSON.stringify(values.variants));
        formData.append('variantAttributes', JSON.stringify(variantAttributes));

        // ✅ Enviar tal cual, no se filtra por índice
        formData.append('removedVariantImages', JSON.stringify(removedVariantImages));

        // ✅ Agregar imágenes nuevas
        Object.entries(variantImageLists).forEach(([variantKey, files]) => {
            files.forEach((file) => {
                if (file.originFileObj) {
                    formData.append(`variantImages_${variantKey}`, file.originFileObj);
                }
            });
        });

        try {
            const response = await Products.editWithVariants(editingItem._id, formData);
            if (response?.success) {
                message.success('Producto actualizado correctamente');
                refetchProducts();
                refetchCategories();
                handleProductCancel();
            } else {
                message.warning(response?.message || 'No se pudo actualizar');
            }
        } catch (err) {
            message.error(err.message || 'Error inesperado');
        }
    };






    const handleDelete = (item) => {
        Modal.confirm({
            title: `¿Eliminar ${item.type.toLowerCase()}?`,
            content: `Esta acción no se puede deshacer. ${item.type}: ${item.name}`,
            okText: 'Sí, eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const service = item.type === 'Categoría' ? Categories : Products;
                    const response = await service.delete(item._id);
                    if (response?.success) {
                        message.success(`${item.type} eliminado correctamente`);
                        item.type === 'Categoría' ? refetchCategories() : refetchProducts();
                    }
                } catch (error) {
                    message.error(error.message || 'Error al eliminar');
                }
            }
        });
    };

    const handleSearch = (value) => {
        setCurrentPage(1);
        setSearchText(value);
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
                    onClick: openCreateProductWithVariantsModal, // 👈 esta función
                },
            ]}
        />
    );

    const columns = [
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Tipo', dataIndex: 'type', key: 'type' },
        {
            title: 'Acciones',
            key: 'acciones',
            render: (_, record) => (
                <Space>
                    {record.type === 'Categoría' ? (
                        <>
                            <Button type="primary" icon={<EditOutlined />} onClick={() => openEditCategoryModal(record)}>
                                Editar
                            </Button>
                            <Button
                                onClick={() => navigate(`/categorias/${record._id}/subcategorias`, {
                                    state: { categoryName: record.name }
                                })}
                                icon={<ShoppingOutlined />}
                            >
                                Subcategorías
                            </Button>
                        </>
                    ) : (
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => {
                                const hasVariants = record.variants && record.variants.length > 0;
                                hasVariants ? openEditProductWithVariantsModal(record) : openEditProductModal(record);
                            }}
                        >
                            Editar
                        </Button>
                    )}

                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                        Eliminar
                    </Button>
                </Space>
            )
        }
    ];













    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto">
                <div className="mb-6">
                    <Row gutter={[16, 16]}>
                        <Col span={24} className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-gray-800">Categorías y Productos Sueltos</h1>
                        </Col>
                        <Row gutter={[16, 16]}>
                            <Col>
                                <Button
                                    type="primary"
                                    onClick={openCreateCategoryModal}
                                    icon={<PlusOutlined />}
                                >
                                    Agregar Categoría
                                </Button>
                            </Col>

                            <Col>
                                <Dropdown overlay={productMenu} trigger={['click']}>
                                    <Button type="primary" icon={<PlusOutlined />}>
                                        Agregar Producto Suelto
                                    </Button>
                                </Dropdown>
                            </Col>
                        </Row>




                    </Row>

                </div>

                <Search
                    placeholder="Buscar por nombre"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="large"
                    onSearch={handleSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="mb-4"
                />

                <div className="overflow-x-auto">
                    {isMobile ? (
                        paginatedData.length > 0 ? (
                            <div className="grid gap-4">
                                {paginatedData.map(item => (
                                    <Card key={item._id} title={item.name} bordered>
                                        <p><strong>Tipo:</strong> {item.type}</p>
                                        <Space wrap>
                                            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(item)}>
                                                Editar
                                            </Button>
                                            <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(item)}>
                                                Eliminar
                                            </Button>
                                            {item.type === 'Categoría' && (
                                                <Button
                                                    size="small"
                                                    icon={<ShoppingOutlined />}
                                                    onClick={() => navigate(`/categorias/${item._id}/subcategorias`)}
                                                >
                                                    Subcategorías
                                                </Button>
                                            )}
                                        </Space>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex justify-center items-center min-h-[300px]">
                                <Empty description="No hay registros" />
                            </div>
                        )
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
                </div>

                <ModalCreateCategory
                    visible={isCategoryModalVisible}
                    onCancel={handleCategoryCancel}
                    onCreate={handleCreateCategory}
                    form={formCategory}
                    imageFile={imageFile}
                    setImageFile={setImageFile}
                    validateImage={validateCategoryImageSize}
                />


                <ModalEditCategory
                    visible={isEditCategoryModalVisible}
                    onCancel={handleEditCategoryCancel}
                    onEdit={handleEditCategory}
                    form={formCategory}
                    imageFile={imageFile}
                    setImageFile={setImageFile}
                    validateImage={validateCategoryImageSize}
                />

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
                        const filePath = file.url?.replace(BACKEND_URL, '');
                        if (filePath) {
                            setRemovedImages(prev => [...prev, filePath]);
                        }
                        setImageFile(prev => prev.filter(f => f.uid !== file.uid));
                    }}
                    BACKEND_URL={BACKEND_URL} // ✅ aquí lo agregas
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
                    BACKEND_URL={BACKEND_URL}
                    removedVariantImages={removedVariantImages} // ✅ nuevo
                    setRemovedVariantImages={setRemovedVariantImages} // ✅ nuevo
                    editingItem={editingItem}
                />

            </div>
        </div>
    );
};

export default Categorias;
