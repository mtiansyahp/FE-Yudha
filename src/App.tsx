// src/App.tsx
import React from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import AppRoutes from './routes/AppRoutes';

const { Header, Sider, Content } = Layout;

function App() {
  const location = useLocation();

  // Jika di /login, render hanya AppRoutes (yang akan menampilkan <Login />)
  if (location.pathname === '/login') {
    return <AppRoutes />;
  }

  // Selain itu, render layout dengan Sidebar + Navbar
  return (
    <Layout style={{ minHeight: '100vh' }}>
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
    </Layout>
  );
}

export default App;
