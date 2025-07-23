import React, { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import Commerce from '../../services/Commerce'; // Asegúrate de que esté bien importado
import './Login.css';
import { useAuth } from '../../context/AuthContext';
import fluviLogo from '../../assets/fluviLogo.png';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();
    const onFinish = async (values) => {
        try {
            setLoading(true);
            const response = await Commerce.login(values);

            if (response?.success) {
                if (response.data?.active === false) {
                    message.error('Servicio suspendido por falta de pago. Contacta al administrador.');
                    setLoading(false);
                    return;
                }

                message.success(response.message || 'Inicio de sesión exitoso');
                login(response.data); // ✅ esto reemplaza el localStorage manual
                navigate('/pedidos');
            } else {
                message.warning(response.message || 'No se pudo iniciar sesión');
            }
        } catch (error) {
            const errorMsg =
                error?.response?.data?.message ||
                error.message ||
                'Error al iniciar sesión';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="relative flex items-center justify-center min-h-screen bg-white overflow-hidden">
            <div className="mesh-bg"></div>

            <div className="z-10 bg-white p-10 md:p-14 lg:p-16 rounded-xl shadow-2xl w-full max-w-md">
                <Form onFinish={onFinish} className="space-y-6">
                    <img src={fluviLogo} alt="Logo de Fluvi" className="mx-auto mb-4 w-12 h-12" />
                    <h2 className="text-2xl font-semibold text-start text-gray-800">Iniciar Sesión Fluvi Store</h2>

                    <Form.Item name="mail" rules={[{ required: true, message: 'Ingresa tu correo' }]}>
                        <Input placeholder="Correo" className="w-full px-4 py-3 rounded-lg border border-gray-300" />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: 'Ingresa tu contraseña' }]}>
                        <Input.Password placeholder="Contraseña" className="w-full px-4 py-3 rounded-lg border border-gray-300" />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="w-full py-3 text-lg rounded-lg bg-blue-500 hover:bg-blue-600 border-none"
                        >
                            Iniciar Sesión
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default Login;
