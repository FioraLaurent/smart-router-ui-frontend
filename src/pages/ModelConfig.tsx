import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Card, Button, Modal, Form, Input, InputNumber, Select,
  Switch, Tag, Space, Typography, Popconfirm, message, Badge
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ThunderboltOutlined,
  ExperimentOutlined, StopOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  fetchModels, createModel, updateModel, deleteModel,
  toggleModel, testModel, circuitBreakModel
} from '../api/client'

const { Text, Title } = Typography
const { Option } = Select

const tierColors: Record<number, string> = { 1: '#3fb950', 2: '#d29922', 3: '#f85149' }

const ModelConfig: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['models'],
    queryFn: () => fetchModels(),
  })

  const createMut = useMutation({ mutationFn: createModel, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['models'] }); closeModal(); message.success('创建成功') },
    onError: () => message.error('创建失败'),
  })

  const updateMut = useMutation({ mutationFn: updateModel, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['models'] }); closeModal(); message.success('更新成功') },
    onError: () => message.error('更新失败'),
  })

  const deleteMut = useMutation({ mutationFn: deleteModel, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['models'] }); message.success('删除成功') },
    onError: () => message.error('删除失败'),
  })

  const toggleMut = useMutation({ mutationFn: toggleModel, 
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['models'] }),
    onError: () => message.error('操作失败'),
  })

  const testMut = useMutation({ mutationFn: testModel, 
    onSuccess: (res) => message.success(`连接测试成功，延迟 ${res.latencyMs}ms`),
    onError: () => message.error('连接测试失败'),
  })

  const circuitMut = useMutation({ mutationFn: circuitBreakModel, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['models'] }); message.warning('模型已熔断') },
    onError: () => message.error('操作失败'),
  })

  const openEdit = (record: any) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    form.resetFields()
  }

  const handleSubmit = () => {
    form.validateFields().then(values => {
      if (editingId) {
        updateMut.mutate({ id: editingId, ...values })
      } else {
        createMut.mutate(values)
      }
    })
  }

  const grouped = [1, 2, 3].map(tier => ({
    tier,
    models: models.filter((m: any) => m.tier === tier),
  }))

  const columns = [
    {
      title: '状态',
      width: 80,
      render: (_: any, record: any) => (
        record.isCircuitOpen
          ? <Badge status="error" text={<Text type="danger">熔断</Text>} />
          : record.enabled
            ? <Badge status="success" text="正常" />
            : <Badge status="default" text="禁用" />
      )
    },
    {
      title: '显示名',
      dataIndex: 'displayName',
      render: (v: string, r: any) => (
        <Space>
          <Text style={{ color: '#58a6ff' }}>{v}</Text>
          {r.isCircuitOpen && <Tag color="error" icon={<StopOutlined />}>熔断</Tag>}
        </Space>
      )
    },
    {
      title: '模型 ID',
      dataIndex: 'modelId',
      render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      render: (v: string) => <Tag style={{ color: '#8b949e', borderColor: '#30363d' }}>{v}</Tag>,
    },
    {
      title: '质量',
      dataIndex: 'qualityScore',
      width: 70,
      align: 'center' as const,
      render: (v: number) => <Text style={{ color: v > 85 ? '#3fb950' : v > 70 ? '#d29922' : '#f85149' }}>{v}</Text>,
    },
    {
      title: '可靠性',
      dataIndex: 'reliabilityScore',
      width: 80,
      align: 'center' as const,
      render: (v: number) => <Text type="secondary">{v}%</Text>,
    },
    {
      title: '价格 ($/1M)',
      render: (_: any, r: any) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          in: ${Number(r.priceInput || 0).toFixed(2)} / out: ${Number(r.priceOutput || 0).toFixed(2)}
        </Text>
      )
    },
    {
      title: '上下文',
      dataIndex: 'contextWindow',
      width: 90,
      align: 'right' as const,
      render: (v: number) => <Text type="secondary">{v?.toLocaleString()}</Text>,
    },
    {
      title: '熔断计数',
      dataIndex: 'circuitBreakerCount',
      width: 90,
      align: 'center' as const,
      render: (v: number) => v > 0 ? <Tag color="warning">{v}/5</Tag> : '-',
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 70,
      align: 'center' as const,
      render: (v: boolean, record: any) => (
        <Switch size="small" checked={v}
          disabled={record.isCircuitOpen}
          onChange={() => toggleMut.mutate(record.id)} />
      )
    },
    {
      title: '操作',
      width: 160,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button type="text" size="small" icon={<ExperimentOutlined />}
            onClick={() => testMut.mutate(record.id)} loading={testMut.isPending} />
          {!record.isCircuitOpen && (
            <Popconfirm
              title="手动熔断此模型？" onConfirm={() => circuitMut.mutate(record.id)}
              okText="熔断" okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" danger icon={<ThunderboltOutlined />} />
            </Popconfirm>
          )}
          <Popconfirm
            title="确认删除？" onConfirm={() => deleteMut.mutate(record.id)}
            okText="删除" okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ color: '#e6edf3', margin: 0 }}>模型配置</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          添加模型
        </Button>
      </div>

      {grouped.map(({ tier, models: tierModels }) => (
        <Card
          key={tier} size="small"
          title={<span style={{ color: tierColors[tier], fontWeight: 700 }}>
            Tier-{tier} {tier === 1 ? '轻量模型' : tier === 2 ? '标准模型' : '重型模型'}
            <Tag style={{ marginLeft: 8, color: '#8b949e', borderColor: '#30363d' }}>
              {tierModels.length} 个
            </Tag>
          </span>}
          style={{ background: '#161b22', border: '1px solid #30363d', marginBottom: 12 }}
          styles={{ header: { borderBottom: `1px solid ${tierColors[tier]}33` } }}
        >
          <Table
            dataSource={tierModels}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            size="small"
          />
        </Card>
      ))}

      <Modal
        title={editingId ? '编辑模型' : '添加模型'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMut.isPending || updateMut.isPending}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }}>
            <Form.Item name="modelId" label="模型 ID" rules={[{ required: true }]} style={{ flex: 2 }}>
              <Input placeholder="如: gpt-4o-mini" />
            </Form.Item>
            <Form.Item name="displayName" label="显示名" style={{ flex: 2 }}>
              <Input placeholder="如: GPT-4o Mini" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="tier" label="Tier" rules={[{ required: true }]} initialValue={1} style={{ flex: 1 }}>
              <Select>
                <Option value={1}>Tier-1 轻量</Option>
                <Option value={2}>Tier-2 标准</Option>
                <Option value={3}>Tier-3 重型</Option>
              </Select>
            </Form.Item>
            <Form.Item name="provider" label="Provider" style={{ flex: 1 }}>
              <Select>
                <Option value="openai">OpenAI</Option>
                <Option value="anthropic">Anthropic</Option>
                <Option value="aliyun">阿里云</Option>
                <Option value="custom">自定义</Option>
              </Select>
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="priceInput" label="输入价格 ($/1M)" style={{ flex: 1 }}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="priceOutput" label="输出价格 ($/1M)" style={{ flex: 1 }}>
              <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="contextWindow" label="上下文窗口" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="maxOutput" label="最大输出" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="qualityScore" label="质量评分 (0-100)" style={{ flex: 1 }}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="reliabilityScore" label="可靠性评分 (0-100)" style={{ flex: 1 }}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ModelConfig
