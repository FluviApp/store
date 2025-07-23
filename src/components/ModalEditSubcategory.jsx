import React from 'react';
import { Modal, Form, Input, Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const ModalEditSubcategory = ({
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
            title="Editar Subcategoría"
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
                    rules={[{ required: true, message: 'Nombre obligatorio' }]}
                >
                    <Input placeholder="Nombre de la subcategoría" />
                </Form.Item>

                <Form.Item label="Imagen (400x400)">
                    <Upload
                        maxCount={1}
                        listType="picture"
                        beforeUpload={validateImage}
                        showUploadList={{ showRemoveIcon: false }}
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
                        customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
                        itemRender={(originNode, file) => (
                            <div style={{ position: 'relative', display: 'inline-block', marginRight: 8 }}>
                                {originNode}
                                <div style={{ position: 'absolute', top: 4, right: 4 }}>
                                    <Button
                                        size="small"
                                        onClick={() => document.getElementById('replace-subcategory-image')?.click()}
                                    >
                                        Reemplazar
                                    </Button>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="replace-subcategory-image"
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
                        )}
                    >
                    </Upload>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalEditSubcategory;
