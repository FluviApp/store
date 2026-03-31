import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { Card, Form, InputNumber, Radio, Button, message, Spin } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext.jsx';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import Stores from '../../services/Store.js';

const METODOS_PAGO = [
    { key: 'efectivo', label: 'Efectivo' },
    { key: 'transferencia', label: 'Transferencia' },
    { key: 'tarjeta', label: 'Tarjeta' },
    { key: 'mercadopago', label: 'Mercado Pago' },
];

const ConfiguracionPagos = () => {
    const { user } = useAuth();
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    const { data: storeResp, isLoading, refetch } = useStoreInfo();
    const store = storeResp?.data || null;
    const paymentFees = store?.paymentFees || {};
    const taxPercent = Number(store?.taxPercent ?? 19);

    useEffect(() => {
        if (!store) return;
        const values = {};
        METODOS_PAGO.forEach(({ key }) => {
            const fee = paymentFees[key];
            values[`${key}_type`] = fee?.type || 'none';
            values[`${key}_value`] = fee?.value ?? 0;
        });
        values.taxPercent = taxPercent;
        form.setFieldsValue(values);
    }, [store, paymentFees, taxPercent, form]);

    const onFinish = async (values) => {
        setSaving(true);
        try {
            const paymentFeesPayload = {};
            METODOS_PAGO.forEach(({ key }) => {
                const type = values[`${key}_type`] || 'none';
                const value = Number(values[`${key}_value`]) || 0;
                paymentFeesPayload[key] = { type, value };
            });
            const taxPercentPayload = Number(values.taxPercent);

            const response = await Stores.updateInfo(user?.storeId, {
                paymentFees: paymentFeesPayload,
                taxPercent: Number.isFinite(taxPercentPayload) ? taxPercentPayload : 0,
            });
            if (response?.success) {
                message.success(response.message || 'Configuración guardada');
                refetch();
            } else {
                message.warning(response?.message || 'No se pudo guardar');
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Error al guardar';
            message.error(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-8 lg:px-8 overflow-x-auto">
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <CreditCardOutlined />
                        Configuración de recargos por método de pago
                    </h1>
                    <p className="text-gray-600 mb-6">
                        Opcional. Define un porcentaje o monto fijo que se agregará al total cuando el cliente pague con ese método.
                    </p>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Spin size="large" />
                        </div>
                    ) : (
                        <Card bordered className="shadow-sm">
                            <Form form={form} layout="vertical" onFinish={onFinish}>
                                {METODOS_PAGO.map(({ key, label }) => (
                                    <div key={key} className="mb-6 last:mb-0">
                                        <div className="text-base font-semibold text-gray-800 mb-2">{label}</div>
                                        <div className="flex flex-wrap items-end gap-4">
                                            <Form.Item
                                                name={`${key}_type`}
                                                noStyle
                                                initialValue="none"
                                            >
                                                <Radio.Group>
                                                    <Radio value="none">Sin recargo</Radio>
                                                    <Radio value="percent">Porcentaje %</Radio>
                                                    <Radio value="fixed">Monto fijo $</Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                            <Form.Item
                                                name={`${key}_value`}
                                                noStyle
                                                initialValue={0}
                                                rules={[{ required: false }]}
                                            >
                                                <InputNumber
                                                    min={0}
                                                    step={0.5}
                                                    placeholder="Ej: 3.5 % o 500 $"
                                                    style={{ width: 160 }}
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="text-base font-semibold text-gray-800 mb-2">IVA (%)</div>
                                    <Form.Item
                                        name="taxPercent"
                                        initialValue={19}
                                        rules={[{ required: true, message: 'Ingresa el porcentaje de IVA' }]}
                                    >
                                        <InputNumber
                                            min={0}
                                            max={100}
                                            step={0.1}
                                            precision={2}
                                            placeholder="Ej: 19"
                                            style={{ width: 180 }}
                                        />
                                    </Form.Item>
                                </div>

                                <Form.Item className="mt-6 mb-0">
                                    <Button type="primary" htmlType="submit" loading={saving} size="large">
                                        Guardar configuración
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionPagos;
