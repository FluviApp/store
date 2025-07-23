import React, { useEffect, useState } from 'react';
import { Card, Switch, Checkbox, Tooltip } from 'antd';

const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
];

const dayLabels = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo'
};

const hourBlocks = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 7;
    return `${hour.toString().padStart(2, '0')}:00`;
});

const HorarioGridForm = ({ initialSchedule = {}, onChange }) => {
    const [schedule, setSchedule] = useState({});

    useEffect(() => {
        if (initialSchedule) {
            setSchedule(initialSchedule);
        }
    }, [initialSchedule]);

    useEffect(() => {
        if (onChange) onChange(schedule);
    }, [schedule, onChange]);

    const toggleDay = (day, enabled) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: {
                enabled,
                hours: enabled ? prev[day]?.hours || {} : {}
            }
        }));
    };

    const toggleHour = (day, hour, checked) => {
        setSchedule((prev) => ({
            ...prev,
            [day]: {
                ...prev[day],
                hours: {
                    ...prev[day]?.hours,
                    [hour]: checked
                }
            }
        }));
    };

    return (
        <div className="overflow-auto">
            <div className="grid gap-4">
                {days.map((day) => (
                    <Card
                        key={day}
                        size="small"
                        title={<div className="flex items-center justify-between">
                            <span className="font-semibold">{dayLabels[day]}</span>
                            <Switch
                                checked={schedule[day]?.enabled}
                                onChange={(checked) => toggleDay(day, checked)}
                            />
                        </div>}
                    >
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                            {hourBlocks.map((hour) => (
                                <Tooltip title={hour} key={hour}>
                                    <Checkbox
                                        disabled={!schedule[day]?.enabled}
                                        checked={schedule[day]?.hours?.[hour] || false}
                                        onChange={(e) => toggleHour(day, hour, e.target.checked)}
                                    >
                                        <span className="text-xs">{hour}</span>
                                    </Checkbox>
                                </Tooltip>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default HorarioGridForm;
