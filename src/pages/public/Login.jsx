import React, { useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import Commerce from '../../services/Commerce';
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
                login(response.data);
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
        <div className="fluvi-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'hidden' }}>
            {/* blobs decorativos */}
            <div className="fluvi-blob fluvi-blob--white" style={{ top: -60, left: -40, width: 320, height: 320 }} />
            <div className="fluvi-blob fluvi-blob--blue" style={{ bottom: -80, right: -60, width: 360, height: 360 }} />

            <div className="glass-card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: '40px 32px' }}>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div style={{ width: 66, height: 66, borderRadius: 33, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(30,144,255,0.22)', marginBottom: 14 }}>
                        <img src={fluviLogo} alt="Fluvi" style={{ width: 40, height: 40 }} />
                    </div>
                    <h2 className="fluvi-title" style={{ fontSize: 26, margin: 0 }}>Fluvi Store</h2>
                    <p className="fluvi-muted" style={{ marginTop: 6, fontSize: 14 }}>Inicia sesión para gestionar tu planta 💧</p>
                </div>

                <Form onFinish={onFinish} layout="vertical" style={{ marginTop: 26 }} requiredMark={false}>
                    <Form.Item name="mail" rules={[{ required: true, message: 'Ingresa tu correo' }]} style={{ marginBottom: 16 }}>
                        <Input size="large" placeholder="Correo" />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: 'Ingresa tu contraseña' }]} style={{ marginBottom: 20 }}>
                        <Input.Password size="large" placeholder="Contraseña" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            size="large"
                            block
                            style={{ height: 52, fontWeight: 800, fontSize: 16 }}
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
