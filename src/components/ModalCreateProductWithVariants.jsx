import React from 'react';
import {
    Modal, Form, Input, Checkbox, Upload, Button,
    Select, message, Card, Space
} from 'antd';
import { UploadOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';

const ModalCreateProductWithVariants = ({
    visible,
    onCancel,
    onSubmit,
    form,
    imageFile,
    setImageFile,
    validateImage,
    variantAttributes,
    setVariantAttributes,
    variantImageLists,
    setVariantImageLists,
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


    const handleReplaceImage = (file, index) => {
        const inputId = `replace-input-${file.uid}`;
        document.getElementById(inputId)?.click();
    };

    const handleReplaceInput = (e, file, index) => {
        const newFile = e.target.files?.[0];
        if (!newFile) return;

        const newUpload = {
            uid: file.uid,
            name: newFile.name,
            status: 'done',
            url: URL.createObjectURL(newFile),
            originFileObj: newFile,
        };

        setImageFile(prev => {
            const updated = [...prev];
            updated[index] = newUpload;
            return updated;
        });
    };

    return (
        <Modal
            title="Crear Producto con Variantes"
            open={visible}
            onCancel={onCancel}
            onOk={onSubmit}
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
                    <Input placeholder="Nombre del producto" />
                </Form.Item>

                <Form.Item name="detail" label="Descripción">
                    <Input.TextArea rows={3} placeholder="Descripción del producto" />
                </Form.Item>

                <Form.Item name="isFeatured" valuePropName="checked">
                    <Checkbox>¿Producto destacado?</Checkbox>
                </Form.Item>


                <Form.Item label="Atributos de variantes (por ejemplo, Talla, Color)">
                    <Select
                        mode="multiple"
                        placeholder="Selecciona atributos como color, talla, sabor, etc."
                        value={variantAttributes}
                        onChange={setVariantAttributes}
                        options={variantOptions}
                    />
                </Form.Item>

                <Form.List name="variants">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <Card key={key} size="small" style={{ marginBottom: 12, position: 'relative' }}>
                                    {fields.length > 1 ? (
                                        <Button
                                            icon={<CloseOutlined />}
                                            size="small"
                                            danger
                                            style={{ position: 'absolute', top: 8, right: 8 }}
                                            onClick={() => remove(name)}
                                        />
                                    ) : (
                                        <Button
                                            icon={<CloseOutlined />}
                                            size="small"
                                            danger
                                            disabled
                                            style={{ position: 'absolute', top: 8, right: 8 }}
                                            onClick={() => message.warning('Debe haber al menos una variante')}
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
                                                    rules={[{ required: true, message: `${label} es obligatorio` }]}
                                                >
                                                    <Input placeholder={label} />
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
                                            <Input
                                                onChange={(e) => {
                                                    const cleaned = e.target.value.replace(/[^\d]/g, '');
                                                    const variants = form.getFieldValue('variants') || [];
                                                    variants[name] = {
                                                        ...variants[name],
                                                        price: cleaned,
                                                    };
                                                    form.setFieldsValue({ variants });
                                                }}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'priceDiscount']}
                                            label="Descuento"
                                            rules={[
                                                {
                                                    validator: (_, value) =>
                                                        !value || /^\d+$/.test(value)
                                                            ? Promise.resolve()
                                                            : Promise.reject('Solo números sin puntos'),
                                                },
                                            ]}
                                        >
                                            <Input
                                                onChange={(e) => {
                                                    const cleaned = e.target.value.replace(/[^\d]/g, '');
                                                    const variants = form.getFieldValue('variants') || [];
                                                    variants[name] = {
                                                        ...variants[name],
                                                        priceDiscount: cleaned,
                                                    };
                                                    form.setFieldsValue({ variants });
                                                }}
                                            />
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
                                            <Input
                                                onChange={(e) => {
                                                    const cleaned = e.target.value.replace(/[^\d]/g, '');
                                                    const variants = form.getFieldValue('variants') || [];
                                                    variants[name] = {
                                                        ...variants[name],
                                                        stock: cleaned,
                                                    };
                                                    form.setFieldsValue({ variants });
                                                }}
                                            />
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
                                                fileList={variantImageLists[name] || []}
                                                onChange={({ fileList }) => {
                                                    setVariantImageLists(prev => ({
                                                        ...prev,
                                                        [name]: fileList
                                                    }));
                                                    const variants = form.getFieldValue('variants') || [];
                                                    variants[name] = {
                                                        ...variants[name],
                                                        images: fileList
                                                    };
                                                    form.setFieldsValue({ variants });
                                                }}
                                                customRequest={({ file, onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                                            >
                                                <Button icon={<UploadOutlined />}>Subir imágenes</Button>
                                            </Upload>
                                        </Form.Item>
                                    </Space>
                                </Card>
                            ))}
                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                    disabled={variantAttributes.length === 0}
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

export default ModalCreateProductWithVariants;
