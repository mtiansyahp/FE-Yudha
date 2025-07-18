import React, { useEffect, useState } from "react";
import {
  Table,
  Typography,
  Tag,
  Card,
  Row,
  Col,
  Button,
  Space,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  Checkbox,
  Radio,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title } = Typography;
const { Option } = Select;

interface Pegawai {
  id: number;
  nama: string;
  email: string;
  posisi: string;
  password?: string;
  jurusan?: string;
  pendidikan_terakhir?: string;
  umur?: number;
  nilai?: number;
  sertifikasi: number;
  ikut_pelatihan: number;
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
  // statusAkun: "Aktif" | "Tidak Aktif";

  tempat_lahir?: string;
  tanggal_lahir?: string;
  no_telepon?: string;
  jabatan?: string;
}

const ManajemenUser: React.FC = () => {
  const [data, setData] = useState<Pegawai[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPegawai, setEditingPegawai] = useState<Pegawai | null>(null);
  const [form] = Form.useForm();
  const [filterText, setFilterText] = useState("");
  const [filterPosisi, setFilterPosisi] = useState("");


  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/users");
      // const formatted = res.data.map((item: any) => ({
      //   ...item,
      //   statusAkun: item.sertifikasi ? "Aktif" : "Tidak Aktif",
      // }));
      setData(res.data);
    } catch (err) {
      message.error("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/api/users/${id}`);
      message.success("Data dihapus");
      fetchData();
    } catch {
      message.error("Gagal hapus data");
    }
  };

  const showModal = (record?: Pegawai) => {
    setEditingPegawai(record || null);
    if (record) {
      form.setFieldsValue({
        ...record,
        b1: record.b1 === 1,
        b2: record.b2 === 1,
        b3: record.b3 === 1,
        b4: record.b4 === 1,
        b5: record.b5 === 1,
        a1: record.a1 === 1,
        a2: record.a2 === 1,
        a3: record.a3 === 1,
        a4: record.a4 === 1,
        a5: record.a5 === 1,
        sertifikasi: record.sertifikasi === 1,
        ikut_pelatihan: record.ikut_pelatihan === 1,
      });
    }
    else form.resetFields();
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const finalValues = {
        ...values,
        password: "$2y$12$jtUrTRCto.CqrQHMihoQceA6.4DMmJPO.NlfOkQY4UBG8m8nD3ifC",
        // sertifikasi: values.sertifikasi || 0,
        b1: values.b1 ? 1 : 0,
        b2: values.b2 ? 1 : 0,
        b3: values.b3 ? 1 : 0,
        b4: values.b4 ? 1 : 0,
        b5: values.b5 ? 1 : 0,
        a1: values.a1 ? 1 : 0,
        a2: values.a2 ? 1 : 0,
        a3: values.a3 ? 1 : 0,
        a4: values.a4 ? 1 : 0,
        a5: values.a5 ? 1 : 0,
        sertifikasi: values.sertifikasi ? 1 : 0,
        ikut_pelatihan: values.ikut_pelatihan ? 1 : 0,
      };

      if (editingPegawai) {
        await axios.put(`http://127.0.0.1:8000/api/users/${editingPegawai.id}`, {
          ...editingPegawai,
          ...finalValues,
        });
        message.success("Data diperbarui");
      } else {
        await axios.post(`http://127.0.0.1:8000/api/users`, finalValues);
        message.success("Data ditambahkan");
      }

      setIsModalVisible(false);
      fetchData();
    } catch {
      message.error("Gagal menyimpan data");
    }
  };

  const renderPelatihanTag = (label: string, value: number) =>
    value === 1 ? <Tag color="blue">{label}</Tag> : null;


  const columns = [
    {
      title: "Nama Pegawai",
      dataIndex: "nama",
      key: "nama",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Posisi",
      dataIndex: "posisi",
      key: "posisi",
    },
    {
      title: "Sertifikasi",
      dataIndex: "sertifikasi",
      key: "sertifikasi",
      render: (v: number) => (
        <Tag color={v ? "green" : "volcano"}>{v ? "Sudah" : "Belum"}</Tag>
      ),
    },
    {
      title: "Pelatihan Dasar",
      key: "pelatihanDasar",
      render: (record: Pegawai) => {
        const items = [
          { label: "B1", value: record.b1 },
          { label: "B2", value: record.b2 },
          { label: "B3", value: record.b3 },
          { label: "B4", value: record.b4 },
          { label: "B5", value: record.b5 },
        ].filter((item) => item.value === 1); // tampilkan hanya yang aktif

        return (
          <Space wrap>
            {items.map((item) => renderPelatihanTag(item.label, item.value))}
            {items.length === 0 && <span>-</span>}
          </Space>
        );
      },
    },

    {
      title: "Pelatihan Advance",
      key: "pelatihanAdvance",
      render: (record: Pegawai) => {
        const items = [
          { label: "A1", value: record.a1 },
          { label: "A2", value: record.a2 },
          { label: "A3", value: record.a3 },
          { label: "A4", value: record.a4 },
          { label: "A5", value: record.a5 },
        ].filter((item) => item.value === 1); // tampilkan hanya yang aktif

        return (
          <Space wrap>
            {items.map((item) => renderPelatihanTag(item.label, item.value))}
            {items.length === 0 && <span>-</span>}
          </Space>
        );
      },
    },

    // {
    //   title: "Status Akun",
    //   dataIndex: "statusAkun",
    //   key: "statusAkun",
    //   render: (status: string) => (
    //     <Tag color={status === "Aktif" ? "green" : "volcano"}>{status}</Tag>
    //   ),
    // },
    {
      title: "Aksi",
      key: "aksi",
      render: (_: any, record: Pegawai) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
            />
          </Tooltip>
          <Tooltip title="Hapus">
            <Popconfirm
              title="Yakin ingin menghapus?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button type="link" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredData = data.filter((item) =>
    item.nama.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div style={{ padding: 24, background: "#f5f7fb", minHeight: "100vh" }}>
      <Card style={{ borderRadius: 10 }}>
        <Row
          justify="space-between"
          align="middle"
          style={{ marginBottom: 16 }}
        >
          <Col>
            <Title level={4}>Manajemen Karyawan</Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Cari posisi"
                allowClear
                onChange={(e) => setFilterPosisi(e.target.value)}
                style={{ width: 200 }}
              />

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => showModal()}
              >
                Tambah Karyawan
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          bordered
          loading={loading}
          scroll={{ x: true }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ paddingLeft: 24 }}>
                <p>
                  <strong>Tempat Lahir:</strong> {record.tempat_lahir}
                </p>
                <p>
                  <strong>Tanggal Lahir:</strong> {record.tanggal_lahir}
                </p>
                <p>
                  <strong>Nomor Telepon:</strong> {record.no_telepon}
                </p>
                <p>
                  <strong>Jabatan:</strong> {record.jabatan}
                </p>
                <p>
                  <strong>Jurusan:</strong> {record.jurusan}
                </p>
                <p>
                  <strong>Pendidikan Terakhir:</strong>{" "}
                  {record.pendidikan_terakhir}
                </p>
                <p>
                  <strong>Umur:</strong> {record.umur}
                </p>
              </div>
            ),
          }}
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title={editingPegawai ? "Edit User" : "Tambah User"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form layout="vertical" form={form}>
          {/* Nama */}
          <Form.Item name="nama" label="Nama" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          {/* Email */}
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
            <Input />
          </Form.Item>

          {/* Posisi */}
          <Form.Item name="posisi" label="Posisi" rules={[{ required: true }]}>
            <Select placeholder="Pilih posisi">
              <Option value="IGD">IGD</Option>
              <Option value="ICU">ICU</Option>
            </Select>
          </Form.Item>

          {/* Pelatihan Dasar */}
          <Form.Item label="Pelatihan Dasar">
            <Space>
              <Form.Item name="b1" valuePropName="checked" noStyle>
                <Checkbox>B1</Checkbox>
              </Form.Item>
              <Form.Item name="b2" valuePropName="checked" noStyle>
                <Checkbox>B2</Checkbox>
              </Form.Item>
              <Form.Item name="b3" valuePropName="checked" noStyle>
                <Checkbox>B3</Checkbox>
              </Form.Item>
              <Form.Item name="b4" valuePropName="checked" noStyle>
                <Checkbox>B4</Checkbox>
              </Form.Item>
              <Form.Item name="b5" valuePropName="checked" noStyle>
                <Checkbox>B5</Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>

          {/* Pelatihan Lanjutan */}
          <Form.Item label="Pelatihan Lanjutan">
            <Space>
              <Form.Item name="a1" valuePropName="checked" noStyle>
                <Checkbox>A1</Checkbox>
              </Form.Item>
              <Form.Item name="a2" valuePropName="checked" noStyle>
                <Checkbox>A2</Checkbox>
              </Form.Item>
              <Form.Item name="a3" valuePropName="checked" noStyle>
                <Checkbox>A3</Checkbox>
              </Form.Item>
              <Form.Item name="a4" valuePropName="checked" noStyle>
                <Checkbox>A4</Checkbox>
              </Form.Item>
              <Form.Item name="a5" valuePropName="checked" noStyle>
                <Checkbox>A5</Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>

          {/* Status Akun */}
          {/* <Form.Item name="statusAkun" label="Status Akun" rules={[{ required: true }]}>
            <Select placeholder="Pilih status">
              <Option value="Aktif">Aktif</Option>
              <Option value="Tidak Aktif">Tidak Aktif</Option>
            </Select>
          </Form.Item> */}

          {/* Jurusan */}
          <Form.Item name="jurusan" label="Jurusan">
            <Select showSearch placeholder="Pilih jurusan">
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
              ].map((j) => (
                <Option key={j} value={j}>{j}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* Pendidikan Terakhir */}
          <Form.Item name="pendidikan_terakhir" label="Pendidikan Terakhir">
            <Select placeholder="Pilih pendidikan">
              <Option value="SMA">SMA</Option>
              <Option value="D3">D3</Option>
              <Option value="S1">S1</Option>
              <Option value="S2">S2</Option>
              <Option value="NERS">NERS</Option>
            </Select>
          </Form.Item>

          {/* Umur */}
          <Form.Item name="umur" label="Umur">
            <Input type="number" />
          </Form.Item>

          {/* Tempat Lahir */}
          <Form.Item name="tempat_lahir" label="Tempat Lahir">
            <Input />
          </Form.Item>

          {/* Tanggal Lahir */}
          <Form.Item name="tanggal_lahir" label="Tanggal Lahir">
            <Input type="date" />
          </Form.Item>

          {/* Sertifikasi */}
          <Form.Item name="sertifikasi" label="Sertifikasi" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={1}>Ada</Radio>
              <Radio value={0}>Tidak Ada</Radio>
            </Radio.Group>
          </Form.Item>

          {/* Sudah Pernah Ikut Pelatihan */}
          <Form.Item name="ikut_pelatihan" label="Pernah Ikut Pelatihan" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={1}>Sudah Pernah</Radio>
              <Radio value={0}>Belum Pernah</Radio>
            </Radio.Group>
          </Form.Item>

          {/* Nomor Telepon */}
          <Form.Item name="no_telepon" label="Nomor Telepon">
            <Input />
          </Form.Item>

          {/* Jabatan */}
          <Form.Item name="jabatan" label="Jabatan">
            <Select placeholder="Pilih jabatan" showSearch>
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
              ].map((j) => (
                <Option key={j} value={j}>{j}</Option>
              ))}
            </Select>
          </Form.Item>

          {/* Role */}
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="pegawai">Pegawai</Option>
            </Select>
          </Form.Item>

          {/* Password – hanya saat tambah */}
          {/* {!editingPegawai && (
            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )} */}
        </Form>

      </Modal>
    </div>
  );
};

export default ManajemenUser;
