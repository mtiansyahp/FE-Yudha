import React, { useEffect, useState } from "react";
import { Table, Button, Typography, message } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

const { Title } = Typography;

interface User {
    id: number;
    nama: string;
    jurusan: string;
    pendidikan_terakhir: string;
    posisi: string;
    umur: number;
}

interface Pelatihan {
    id: string;
    nama_pelatihan: string;
    tanggal: string;
    deskripsi: string;
    users: User[];
}

export default function AdminUnit() {
    const [data, setData] = useState<Pelatihan[]>([]);
    const [loading, setLoading] = useState(false);
    const baseUrl = "http://localhost:8000/api";

    useEffect(() => {
        fetchPelatihan();
    }, []);

    const fetchPelatihan = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${baseUrl}/pelatihans`);
            const pelatihans: Pelatihan[] = await Promise.all(
                res.data.map(async (p: any) => {
                    const detail = await axios.get(`${baseUrl}/pelatihans/${p.id}`);
                    return detail.data;
                })
            );
            setData(pelatihans);
        } catch (err) {
            console.error(err);
            message.error("Gagal memuat data pelatihan");
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = (record: Pelatihan) => {
        const doc = new jsPDF();

        doc.setFontSize(14);
        doc.text("SURAT PERMOHONAN PELATIHAN", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.text(
            `Dengan ini kami mengajukan permohonan pelatihan sebagai berikut:`,
            20,
            35
        );
        doc.text(`Nama Pelatihan: ${record.nama_pelatihan}`, 20, 45);
        doc.text(
            `Tanggal: ${dayjs(record.tanggal).format("DD MMMM YYYY")}`,
            20,
            53
        );
        doc.text(`Deskripsi: ${record.deskripsi}`, 20, 61);

        doc.text("Berikut adalah daftar peserta yang diusulkan:", 20, 75);

        autoTable(doc, {
            startY: 80,
            head: [["No", "Nama", "Jurusan", "Pendidikan", "Posisi", "Umur"]],
            body: record.users.map((user, idx) => [
                idx + 1,
                user.nama,
                user.jurusan,
                user.pendidikan_terakhir,
                user.posisi,
                user.umur.toString(),
            ]),
            theme: "grid",
            styles: { fontSize: 10 },
        });

        doc.save(`Surat_Permohonan_${record.nama_pelatihan}.pdf`);
    };

    const columns = [
        {
            title: "Nama Pelatihan",
            dataIndex: "nama_pelatihan",
            key: "nama_pelatihan",
        },
        {
            title: "Tanggal",
            dataIndex: "tanggal",
            key: "tanggal",
            render: (val: string) => dayjs(val).format("DD-MM-YYYY"),
        },
        {
            title: "Deskripsi",
            dataIndex: "deskripsi",
            key: "deskripsi",
        },
        {
            title: "Jumlah Peserta",
            render: (_: any, record: Pelatihan) => record.users.length,
        },
        {
            title: "Aksi",
            render: (_: any, record: Pelatihan) => (
                <Button
                    icon={<PrinterOutlined />}
                    onClick={() => handlePrint(record)}
                >
                    Cetak Surat
                </Button>
            ),
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Menu Pelatihan - Surat Permohonan Pelatihan</Title>
            <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                loading={loading}
                bordered
            />
        </div>
    );
}
