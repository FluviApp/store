// components/modals/ModalCreateSubcategory.jsx
import React from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const ModalCreateSubcategory = ({
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
            title="Agregar Subcategoría"
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
                    rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                >
                    <Input placeholder="Nombre de la subcategoría" />
                </Form.Item>

                <Form.Item label="Imagen (400x400)">
                    <Upload
                        listType="picture"
                        maxCount={1}
                        beforeUpload={validateImage}
                        showUploadList={{ showRemoveIcon: true }}
                        customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                        fileList={
                            imageFile
                                ? [{
                                    uid: imageFile.uid || '-1',
                                    name: imageFile.name || 'imagen.png',
                                    status: 'done',
                                    url: imageFile.url || (imageFile.originFileObj ? URL.createObjectURL(imageFile.originFileObj) : undefined),
                                    thumbUrl: imageFile.thumbUrl || (imageFile.originFileObj ? URL.createObjectURL(imageFile.originFileObj) : undefined),
                                }]
                                : []
                        }
                        onRemove={() => setImageFile(null)}
                    >
                        <Button icon={<UploadOutlined />}>Seleccionar imagen</Button>
                    </Upload>

                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalCreateSubcategory;
