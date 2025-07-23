import React from 'react';
import { Modal, Form, Input, Upload, Button, Select, Card, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

const ModalEditPack = ({
    visible,
    onCancel,
    onSubmit,
    form,
    imageFile,
    setImageFile,
    validateImage,
    products,
    selectedProducts,
    handleAddProduct,
    handleRemoveProduct,
    handleChangeQuantity,
    isLoadingProducts
}) => {
    const handleReplaceImage = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const isValid = await validateImage(file);
        if (!isValid) return;

        setImageFile({
            uid: file.uid || '-1',
            name: file.name,
            status: 'done',
            url: URL.createObjectURL(file),
            originFileObj: file,
        });
    };

    return (
        <Modal
            title="Editar Paquete"
            open={visible}
            onCancel={onCancel}
            onOk={onSubmit}
            okText="Guardar cambios"
            cancelText="Cancelar"
            width={600}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="Nombre del paquete"
                    rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                >
                    <Input placeholder="Nombre del paquete" />
                </Form.Item>

                <Form.Item
                    name="price"
                    label="Precio"
                    rules={[{ required: true, message: 'El precio es obligatorio' }]}
                >
                    <Input type="number" placeholder="Precio del paquete" />
                </Form.Item>

                <Form.Item label="Imagen del paquete (1200x500)">
                    <Upload
                        maxCount={1}
                        listType="picture"
                        beforeUpload={() => false}
                        showUploadList={{ showRemoveIcon: false }}
                        fileList={
                            imageFile
                                ? [{
                                    uid: imageFile.uid || '-1',
                                    name: imageFile.name || 'imagen.jpg',
                                    status: 'done',
                                    url: imageFile.url || (imageFile.originFileObj ? URL.createObjectURL(imageFile.originFileObj) : undefined),
                                }]
                                : []
                        }
                        customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                        itemRender={(originNode) => (
                            <div style={{ position: 'relative', display: 'inline-block', marginRight: 8 }}>
                                {originNode}
                                <div style={{ position: 'absolute', top: 4, right: 4 }}>
                                    <Button
                                        size="small"
                                        onClick={() => document.getElementById('replace-pack-image')?.click()}
                                    >
                                        Reemplazar
                                    </Button>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="replace-pack-image"
                                    style={{ display: 'none' }}
                                    onChange={handleReplaceImage}
                                />
                            </div>
                        )}
                    />
                </Form.Item>

                <Form.Item label="Editar productos del paquete">
                    <Select
                        showSearch
                        placeholder="Buscar productos..."
                        optionFilterProp="label"
                        loading={isLoadingProducts}
                        onSelect={(productId) => {
                            const product = products.find(p => p._id === productId);
                            if (product) handleAddProduct(product);
                        }}
                        filterOption={(input, option) =>
                            option?.label?.toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {products.map((product) => (
                            <Option
                                key={product._id}
                                value={product._id}
                                label={product.name}
                            >
                                {product.name} - ${product.priceBase}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedProducts.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {selectedProducts.map(product => (
                            <Card
                                key={product.productId}
                                size="small"
                                className="border border-gray-200"
                                title={product.name}
                                extra={
                                    <Button
                                        size="small"
                                        danger
                                        onClick={() => handleRemoveProduct(product.productId)}
                                    >
                                        Quitar
                                    </Button>
                                }
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <Button onClick={() => handleChangeQuantity(product.productId, -1)}>-</Button>
                                        <span>{product.quantity}</span>
                                        <Button onClick={() => handleChangeQuantity(product.productId, 1)}>+</Button>
                                    </div>
                                    <span className="font-semibold">${product.price}</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </Form>
        </Modal>
    );
};

export default ModalEditPack;
