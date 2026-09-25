import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow, Polygon } from '@react-google-maps/api';
import { DatePicker, Switch, Card, Spin, Empty, Button, Tag, Modal, Input, message as antdMessage } from 'antd';
import { ReloadOutlined, MailOutlined, WhatsAppOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import useFilteredClients from '../../hooks/useFilteredClients.js';
import useZones from '../../hooks/useZones.js';
import Clients from '../../services/Clients.js';

const { TextArea } = Input;

// Colores para distinguir las zonas de reparto en el mapa
const ZONE_COLORS = ['#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899', '#ef4444', '#14b8a6', '#6366f1'];

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
    const { data: zonesResp } = useZones({ page: 1, limit: 100 });
    const [showZones, setShowZones] = useState(false);

    // Polígonos de las zonas de reparto (mismo criterio que ZonasTab)
    const zonePolys = useMemo(() => {
        const raw = zonesResp?.data?.docs || [];
        return raw
            .map(z => ({
                id: z._id,
                name: z.name || z.comuna || 'Zona',
                path: (Array.isArray(z.polygon) ? z.polygon : [])
                    .map(p => ({ lat: Number(p?.lat), lng: Number(p?.lng) }))
                    .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)),
            }))
            .filter(z => z.path.length >= 3);
    }, [zonesResp]);

    // Único filtro: fecha de registro del usuario
    const [dateRange, setDateRange] = useState(null);
    // Modo color (toggle): pinta por tiempo sin pedir
    const [colorOn, setColorOn] = useState(true);
    // Qué colores mostrar (permite ver solo 1 o 2 colores a la vez)
    const [visible, setVisible] = useState({ verde: true, azul: true, rojo: true, negro: true });
    const toggleBucket = (k) => setVisible(v => ({ ...v, [k]: !v[k] }));

    const [selected, setSelected] = useState(null);
    const mapRef = useRef(null);

    // Campaña de reactivación (email masivo + WhatsApp uno por uno)
    const [campaignOpen, setCampaignOpen] = useState(false);
    const [subject, setSubject] = useState('Un regalo de Fluvi 💧');
    const [msgText, setMsgText] = useState('Hola {nombre} 👋 En Fluvi te damos un descuento especial: usa el código {codigo} en tu pedido. 💧 Pide en fluvi.cl');
    const [code, setCode] = useState('');
    const [sending, setSending] = useState(false);
    const [showWa, setShowWa] = useState(false);

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

    // Segmento objetivo para la campaña: TODOS los que cumplen el filtro de color
    // (incluye los que no tienen coordenadas — para mensajear da igual la ubicación).
    const targets = useMemo(
        () => (filteredClients || []).filter(c => !colorOn || visible[bucketOf(c)]),
        [filteredClients, colorOn, visible]
    );
    const targetsEmail = useMemo(() => targets.filter(t => t.email), [targets]);
    const targetsPhone = useMemo(() => targets.filter(t => t.phone), [targets]);

    const personalize = (text, c) => String(text || '')
        .split('{nombre}').join(c.name || 'cliente')
        .split('{codigo}').join(code || '');
    const waLink = (c) => `https://wa.me/56${String(c.phone).replace(/\D/g, '').slice(-9)}?text=${encodeURIComponent(personalize(msgText, c))}`;

    const sendEmails = async () => {
        if (!targetsEmail.length) { antdMessage.warning('No hay clientes con email en el segmento'); return; }
        setSending(true);
        try {
            const res = await Clients.sendCampaignEmail({
                subject,
                message: msgText.split('{codigo}').join(code || ''), // {nombre} lo reemplaza el backend por destinatario
                recipients: targetsEmail.map(t => ({ email: t.email, name: t.name })),
            });
            if (res?.success) antdMessage.success(res.message || `Enviados: ${res.sent}`);
            else antdMessage.error(res?.message || 'No se pudo enviar');
        } catch (e) {
            antdMessage.error(e?.response?.data?.message || e?.message || 'Error al enviar la campaña');
        } finally { setSending(false); }
    };

    // Eliminar un cliente (de a uno, con confirmación). No borra sus pedidos.
    const handleDeleteClient = (c) => {
        Modal.confirm({
            title: '¿Eliminar cliente?',
            content: `Se eliminará a "${c.name || 'este cliente'}" de forma permanente. Sus pedidos históricos NO se borran.`,
            okText: 'Eliminar',
            okType: 'danger',
            cancelText: 'Cancelar',
            onOk: async () => {
                try {
                    const res = await Clients.delete(c._id);
                    if (res?.success) {
                        antdMessage.success('Cliente eliminado');
                        setSelected(null);
                        fetchClients();
                    } else {
                        antdMessage.error(res?.message || 'No se pudo eliminar');
                    }
                } catch (e) {
                    antdMessage.error(e?.response?.data?.message || e?.message || 'Error al eliminar');
                }
            },
        });
    };

    // Marcadores memoizados: solo se recalculan al cambiar los datos o el modo color,
    // NO al hacer clic (así el mapa no "se recarga" al abrir un pin).
    const markers = useMemo(
        () => withCoords
            // Cuando el color está ON, mostrar solo los buckets activados (1, 2 o los que sea)
            .filter((c) => !colorOn || visible[bucketOf(c)])
            .map((c) => {
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
        [withCoords, colorOn, visible]
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
                        <span className="text-sm font-medium text-gray-700">Zonas</span>
                        <Switch checked={showZones} onChange={setShowZones} checkedChildren="ON" unCheckedChildren="OFF" />
                        <span className="text-sm font-medium text-gray-700 ml-2">Colorear por actividad</span>
                        <Switch checked={colorOn} onChange={setColorOn} checkedChildren="ON" unCheckedChildren="OFF" />
                        <Button icon={<ReloadOutlined />} onClick={fetchClients} />
                        <Button type="primary" icon={<MailOutlined />} onClick={() => setCampaignOpen(true)}>
                            Mensaje a estos ({targets.length})
                        </Button>
                    </div>
                </div>

                {colorOn ? (
                    <div className="mt-3">
                        <div className="flex flex-wrap gap-2 items-center">
                            {[
                                { key: 'verde', color: 'green', emoji: '🟢', label: 'Este mes' },
                                { key: 'azul', color: 'blue', emoji: '🔵', label: '31–60d' },
                                { key: 'rojo', color: 'red', emoji: '🔴', label: 'Perdidos' },
                                { key: 'negro', color: 'default', emoji: '⚫', label: 'Nunca' },
                            ].map((l) => (
                                <Tag
                                    key={l.key}
                                    color={visible[l.key] ? l.color : 'default'}
                                    onClick={() => toggleBucket(l.key)}
                                    style={{ cursor: 'pointer', opacity: visible[l.key] ? 1 : 0.35, userSelect: 'none' }}
                                >
                                    {l.emoji} {l.label}: {counts[l.key]}
                                </Tag>
                            ))}
                            {sinUbicacion > 0 && <Tag>📍 Sin ubicación: {sinUbicacion}</Tag>}
                            {!Object.values(visible).every(Boolean) && (
                                <Button size="small" type="link" onClick={() => setVisible({ verde: true, azul: true, rojo: true, negro: true })}>
                                    Ver todos
                                </Button>
                            )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Toca un color para mostrar/ocultar en el mapa.</div>
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
                        {showZones && zonePolys.map((z, i) => (
                            <Polygon
                                key={z.id}
                                paths={z.path}
                                options={{
                                    strokeColor: ZONE_COLORS[i % ZONE_COLORS.length],
                                    strokeOpacity: 0.9,
                                    strokeWeight: 2,
                                    fillColor: ZONE_COLORS[i % ZONE_COLORS.length],
                                    fillOpacity: 0.10,
                                    clickable: false, // que no bloquee el clic en los pines
                                    zIndex: 1,
                                }}
                            />
                        ))}

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
                                    <div style={{ marginTop: 10, borderTop: '1px solid #eee', paddingTop: 8 }}>
                                        <button
                                            onClick={() => handleDeleteClient(selected)}
                                            style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13 }}
                                        >
                                            🗑️ Eliminar cliente
                                        </button>
                                    </div>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                )}
            </div>

            {/* --- Campaña de reactivación --- */}
            <Modal
                title={`Enviar mensaje a ${targets.length} clientes`}
                open={campaignOpen}
                onCancel={() => setCampaignOpen(false)}
                footer={null}
                width={620}
            >
                <div className="text-sm text-gray-500 mb-3">
                    Segmento actual: <b>{targets.length}</b> clientes · {targetsEmail.length} con email · {targetsPhone.length} con teléfono.
                </div>

                <div className="mb-2">
                    <div className="text-xs text-gray-500 mb-1">Asunto (para el email)</div>
                    <Input value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div className="mb-2">
                    <div className="text-xs text-gray-500 mb-1">Código de descuento</div>
                    <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ej: BIENVENIDO" />
                    <div className="text-xs text-gray-400 mt-1">Debe existir en “Códigos de descuento” para que funcione al aplicarlo.</div>
                </div>
                <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Mensaje (usa {'{nombre}'} y {'{codigo}'})</div>
                    <TextArea rows={4} value={msgText} onChange={e => setMsgText(e.target.value)} />
                </div>

                <div className="flex gap-2 flex-wrap">
                    <Button type="primary" icon={<MailOutlined />} loading={sending} onClick={sendEmails} disabled={!targetsEmail.length}>
                        Enviar email a {targetsEmail.length}
                    </Button>
                    <Button icon={<WhatsAppOutlined />} onClick={() => setShowWa(v => !v)} disabled={!targetsPhone.length}>
                        {showWa ? 'Ocultar' : 'WhatsApp uno por uno'} ({targetsPhone.length})
                    </Button>
                </div>

                {showWa && (
                    <div style={{ maxHeight: 260, overflowY: 'auto', marginTop: 12, border: '1px solid #eee', borderRadius: 8 }}>
                        {targetsPhone.map(c => (
                            <div key={c._id} className="flex items-center justify-between" style={{ padding: '8px 12px', borderBottom: '1px solid #f2f2f2' }}>
                                <span style={{ fontSize: 13 }}>{c.name || 'Cliente'} · {c.phone}</span>
                                <a href={waLink(c)} target="_blank" rel="noopener noreferrer" style={{ color: '#12a150', fontWeight: 600 }}>
                                    <WhatsAppOutlined /> Enviar
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ClientesMapa;
