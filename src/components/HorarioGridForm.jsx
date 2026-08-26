import React, { useEffect, useState } from 'react';
import { Card, Switch, Checkbox, Tooltip, Select, Button, Tag, Alert } from 'antd';
import { normalizeHourBlock, oneHourBlock, startOfHour } from '../utils/deliveryTime.js';

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const dayLabels = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
};

// Horas de inicio disponibles (07:00 a 22:00) para los bloques de 1 hora.
const startHours = Array.from({ length: 16 }, (_, i) => i + 7);
// Para bloques amplios: inicios 07..21 y fines 08..23.
const wideStarts = Array.from({ length: 15 }, (_, i) => i + 7);
const wideEnds = Array.from({ length: 16 }, (_, i) => i + 8);

// Normaliza el schedule cargado (soporta llaves viejas "07:00" y "12:00 AM").
const normalizeSchedule = (sched) => {
    const out = {};
    for (const day of days) {
        const cfg = sched?.[day];
        if (!cfg) continue;
        const hours = {};
        for (const [k, v] of Object.entries(cfg.hours || {})) {
            if (!v) continue;
            const norm = normalizeHourBlock(k);
            if (norm) hours[norm] = true;
        }
        out[day] = { enabled: !!cfg.enabled, hours };
    }
    return out;
};

const HorarioGridForm = ({ initialSchedule = {}, onChange, deliveryMode = 'slots_chicos' }) => {
    const [schedule, setSchedule] = useState({});

    useEffect(() => {
        setSchedule(normalizeSchedule(initialSchedule || {}));
    }, [initialSchedule]);

    useEffect(() => {
        if (onChange) onChange(schedule);
    }, [schedule, onChange]);

    const toggleDay = (day, enabled) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: { enabled, hours: enabled ? prev[day]?.hours || {} : {} },
        }));
    };

    const setHourKey = (day, key, active) => {
        setSchedule((prev) => {
            const hours = { ...(prev[day]?.hours || {}) };
            if (active) hours[key] = true;
            else delete hours[key];
            return { ...prev, [day]: { ...prev[day], enabled: prev[day]?.enabled, hours } };
        });
    };

    if (deliveryMode === 'sin_horario') {
        return (
            <Alert
                type="info"
                showIcon
                message="Modo sin horario activo"
                description="En este modo el cliente no elige horario de entrega, así que no se configuran tramos por zona. Igual puedes definir la cobertura y el costo de la zona normalmente."
            />
        );
    }

    const esGrande = deliveryMode === 'slots_grandes';

    return (
        <div className="overflow-auto">
            <div className="grid gap-4">
                {days.map((day) => {
                    const cfg = schedule[day] || {};
                    const enabled = !!cfg.enabled;
                    const blocks = Object.keys(cfg.hours || {})
                        .sort((a, b) => (startOfHour(a) || '').localeCompare(startOfHour(b) || ''));

                    return (
                        <Card
                            key={day}
                            size="small"
                            title={
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold">{dayLabels[day]}</span>
                                    <Switch checked={enabled} onChange={(checked) => toggleDay(day, checked)} />
                                </div>
                            }
                        >
                            {!esGrande ? (
                                // BLOQUES CHICOS: checkboxes de 1 hora (guardan rango canónico)
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                    {startHours.map((h) => {
                                        const key = oneHourBlock(h);
                                        return (
                                            <Tooltip title={key} key={key}>
                                                <Checkbox
                                                    disabled={!enabled}
                                                    checked={!!cfg.hours?.[key]}
                                                    onChange={(e) => setHourKey(day, key, e.target.checked)}
                                                >
                                                    <span className="text-xs">{key}</span>
                                                </Checkbox>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            ) : (
                                // BLOQUES GRANDES: builder de tramos amplios
                                <WideBlockEditor
                                    disabled={!enabled}
                                    blocks={blocks}
                                    onAdd={(key) => setHourKey(day, key, true)}
                                    onRemove={(key) => setHourKey(day, key, false)}
                                />
                            )}
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

const WideBlockEditor = ({ disabled, blocks, onAdd, onRemove }) => {
    const [start, setStart] = useState(10);
    const [end, setEnd] = useState(12);

    const add = () => {
        if (end <= start) return;
        onAdd(`${String(start).padStart(2, '0')}:00 - ${String(end).padStart(2, '0')}:00`);
    };

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {blocks.length === 0 && <span className="text-gray-400 text-sm">Sin bloques</span>}
                {blocks.map((b) => (
                    <Tag key={b} closable={!disabled} onClose={() => onRemove(b)} color="blue">
                        {b}
                    </Tag>
                ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <Select
                    disabled={disabled}
                    size="small"
                    value={start}
                    style={{ width: 90 }}
                    onChange={setStart}
                    options={wideStarts.map((h) => ({ value: h, label: `${String(h).padStart(2, '0')}:00` }))}
                />
                <span className="text-gray-400">a</span>
                <Select
                    disabled={disabled}
                    size="small"
                    value={end}
                    style={{ width: 90 }}
                    onChange={setEnd}
                    options={wideEnds.map((h) => ({ value: h, label: `${String(h).padStart(2, '0')}:00` }))}
                />
                <Button size="small" type="dashed" disabled={disabled || end <= start} onClick={add}>
                    Agregar bloque
                </Button>
            </div>
        </div>
    );
};

export default HorarioGridForm;
