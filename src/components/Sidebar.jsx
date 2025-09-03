import React, { useState } from 'react';
import { Layout, Menu, Button } from 'antd';
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
    LogoutOutlined
} from '@ant-design/icons';

import useStoreInfo from '../hooks/useStoreInfo'; // <— NUEVO

const { Sider } = Layout;

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(true);

    const { data: storeResp } = useStoreInfo(); // { success, data: store }
    const store = storeResp?.data || null;
    console.log(store)
    const toggleSidebar = () => setCollapsed(!collapsed);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getSelectedKey = () => {
        switch (location.pathname) {
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
            case '/repartidores':
                return ['6'];
            case '/zonasdespacho':
                return ['7'];
            case '/pedidos':
                return ['8'];
            case '/historialventas':
                return ['9'];
            case '/banners':
                return ['10'];
            case '/notificaciones':
                return ['11'];
            case '/codigosdescuento':
                return ['12'];
            default:
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
            <Menu.Item key="6" icon={<CarOutlined />}>
                <Link to="/repartidores">Repartidores</Link>
            </Menu.Item>
            <Menu.Item key="7" icon={<EnvironmentOutlined />}>
                <Link to="/zonasdespacho">Zonas de despacho</Link>
            </Menu.Item>
            <Menu.Item key="8" icon={<FileTextOutlined />}>
                <Link to="/pedidos">Pedidos</Link>
            </Menu.Item>
            <Menu.Item key="9" icon={<FileTextOutlined />}>
                <Link to="/historialventas">Historial de ventas</Link>
            </Menu.Item>
            <Menu.Item key="10" icon={<FileTextOutlined />}>
                <Link to="/banners">Banners</Link>
            </Menu.Item>
            <Menu.Item key="11" icon={<FileTextOutlined />}>
                <Link to="/notificaciones">Notificaciones</Link>
            </Menu.Item>
            <Menu.Item key="12" icon={<FileTextOutlined />}>
                <Link to="/codigosdescuento">Codigos de descuento</Link>
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

            {/* Sidebar de escritorio */}
            <Sider
                theme="light"
                breakpoint="lg"
                collapsedWidth="0"
                width={250}
                className="hidden lg:block h-screen border-r border-gray-200"
            >
                {renderBrand('p-6')}
                <Menu mode="inline" selectedKeys={getSelectedKey()}>
                    {renderMenuItems()}
                </Menu>
                <div className="text-center text-sm text-gray-500 p-2">
                    © 2020 Fluvi
                </div>
            </Sider>
        </>
    );
};

export default Sidebar;
