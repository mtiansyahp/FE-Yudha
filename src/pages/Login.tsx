// src/pages/Login.tsx
import React, { useEffect } from 'react';
import { Row, Col, Form, Input, Button, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

const { Title, Text } = Typography;
const API_URL = 'http://localhost:3002';

export function Login() {


    const navigate = useNavigate();
    const { user } = useAuth(); // jika kamu pakai context, atau ambil dari localStorage


    const { login } = useAuth();

    const onFinish = async ({ email, password }: { email: string; password: string }) => {
        try {
            const { data } = await axios.post('http://localhost:8000/api/login', {
                email,
                password,
            });

            const userData = {
                id: data.user.id,
                role: data.user.role,
                posisi: data.user.posisi,
            };

            localStorage.setItem('token', data.token);
            login(userData); // ⬅️ update context

            message.success(`Login berhasil sebagai ${data.user.role}`);

            // Redirect
            if (data.user.role === 'admin') navigate('/admin/dashboard', { replace: true });
            else if (data.user.role === 'admin_unit') navigate('/admin-unit', { replace: true });
            else if (data.user.role === 'atasan') navigate('/atasan/dashboard', { replace: true });
            else navigate('/pegawai/dashboard', { replace: true });

        } catch (err: any) {
            if (err.response?.status === 401) {
                message.error('Email atau password salah');
            } else {
                message.error('Gagal terhubung ke server');
            }
        }
    };


    // useEffect(() => {
    //     const role = localStorage.getItem('userRole');
    //     if (role) {
    //         if (role === 'admin') navigate('/admin/dashboard', { replace: true });
    //         else if (role === 'admin_unit') navigate('/admin-unit', { replace: true });
    //         else if (role === 'atasan') navigate('/atasan/dashboard', { replace: true });
    //         else navigate('/pegawai/dashboard', { replace: true });
    //     }
    // }, [navigate]); // ✅ tambahkan dependency array




    return (
        <Row style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* KIRI - GAMBAR (dipertahankan) */}
            <Col xs={0} md={12}>
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#16B3AC',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderTopLeftRadius: 16,
                        borderBottomLeftRadius: 16,
                        overflow: 'hidden'
                    }}
                >
                    <img
                        src="https://png.pngtree.com/png-vector/20231019/ourmid/pngtree-hospital-3d-asset-illustration-png-image_10264097.png"
                        alt="Hospital Illustration"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            </Col>

            {/* KANAN - FORM LOGIN */}
            <Col
                xs={24}
                md={12}
                style={{
                    backgroundColor: '#fff',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '40px 24px',
                    borderTopRightRadius: 16,
                    borderBottomRightRadius: 16,
                    position: 'relative',
                }}
            >
                {/* Logo pojok kiri atas */}
                <img
                    src="/logo.png"
                    alt="Logo"
                    style={{
                        position: 'absolute',
                        top: 24,
                        left: 24,
                        height: 40,
                    }}
                />

                {/* <img
                        src="/logo.png"
                        alt="Logo"
                        style={{
                            position: 'absolute',
                            top: 24,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            height: 40,
                        }}
                    /> */}


                <div style={{ width: '100%', maxWidth: 400 }}>
                    {/* Logo atas form */}
                    {/* <img
                            src="https://logowik.com/content/uploads/images/bmsgpk-at6347.logowik.com.webp  "
                            alt="Pupuk Indonesia"
                            style={{ width: 160, marginBottom: 24 }}
                        /> */}

                    <Title level={4} style={{ fontWeight: 'bold', marginBottom: 0 }}>
                        Login Dashboard Dilan
                    </Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                        Masukkan Email akun anda
                    </Text>

                    <Form
                        name="login"
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[{ required: true, message: 'Mohon masukkan email' }]}
                        >
                            <Input
                                placeholder="Masukkan Email"
                                size="large"
                                style={{ borderRadius: 8 }}
                            />
                        </Form.Item>
                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[{ required: true, message: 'Mohon masukkan password' }]}
                        >
                            <Input.Password
                                placeholder="Masukkan Password Anda"
                                size="large"
                                style={{ borderRadius: 8 }}
                            />
                        </Form.Item>
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                size="large"
                                style={{
                                    borderRadius: 8,
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(90deg, #16B3AC, #9BC03C)',
                                    border: 'none'
                                }}
                            >
                                Masuk
                            </Button>
                        </Form.Item>
                    </Form>

                    {/* Footer copyright */}
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Copyright RSMH Palembang 2025
                    </Text>
                </div>
            </Col>
        </Row>
    );
}
