import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { Card, Switch, Button, message, Spin, DatePicker, Tag, Alert, Empty } from 'antd';
import { CalendarOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAuth } from '../../context/AuthContext.jsx';
import useDeliveryConfig from '../../hooks/useDeliveryConfig.js';
import DeliveryConfig from '../../services/DeliveryConfig.js';

const ConfiguracionReparto = () => {
    const { user } = useAuth();
    const { data: config, isLoading, refetch } = useDeliveryConfig();
    const [saving, setSaving] = useState(false);

    const [deliverOnHolidays, setDeliverOnHolidays] = useState(true);
    const [blockedDates, setBlockedDates] = useState([]);
    const [datePickerValue, setDatePickerValue] = useState(null);

    useEffect(() => {
        const data = config?.data;
        if (!data) return;
        setDeliverOnHolidays(data.deliverOnHolidays !== false);
        const dates = (data.blockedDates || [])
            .map((d) => dayjs(d).startOf('day'))
            .filter((d) => d.isValid());
        setBlockedDates(dates.sort((a, b) => a.valueOf() - b.valueOf()));
    }, [config]);

    const blockedDatesIsoSet = useMemo(
        () => new Set(blockedDates.map((d) => d.format('YYYY-MM-DD'))),
        [blockedDates]
    );

    const handleAddDate = () => {
        if (!datePickerValue) return;
        const iso = datePickerValue.startOf('day').format('YYYY-MM-DD');
        if (blockedDatesIsoSet.has(iso)) {
            message.info('Esa fecha ya está bloqueada');
            return;
        }
        const next = [...blockedDates, datePickerValue.startOf('day')].sort((a, b) => a.valueOf() - b.valueOf());
        setBlockedDates(next);
        setDatePickerValue(null);
    };

    const handleRemoveDate = (iso) => {
        setBlockedDates(blockedDates.filter((d) => d.format('YYYY-MM-DD') !== iso));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                storeId: user?.storeId,
                deliverOnHolidays,
                blockedDates: blockedDates.map((d) => d.toISOString()),
            };
            const response = await DeliveryConfig.update(payload);
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
            <div className="flex-1 pt-16 px-4 lg:pt-10 lg:px-10 pb-10 overflow-x-auto">
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3 flex items-center gap-3">
                        <CalendarOutlined />
                        Configuración de reparto
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Controla excepciones en el calendario de reparto sin tocar los horarios semanales de cada zona.
                    </p>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Spin size="large" />
                        </div>
                    ) : (
                        <>
                            <Card bordered className="shadow-sm mb-6" bodyStyle={{ padding: 24 }}>
                                <div className="flex items-start justify-between gap-6">
                                    <div>
                                        <div className="text-base font-semibold text-gray-800 mb-2">
                                            Atender en días feriados
                                        </div>
                                        <p className="text-sm text-gray-600 max-w-md leading-relaxed">
                                            Si está desactivado, los feriados chilenos se bloquean automáticamente para toda la tienda. Al pasar el feriado, no hace falta reactivar nada.
                                        </p>
                                    </div>
                                    <Switch
                                        checked={deliverOnHolidays}
                                        onChange={setDeliverOnHolidays}
                                        checkedChildren="Sí"
                                        unCheckedChildren="No"
                                    />
                                </div>
                            </Card>

                            <Card bordered className="shadow-sm mb-6" bodyStyle={{ padding: 24 }}>
                                <div className="text-base font-semibold text-gray-800 mb-2">
                                    Fechas puntuales sin reparto
                                </div>
                                <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                                    Selecciona fechas específicas donde no se realizará reparto, independiente del horario semanal de la zona.
                                </p>

                                <div className="flex gap-3 mb-6">
                                    <DatePicker
                                        value={datePickerValue}
                                        onChange={setDatePickerValue}
                                        format="DD/MM/YYYY"
                                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                                        placeholder="Selecciona una fecha"
                                    />
                                    <Button type="primary" icon={<PlusOutlined />} onClick={handleAddDate} disabled={!datePickerValue}>
                                        Agregar
                                    </Button>
                                </div>

                                {blockedDates.length === 0 ? (
                                    <div className="py-4">
                                        <Empty description="Sin fechas bloqueadas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {blockedDates.map((d) => {
                                            const iso = d.format('YYYY-MM-DD');
                                            return (
                                                <Tag
                                                    key={iso}
                                                    closable
                                                    closeIcon={<CloseOutlined />}
                                                    onClose={(e) => {
                                                        e.preventDefault();
                                                        handleRemoveDate(iso);
                                                    }}
                                                    color="blue"
                                                    className="text-sm px-3 py-1"
                                                >
                                                    {d.format('DD/MM/YYYY')}
                                                </Tag>
                                            );
                                        })}
                                    </div>
                                )}
                            </Card>

                            <Alert
                                type="info"
                                showIcon
                                message="Cómo se combinan las reglas"
                                description="Un día se considera abierto solo si el schedule semanal de la zona lo permite y la fecha NO está en las reglas de arriba. Es decir, estas reglas solo restan disponibilidad."
                                className="mb-8"
                            />

                            <Button type="primary" size="large" loading={saving} onClick={handleSave}>
                                Guardar configuración
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfiguracionReparto;
