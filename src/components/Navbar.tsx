import { Typography } from 'antd';
import { useLocation } from 'react-router-dom';

const { Title } = Typography;

function Navbar() {
    const location = useLocation();
    const path = location.pathname;

    // Gunakan style tengah HANYA untuk halaman utama dashboard
    const isMainDashboard = path === '/';

    // Tentukan judul berdasarkan path
    let pageTitle = 'Dashboard Dilan'; // default
    if (!isMainDashboard) {
        if (path.includes('/admin')) {
            pageTitle = 'Dashboard Admin';
        } else if (path.includes('/pegawai')) {
            pageTitle = 'Dashboard Pegawai';
        } else if (path.includes('/atasan')) {
            pageTitle = 'Dashboard Atasan';
        } else if (path === '/login') {
            pageTitle = 'Login';
        } else {
            pageTitle = path.replace('/', '').replace(/-/g, ' ').toUpperCase();
        }
    }

    return (
        <div
            style={{
                width: '100%',
                padding: '16px 24px',
                backgroundColor: '#ffffff',
                position: 'relative',
                top: 0,
                textAlign: isMainDashboard ? 'center' : 'left',
            }}
        >

            <Title
                level={isMainDashboard ? 4 : 5}
                style={{ margin: 0 }}
            >
                {pageTitle}
            </Title>
        </div>
    );
}

export default Navbar;
