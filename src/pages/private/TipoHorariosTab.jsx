import React, { useState, useEffect } from 'react';
import { Card, Radio, Button, message, Spin, Tag, Alert } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext.jsx';
import useStoreInfo from '../../hooks/useStoreInfo.js';
import Stores from '../../services/Store.js';

const HINTS = {
    slots_chicos: 'Los horarios se marcan por zona: ve a la pestaña "Zonas" → edita una zona → activa el día y marca las horas (bloques de 1 hora).',
    slots_grandes: '👉 Los tramos anchos se definen POR ZONA: guarda este modo, ve a la pestaña "Zonas" → edita una zona → activa el día y usa "Agregar bloque" (eliges hora de inicio y fin, ej. 10:00 a 12:00).',
    sin_horario: 'No necesitas configurar horarios. El cliente podrá elegir un día (opcional) al hacer el pedido, y se le avisa cuando sale en camino.',
};

const OPCIONES = [
    {
        value: 'slots_chicos',
        titulo: 'Bloques de 1 hora',
        desc: 'El cliente elige una hora exacta (ej. 09:00 - 10:00). Es el comportamiento clásico.',
    },
    {
        value: 'slots_grandes',
        titulo: 'Bloques amplios',
        desc: 'La tienda define tramos anchos (ej. 10:00 - 12:00, 15:00 - 19:00). Más holgura para el reparto.',
    },
    {
        value: 'sin_horario',
        titulo: 'Sin horario',
        desc: 'El cliente no elige hora (puede elegir día). Se le avisa cuando el pedido sale en camino.',
    },
];

const TipoHorariosTab = () => {
    const { user } = useAuth();
    const { data: storeResp, isLoading, refetch } = useStoreInfo();
    const store = storeResp?.data || null;

    const [mode, setMode] = useState('slots_chicos');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (store?.deliveryMode) setMode(store.deliveryMode);
    }, [store?.deliveryMode]);

    const onSave = async () => {
        setSaving(true);
        try {
            const response = await Stores.updateInfo(user?.storeId, { deliveryMode: mode });
            if (response?.success) {
                message.success('Tipo de horarios guardado');
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

    if (isLoading) {
        return <div className="flex justify-center py-16"><Spin /></div>;
    }

    const dirty = store?.deliveryMode && store.deliveryMode !== mode;

    return (
        <div className="max-w-3xl">
            <p className="text-gray-600 mb-4 flex items-center gap-2">
                <ClockCircleOutlined />
                Define cómo tus clientes eligen el horario de entrega. Este ajuste aplica a la app, al link
                de pedido rápido y al ingreso manual de pedidos.
            </p>

            <Radio.Group
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full"
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
                {OPCIONES.map((op) => (
                    <Card
                        key={op.value}
                        size="small"
                        hoverable
                        onClick={() => setMode(op.value)}
                        style={{
                            borderColor: mode === op.value ? '#1479e0' : undefined,
                            borderWidth: mode === op.value ? 2 : 1,
                        }}
                    >
                        <Radio value={op.value}>
                            <span className="font-semibold text-gray-800">{op.titulo}</span>
                            {store?.deliveryMode === op.value && (
                                <Tag color="blue" className="ml-2">Actual</Tag>
                            )}
                            <div className="text-gray-500 text-sm mt-1">{op.desc}</div>
                        </Radio>
                    </Card>
                ))}
            </Radio.Group>

            <Alert
                type={mode === 'slots_grandes' ? 'warning' : 'info'}
                showIcon
                className="mt-4"
                message={mode === 'slots_grandes' ? '¿Dónde defino los bloques amplios?' : '¿Dónde configuro los horarios?'}
                description={HINTS[mode]}
            />

            <div className="mt-5">
                <Button type="primary" loading={saving} disabled={!dirty} onClick={onSave}>
                    Guardar tipo de horarios
                </Button>
                {dirty && <span className="ml-3 text-gray-400 text-sm">Guarda para aplicar el cambio</span>}
            </div>
        </div>
    );
};

export default TipoHorariosTab;
