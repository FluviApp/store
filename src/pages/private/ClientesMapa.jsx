import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, Marker, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import { DatePicker, Select, Switch, Card, Spin, Empty, Button, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useFilteredClients from '../../hooks/useFilteredClients.js';

const { RangePicker } = DatePicker;

// Centro por defecto (Santiago) si no hay clientes con coordenadas
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

const ClientesMapa = () => {
    const { filteredClients, isLoading, getFilteredClients } = useFilteredClients();

    // Filtros
    const [dateRange, setDateRange] = useState(null);      // [from, to] fecha de registro
    const [inactivityDays, setInactivityDays] = useState(null); // null | 30 | 60 | 90
    const [neverPurchased, setNeverPurchased] = useState(false);
    // Modo color (toggle) — independiente de los filtros
    const [colorOn, setColorOn] = useState(true);

    const [selected, setSelected] = useState(null);
    const mapRef = useRef(null);

    const fetchClients = () => {
        getFilteredClients({
            registrationDateFrom: dateRange?.[0] ? dateRange[0].startOf('day').toISOString() : null,
            registrationDateTo: dateRange?.[1] ? dateRange[1].endOf('day').toISOString() : null,
            inactivityDays: inactivityDays ?? null,
            neverPurchased,
        });
    };

    useEffect(() => { fetchClients(); /* eslint-disable-next-line */ }, [dateRange, inactivityDays, neverPurchased]);

    // Clientes con coordenadas válidas
    const withCoords = useMemo(
        () => (filteredClients || []).filter(c => typeof c.lat === 'number' && typeof c.lon === 'number' && c.lat && c.lon),
        [filteredClients]
    );
    const sinUbicacion = (filteredClients || []).length - withCoords.length;

    // Conteo por bucket
    const counts = useMemo(() => {
        const acc = { verde: 0, azul: 0, rojo: 0, negro: 0 };
        withCoords.forEach(c => { acc[bucketOf(c)]++; });
        return acc;
    }, [withCoords]);

    const center = withCoords.length ? { lat: withCoords[0].lat, lng: withCoords[0].lon } : DEFAULT_CENTER;

    const iconFor = (color) => (
        window.google ? {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: color,
            fillOpacity: 0.95,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
        } : undefined
    );

    const money = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

    return (
        <div>
            {/* --- Filtros --- */}
            <Card size="small" className="mb-4">
                <div className="flex flex-wrap items-center gap-4">
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Fecha de registro</div>
                        <RangePicker value={dateRange} onChange={setDateRange} format="DD/MM/YYYY" allowClear />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Sin pedir hace</div>
                        <Select
                            style={{ width: 160 }}
                            value={inactivityDays}
                            onChange={setInactivityDays}
                            allowClear
                            placeholder="Todos"
                            options={[
                                { value: 30, label: '+30 días' },
                                { value: 60, label: '+60 días' },
                                { value: 90, label: '+90 días' },
                            ]}
                        />
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 mb-1">Solo sin pedidos</div>
                        <Switch checked={neverPurchased} onChange={setNeverPurchased} checkedChildren="Sí" unCheckedChildren="No" />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Colorear por actividad</span>
                        <Switch checked={colorOn} onChange={setColorOn} checkedChildren="ON" unCheckedChildren="OFF" />
                        <Button icon={<ReloadOutlined />} onClick={fetchClients} />
                    </div>
                </div>

                {/* Leyenda / contadores (solo si el color está activo) */}
                {colorOn && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        <Tag color="green">🟢 Este mes: {counts.verde}</Tag>
                        <Tag color="blue">🔵 31–60d: {counts.azul}</Tag>
                        <Tag color="red">🔴 Perdidos: {counts.rojo}</Tag>
                        <Tag color="default">⚫ Nunca: {counts.negro}</Tag>
                        {sinUbicacion > 0 && <Tag>📍 Sin ubicación: {sinUbicacion}</Tag>}
                    </div>
                )}
                {!colorOn && (
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
                        center={center}
                        zoom={11}
                        onLoad={(map) => { mapRef.current = map; }}
                        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: true }}
                    >
                        <MarkerClusterer>
                            {(clusterer) =>
                                withCoords.map((c) => {
                                    const b = colorOn ? bucketOf(c) : 'neutro';
                                    return (
                                        <Marker
                                            key={c._id}
                                            position={{ lat: c.lat, lng: c.lon }}
                                            clusterer={clusterer}
                                            icon={iconFor(BUCKETS[b].color)}
                                            onClick={() => setSelected(c)}
                                        />
                                    );
                                })
                            }
                        </MarkerClusterer>

                        {selected && (
                            <InfoWindow
                                position={{ lat: selected.lat, lng: selected.lon }}
                                onCloseClick={() => setSelected(null)}
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
