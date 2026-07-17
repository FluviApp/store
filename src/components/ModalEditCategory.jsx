// components/modals/ModalEditCategoria.jsx
import React from 'react';
import { Modal, Form, Input, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const buildFileList = (file) =>
    file
        ? [{
            uid: file.uid || '-1',
            name: file.name || 'image.png',
            status: 'done',
            url: file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : undefined),
        }]
        : [];

const ModalEditCategory = ({
    visible,
    onCancel,
    onEdit,
    form,
    imageFile,
    setImageFile,
    validateImage,
    imageWideFile,
    setImageWideFile,
    validateWideImage,
}) => {
    return (
        <Modal
            title="Editar categoría"
            open={visible}
            onCancel={onCancel}
            onOk={onEdit}
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
                    <Input placeholder="Nombre de la categoría" />
                </Form.Item>

                <Form.Item
                    label="Imagen cuadrada (400×400)"
                    extra="La usa la app actual. Selecciona una nueva para reemplazarla."
                >
                    <Upload
                        maxCount={1}
                        listType="picture"
                        beforeUpload={validateImage}
                        showUploadList={{ showRemoveIcon: true }}
                        fileList={buildFileList(imageFile)}
                        onRemove={() => setImageFile(null)}
                        customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                    >
                        <Button icon={<UploadOutlined />}>Seleccionar imagen cuadrada</Button>
                    </Upload>
                </Form.Item>

                <Form.Item
                    label="Imagen rectangular 2:1 (800×400) — opcional"
                    extra="La usa la app nueva. Si no la subes, se usa la cuadrada."
                >
                    <Upload
                        maxCount={1}
                        listType="picture"
                        beforeUpload={validateWideImage}
                        showUploadList={{ showRemoveIcon: true }}
                        fileList={buildFileList(imageWideFile)}
                        onRemove={() => setImageWideFile(null)}
                        customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                    >
                        <Button icon={<UploadOutlined />}>Seleccionar imagen rectangular</Button>
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalEditCategory;
