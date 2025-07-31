// src/App.tsx
import React from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';
import { useAuth } from './auth/AuthContext';

const { Header, Sider, Content } = Layout;

function App() {
  const location = useLocation();
  const { user } = useAuth();

  const isLoginPage = location.pathname === '/login';

  if (isLoginPage && !user) {
    return <AppRoutes />;
  }


  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Jika sedang di halaman login, tampilkan route saja */}
      {isLoginPage || !user ? (
        <Content style={{ margin: '16px' }}>
          <AppRoutes />
        </Content>
      ) : (
        <>
          <Sider collapsible>
            <Sidebar />
          </Sider>
          <Layout>
            <Header style={{ background: '#fff', padding: 0 }}>
              <Navbar />
            </Header>
            <Content style={{ margin: '16px' }}>
              <AppRoutes />
            </Content>
          </Layout>
        </>
      )}
    </Layout>
  );
}

export default App;
