import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Space,
  Popconfirm,
  message,
  Typography,
  Switch,
  Collapse,
  Select,
  Checkbox,
} from "antd";
import { PlusOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";

/* ---------------- utils kecil, letakkan di paling atas file -------------- */
// utils helper di atas file komponen:
const toFixedSafe = (val: any, digit = 2) => {
  const num = Number(val);
  return isFinite(num) ? num.toFixed(digit) : "0.00";
};
const B_KEYS = ['b1', 'b2', 'b3', 'b4', 'b5'] as const;
const A_KEYS = ['a1', 'a2', 'a3', 'a4', 'a5'] as const;





/* ------------------------------------------------------------------------- */


const { Title } = Typography;

interface Penilaian {
  created_at: any;
  updated_at: any;
  id: string;
  user_id: string; // ✅ tambahkan ini
  nama: string;
  skor: number;
  keterangan: string;
  pelatihan_id: string;
  perhitungan: Record<string, number>;
}


interface Pegawai {
  id: number;
  nama: string;
  jurusan: string;
  pendidikan_terakhir: string;
  posisi: string;
  umur: number;
  // sesuai JSON Anda, Pegawai juga punya properti:
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  b5: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  sertifikasi: number;
  ikut_pelatihan: number;
  // sisanya tidak dipakai untuk perhitungan fuzzy (tapi tetap ada di BE):
  [key: string]: any;
}

interface Pelatihan {
  id: string;
  nama_pelatihan: string;
  tanggal: string;
  deskripsi: string;
  syarat: string;
  kualifikasi: string;
  peserta: number[];
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  b5: number;
  a1: number;
  a2: number;
  a3: number;
  a4: number;
  a5: number;
  sertifikasi: number;
  ikut_pelatihan: number;
  pendidikan_terakhir: string;
  jurusan: string;
  posisi: string;
  max_umur: number;
  users?: Pegawai[];
}

export default function PenilaianPelatihan() {
  const role = localStorage.getItem("userRole");
  const isPegawai = role === "pegawai";
  const [penilaianData, setPenilaianData] = useState<Penilaian[]>([]);
  const [pelatihanData, setPelatihanData] = useState<Pelatihan[]>([]);
  const [pegawaiData, setPegawaiData] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(false);

  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);

  const [isPenilaianModalVisible, setPenilaianModalVisible] = useState(false);
  const [editingPenilaian, setEditingPenilaian] = useState<Penilaian | null>(
    null
  );
  const [penilaianForm] = Form.useForm();

  const [isPelatihanModalVisible, setPelatihanModalVisible] = useState(false);
  const [editingPelatihan, setEditingPelatihan] = useState<Pelatihan | null>(
    null
  );
  const [pelatihanForm] = Form.useForm();

  const [selectedPeserta, setSelectedPeserta] = useState<Pegawai[]>([]);
  const [isPesertaModalVisible, setPesertaModalVisible] = useState(false);

  const baseUrl = "http://localhost:8000/api";

  useEffect(() => {
    fetchData();
  }, []);

  const summaryColumns = [
    { title: "Pelatihan", dataIndex: "nama_pelatihan", key: "nama_pelatihan" },
    {
      title: "Tanggal Proses",
      dataIndex: "tanggal_proses",
      key: "tanggal_proses",
    },
    { title: "Total Pegawai", dataIndex: "total", key: "total" },
    {
      title: "Aksi",
      key: "aksi",
      render: (_: any, row: any) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            type="link"
            onClick={() => {
              setSelectedSummary(row);
              setSummaryModalVisible(true);
            }}
          />
          {!isPegawai && (
            <Popconfirm
              title="Yakin hapus semua hasil penilaian untuk pelatihan ini?"
              onConfirm={() => handleDeleteGroup(row.key as string)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // state untuk summary
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [selectedSummary, setSelectedSummary] = useState<{
    nama_pelatihan: string;
    tanggal_proses: string;
    total: number;
    scores: Penilaian[];
  } | null>(null);

  // build summaryData: satu entry per pelatihan_id
  const summaryData = useMemo(() => {
    // group penilaianData per pelatihan_id
    const map = new Map<string, Penilaian[]>();
    penilaianData.forEach((p) => {
      if (!map.has(p.pelatihan_id)) map.set(p.pelatihan_id, []);
      map.get(p.pelatihan_id)!.push(p);
    });

    // for each grup, cari nama pelatihan + tanggal_proses + total
    return Array.from(map.entries()).map(([pelId, grup]) => {
      const pel = pelatihanData.find((pl) => pl.id === pelId);
      const tanggalProses = grup[0].created_at ?? grup[0].updated_at ?? "-";
      return {
        key: pelId,
        nama_pelatihan: pel?.nama_pelatihan ?? pelId,
        tanggal_proses: tanggalProses.split("T")[0],
        total: grup.length,
        scores: grup,
      };
    });
  }, [penilaianData, pelatihanData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resPenilaian, resPelatihan, resPegawai] = await Promise.all([
        axios.get(`${baseUrl}/penilaians`),
        axios.get(`${baseUrl}/pelatihans`),
        axios.get(`${baseUrl}/users`),
      ]);
      const penilaianFix = resPenilaian.data.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,          // ← tambahkan
        pelatihan_id: p.pelatihan_id,     // ← tambahkan (perlu utk edit)
        nama: p.user?.nama ?? "Unknown",
        skor: p.skor,
        keterangan: p.keterangan,
        created_at: p.created_at,
        perhitungan: p.detail ?? {},     // kalau BE men-store detail
      }));

      setPenilaianData(penilaianFix);
      setPelatihanData(resPelatihan.data);
      setPegawaiData(resPegawai.data);
    } catch {
      message.error("Gagal memuat data dari server");
    } finally {
      setLoading(false);
    }
  };


  // === PENILAIAN ===
  const showPenilaianModal = () => {
    setEditingPenilaian(null);
    penilaianForm.resetFields();
    setPenilaianModalVisible(true);
  };

  const handlePenilaianSubmit = async () => {
    try {
      const values = await penilaianForm.validateFields();
      if (editingPenilaian) {
        await axios.put(`${baseUrl}/penilaian/${editingPenilaian.id}`, values);
        message.success("Penilaian diperbarui");
      } else {
        await axios.post(`${baseUrl}/penilaian`, values);
        message.success("Penilaian ditambahkan");
      }
      setPenilaianModalVisible(false);
      fetchData();
    } catch {
      message.error("Gagal menyimpan penilaian");
    }
  };

  // const handleDeleteGroup = async (pelatihanId: string) => {
  //   try {
  //     const idsToDelete = penilaianData
  //       .filter((p) => p.pelatihan_id === pelatihanId)
  //       .map((p) => p.id);
  //     await Promise.all(
  //       idsToDelete.map((id) => axios.delete(`${baseUrl}/penilaian/${id}`))
  //     );
  //     message.success(`Deleted ${idsToDelete.length} penilaian`);
  //     fetchData();
  //   } catch {
  //     message.error("Gagal menghapus penilaian");
  //   }
  // };

  const handlePenilaianEdit = (record: Penilaian) => {
    setEditingPenilaian(record);
    penilaianForm.setFieldsValue(record);
    setPenilaianModalVisible(true);
  };

  const handleDeleteGroup = async (pelatihanId: string) => {
    try {
      await axios.delete(`${baseUrl}/penilaian/pelatihan/${pelatihanId}`);
      message.success("Semua penilaian & log berhasil dihapus");
      fetchData(); // refresh
    } catch (err) {
      message.error("Gagal menghapus semua penilaian & log");
    }
  };



  const handleViewDetail = async (record: Penilaian) => {
    try {
      const url = `${baseUrl}/log-penilaians/penilaian/${record.id}/user/${record.user_id}`;
      const { data: log } = await axios.get(url);

      setSelectedDetail({
        ...log,                                             // log sudah memiliki user, pelatihan, detail
        skor: Number(log.skor) || 0,
      });
      setDetailVisible(true);
    } catch (err) {
      message.error('Gagal mengambil detail');
    }
  };






  const penilaianColumns = [
    { title: "Nama", dataIndex: "nama" },
    { title: "Skor", dataIndex: "skor" },
    { title: "Keterangan", dataIndex: "keterangan" },
    {
      title: "Aksi",
      render: (_: any, record: Penilaian) => (
        <Space>
          <Button type="link" onClick={() => handleViewDetail(record)}>
            View
          </Button>

          {/* hanya untuk atasan/admin */}
          {!isPegawai && (
            <>
              <Button type="link" onClick={() => handlePenilaianEdit(record)}>
                Edit
              </Button>
              <Popconfirm
                title="Yakin hapus?"
                onConfirm={() => handleDeleteGroup(record.id)}
              >
                {/* icon‐only delete button */}
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  // === PELATIHAN ===
  const showPelatihanModal = () => {
    setEditingPelatihan(null);
    pelatihanForm.resetFields();
    setPelatihanModalVisible(true);
  };

  const handlePelatihanSubmit = async () => {
    try {
      const values = await pelatihanForm.validateFields();

      const selectedA = values.a_group || [];
      const selectedB = values.b_group || [];

      const allKeys = ['a1', 'a2', 'a3', 'a4', 'a5', 'b1', 'b2', 'b3', 'b4', 'b5'];
      const flags = Object.fromEntries(
        allKeys.map(k => [k, selectedA.includes(k) || selectedB.includes(k) ? 1 : 0])
      );

      const formatted: any = {
        ...values,
        tanggal: values.tanggal.format("YYYY-MM-DD"),
        peserta: parsePeserta(values.peserta),
        ...flags,
        sertifikasi: values.sertifikasi ? 1 : 0,
        ikut_pelatihan: values.ikut_pelatihan ? 1 : 0,
      };

      delete formatted.a_group;
      delete formatted.b_group;

      if (editingPelatihan) {
        await axios.put(`${baseUrl}/pelatihans/${editingPelatihan.id}`, formatted);
        message.success("Pelatihan diperbarui");
      } else {
        await axios.post(`${baseUrl}/pelatihans`, formatted);
        message.success("Pelatihan ditambahkan");
      }

      setPelatihanModalVisible(false);
      fetchData();
    } catch (err) {
      message.error("Gagal menyimpan pelatihan");
    }
  };


  const handlePelatihanEdit = async (record: Pelatihan) => {
    try {
      const { data } = await axios.get(`${baseUrl}/pelatihans/${record.id}`);

      const bKeys = ["b1", "b2", "b3", "b4", "b5"];
      const aKeys = ["a1", "a2", "a3", "a4", "a5"];

      const b_group = bKeys.filter((key) => data[key] === 1);
      const a_group = aKeys.filter((key) => data[key] === 1);

      const switchFlags: any = {};
      [...bKeys, ...aKeys, "sertifikasi", "ikut_pelatihan"].forEach((key) => {
        switchFlags[key] = data[key] === 1;
      });

      pelatihanForm.setFieldsValue({
        ...data,
        peserta: data.users?.map((u: any) => u.id) || [],
        tanggal: dayjs(data.tanggal),
        b_group,
        a_group,
        ...switchFlags,
      });

      setEditingPelatihan(data);
      setPelatihanModalVisible(true);
    } catch (err) {
      console.error("❌ Gagal memuat data pelatihan:", err);
      message.error("Gagal memuat data pelatihan.");
    }
  };



  const handlePelatihanDelete = async (id: string) => {
    await axios.delete(`http://127.0.0.1:8000/api/pelatihans/${id}`);
    message.success("Pelatihan dihapus");
    fetchData();
  };

  /**
   * HITUNG T1 = rata‐rata dari b1..b5
   * (nilai 1 jika pegawai.bX === pelatihan.bX, jamak 5 kunci)
   */
  const calculateComponentT1 = (
    pegawai: Pegawai,
    pelatihan: Pelatihan
  ): number => {
    const keys: Array<"b1" | "b2" | "b3" | "b4" | "b5"> = [
      "b1",
      "b2",
      "b3",
      "b4",
      "b5",
    ];
    const match: number[] = keys.map((k) =>
      // pastikan kita membandingkan angka, bukan string
      Number(pegawai[k]) === Number(pelatihan[k]) ? 1 : 0
    );
    const T1 = match.reduce((a, b) => a + b, 0) / match.length;
    console.log(
      `T1 (${pegawai.nama}):`,
      T1.toFixed(4),
      "⟐ pegawai =",
      keys.map((k) => pegawai[k]),
      "⟐ pelatihan =",
      keys.map((k) => pelatihan[k])
    );
    return T1;
  };

  /**
   * HITUNG T2 = rata‐rata dari { aX : pelatihan.aX===1 }
   * (hanya ambil aX yang di‐on di pelatihan)
   */
  const calculateComponentT2 = (
    pegawai: Pegawai,
    pelatihan: Pelatihan
  ): number => {
    const keys: Array<"a1" | "a2" | "a3" | "a4" | "a5"> = [
      "a1",
      "a2",
      "a3",
      "a4",
      "a5",
    ];
    // ambil hanya aX yang aktif (===1) di pelatihan
    const activeKeys = keys.filter((k) => Number(pelatihan[k]) === 1);
    if (activeKeys.length === 0) {
      console.log(`T2 (${pegawai.nama}): 1.0000 (tidak ada kriteria a*)`);
      return 1;
    }
    const match: number[] = activeKeys.map((k) =>
      Number(pegawai[k]) === 1 ? 1 : 0
    );
    const T2 = match.reduce((a, b) => a + b, 0) / match.length;
    console.log(
      `T2 (${pegawai.nama}):`,
      T2.toFixed(4),
      "⟐ pegawai a* =",
      activeKeys.map((k) => pegawai[k]),
      "⟐ pelatihan a* =",
      activeKeys.map((k) => pelatihan[k])
    );
    return T2;
  };

  /**
   * HITUNG Pendidikan = 1 − (|index(pegawai.pendidikan) − index(pelatihan.pendidikan)| / 4)
   * di mana urutan = ['D3','D4','S1','S2','S3']
   */
  const calculateComponentPendidikan = (
    pegawai: Pegawai,
    pelatihan: Pelatihan
  ): number => {
    const urutan = ["D3", "D4", "S1", "S2", "S3"];
    const i1 = urutan.indexOf(pegawai.pendidikan_terakhir.toUpperCase());
    const i2 = urutan.indexOf(pelatihan.pendidikan_terakhir.toUpperCase());
    const Pendidikan =
      i1 >= 0 && i2 >= 0 ? 1 - Math.abs(i1 - i2) / (urutan.length - 1) : 0;
    console.log(
      `Pendidikan (${pegawai.nama}):`,
      Pendidikan.toFixed(4),
      "⟐ pegawai =",
      pegawai.pendidikan_terakhir.toUpperCase(),
      "⟐ pelatihan =",
      pelatihan.pendidikan_terakhir.toUpperCase()
    );
    return Pendidikan;
  };

  /**
   * HITUNG Umur = 1 jika pegawai.umur ≤ pelatihan.max_umur,
   *   kalau lebih : max(0, 1 − (pegawai.umur − pelatihan.max_umur)/20)
   */
  const calculateComponentUmur = (
    pegawai: Pegawai,
    pelatihan: Pelatihan
  ): number => {
    const Umur =
      pegawai.umur <= pelatihan.max_umur
        ? 1
        : Math.max(0, 1 - (pegawai.umur - pelatihan.max_umur) / 20);
    console.log(
      `Umur (${pegawai.nama}):`,
      Umur.toFixed(4),
      "⟐ pegawai.umur =",
      pegawai.umur,
      "⟐ pelatihan.max_umur =",
      pelatihan.max_umur
    );
    return Umur;
  };

  const showPesertaModal = async (record: Pelatihan) => {
    const fallbackDummy: Pegawai[] = [
      { id: 1, nama: 'Tes', jurusan: '', pendidikan_terakhir: '', posisi: '', umur: 25, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, a1: 0, a2: 0, a3: 0, a4: 0, a5: 0, sertifikasi: 0, ikut_pelatihan: 0 },
    ];
    try {
      const res = await axios.get(`${baseUrl}/pelatihans/${record.id}`);

      const pelatihanWithUsers = res.data;

      console.log("🧾 Data:", pelatihanWithUsers);

      setSelectedPeserta(pelatihanWithUsers.users || fallbackDummy);
      setPesertaModalVisible(true);
    } catch (err) {
      console.error("❌ Gagal:", err);
      message.error("Gagal menampilkan peserta");
    }
  };




  const pelatihanColumns = [
    { title: "Nama Pelatihan", dataIndex: "nama_pelatihan" },
    { title: "Tanggal", dataIndex: "tanggal" },
    { title: "Deskripsi", dataIndex: "deskripsi" },
    {
      title: "Lihat Peserta",
      render: (_: any, record: Pelatihan) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => showPesertaModal(record)}

        />
      ),
    },
    {
      title: "Proses",
      render: (_: any, record: Pelatihan) => (
        <Button
          type="primary"
          loading={loading}
          onClick={() => handleProsesPenilaian(record.id)} // ⬅️ passing ID pelatihan
        >
          Proses Penilaian
        </Button>
      )

    },
    {
      title: "Aksi",
      render: (_: any, record: Pelatihan) => (
        <Space>
          {/* hanya untuk atasan/admin */}
          {!isPegawai && (
            <>
              <Button type="link" onClick={() => handlePelatihanEdit(record)}>
                Edit
              </Button>
              <Popconfirm
                title="Yakin hapus?"
                onConfirm={() => handlePelatihanDelete(record.id)}
              >
                <Button type="link" danger>
                  Hapus
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  /**
   * HITUNG keseluruhan skor menggunakan Tsukamoto:
   * 1) panggil calculateComponentT1.. calculateComponentUmur
   * 2) hitung Sertifikasi, PernahPelatihan, Jurusan, Posisi
   * 3) skor = rata‐rata semua 8 komponen
   */
  const calculateTsukamotoScore = (
    pegawai: Pegawai,
    pelatihan: Pelatihan
  ): {
    nilai: number;
    keterangan: string;
    detail: Record<string, number>;
  } => {
    // 1. T1
    const T1 = calculateComponentT1(pegawai, pelatihan);

    // 2. T2
    const T2 = calculateComponentT2(pegawai, pelatihan);

    // 3. Pendidikan
    const Pendidikan = calculateComponentPendidikan(pegawai, pelatihan);

    // 4. Umur
    const Umur = calculateComponentUmur(pegawai, pelatihan);

    // 5. Sertifikasi
    const Sertifikasi =
      Number(pegawai.sertifikasi) === Number(pelatihan.sertifikasi) ? 1 : 0;
    console.log(
      `Sertifikasi (${pegawai.nama}):`,
      Sertifikasi.toFixed(4),
      "⟐ pegawai.sertifikasi =",
      pegawai.sertifikasi,
      "⟐ pelatihan.sertifikasi =",
      pelatihan.sertifikasi
    );

    // 6. PernahPelatihan
    const PernahPelatihan =
      Number(pegawai.ikut_pelatihan) === Number(pelatihan.ikut_pelatihan)
        ? 1
        : 0;
    console.log(
      `PernahPelatihan (${pegawai.nama}):`,
      PernahPelatihan.toFixed(4),
      "⟐ pegawai.ikut_pelatihan =",
      pegawai.ikut_pelatihan,
      "⟐ pelatihan.ikut_pelatihan =",
      pelatihan.ikut_pelatihan
    );

    // 7. Jurusan
    const Jurusan =
      pegawai.jurusan.toLowerCase() === pelatihan.jurusan.toLowerCase() ? 1 : 0;
    console.log(
      `Jurusan (${pegawai.nama}):`,
      Jurusan.toFixed(4),
      "⟐ pegawai.jurusan =",
      pegawai.jurusan,
      "⟐ pelatihan.jurusan =",
      pelatihan.jurusan
    );

    // 8. Posisi
    const pegPos = pegawai.posisi.toLowerCase();
    const pelPos = pelatihan.posisi.toLowerCase();
    const Posisi = pegPos === pelPos ? 1 : pegPos.includes(pelPos) ? 0.7 : 0;
    console.log(
      `Posisi (${pegawai.nama}):`,
      Posisi.toFixed(4),
      "⟐ pegawai.posisi =",
      pegawai.posisi,
      "⟐ pelatihan.posisi =",
      pelatihan.posisi
    );

    const komponen = {
      T1,
      T2,
      Pendidikan,
      Umur,
      Sertifikasi,
      PernahPelatihan,
      Jurusan,
      Posisi,
    };
    const skor =
      Object.values(komponen).reduce((a, b) => a + b, 0) /
      Object.keys(komponen).length;
    const skorFinal = parseFloat((skor * 100).toFixed(2));

    const keterangan =
      skorFinal >= 85
        ? "Sangat Baik"
        : skorFinal >= 75
          ? "Baik"
          : skorFinal >= 65
            ? "Cukup"
            : skorFinal >= 50
              ? "Kurang"
              : "Sangat Kurang";

    return {
      nilai: skorFinal,
      keterangan,
      detail: komponen,
    };
  };

  /**
   * Proses seluruh peserta untuk satu Pelatihan:
   * - Hitung Tsukamoto
   * - Cek apakah sudah ada di DB / hindari duplikat
   * - Kirim hasil baru ke endpoint /penilaian
   */

  // ── Tambahkan helper ini ───────────────────────────────────────────────────────
  function parsePeserta(raw: number[] | string): number[] {
    if (Array.isArray(raw)) return raw.map((x) => Number(x));
    try {
      return JSON.parse(raw).map((x: any) => Number(x));
    } catch {
      return [];
    }
  }

  // ───────────────────────────────────────────────────────────────────────────────

  const handleProsesPenilaian = async (pelatihanId: string) => {
    setLoading(true);
    try {
      const res = await axios.post(`${baseUrl}/penilaian/tsukamoto-batch/${pelatihanId}`);
      message.success(res.data.message || "Berhasil diproses");
      fetchData(); // refresh data penilaian
    } catch (err) {
      console.error("❌ Gagal proses penilaian:", err);
      if (axios.isAxiosError(err)) {
        const errorMsg = err.response?.data?.message || "Gagal menyimpan hasil penilaian";
        message.error(errorMsg);
      } else {
        message.error("Terjadi kesalahan yang tidak diketahui");
      }
    }
    finally {
      setLoading(false);
    }
  };



  return (
    <div style={{ padding: 24 }}>
      {/* <Title level={3}>Penilaian</Title> */}
      {/* <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showPenilaianModal}
                style={{ marginBottom: 16 }}
            >
                Tambah Penilaian
            </Button> */}
      <Title level={3}>Hasil Penilaian</Title>
      <Table
        columns={summaryColumns}
        dataSource={summaryData}
        loading={loading}
        pagination={false}
        bordered
      />

      <Title level={3} style={{ marginTop: 48 }}>
        Pelatihan Rumah Sakit
      </Title>
      {/* TOMBOL TAMBAH hanya untuk atasan/admin */}
      {!isPegawai && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showPelatihanModal}
          style={{ marginBottom: 16 }}
        >
          Tambah Pelatihan
        </Button>
      )}

      <Table
        columns={pelatihanColumns}
        dataSource={pelatihanData}
        rowKey="id"
        bordered
        loading={loading}
      />

      <Modal
        open={summaryModalVisible}
        title={`Detail Penilaian: ${selectedSummary?.nama_pelatihan}`}
        footer={null}
        onCancel={() => setSummaryModalVisible(false)}
        width={800}
      >
        {selectedSummary && (
          <Table<Penilaian>
            dataSource={[...selectedSummary.scores].sort((a, b) => b.skor - a.skor)}
            rowKey="id"
            pagination={false}
            bordered
            // ————————— expandable untuk collapse/expand per baris —————————
            expandable={{
              // untuk tiap baris peserta, tampilkan detail perhitungan:
              expandedRowRender: (score) => {
                let parsed = score.perhitungan;

                // Tambahan: jika backend kirim string JSON, parse dulu
                if (typeof parsed === "string") {
                  try {
                    parsed = JSON.parse(parsed);
                  } catch (e) {
                    console.error("Gagal parse perhitungan JSON:", e);
                    parsed = {};
                  }
                }

                const details = Object.entries(parsed).map(([komp, val]) => ({
                  komp,
                  val: Number(val), // pastikan nilainya number
                }));


                return (
                  <Table
                    dataSource={details}
                    rowKey="komp"
                    pagination={false}
                    size="small"
                    bordered
                    columns={[
                      {
                        title: "Komponen",
                        dataIndex: "komp",
                        key: "komp",
                      },
                      {
                        title: "Nilai",
                        dataIndex: "val",
                        key: "val",
                        // 🔄 ganti render kolom "Nilai" di expandable <Table>:
                        render: (v: any) => `${toFixedSafe(v)}%`
                        ,
                      },
                    ]}
                  />
                );
              },
              // selalu boleh di-expand
              rowExpandable: () => true,
            }}
            // ————————— kolom utama peserta —————————
            columns={[
              {
                title: "Nama Pegawai",
                dataIndex: "nama",
                key: "nama",
              },
              {
                title: "Skor (%)",
                dataIndex: "skor",
                key: "skor",
                render: (v: any) => `${toFixedSafe(v)}%`

              },
              {
                title: "Keterangan",
                dataIndex: "keterangan",
                key: "keterangan",
              },
            ]}
          />
        )}
      </Modal>

      {/* Modal Penilaian */}
      <Modal
        open={isPenilaianModalVisible}
        title={editingPenilaian ? "Edit Penilaian" : "Tambah Penilaian"}
        onOk={handlePenilaianSubmit}
        onCancel={() => setPenilaianModalVisible(false)}
        okText="Simpan"
      >
        <Form layout="vertical" form={penilaianForm}>
          <Form.Item
            name="user_id"
            label="Pegawai"
            rules={[{ required: true }]}
          >
            <Select placeholder="Pilih Pegawai">
              {pegawaiData.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.nama}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="pelatihan_id"
            label="Pelatihan"
            rules={[{ required: true }]}
          >
            <Select placeholder="Pilih Pelatihan">
              {pelatihanData.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.nama_pelatihan}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="skor"
            label="Skor (%)"
            rules={[{ required: true }]}
          >
            <Input type="number" min={0} max={100} />
          </Form.Item>

          <Form.Item name="keterangan" label="Keterangan">
            <Input.TextArea />
          </Form.Item>
        </Form>

      </Modal>

      {/* Modal Tambah Pelatihan dan Edit Pelatihan */}
      <Modal
        open={isPelatihanModalVisible}
        title={editingPelatihan ? "Edit Pelatihan" : "Tambah Pelatihan"}
        onOk={handlePelatihanSubmit}
        onCancel={() => setPelatihanModalVisible(false)}
        okText="Simpan"
      >
        <Form layout="vertical" form={pelatihanForm}>
          <Form.Item
            name="nama_pelatihan"
            label="Nama Pelatihan"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="tanggal"
            label="Tanggal"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          {/* <Form.Item name="deskripsi" label="Deskripsi">
            <Input.TextArea />
          </Form.Item> */}
          {/* <Form.Item name="syarat" label="Syarat">
            <Input />
          </Form.Item> */}
          {/* <Form.Item name="kualifikasi" label="Kualifikasi">
            <Input />
          </Form.Item> */}
          <Form.Item
            name="peserta"
            label="Peserta (Array ID)"
            rules={[{ required: true, message: "Pilih peserta pelatihan" }]}
          >
            <Select
              mode="multiple"
              placeholder="Pilih peserta dari daftar pegawai"
              optionLabelProp="label"
              showSearch
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }

            >
              {pegawaiData
                .filter((p) => p.role === "pegawai") // pastikan filter role
                .map((p) => (
                  <Select.Option key={p.id} value={p.id} label={p.nama}>
                    {p.nama} — {p.jabatan ?? p.posisi}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item name="b_group" label="Kriteria B (b1–b5)">
            <Checkbox.Group>
              <Space>
                <Checkbox value="b1">b1</Checkbox>
                <Checkbox value="b2">b2</Checkbox>
                <Checkbox value="b3">b3</Checkbox>
                <Checkbox value="b4">b4</Checkbox>
                <Checkbox value="b5">b5</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>
          {/*  */}
          <Form.Item name="a_group" label="Kriteria A (a1–a5)">
            <Checkbox.Group>
              <Space>
                <Checkbox value="a1">a1</Checkbox>
                <Checkbox value="a2">a2</Checkbox>
                <Checkbox value="a3">a3</Checkbox>
                <Checkbox value="a4">a4</Checkbox>
                <Checkbox value="a5">a5</Checkbox>
              </Space>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item name="sertifikasi" label="Sertifikasi">
            <Switch />
          </Form.Item>
          <Form.Item name="ikut_pelatihan" label="Ikut Pelatihan">
            <Switch />
          </Form.Item>
          <Form.Item
            name="pendidikan_terakhir"
            label="Pendidikan Terakhir"
            rules={[{ required: true, message: 'Pilih pendidikan terakhir' }]}
          >
            <Select placeholder="Pilih pendidikan">
              <Select.Option value="SMA">SMA</Select.Option>
              <Select.Option value="D3">D3</Select.Option>
              <Select.Option value="S1">S1</Select.Option>
              <Select.Option value="S2">S2</Select.Option>
              <Select.Option value="NERS">NERS</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="jurusan" label="Jurusan">
            <Select showSearch>
              {[
                "Akademi Perawat",
                "Akademi Perawat Umum",
                "D. III Keperawatan",
                "D.III Administrasi Niaga",
                "D.III Akuntansi",
                "D.III Kebidanan",
                "D.III Perawat",
                "D.III Perawat Umum",
                "D.IV Kebidanan",
                "Magister Keperawatan",
                "Ners",
                "S.1 Akuntansi",
                "S.1 Ekonomi Akuntansi",
                "S.1 Ilmu Komputer",
                "S.1 Keperawatan",
                "S.1 Kesehatan Masyarakat",
                "S.1 Sosial Ekonomi Pertanian",
                "S.2 Biomedik",
                "S.2 Spesialis Keperawatan Anak",
                "S1 Kesehatan Masyarakat",
                "S1 Manajemen",
                "SMA / Sederajat",
                "SMK",
                "Sekolah Menengah Atas"
              ].map((jur) => (
                <Select.Option key={jur} value={jur}>
                  {jur}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="posisi"
            label="Posisi"
            rules={[{ required: true, message: "Pilih posisi" }]}
          >
            <Select showSearch placeholder="Pilih posisi/jabatan">
              {[
                "Administrasi",
                "Analis Data dan Informasi",
                "Arsiparis / Pranata Kearsipan",
                "Bidan Ahli Muda",
                "Bidan Terampil",
                "Pengelola Kebidanan",
                "Pengelola Keperawatan",
                "Perawat Ahli",
                "Perawat Ahli Madya",
                "Perawat Ahli Muda",
                "Perawat Ahli Pertama",
                "Perawat Mahir",
                "Perawat Penyelia",
                "Perawat Terampil",
                "Pramubakti",
                "Pramubakti Portir",
                "Sanitasi Lingkungan",
                "Terapis Wicara",
                "Tenaga Teknis Kefarmasian"
              ].map((pos) => (
                <Select.Option key={pos} value={pos}>
                  {pos}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="max_umur" label="Max Umur">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Peserta */}
      <Modal
        visible={isPesertaModalVisible}
        title="Daftar Peserta"
        footer={null}
        onCancel={() => setPesertaModalVisible(false)}
        width={800}
      >
        <Table
          dataSource={selectedPeserta}
          rowKey="id"
          pagination={false}
          bordered
          columns={[
            { title: "ID", dataIndex: "id", key: "id" },
            { title: "Nama", dataIndex: "nama", key: "nama" },
            { title: "Jurusan", dataIndex: "jurusan", key: "jurusan" },
            {
              title: "Pendidikan",
              dataIndex: "pendidikan_terakhir",
              key: "pendidikan_terakhir",
            },
            { title: "Posisi", dataIndex: "posisi", key: "posisi" },
            { title: "Umur", dataIndex: "umur", key: "umur" },
          ]}
        />

      </Modal>

      <Modal
        open={detailVisible}
        title="Detail Penilaian Fuzzy Tsukamoto"
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {/* Modal Summary Detail */}

        {selectedDetail && (
          <div>
            <p><b>Nama:</b> {selectedDetail.nama}</p>
            <p><b>Pelatihan:</b> {selectedDetail.pelatihan?.nama_pelatihan}</p>
            <p><b>Tanggal Penilaian:</b> {selectedDetail.tanggal_penilaian}</p>
            <p><b>Skor:</b> {selectedDetail.skor} ({selectedDetail.keterangan})</p>

            <br />
            <Title level={5}>Rincian Peserta:</Title>
            <ul>
              <li><b>Nama:</b> {selectedDetail.user?.nama}</li>
              <li><b>Email:</b> {selectedDetail.user?.email}</li>
              <li><b>Jurusan:</b> {selectedDetail.user?.jurusan}</li>
              <li><b>Pendidikan:</b> {selectedDetail.user?.pendidikan_terakhir}</li>
              <li><b>Umur:</b> {selectedDetail.user?.umur}</li>
              <li><b>Posisi:</b> {selectedDetail.user?.posisi}</li>
              <li><b>Jabatan:</b> {selectedDetail.user?.jabatan}</li>
            </ul>

            <br />
            <Title level={5}>Rincian Perhitungan:</Title>
            <ul>
              {selectedDetail?.perhitungan && typeof selectedDetail.perhitungan === 'object'
                ? Object.entries(selectedDetail.perhitungan).map(([label, value]) => {
                  const num = Number(value);
                  return (
                    <li key={label}>
                      <b>{label}</b>: {isFinite(num) ? num.toFixed(4) : "0.0000"}
                    </li>
                  );
                })
                : <li><i>Perhitungan tidak tersedia</i></li>}
            </ul>

          </div>
        )}

      </Modal>
    </div>
  );
}
