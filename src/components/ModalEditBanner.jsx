// components/modals/ModalEditBanner.jsx
import React from 'react';
import { Modal, Form, Input, Upload, Button } from 'antd';

const ModalEditBanner = ({
    visible,
    onCancel,
    onEdit,
    form,
    imageFile,
    setImageFile,
    validateImage,
    BACKEND_URL
}) => {
    return (
        <Modal
            title="Editar Banner"
            open={visible}
            onCancel={onCancel}
            onOk={onEdit}
            okText="Guardar cambios"
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
                        beforeUpload={validateImage}
                        showUploadList={{ showRemoveIcon: false }}
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
                        customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                        itemRender={(originNode) => (
                            <div style={{ position: 'relative', display: 'inline-block', marginRight: 8 }}>
                                {originNode}
                                <div style={{ position: 'absolute', top: 4, right: 4 }}>
                                    <Button
                                        size="small"
                                        onClick={() => document.getElementById('replace-banner-image')?.click()}
                                    >
                                        Reemplazar
                                    </Button>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="replace-banner-image"
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
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
                                    }}
                                />
                            </div>
                        )}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalEditBanner;
