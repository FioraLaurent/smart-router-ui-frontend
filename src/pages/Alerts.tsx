import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Card, Button, Modal, Form, Input, Select, InputNumber,
  Switch, Tag, Space, Typography, Popconfirm, message, Timeline
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  fetchAlertRules, createAlertRule, updateAlertRule,
  deleteAlertRule, fetchAlertHistory
} from '../api/client'

const { Text, Title } = Typography
const { Option } = Select

const metricLabels: Record<string, string> = {
  fail_rate: '失败率',
  latency_p95: 'P95 延迟',
  budget: '预算消耗',
  circuit: '熔断触发',
}

const metricUnits: Record<string, string> = {
  fail_rate: '%',
  latency_p95: 'ms',
  budget: '%',
  circuit: '次',
}

const Alerts: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['alert-rules'],
    queryFn: fetchAlertRules,
  })

  const { data: history = [] } = useQuery({
    queryKey: ['alert-history'],
    queryFn: () => fetchAlertHistory(0, 100),
    enabled: historyOpen,
  })

  const createMut = useMutation({ mutationFn: createAlertRule, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alert-rules'] }); closeModal(); message.success('创建成功') },
    onError: () => message.error('创建失败'),
  })

  const updateMut = useMutation({ mutationFn: updateAlertRule, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alert-rules'] }); closeModal(); message.success('更新成功') },
    onError: () => message.error('更新失败'),
  })

  const deleteMut = useMutation({ mutationFn: deleteAlertRule, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['alert-rules'] }); message.success('删除成功') },
    onError: () => message.error('删除失败'),
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
      if (editingId) updateMut.mutate({ id: editingId, ...values })
      else createMut.mutate(values)
    })
  }

  const ruleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      render: (v: string) => <Text style={{ color: '#e6edf3', fontWeight: 500 }}>{v}</Text>,
    },
    {
      title: '指标',
      dataIndex: 'metric',
      render: (v: string) => <Tag color="blue">{metricLabels[v] || v}</Tag>,
    },
    {
      title: '阈值',
      render: (_: any, r: any) => (
        <Text style={{ color: '#00d4aa' }}>
          {r.threshold}{metricUnits[r.metric] || ''}
        </Text>
      )
    },
    {
      title: '持续时间',
      dataIndex: 'durationMinutes',
      render: (v: number) => <Text type="secondary">{v} 分钟</Text>,
    },
    {
      title: '通知方式',
      dataIndex: 'notifyType',
      render: (v: string) => (
        <Tag color={v === 'email' ? 'green' : v === 'webhook' ? 'orange' : 'purple'}>
          {v === 'email' ? '邮件' : v === 'webhook' ? 'Webhook' : '页面'}
        </Tag>
      )
    },
    {
      title: '通知目标',
      dataIndex: 'notifyTarget',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 70,
      align: 'center' as const,
      render: (v: boolean) => v
        ? <Tag color="success">启用</Tag>
        : <Tag>禁用</Tag>
    },
    {
      title: '操作',
      width: 120,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除？" onConfirm={() => deleteMut.mutate(record.id)}
            okText="删除" okButtonProps={{ danger: true }}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ color: '#e6edf3', margin: 0 }}>告警管理</Title>
        <Space>
          <Button onClick={() => setHistoryOpen(true)}>告警历史</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            新增规则
          </Button>
        </Space>
      </div>

      <Card style={{ background: '#161b22', border: '1px solid #30363d' }}>
        <Table
          dataSource={rules}
          columns={ruleColumns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="small"
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingId ? '编辑告警规则' : '新增告警规则'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMut.isPending || updateMut.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true }]}>
            <Input placeholder="如：失败率告警" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="metric" label="监控指标" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select>
                <Option value="fail_rate">失败率 (%)</Option>
                <Option value="latency_p95">P95 延迟 (ms)</Option>
                <Option value="budget">预算消耗 (%)</Option>
                <Option value="circuit">熔断次数</Option>
              </Select>
            </Form.Item>
            <Form.Item name="threshold" label="阈值" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="durationMinutes" label="持续触发时间（分钟）" initialValue={5}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="notifyType" label="通知方式" initialValue="page" style={{ flex: 1 }}>
              <Select>
                <Option value="page">页面通知</Option>
                <Option value="email">邮件</Option>
                <Option value="webhook">Webhook</Option>
              </Select>
            </Form.Item>
            <Form.Item name="notifyTarget" label="通知目标" style={{ flex: 2 }}>
              <Input placeholder="邮箱地址或 Webhook URL" />
            </Form.Item>
          </Space>
          <Form.Item name="enabled" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 告警历史 */}
      <Modal
        title="告警历史"
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        width={700}
      >
        <Timeline
          items={history.map((h: any) => ({
            color: h.resolvedAt ? 'green' : 'red',
            children: (
              <div>
                <Space>
                  <Tag color={h.resolvedAt ? 'success' : 'error'}>
                    {h.resolvedAt ? '已恢复' : '触发中'}
                  </Tag>
                  <Text type="secondary">{dayjs(h.triggeredAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
                </Space>
                <div style={{ marginTop: 4 }}>
                  <Text>{h.message || `指标值: ${h.metricValue}`}</Text>
                </div>
              </div>
            )
          }))}
        />
      </Modal>
    </div>
  )
}

export default Alerts
