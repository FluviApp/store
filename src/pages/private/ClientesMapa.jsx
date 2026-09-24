import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { DatePicker, Switch, Card, Spin, Empty, Button, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useFilteredClients from '../../hooks/useFilteredClients.js';

const { RangePicker } = DatePicker;

// Centro inicial (Santiago). El encuadre real se hace con fitBounds.
const DEFAULT_CENTER = { lat: -33.45, lng: -70.66 };

// Umbrales de los buckets de color (días desde el último pedido)
const VERDE_MAX = 30;   // pidió este mes
const AZUL_MAX = 60;    // 31–60 días

const BUCKETS = {
    verde: { color: '#22c55e', label: 'Este mes (≤30d)' },
    azul: { color: '#3b82f6', label: '31–60 días' },
    rojo: { color: '#ef4444', label: 'Perdido (+60d)' },
    negro: { color: '#111827', label: 'Nunca pidió' },
    neutro: { color: '#1479e0', label: 'Cliente' },
};

const bucketOf = (c) => {
    if (!c.lastOrderDate) return 'negro';
    const days = (Date.now() - new Date(c.lastOrderDate).getTime()) / 86400000;
    if (days <= VERDE_MAX) return 'verde';
    if (days <= AZUL_MAX) return 'azul';
    return 'rojo';
};

const iconFor = (color) => (
    window.google ? {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 6.5,
        fillColor: color,
        fillOpacity: 0.95,
        strokeColor: '#ffffff',
        strokeWeight: 1.5,
    } : undefined
);

const ClientesMapa = () => {
    const { filteredClients, isLoading, getFilteredClients } = useFilteredClients();

    // Único filtro: fecha de registro del usuario
    const [dateRange, setDateRange] = useState(null);
    // Modo color (toggle): pinta por tiempo sin pedir
    const [colorOn, setColorOn] = useState(true);

    const [selected, setSelected] = useState(null);
    const mapRef = useRef(null);

    const fetchClients = () => {
        setSelected(null);
        getFilteredClients({
            registrationDateFrom: dateRange?.[0] ? dateRange[0].startOf('day').toISOString() : null,
            registrationDateTo: dateRange?.[1] ? dateRange[1].endOf('day').toISOString() : null,
        });
    };

    useEffect(() => { fetchClients(); /* eslint-disable-next-line */ }, [dateRange]);

    // Clientes con coordenadas válidas (ref estable entre clics)
    const withCoords = useMemo(
        () => (filteredClients || []).filter(c => typeof c.lat === 'number' && typeof c.lon === 'number' && c.lat && c.lon),
        [filteredClients]
    );
    const sinUbicacion = (filteredClients || []).length - withCoords.length;

    const counts = useMemo(() => {
        const acc = { verde: 0, azul: 0, rojo: 0, negro: 0 };
        withCoords.forEach(c => { acc[bucketOf(c)]++; });
        return acc;
    }, [withCoords]);

    // Marcadores memoizados: solo se recalculan al cambiar los datos o el modo color,
    // NO al hacer clic (así el mapa no "se recarga" al abrir un pin).
    const markers = useMemo(
        () => withCoords.map((c) => {
            const b = colorOn ? bucketOf(c) : 'neutro';
            return (
                <Marker
                    key={c._id}
                    position={{ lat: c.lat, lng: c.lon }}
                    icon={iconFor(BUCKETS[b].color)}
                    onClick={() => setSelected(c)}
                />
            );
        }),
        [withCoords, colorOn]
    );

    // Encuadrar el mapa a los pines cuando cambian los datos (no al hacer clic).
    useEffect(() => {
        if (mapRef.current && withCoords.length && window.google) {
            const bounds = new window.google.maps.LatLngBounds();
            withCoords.forEach(c => bounds.extend({ lat: c.lat, lng: c.lon }));
            mapRef.current.fitBounds(bounds);
        }
    }, [withCoords]);

    const money = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

    return (
        <div>
            {/* --- Filtros --- */}
            <Card size="small" className="mb-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Fecha de registro del cliente</div>
                        <RangePicker value={dateRange} onChange={setDateRange} format="DD/MM/YYYY" allowClear />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Colorear por actividad</span>
                        <Switch checked={colorOn} onChange={setColorOn} checkedChildren="ON" unCheckedChildren="OFF" />
                        <Button icon={<ReloadOutlined />} onClick={fetchClients} />
                    </div>
                </div>

                {colorOn ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                        <Tag color="green">🟢 Este mes: {counts.verde}</Tag>
                        <Tag color="blue">🔵 31–60d: {counts.azul}</Tag>
                        <Tag color="red">🔴 Perdidos: {counts.rojo}</Tag>
                        <Tag color="default">⚫ Nunca: {counts.negro}</Tag>
                        {sinUbicacion > 0 && <Tag>📍 Sin ubicación: {sinUbicacion}</Tag>}
                    </div>
                ) : (
                    <div className="mt-3 text-sm text-gray-500">
                        {withCoords.length} clientes en el mapa{sinUbicacion > 0 ? ` · ${sinUbicacion} sin ubicación` : ''}
                    </div>
                )}
            </Card>

            {/* --- Mapa --- */}
            <div className="glass-card" style={{ padding: 8, borderRadius: 12 }}>
                {isLoading ? (
                    <div className="flex justify-center items-center" style={{ height: 560 }}><Spin size="large" /></div>
                ) : withCoords.length === 0 ? (
                    <div className="flex justify-center items-center" style={{ height: 560 }}>
                        <Empty description="No hay clientes con ubicación para estos filtros" />
                    </div>
                ) : (
                    <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '560px', borderRadius: 10 }}
                        center={DEFAULT_CENTER}
                        zoom={11}
                        onLoad={(map) => {
                            mapRef.current = map;
                            if (withCoords.length && window.google) {
                                const bounds = new window.google.maps.LatLngBounds();
                                withCoords.forEach(c => bounds.extend({ lat: c.lat, lng: c.lon }));
                                map.fitBounds(bounds);
                            }
                        }}
                        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
                    >
                        {markers}

                        {selected && (
                            <InfoWindow
                                position={{ lat: selected.lat, lng: selected.lon }}
                                onCloseClick={() => setSelected(null)}
                                options={{ disableAutoPan: true }}
                            >
                                <div style={{ maxWidth: 240, lineHeight: 1.5 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{selected.name || 'Cliente'}</div>
                                    {selected.address && <div style={{ fontSize: 12, color: '#555' }}>{selected.address}</div>}
                                    <div style={{ fontSize: 12, marginTop: 6 }}>
                                        <div>📦 Pedidos: <b>{selected.orderCount || 0}</b></div>
                                        <div>💰 Gastado: <b>{money(selected.totalSpent)}</b></div>
                                        <div>🕐 Último pedido: <b>{selected.lastOrderDate ? dayjs(selected.lastOrderDate).format('DD/MM/YYYY') : 'nunca'}</b></div>
                                    </div>
                                    {selected.phone && (
                                        <a
                                            href={`https://wa.me/56${String(selected.phone).replace(/\D/g, '').slice(-9)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ display: 'inline-block', marginTop: 8, color: '#12a150', fontWeight: 600 }}
                                        >
                                            💬 WhatsApp {selected.phone}
                                        </a>
                                    )}
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                )}
            </div>
        </div>
    );
};

export default ClientesMapa;
