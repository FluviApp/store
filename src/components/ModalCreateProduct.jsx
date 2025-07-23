import React from 'react';
import { Modal, Form, Input, Checkbox, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const ModalCreateProduct = ({
    visible,
    onCancel,
    onCreate,
    form,
    imageFile,
    setImageFile,
    validateImage,
}) => {
    return (
        <Modal
            title="Agregar Producto"
            open={visible}
            onCancel={onCancel}
            onOk={onCreate}
            okText="Guardar"
            cancelText="Cancelar"
            width={800}
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

                <Form.Item
                    name="priceBase"
                    label="Precio base"
                    rules={[{ required: true, message: 'Precio obligatorio' }]}
                >
                    <Input
                        placeholder="$"
                        onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^\d]/g, '');
                            form.setFieldsValue({ priceBase: cleaned });
                        }}
                    />
                </Form.Item>

                <Form.Item
                    name="priceDiscount"
                    label="Precio descuento (opcional)"
                    rules={[
                        {
                            validator: (_, value) =>
                                !value || /^\d+$/.test(value)
                                    ? Promise.resolve()
                                    : Promise.reject('Solo números enteros'),
                        },
                    ]}
                >
                    <Input
                        placeholder="$"
                        onChange={(e) => {
                            const cleaned = e.target.value.replace(/[^\d]/g, '');
                            form.setFieldsValue({ priceDiscount: cleaned });
                        }}
                    />
                </Form.Item>

                <Form.Item name="isFeatured" valuePropName="checked">
                    <Checkbox>¿Producto destacado?</Checkbox>
                </Form.Item>

                <Form.Item name="available" valuePropName="checked">
                    <Checkbox>¿Disponible?</Checkbox>
                </Form.Item>

                <Form.Item label="Imágenes del producto (400x400)">
                    <Upload
                        listType="picture"
                        multiple
                        beforeUpload={validateImage}
                        fileList={imageFile || []}
                        onChange={({ fileList: incomingList }) => {
                            const unique = Array.from(new Map(incomingList.map(f => [f.uid, f])).values());
                            if (unique.length > 5) {
                                message.error('Solo puedes subir hasta 5 imágenes');
                                return;
                            }
                            setImageFile(unique);
                        }}
                        onRemove={(file) => {
                            setImageFile(prev => prev.filter(f => f.uid !== file.uid));
                        }}
                        customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                    >
                        <Button icon={<UploadOutlined />}>Agregar imagen</Button>
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalCreateProduct;
