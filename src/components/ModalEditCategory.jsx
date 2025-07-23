// components/modals/ModalEditCategoria.jsx
import React from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const ModalEditCategory = ({
    visible,
    onCancel,
    onEdit,
    form,
    imageFile,
    setImageFile,
    validateImage,
}) => {
    return (
        <Modal
            title="Edit Category"
            open={visible}
            onCancel={onCancel}
            onOk={onEdit}
            okText="Save"
            cancelText="Cancel"
            width={600}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="nombre"
                    label="Name"
                    rules={[{ required: true, message: 'Name is required' }]}
                >
                    <Input placeholder="Category name" />
                </Form.Item>

                <Form.Item label="Imagen (400x400)">
                    <Upload
                        maxCount={1}
                        listType="picture"
                        beforeUpload={validateImage}
                        showUploadList={{ showRemoveIcon: false }} // 👈🏻 ocultar ícono de eliminar
                        fileList={
                            imageFile
                                ? [{
                                    uid: imageFile.uid || '-1',
                                    name: imageFile.name || 'image.png',
                                    status: 'done',
                                    url: imageFile.url || (imageFile.originFileObj ? URL.createObjectURL(imageFile.originFileObj) : undefined),
                                }]
                                : []
                        }
                        customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                        itemRender={(originNode, file) => {
                            return (
                                <div style={{ position: 'relative', display: 'inline-block', marginRight: 8 }}>
                                    {originNode}
                                    <div style={{ position: 'absolute', top: 4, right: 4 }}>
                                        <Button
                                            size="small"
                                            onClick={() => document.getElementById('replace-category-image')?.click()}
                                        >
                                            Reemplazar
                                        </Button>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="replace-category-image"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            const isValid = await validateImage(file);
                                            if (isValid === false) return;

                                            setImageFile({
                                                uid: file.uid || '-1',
                                                name: file.name,
                                                status: 'done',
                                                url: URL.createObjectURL(file),
                                                originFileObj: file,
                                            });
                                        }}
                                    />
                                </div>
                            );
                        }}
                    >
                    </Upload>

                </Form.Item>

            </Form>
        </Modal>
    );
};

export default ModalEditCategory;
