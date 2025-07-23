import { useEffect } from 'react';
import { useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom';
import { message } from 'antd';
import Commerce from '../services/Commerce'; // Servicio correcto

const PrivateRoute = () => {
    const storedUser = JSON.parse(localStorage.getItem('user')); // 👈 Parseamos para leer el objeto
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const checkStatus = async () => {
            if (!storedUser?.mail) return; // 👈 Verificamos que exista el mail

            try {
                const response = await Commerce.checkCommerceStatus(storedUser.mail);
                if (!response.success || response?.data?.active === false) {
                    message.error('Servicio suspendido por falta de pago.');
                    localStorage.removeItem('user');
                    navigate('/login');
                }
            } catch (error) {
                console.error('Error al verificar estado del comercio:', error);
                message.error('No se pudo verificar el estado del servicio');
                localStorage.removeItem('user');
                navigate('/login');
            }
        };

        checkStatus();
    }, [location.pathname]);

    return storedUser ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
