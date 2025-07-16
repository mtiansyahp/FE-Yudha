// src/pages/About.tsx
import React from 'react';
import { Typography, Card } from 'antd';

const { Title, Paragraph } = Typography;

const About: React.FC = () => (
    <Card style={{ margin: '24px', background: '#fff' }}>
        <Title level={2}>Tentang Aplikasi</Title>
        <Paragraph>
            Ini adalah halaman <em>About</em> sementara untuk aplikasi Fuzzy Tsukamoto.
            Di sini nanti bisa ditambahkan informasi seperti:
        </Paragraph>
        <ul>
            <li>Deskripsi singkat aplikasi</li>
            <li>Versi: 1.0.0</li>
            <li>Penulis: Nama Anda</li>
            <li>Kontak: email@domain.com</li>
        </ul>
        <Paragraph>
            Anda bisa mengganti isi halaman ini dengan detail yang lebih lengkap
            ketika sudah tersedia.
        </Paragraph>
    </Card>
);

export default About;
