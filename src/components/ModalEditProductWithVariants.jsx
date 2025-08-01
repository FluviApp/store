import React from 'react';
import { useEffect } from 'react';
import {
    Modal, Form, Input, Checkbox, Upload, Button,
    Select, message, Card, Space
} from 'antd';
import { UploadOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';

const ModalEditProductWithVariants = ({
    visible,
    onCancel,
    onEdit,
    form,
    imageFile,
    setImageFile,
    validateImage,
    variantAttributes,
    setVariantAttributes,
    variantImageLists,
    setVariantImageLists,
    removedVariantImages,
    setRemovedVariantImages,
    editingItem,
}) => {
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


    useEffect(() => {
        if (!visible) return;

        const currentVariants = form.getFieldValue('variants') || [];

        if (currentVariants.length === 0) return;

        // Tomar claves de la primera variante
        const firstVariantKeys = Object.keys(currentVariants[0]);

        // Comparar solo con las opciones válidas (evita campos backend o imágenes)
        const validAttrs = variantOptions
            .map(opt => opt.value)
            .filter(value => firstVariantKeys.includes(value));

        setVariantAttributes(validAttrs);
    }, [visible]);


    return (
        <Modal
            title="Editar Producto con Variantes"
            open={visible}
            onCancel={onCancel}
            onOk={onEdit}
            okText="Guardar"
            cancelText="Cancelar"
            width={900}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="nombre"
                    label="Nombre"
                    rules={[{ required: true, message: 'Nombre obligatorio' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item name="detail" label="Descripción">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item name="isFeatured" valuePropName="checked">
                    <Checkbox>Producto destacado</Checkbox>
                </Form.Item>
                <Form.Item label="Atributos de variantes (por ejemplo, Talla, Color)">
                    <Select
                        mode="multiple"
                        value={variantAttributes}
                        options={variantOptions.filter(opt => variantAttributes.includes(opt.value))}
                        disabled
                    />
                </Form.Item>

                <Form.List name="variants">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => {
                                const variants = form.getFieldValue('variants') || [];
                                const totalVariants = variants.length;
                                const dbVariantsCount = variants.filter(v => !!v?._id).length;
                                const isFromDB = !!variants[name]?._id;
                                const canDelete = totalVariants > 1 && (!isFromDB || dbVariantsCount > 1);

                                return (
                                    <Card key={key} size="small" style={{ marginBottom: 12, position: 'relative' }}>
                                        {canDelete ? (
                                            <Button
                                                icon={<CloseOutlined />}
                                                size="small"
                                                danger
                                                style={{ position: 'absolute', top: 8, right: 8 }}
                                                onClick={() => {
                                                    const variants = form.getFieldValue('variants') || [];
                                                    const variantToRemove = variants[name];

                                                    console.log('🧨 Eliminando variante con índice:', name);
                                                    console.log('🧨 Variante eliminada:', variantToRemove);
                                                    console.log('🔍 _id de la variante:', variantToRemove?._id);

                                                    const variantImages = variantImageLists[name];
                                                    console.log('📸 Imágenes asociadas a esta variante:', variantImages);

                                                    if (variantToRemove?._id && variantImages?.length) {
                                                        const paths = variantImages
                                                            .filter(img => img.url)
                                                            .map(img => img.url);


                                                        console.log('🧾 Rutas detectadas para eliminar:', paths);

                                                        if (paths.length) {
                                                            setRemovedVariantImages(prev => {
                                                                const updated = {
                                                                    ...prev,
                                                                    [variantToRemove._id]: [...(prev[variantToRemove._id] || []), ...paths],
                                                                };
                                                                console.log('📦 removedVariantImages actualizado:', updated);
                                                                return updated;
                                                            });
                                                        }
                                                    } else {
                                                        console.warn('⚠️ Variante sin _id o sin imágenes. No se guarda en removedVariantImages.');
                                                    }

                                                    // 🔄 Limpiar las imágenes en memoria
                                                    setVariantImageLists(prev => {
                                                        const updated = { ...prev };
                                                        delete updated[name];
                                                        return updated;
                                                    });

                                                    remove(name); // ← Esto borra visualmente la variante del form
                                                }}

                                            />




                                        ) : (
                                            <Button
                                                icon={<CloseOutlined />}
                                                size="small"
                                                danger
                                                disabled
                                                style={{ position: 'absolute', top: 8, right: 8 }}
                                                onClick={() => message.warning('No podés eliminar esta variante')}
                                            />
                                        )}

                                        <Space align="baseline" wrap style={{ width: '100%' }}>
                                            {variantAttributes.map(attr => {
                                                const label = variantOptions.find(opt => opt.value === attr)?.label || attr;
                                                return (
                                                    <Form.Item
                                                        key={attr}
                                                        {...restField}
                                                        name={[name, attr]}
                                                        label={label}
                                                        rules={[{ required: true, message: `${label} obligatorio` }]}
                                                    >
                                                        <Input />
                                                    </Form.Item>
                                                );
                                            })}

                                            <Form.Item
                                                {...restField}
                                                name={[name, 'price']}
                                                label="Precio"
                                                rules={[
                                                    { required: true, message: 'Precio obligatorio' },
                                                    {
                                                        validator: (_, value) =>
                                                            /^\d+$/.test(value)
                                                                ? Promise.resolve()
                                                                : Promise.reject('Solo números sin puntos'),
                                                    },
                                                ]}
                                            >
                                                <Input />
                                            </Form.Item>

                                            <Form.Item {...restField} name={[name, 'priceDiscount']} label="Descuento">
                                                <Input />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                name={[name, 'stock']}
                                                label="Stock"
                                                rules={[
                                                    { required: true, message: 'Stock obligatorio' },
                                                    {
                                                        validator: (_, value) =>
                                                            /^\d+$/.test(value)
                                                                ? Promise.resolve()
                                                                : Promise.reject('Solo números sin puntos'),
                                                    },
                                                ]}
                                            >
                                                <Input />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                name={[name, 'available']}
                                                label="Disponible"
                                                valuePropName="checked"
                                            >
                                                <Checkbox />
                                            </Form.Item>

                                            <Form.Item label="Imágenes">
                                                <Upload
                                                    listType="picture"
                                                    multiple
                                                    beforeUpload={validateImage}
                                                    fileList={(variantImageLists[key] || []).map(file => ({
                                                        ...file,
                                                        thumbUrl: file.thumbUrl || file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : undefined),
                                                        url: file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : undefined),
                                                    }))}
                                                    onChange={({ file, fileList }) => {
                                                        const updatedList = fileList.map(f => {
                                                            const isNew = !!f.originFileObj;
                                                            return {
                                                                ...f,
                                                                status: 'done',
                                                                thumbUrl: f.thumbUrl || (isNew ? URL.createObjectURL(f.originFileObj) : f.url),
                                                                url: f.url || (isNew ? URL.createObjectURL(f.originFileObj) : undefined),
                                                            };
                                                        });

                                                        const variants = form.getFieldValue('variants') || [];

                                                        // 🚨 Validación: asegurarse de que la variante existe antes de subir imágenes
                                                        if (!variants[key]) {
                                                            message.warning('Primero completa al menos un campo de la variante antes de subir imágenes.');
                                                            return;
                                                        }

                                                        // ✅ Guardar imágenes en estado
                                                        setVariantImageLists(prev => ({
                                                            ...prev,
                                                            [key]: updatedList
                                                        }));

                                                        // ✅ Asociar imágenes al formulario
                                                        variants[key] = {
                                                            ...variants[key],
                                                            images: updatedList
                                                        };
                                                        form.setFieldsValue({ variants });
                                                    }}

                                                    onRemove={(file) => {
                                                        const currentList = variantImageLists[key] || [];

                                                        if (currentList.length === 1) {
                                                            message.warning('Cada variante debe tener al menos una imagen');
                                                            return false;
                                                        }

                                                        const variant = form.getFieldValue('variants')?.[key];
                                                        const variantId = variant?._id; // ✅ Usamos el _id real

                                                        if (file.url && variantId) {
                                                            setRemovedVariantImages(prev => ({
                                                                ...prev,
                                                                [variantId]: [...(prev[variantId] || []), file.url]
                                                            }));
                                                        }


                                                        const updatedList = currentList.filter(f => f.uid !== file.uid);

                                                        setVariantImageLists(prev => ({
                                                            ...prev,
                                                            [key]: updatedList
                                                        }));

                                                        const variants = form.getFieldValue('variants') || [];
                                                        variants[key] = {
                                                            ...variants[key],
                                                            images: updatedList
                                                        };
                                                        form.setFieldsValue({ variants });

                                                        return true;
                                                    }}

                                                    customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                                                    itemRender={(originNode, file) => {
                                                        const uid = file.uid;

                                                        return (
                                                            <div style={{ position: 'relative', display: 'inline-block', marginRight: 8 }}>
                                                                {originNode}
                                                                <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                                                                    <Button
                                                                        size="small"
                                                                        onClick={() => document.getElementById(`replace-variant-${key}-${uid}`)?.click()}
                                                                    >
                                                                        Reemplazar
                                                                    </Button>
                                                                </div>

                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    style={{ display: 'none' }}
                                                                    id={`replace-variant-${key}-${uid}`}
                                                                    onChange={(e) => {
                                                                        const newFile = e.target.files?.[0];
                                                                        if (!newFile) return;

                                                                        const updatedFile = {
                                                                            uid,
                                                                            name: newFile.name,
                                                                            status: 'done',
                                                                            originFileObj: newFile,
                                                                            url: URL.createObjectURL(newFile),
                                                                            thumbUrl: URL.createObjectURL(newFile),
                                                                        };

                                                                        const prevList = variantImageLists[key] || [];
                                                                        const updatedList = prevList.map(f => f.uid === uid ? updatedFile : f);

                                                                        const variant = form.getFieldValue('variants')?.[key];
                                                                        const variantId = variant?._id;

                                                                        const oldUrl = file.url;
                                                                        if (oldUrl && variantId) {
                                                                            setRemovedVariantImages(prev => ({
                                                                                ...prev,
                                                                                [variantId]: [...(prev[variantId] || []), oldUrl]
                                                                            }));
                                                                        }


                                                                        setVariantImageLists(prev => ({
                                                                            ...prev,
                                                                            [key]: updatedList
                                                                        }));

                                                                        const variants = form.getFieldValue('variants') || [];
                                                                        variants[key] = {
                                                                            ...variants[key],
                                                                            images: updatedList
                                                                        };
                                                                        form.setFieldsValue({ variants });
                                                                    }}

                                                                />
                                                            </div>
                                                        );
                                                    }}
                                                >
                                                    <Button icon={<UploadOutlined />}>Subir imágenes</Button>
                                                </Upload>
                                            </Form.Item>
                                        </Space>
                                    </Card>
                                );
                            })}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    onClick={() => add()}
                                    disabled={variantAttributes.length === 0}
                                    block
                                >
                                    Agregar variante
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

            </Form>
        </Modal>
    );
};

export default ModalEditProductWithVariants;
