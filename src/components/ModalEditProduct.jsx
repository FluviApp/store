import React from 'react';
import { Modal, Form, Input, Checkbox, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const ModalEditProduct = ({
    visible,
    onCancel,
    onEdit,
    form,
    imageFile,
    setImageFile,
    validateImage,
    onRemove,
    BACKEND_URL,
}) => {
    return (
        <Modal
            title="Editar Producto"
            open={visible}
            onCancel={onCancel}
            onOk={onEdit}
            okText="Guardar cambios"
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
                        onRemove={onRemove} // ✅ usar la función pasada por props
                        customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                        itemRender={(originNode, file) => {
                            const index = imageFile.findIndex(f => f.uid === file.uid);

                            return (
                                <div style={{ position: 'relative', display: 'inline-block', marginRight: 8 }}>
                                    {originNode}
                                    <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                                        <Button
                                            size="small"
                                            onClick={() =>
                                                document.getElementById(`replace-input-${file.uid}`)?.click()
                                            }
                                        >
                                            Reemplazar
                                        </Button>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id={`replace-input-${file.uid}`}
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const newFile = e.target.files?.[0];
                                            if (!newFile) return;

                                            const oldUrl = file.url;
                                            const newUpload = {
                                                uid: file.uid,
                                                name: newFile.name,
                                                status: 'done',
                                                url: URL.createObjectURL(newFile),
                                                originFileObj: newFile
                                            };

                                            setImageFile(prev => {
                                                const updated = [...prev];
                                                if (index !== -1) {
                                                    updated[index] = newUpload;
                                                }
                                                return updated;
                                            });

                                            if (oldUrl && oldUrl.startsWith(BACKEND_URL)) {
                                                const relativePath = oldUrl.replace(BACKEND_URL, '');
                                                onRemove?.({ url: relativePath });
                                            }
                                        }}
                                    />
                                </div>
                            );
                        }}

                    >
                        <Button icon={<UploadOutlined />}>Agregar imagen</Button>
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalEditProduct;
