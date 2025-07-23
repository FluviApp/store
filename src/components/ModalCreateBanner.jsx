// components/modals/ModalCreateBanner.jsx
import React from 'react';
import { Modal, Form, Input, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const ModalCreateBanner = ({
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
            title="Agregar Banner"
            open={visible}
            onCancel={onCancel}
            onOk={onCreate}
            okText="Guardar"
            cancelText="Cancelar"
            width={600}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="name"
                    label="Nombre del banner"
                    rules={[{ required: true, message: 'El nombre es obligatorio' }]}
                >
                    <Input placeholder="Nombre del banner" />
                </Form.Item>

                <Form.Item name="link" label="Link del banner (opcional)">
                    <Input placeholder="https://..." />
                </Form.Item>

                <Form.Item label="Imagen (1200x500)">
                    <Upload
                        maxCount={1}
                        listType="picture"
                        beforeUpload={async (file) => {
                            const isValid = await validateImage(file);
                            if (!isValid) return Upload.LIST_IGNORE;

                            setImageFile({
                                uid: file.uid || '-1',
                                name: file.name,
                                status: 'done',
                                url: URL.createObjectURL(file),
                                originFileObj: file,
                            });

                            return false; // prevenir subida automática
                        }}
                        showUploadList={{ showRemoveIcon: true }}
                        fileList={
                            imageFile
                                ? [{
                                    uid: imageFile.uid || '-1',
                                    name: imageFile.name || 'banner.jpg',
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

export default ModalCreateBanner;
