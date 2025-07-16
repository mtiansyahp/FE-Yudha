import React, { useEffect, useState } from 'react';
import { Card, Col, Row, message } from 'antd';
import Chart from 'react-apexcharts';
import axios from 'axios';

function Dashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchSummary = async () => {
        try {
            const res = await axios.get('http://localhost:8000/api/dashboard/summary');
            setData(res.data.data);
        } catch (err) {
            message.error('Gagal mengambil data dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    if (loading || !data) return null;

    // Grafik 1: Jumlah pegawai per departemen (bar)
    const posisiLabels = data.posisi.map((item: any) => item.label || 'Tidak Diketahui');
    const posisiData = data.posisi.map((item: any) => item.total);

    const departemenChart = {
        options: {
            chart: { id: 'departemen-bar' },
            xaxis: { categories: posisiLabels },
        },
        series: [{ name: 'Pegawai', data: posisiData }],
    };

    // Grafik 2: Pegawai berdasarkan jurusan pendidikan (pie)
    const jurusanLabels = data.jurusan.map((item: any) => item.label || 'Tidak Diketahui');
    const jurusanData = data.jurusan.map((item: any) => item.total);

    const jurusanChart = {
        options: {
            labels: jurusanLabels,
        },
        series: jurusanData,
    };

    // Grafik 3: Status Pelatihan Pegawai (donut)
    const pelatihanLabels = data.status_pelatihan.map((item: any) => item.label);
    const pelatihanData = data.status_pelatihan.map((item: any) => item.total);

    const pelatihanChart = {
        options: {
            labels: pelatihanLabels,
        },
        series: pelatihanData,
    };

    // Grafik 4: Jumlah pelatihan per bulan (line)
    const currentYear = new Date().getFullYear();
    const monthLabels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    const monthKeys = Array.from({ length: 12 }, (_, i) =>
        `${currentYear}-${String(i + 1).padStart(2, '0')}`
    );

    const pelatihanMap: Record<string, number> = {};
    data.pelatihan_per_bulan.forEach((item: any) => {
        if (item.label) pelatihanMap[item.label] = item.total;
    });

    const bulanData = monthKeys.map((key) => pelatihanMap[key] || 0);

    const pelatihanBulananChart = {
        options: {
            chart: { id: 'pelatihan-line' },
            xaxis: { categories: monthLabels },
        },
        series: [{ name: 'Pelatihan', data: bulanData }],
    };

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <Card title="Jumlah Pegawai per Departemen">
                        <Chart
                            options={departemenChart.options}
                            series={departemenChart.series}
                            type="bar"
                            height={250}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="Pegawai Berdasarkan Jurusan Pendidikan">
                        <Chart
                            options={jurusanChart.options}
                            series={jurusanChart.series}
                            type="pie"
                            height={250}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="Status Pelatihan Pegawai">
                        <Chart
                            options={pelatihanChart.options}
                            series={pelatihanChart.series}
                            type="donut"
                            height={250}
                        />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="Jumlah Pelatihan yang Dilakukan per Bulan">
                        <Chart
                            options={pelatihanBulananChart.options}
                            series={pelatihanBulananChart.series}
                            type="line"
                            height={250}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Dashboard;
