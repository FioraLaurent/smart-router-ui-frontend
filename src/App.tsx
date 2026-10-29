import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  SettingOutlined,
  AlertOutlined,
  TableOutlined,
  TagsOutlined,
  ApiOutlined
} from '@ant-design/icons'
import Dashboard from './pages/Dashboard'
import RouteLogs from './pages/RouteLogs'
import KeywordRules from './pages/KeywordRules'
import ModelConfig from './pages/ModelConfig'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'

const { Sider, Content } = Layout

const App: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: '看板总览' },
    { key: '/logs', icon: <TableOutlined />, label: '路由日志' },
    { key: '/rules', icon: <TagsOutlined />, label: '关键词规则' },
    { key: '/models', icon: <ApiOutlined />, label: '模型配置' },
    { key: '/alerts', icon: <AlertOutlined />, label: '告警管理' },
    { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={220}
        style={{ background: '#0d1117', borderRight: '1px solid #30363d' }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid #30363d',
          gap: 10,
        }}>
          <ApiOutlined style={{ fontSize: 24, color: '#00d4aa' }} />
          <span style={{ color: '#e6edf3', fontWeight: 700, fontSize: 15 }}>
            Smart Router
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          theme="dark"
          style={{ background: 'transparent', border: 'none', marginTop: 8 }}
          items={items}
        />
      </Sider>
      <Layout>
        <Content style={{ padding: 24, overflow: 'auto' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/logs" element={<RouteLogs />} />
            <Route path="/rules" element={<KeywordRules />} />
            <Route path="/models" element={<ModelConfig />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App
