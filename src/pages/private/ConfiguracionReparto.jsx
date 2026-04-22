import React from 'react';
import Sidebar from '../../components/Sidebar.jsx';
import BackToAjustes from '../../components/BackToAjustes.jsx';
import { Tabs } from 'antd';
import { CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import ZonasTab from './ZonasTab.jsx';
import FeriadosTab from './FeriadosTab.jsx';

const ConfiguracionReparto = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'feriados' ? 'feriados' : 'zonas';

    const onTabChange = (key) => {
        if (key === 'zonas') searchParams.delete('tab');
        else searchParams.set('tab', key);
        setSearchParams(searchParams);
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 pt-16 px-4 lg:pt-10 lg:px-10 pb-10 overflow-x-auto">
                <BackToAjustes />
                <h1 className="text-3xl font-bold text-gray-800 mb-3 flex items-center gap-3">
                    <CalendarOutlined />
                    Configuración de reparto
                </h1>
                <p className="text-gray-600 mb-6">
                    Gestiona las zonas de despacho y las excepciones en el calendario.
                </p>

                <Tabs
                    activeKey={activeTab}
                    onChange={onTabChange}
                    items={[
                        {
                            key: 'zonas',
                            label: (
                                <span className="flex items-center gap-2">
                                    <EnvironmentOutlined />
                                    Zonas
                                </span>
                            ),
                            children: <ZonasTab />,
                        },
                        {
                            key: 'feriados',
                            label: (
                                <span className="flex items-center gap-2">
                                    <CalendarOutlined />
                                    Feriados y fechas bloqueadas
                                </span>
                            ),
                            children: <FeriadosTab />,
                        },
                    ]}
                />
            </div>
        </div>
    );
};

export default ConfiguracionReparto;
