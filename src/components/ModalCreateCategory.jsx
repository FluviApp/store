
import React from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const ModalCreateCategory = ({
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
            title="Agregar Categoría"
            open={visible}
            onCancel={onCancel}
            onOk={onCreate}
            okText="Guardar"
            cancelText="Cancelar"
            width={600}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="nombre"
                    label="Nombre"
                    rules={[{ required: true, message: 'Nombre obligatorio' }]}
                >
                    <Input placeholder="Nombre de la categoría" />
                </Form.Item>

                <Form.Item label="Imagen (400x400)">
                    <Upload
                        maxCount={1}
                        listType="picture"
                        beforeUpload={validateImage}
                        showUploadList={{ showRemoveIcon: true }}
                        fileList={
                            imageFile
                                ? [{
                                    uid: imageFile.uid || '-1',
                                    name: imageFile.name || 'imagen.png',
                                    status: 'done',
                                    url: imageFile.url || (imageFile.originFileObj ? URL.createObjectURL(imageFile.originFileObj) : undefined),
                                }]
                                : []
                        }
                        onRemove={() => setImageFile(null)}
                        customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                    >
                        <Button icon={<UploadOutlined />}>Seleccionar imagen</Button>
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalCreateCategory;
