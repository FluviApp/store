import React from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import { Card, Row, Col } from 'antd';
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
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

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
