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
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

    const quickOrderUrl = () => {
        const slug = STORE_SLUGS[user?.storeId];
        return slug ? `${QUICK_ORDER_BASE}/${slug}` : `${QUICK_ORDER_BASE}/pedido/${user?.storeId || ''}`;
    };

    const handleShareQuickOrder = async () => {
        const url = quickOrderUrl();
        try {
            if (navigator.share) {
                await navigator.share({ title: 'Pide tu agua', text: 'Haz tu pedido rápido aquí 💧', url });
            } else {
                await navigator.clipboard.writeText(url);
                message.success('¡URL copiada! Ya puedes compartirla 💧');
            }
        } catch (err) {
            try { await navigator.clipboard.writeText(url); message.success('¡URL copiada! 💧'); }
            catch { message.info(url); }
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
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
