import React, { useState } from 'react'
import {
  Card, Form, Input, InputNumber, Switch, Select, Button,
  Space, Typography, Divider, message, Tag
} from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'

const { Text, Title } = Typography
const { Option } = Select
const { TextArea } = Input

const Settings: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      message.success('设置已保存（模拟）')
      setLoading(false)
    }, 800)
  }

  const handleReset = () => {
    form.resetFields()
    message.info('已重置为默认值')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ color: '#e6edf3', margin: 0 }}>系统设置</Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>
            保存配置
          </Button>
        </Space>
      </div>

      {/* 预算策略 */}
      <Card
        title={<Text style={{ color: '#e6edf3' }}>预算策略</Text>}
        size="small" style={{ background: '#161b22', border: '1px solid #30363d', marginBottom: 12 }}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="日预算上限 (Token)" initialValue={10000000} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="周预算上限 (Token)" initialValue={50000000} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="月预算上限 (Token)" initialValue={200000000} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item label="超预算后行为" initialValue="warn">
            <Select style={{ width: 300 }}>
              <Option value="warn">仅告警</Option>
              <Option value="degrade">降级到 Tier-1</Option>
              <Option value="block">阻止请求</Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      {/* 重试策略 */}
      <Card
        title={<Text style={{ color: '#e6edf3' }}>重试策略</Text>}
        size="small" style={{ background: '#161b22', border: '1px solid #30363d', marginBottom: 12 }}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="最大重试次数" initialValue={3} style={{ flex: 1 }}>
              <InputNumber min={0} max={5} />
            </Form.Item>
            <Form.Item label="基础退避时间 (ms)" initialValue={500} style={{ flex: 1 }}>
              <InputNumber min={100} step={100} />
            </Form.Item>
            <Form.Item label="退避倍率" initialValue={2} style={{ flex: 1 }}>
              <InputNumber min={1} max={5} step={0.5} />
            </Form.Item>
            <Form.Item label="Jitter 范围 (%)" initialValue={20} style={{ flex: 1 }}>
              <InputNumber min={0} max={50} />
            </Form.Item>
          </Space>
          <Form.Item label="幂等保护（写操作禁止自动重试）" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Card>

      {/* 隐私配置 */}
      <Card
        title={<Text style={{ color: '#e6edf3' }}>隐私与内容存储</Text>}
        size="small" style={{ background: '#161b22', border: '1px solid #30363d', marginBottom: 12 }}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }}>
            <Form.Item label="内容存储保留期（天）" initialValue={30} style={{ flex: 1 }}>
              <InputNumber min={1} max={365} />
            </Form.Item>
            <Form.Item label="日志保留期（天）" initialValue={90} style={{ flex: 1 }}>
              <InputNumber min={1} max={365} />
            </Form.Item>
          </Space>
          <Form.Item label="PII 脱敏处理" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item label="敏感内容模式（关键词）" initialValue="password,secret,key,token,密钥">
            <TextArea placeholder="敏感词列表，逗号分隔" rows={2} />
          </Form.Item>
          <Form.Item label="PII 检测规则">
            <TextArea
              defaultValue="密码相关: pwd|pass|密码\n银行卡: \d{16,19}\n身份证: \d{17}[\dXx]"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Card>

      {/* Provider 配置 */}
      <Card
        title={<Text style={{ color: '#e6edf3' }}>Provider 配置</Text>}
        size="small" style={{ background: '#161b22', border: '1px solid #30363d', marginBottom: 12 }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="OpenAI">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input.Password placeholder="API Key" />
              <Input placeholder="Base URL（可选，自定义端点）" />
              <Space>
                <Switch defaultChecked /> <Text type="secondary">启用</Text>
              </Space>
            </Space>
          </Form.Item>
          <Divider style={{ borderColor: '#30363d' }} />
          <Form.Item label="Anthropic">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input.Password placeholder="API Key" />
              <Space>
                <Switch defaultChecked /> <Text type="secondary">启用</Text>
              </Space>
            </Space>
          </Form.Item>
          <Divider style={{ borderColor: '#30363d' }} />
          <Form.Item label="阿里云">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input.Password placeholder="API Key" />
              <Space>
                <Switch defaultChecked /> <Text type="secondary">启用</Text>
              </Space>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 高级路由策略 */}
      <Card
        title={<Text style={{ color: '#e6edf3' }}>高级路由策略</Text>}
        size="small" style={{ background: '#161b22', border: '1px solid #30363d', marginBottom: 12 }}
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} align="start">
            <Form.Item label="成本权重 (%)" initialValue={30} style={{ flex: 1 }}>
              <InputNumber min={0} max={100} />
            </Form.Item>
            <Form.Item label="质量权重 (%)" initialValue={60} style={{ flex: 1 }}>
              <InputNumber min={0} max={100} />
            </Form.Item>
            <Form.Item label="可靠性权重 (%)" initialValue={10} style={{ flex: 1 }}>
              <InputNumber min={0} max={100} />
            </Form.Item>
          </Space>
          <Form.Item label="默认 Tier（规则无法判断时）" initialValue={2}>
            <Select style={{ width: 200 }}>
              <Option value={1}>Tier-1 轻量</Option>
              <Option value={2}>Tier-2 标准</Option>
              <Option value={3}>Tier-3 重型</Option>
            </Select>
          </Form.Item>
          <Form.Item label="开启成本感知调度" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item label="开启强化学习自适应" valuePropName="checked" initialValue={false}>
            <Switch />
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default Settings
