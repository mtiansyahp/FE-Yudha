import React, { useEffect, useState } from "react";
import { Table, Button, Typography, message, Modal } from "antd";
import { PrinterOutlined } from "@ant-design/icons";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";

const { Title } = Typography;

function toFixedSafe(val: any, digit = 2): string {
    const num = Number(val);
    return isFinite(num) ? num.toFixed(digit) : "0.00";
}



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

interface LogEntry {
    id: number;
    user_id: number;
    skor: number;
    keterangan: string;
    user: {
        id: number;
        nama: string;
        jurusan: string;
        pendidikan_terakhir: string;
        posisi: string;
        umur: number;
    };
}

interface Penilaian {
    id: string;
    user_id: number;
    nama: string;
    skor: number;
    keterangan: string;
}

interface PenilaianWithUser extends Penilaian {
    user: User;
}

export default function AdminUnit() {
    const [data, setData] = useState<Pelatihan[]>([]);
    const [loading, setLoading] = useState(false);
    const baseUrl = "http://localhost:8000/api";
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [penilaians, setPenilaians] = useState<Penilaian[]>([]);
    const [viewModalVisible, setViewModalVisible] = useState(false);
    const [selectedPel, setSelectedPel] = useState<Pelatihan | null>(null);
    const [penilaianWithUser, setPenilaianWithUser] = useState<PenilaianWithUser[]>([]);

    const [usersById, setUsersById] = useState<Record<number, User>>({});

    async function fetchUsers() {
        try {
            const res = await axios.get<User[]>(`${baseUrl}/users`);
            const map: Record<number, User> = {};
            res.data.forEach(u => { map[u.id] = u });
            setUsersById(map);
        } catch {
            message.error("Gagal memuat data pengguna");
        }
    }

    useEffect(() => {
        fetchPelatihan();
        fetchUsers();
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
    async function handleView(record: Pelatihan) {
        setLoading(true);
        try {
            // jika usersById masih kosong, load dulu
            if (Object.keys(usersById).length === 0) {
                await fetchUsers();
            }

            const res = await axios.get<Penilaian[]>(
                `${baseUrl}/penilaians?pelatihan_id=${record.id}`
            );
            const enriched = res.data.map(p => ({
                ...p,
                user: usersById[p.user_id] || {
                    id: p.user_id,
                    nama: "-",
                    jurusan: "-",
                    pendidikan_terakhir: "-",
                    posisi: "-",
                    umur: 0
                }
            }));
            setPenilaianWithUser(enriched);
            setSelectedPel(record);
            setViewModalVisible(true);
        } catch {
            message.error("Gagal memuat penilaian");
        } finally {
            setLoading(false);
        }
    }




    async function handlePrint(record: Pelatihan) {
        setLoading(true);

        if (Object.keys(usersById).length === 0) {
            await fetchUsers();
        }

        let top10: PenilaianWithUser[] = [];
        try {
            const res = await axios.get<Penilaian[]>(
                `${baseUrl}/penilaians?pelatihan_id=${record.id}`
            );
            top10 = res.data
                .sort((a, b) => b.skor - a.skor)
                .slice(0, 10)
                .map<PenilaianWithUser>(p => ({
                    ...p,
                    user: usersById[p.user_id] || { /* fallback */ }
                }));
        } catch {
            message.error("Gagal memuat penilaian untuk print");
            setLoading(false);
            return;
        }
        setLoading(false);

        const doc = new jsPDF();

        // === Tambahkan kembali header & teks pengantar ===
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

        doc.text("Berikut daftar 10 peserta dengan nilai terbaik:", 20, 75);
        // ================================================

        autoTable(doc, {
            startY: 80,
            head: [["No", "Nama", "Jabatan", "Skor (%)", "Keterangan"]],
            body: top10.map((p, i) => [
                i + 1,
                p.user.nama,
                p.user.posisi,
                `${toFixedSafe(p.skor)}%`,
                p.keterangan,
            ]),
            theme: "grid",
            styles: { fontSize: 10 },
        });

        doc.save(`Surat_Permohonan_${record.nama_pelatihan}.pdf`);
    }






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
                <>
                    <Button
                        icon={<PrinterOutlined />}
                        onClick={() => handlePrint(record)}
                        style={{ marginRight: 8 }}
                    >
                        Cetak Surat
                    </Button>
                    <Button onClick={() => handleView(record)}>
                        View Penilaian
                    </Button>
                </>
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
            <Modal
                open={viewModalVisible}
                title={`Penilaian: ${selectedPel?.nama_pelatihan}`}
                footer={null}
                onCancel={() => setViewModalVisible(false)}
                width={600}
            >
                <Table
                    // sesudah:
                    dataSource={[...penilaianWithUser].sort((a, b) => b.skor - a.skor)}

                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    columns={[
                        {
                            title: "No",
                            key: "no",
                            render: (_: any, __: any, idx: number) => idx + 1,
                            width: 50,
                        },
                        {
                            title: "Nama Pegawai",
                            dataIndex: ["user", "nama"],
                            key: "nama",
                        },
                        {
                            title: "Jabatan",
                            dataIndex: ["user", "posisi"],
                            key: "posisi",
                        },
                        {
                            title: "Skor (%)",
                            dataIndex: "skor",
                            key: "skor",
                            render: (v: number) => `${toFixedSafe(v)}%`,
                        },
                        {
                            title: "Keterangan",
                            dataIndex: "keterangan",
                            key: "keterangan",
                        },
                    ]}
                />
            </Modal>


        </div>
    );
}

