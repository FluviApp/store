import React from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { Card, Row, Col, message } from 'antd';
import {
    SettingOutlined,
    CarOutlined,
    FileTextOutlined,
    PictureOutlined,
    TagOutlined,
    CreditCardOutlined,
    CalendarOutlined,
    BellOutlined,
    RightOutlined,
    ThunderboltFilled,
    ShareAltOutlined,
    QrcodeOutlined,
    CopyOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useStoreInfo from '../../hooks/useStoreInfo.js';

// ⚠️ Dominio público donde está desplegado el ecommerce (pedido rápido).
// Cámbialo por tu dominio real (ej: https://fluvi.cl o el de Render).
const QUICK_ORDER_BASE = 'https://fluvi.cl';

// Slugs bonitos por tienda (opcional). Si no hay, se usa /pedido/<storeId>.
const STORE_SLUGS = {
    '686475c9b8bfd36c37a820c3': 'fluvi',
    '68697bf9c8e5172fd536738f': 'aguas-ancud',
};

const items = [
    {
        key: 'repartidores',
        title: 'Repartidores',
        description: 'Gestiona tu equipo de reparto.',
        icon: <CarOutlined style={{ fontSize: 28, color: '#2563eb' }} />,
        path: '/repartidores',
    },
    {
        key: 'historial',
        title: 'Historial de ventas',
        description: 'Consulta todos los pedidos entregados y su estado.',
        icon: <FileTextOutlined style={{ fontSize: 28, color: '#16a34a' }} />,
        path: '/historialventas',
    },
    {
        key: 'banners',
        title: 'Banners',
        description: 'Edita las imágenes destacadas del home de la tienda.',
        icon: <PictureOutlined style={{ fontSize: 28, color: '#f59e0b' }} />,
        path: '/banners',
    },
    {
        key: 'descuentos',
        title: 'Códigos de descuento',
        description: 'Crea cupones para tus clientes.',
        icon: <TagOutlined style={{ fontSize: 28, color: '#dc2626' }} />,
        path: '/codigosdescuento',
    },
    {
        key: 'pagos',
        title: 'Config. de pagos',
        description: 'Recargos por método de pago, IVA y mensaje de cobro.',
        icon: <CreditCardOutlined style={{ fontSize: 28, color: '#9333ea' }} />,
        path: '/configuracionpagos',
    },
    {
        key: 'reparto',
        title: 'Config. de reparto',
        description: 'Zonas de despacho, feriados y fechas bloqueadas.',
        icon: <CalendarOutlined style={{ fontSize: 28, color: '#0ea5e9' }} />,
        path: '/configuracionreparto',
    },
    {
        key: 'notificaciones',
        title: 'Notificaciones',
        description: 'Envía push a tus clientes y gestiona avisos al inicio.',
        icon: <BellOutlined style={{ fontSize: 28, color: '#ea580c' }} />,
        path: '/notificaciones',
    },
];

const Ajustes = () => {
    const { user } = useAuth();
    const [hover, setHover] = React.useState(false);

    const { data: storeResp } = useStoreInfo();
    const storeCode = storeResp?.data?.code || '';

    const handleCopyCode = async () => {
        if (!storeCode) return;
        try {
            await navigator.clipboard.writeText(storeCode);
            message.success('¡Código copiado! 💧');
        } catch {
            message.info(storeCode);
        }
    };

    const quickOrderUrl = () => {
        const slug = STORE_SLUGS[user?.storeId];
        return slug ? `${QUICK_ORDER_BASE}/${slug}` : `${QUICK_ORDER_BASE}/pedido/${user?.storeId || ''}`;
    };

    const handleShareQuickOrder = async () => {
        // Copiamos SOLO la URL limpia. (Compartir con texto hacía que algunos
        // destinos pegaran "texto + URL" juntos y rompieran el enlace.)
        const url = quickOrderUrl();
        try {
            await navigator.clipboard.writeText(url);
            message.success('¡URL copiada! Ya puedes pegarla y compartirla 💧');
        } catch (err) {
            try {
                if (navigator.share) { await navigator.share({ url }); }
                else { message.info(url); }
            } catch { message.info(url); }
        }
    };

    return (
        <div className="flex min-h-screen fluvi-page">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-10 lg:px-10 pb-10 overflow-x-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-3 flex items-center gap-3">
                    <SettingOutlined />
                    Ajustes
                </h1>
                <p className="text-gray-600 mb-8">
                    Configura todo lo relacionado a tu tienda.
                </p>

                {/* Botón glassmorphism: compartir URL de pedido rápido */}
                <button
                    onClick={handleShareQuickOrder}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    style={{
                        width: '100%',
                        cursor: 'pointer',
                        borderRadius: 24,
                        padding: '26px 30px',
                        marginBottom: 32,
                        color: '#fff',
                        textAlign: 'left',
                        border: '1px solid rgba(255,255,255,0.4)',
                        background: 'linear-gradient(135deg, rgba(30,144,255,0.95) 0%, rgba(13,110,226,0.92) 60%, rgba(56,164,255,0.95) 100%)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        boxShadow: hover ? '0 24px 60px rgba(30,144,255,0.55)' : '0 16px 44px rgba(30,144,255,0.4)',
                        transform: hover ? 'translateY(-3px)' : 'none',
                        transition: 'transform .18s ease, box-shadow .18s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* brillo decorativo */}
                    <span style={{ position: 'absolute', top: -40, right: -20, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45), rgba(255,255,255,0))', pointerEvents: 'none' }} />
                    <span style={{ width: 62, height: 62, borderRadius: 18, background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ThunderboltFilled style={{ fontSize: 30, color: '#fff' }} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
                            Compartir URL de pedido rápido
                        </span>
                        <span style={{ display: 'block', fontSize: 14, opacity: 0.92, fontWeight: 500 }}>
                            Comparte el link por WhatsApp o redes y recibe pedidos en segundos 💧
                        </span>
                    </span>
                    <ShareAltOutlined style={{ fontSize: 26, color: '#fff', flexShrink: 0 }} />
                </button>

                {/* Código de tienda: los clientes lo ingresan (o escanean el QR) en la app Fluvi */}
                <div
                    style={{
                        width: '100%',
                        borderRadius: 20,
                        padding: '22px 26px',
                        marginBottom: 32,
                        background: '#fff',
                        border: '1px solid #e5edf7',
                        boxShadow: '0 8px 28px rgba(30,144,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 20,
                        flexWrap: 'wrap',
                    }}
                >
                    <span
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg,#e6f2ff,#cfe6ff)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <QrcodeOutlined style={{ fontSize: 28, color: '#1e90ff' }} />
                    </span>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Código de tu tienda
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color: '#0f2740', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', letterSpacing: 1 }}>
                            {storeCode || '—'}
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                            Compártelo con tus clientes: al ingresarlo (o escanear tu QR) en la app Fluvi entran directo a tu marca.
                        </div>
                    </div>
                    <button
                        onClick={handleCopyCode}
                        disabled={!storeCode}
                        style={{
                            cursor: storeCode ? 'pointer' : 'not-allowed',
                            border: 'none',
                            borderRadius: 14,
                            padding: '12px 20px',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 15,
                            background: 'linear-gradient(135deg,#1e90ff,#0d6ee2)',
                            boxShadow: '0 8px 20px rgba(30,144,255,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexShrink: 0,
                            opacity: storeCode ? 1 : 0.5,
                        }}
                    >
                        <CopyOutlined /> Copiar
                    </button>
                </div>

                <Row gutter={[20, 20]}>
                    {items.map((item) => (
                        <Col key={item.key} xs={24} sm={12} lg={8}>
                            <Link to={item.path} className="block h-full">
                                <Card
                                    bordered
                                    hoverable
                                    className="shadow-sm h-full transition"
                                    bodyStyle={{ padding: 24 }}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div
                                            className="flex items-center justify-center rounded-lg"
                                            style={{ width: 48, height: 48, background: '#f3f4f6' }}
                                        >
                                            {item.icon}
                                        </div>
                                        <RightOutlined style={{ color: '#9ca3af' }} />
                                    </div>
                                    <div className="text-lg font-semibold text-gray-800 mb-1">
                                        {item.title}
                                    </div>
                                    <p className="text-sm text-gray-600 leading-relaxed mb-0">
                                        {item.description}
                                    </p>
                                </Card>
                            </Link>
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
};

export default Ajustes;
