import React, { useState } from 'react';
import { Layout, Menu, Button, Badge } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    MenuOutlined,
    ShoppingCartOutlined,
    BarChartOutlined,
    UserOutlined,
    AppstoreOutlined,
    CarOutlined,
    EnvironmentOutlined,
    FileTextOutlined,
    CreditCardOutlined,
    CalendarOutlined,
    DollarOutlined,
    SettingOutlined,
    LogoutOutlined
} from '@ant-design/icons';

import useStoreInfo from '../hooks/useStoreInfo'; // <— NUEVO
import useOrders from '../hooks/useOrders';

const { Sider } = Layout;

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(true);

    const { data: storeResp } = useStoreInfo(); // { success, data: store }
    const store = storeResp?.data || null;
    const toggleSidebar = () => setCollapsed(!collapsed);

    // Contador de cobros pendientes (transferencias no pagadas)
    const { data: pendingCobrosResp } = useOrders({
        page: 1,
        limit: 1,
        paymentMethod: 'transferencia',
        transferPay: false,
    });
    const pendingCobrosCount = pendingCobrosResp?.data?.totalDocs || 0;

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getSelectedKey = () => {
        const path = location.pathname;
        switch (path) {
            case '/pos':
                return ['1'];
            case '/metricas':
                return ['2'];
            case '/clientes':
                return ['3'];
            case '/categorias':
                return ['4'];
            case '/paquetes':
                return ['5'];
            case '/pedidos':
                return ['8'];
            case '/cobros':
                return ['cobros'];
            default:
                // Sub-pantallas agrupadas en Ajustes
                if ([
                    '/ajustes',
                    '/repartidores',
                    '/historialventas',
                    '/banners',
                    '/codigosdescuento',
                    '/configuracionpagos',
                    '/configuracionreparto',
                    '/notificaciones',
                ].some((p) => path.startsWith(p))) {
                    return ['ajustes'];
                }
                return ['1'];
        }
    };

    const renderBrand = (className = '') => (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            {store?.image ? (
                <img
                    src={store.image}
                    alt={store?.name || 'Store Logo'}
                    className="h-12 w-auto object-contain rounded"
                    draggable={false}
                />
            ) : (
                <div className="font-bold text-2xl text-gray-800">Fluvi</div>
            )}
            <div className="mt-2 text-sm text-gray-600 line-clamp-1">
                {store?.name || '—'}
            </div>
        </div>
    );

    const renderMenuItems = () => (
        <>
            <Menu.Item key="1" icon={<ShoppingCartOutlined />}>
                <Link to="/pos">Vender</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<BarChartOutlined />}>
                <Link to="/metricas">Métricas</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<UserOutlined />}>
                <Link to="/clientes">Clientes</Link>
            </Menu.Item>
            <Menu.Item key="4" icon={<AppstoreOutlined />}>
                <Link to="/categorias">Categorías</Link>
            </Menu.Item>
            <Menu.Item key="5" icon={<FileTextOutlined />}>
                <Link to="/paquetes">Packs</Link>
            </Menu.Item>
            <Menu.Item key="8" icon={<FileTextOutlined />}>
                <Link to="/pedidos">Pedidos</Link>
            </Menu.Item>
            <Menu.Item key="cobros" icon={<DollarOutlined />}>
                <Link to="/cobros" className="flex items-center justify-between gap-2">
                    <span>Cobros</span>
                    {pendingCobrosCount > 0 && (
                        <Badge count={pendingCobrosCount} overflowCount={99} style={{ backgroundColor: '#f5222d' }} />
                    )}
                </Link>
            </Menu.Item>
            <Menu.Item key="ajustes" icon={<SettingOutlined />}>
                <Link to="/ajustes">Ajustes</Link>
            </Menu.Item>
            <Menu.Item
                key="logout"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="text-red-500"
            >
                Cerrar sesión
            </Menu.Item>
        </>
    );

    return (
        <>
            {/* Botón hamburguesa mobile */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    icon={<MenuOutlined />}
                    shape="circle"
                    onClick={toggleSidebar}
                    className="shadow-md"
                />
            </div>

            {/* Sidebar móvil */}
            <div
                className={`fixed top-0 left-0 h-full w-64 bg-white z-40 transition-transform duration-300 shadow-lg ${collapsed ? '-translate-x-full' : 'translate-x-0'
                    } lg:hidden`}
            >
                {renderBrand('p-6')}
                <Menu
                    mode="inline"
                    selectedKeys={getSelectedKey()}
                    onClick={() => setCollapsed(true)}
                >
                    {renderMenuItems()}
                </Menu>
                <div className="text-center text-sm text-gray-500 p-2">
                    © 2020 Fluvi
                </div>
            </div>

            {/* Sidebar de escritorio: contenedor sticky para que no se mueva al hacer scroll */}
            <div className="hidden lg:block sticky top-0 z-20 h-screen max-h-screen w-[250px] shrink-0 self-start overflow-y-auto border-r border-gray-200 bg-white">
                <Sider
                    theme="light"
                    breakpoint="lg"
                    collapsedWidth="0"
                    width={250}
                    className="min-h-full !bg-white border-0"
                >
                    {renderBrand('p-6')}
                    <Menu mode="inline" selectedKeys={getSelectedKey()}>
                        {renderMenuItems()}
                    </Menu>
                    <div className="text-center text-sm text-gray-500 p-2">
                        © 2020 Fluvi
                    </div>
                </Sider>
            </div>
        </>
    );
};

export default Sidebar;
