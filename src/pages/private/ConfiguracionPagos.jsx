import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { Card, Form, InputNumber, Button, message, Spin } from 'antd';
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
        const pf = {};
        METODOS_PAGO.forEach(({ key }) => {
            const fee = paymentFees[key];
            const rawType = fee?.type;
            const rawValue = fee?.value ?? 0;
            // Solo porcentaje: migrar fixed a percent (valor aproximado no es posible; se guarda 0) o mantener percent/none
            let percent = 0;
            if (rawType === 'percent' && Number(rawValue) > 0) {
                percent = Number(rawValue);
            } else if (rawType === 'fixed' && Number(rawValue) > 0) {
                percent = 0;
            }
            pf[key] = { percent };
        });
        form.setFieldsValue({ paymentFees: pf, taxPercent });
    }, [store, paymentFees, taxPercent, form]);

    const onFinish = async (values) => {
        setSaving(true);
        try {
            const pf = values.paymentFees || {};
            const paymentFeesPayload = {};
            METODOS_PAGO.forEach(({ key }) => {
                const percent = Number(pf[key]?.percent) || 0;
                paymentFeesPayload[key] = {
                    type: percent > 0 ? 'percent' : 'none',
                    value: percent,
                };
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
                        Recargo opcional como porcentaje sobre el subtotal del pedido. Usa 0 para no cobrar recargo en ese método.
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
                                        <Form.Item
                                            label="Recargo (%)"
                                            name={['paymentFees', key, 'percent']}
                                            rules={[{ required: true, message: 'Ingresa un número' }]}
                                        >
                                            <InputNumber
                                                min={0}
                                                max={100}
                                                step={0.5}
                                                placeholder="0 = sin recargo"
                                                style={{ width: 200 }}
                                            />
                                        </Form.Item>
                                    </div>
                                ))}

                                <div className="mt-6 pt-4 border-t border-gray-200">
                                    <div className="text-base font-semibold text-gray-800 mb-2">IVA (%)</div>
                                    <Form.Item
                                        name="taxPercent"
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
