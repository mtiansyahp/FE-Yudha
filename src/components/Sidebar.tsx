import React, { useState } from "react";
import { Menu, Button } from "antd";
import {
  DashboardOutlined,
  TableOutlined,
  UserOutlined,
  MacCommandOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

// 👇 Tipe route key yang valid
type RouteKey = "/" | "/penilaian" | "/manajemen-user" | "/admin-unit";
type Role = "admin" | "pegawai" | "atasan";

const menuMap: Record<RouteKey, { icon: React.ReactNode; label: string }> = {
  "/": { icon: <DashboardOutlined />, label: "Dashboard" },
  "/penilaian": { icon: <TableOutlined />, label: "Penilaian" },
  "/manajemen-user": { icon: <UserOutlined />, label: "Manajemen User" },
  "/admin-unit": { icon: <MacCommandOutlined />, label: "Admin Unit" },
  // "/about": { icon: <MacCommandOutlined />, label: "About" },
};

const menuAccess: Record<Role, RouteKey[]> = {
  admin: ["/", "/penilaian", "/manajemen-user", "/admin-unit"],
  pegawai: ["/"],
  atasan: ["/", "/penilaian"],
};

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const storedRole = localStorage.getItem("userRole") as Role | null;
  const role: Role = storedRole === "admin" || storedRole === "atasan" || storedRole === "pegawai"
    ? storedRole
    : "pegawai"; // default role jika tidak valid

  const allowedMenus = menuAccess[role];

  const menuItems = allowedMenus.map((key) => ({
    key,
    icon: menuMap[key].icon,
    label: menuMap[key].label,
    onClick: () => navigate(key),
  }));

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");

      if (token) {
        await axios.post("http://localhost:8000/api/logout", {}, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      localStorage.clear();
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div
      style={{
        width: collapsed ? 80 : 200,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#001529",
        transition: "width 0.2s",
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 0",
          textAlign: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <img
          src="/logo.png"
          alt="Logo"
          style={{
            width: collapsed ? 40 : 160,
            height: 40,
            objectFit: "contain",
            objectPosition: "left center",
            transition: "width 0.2s",
          }}
        />
      </div>

      {/* Menu */}
      <Menu
        theme="dark"
        mode="inline"
        inlineCollapsed={collapsed}
        selectedKeys={[location.pathname]}
        style={{ flex: 1, paddingTop: 12 }}
        items={menuItems}
      />

      {/* Logout */}
      <div
        style={{
          marginTop: "auto",
          padding: "16px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <Button
          type="primary"
          icon={<LogoutOutlined />}
          danger
          block
          onClick={handleLogout}
        >
          {!collapsed && "Logout"}
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
