import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table, Card, Button, Modal, Form, Input, Select, InputNumber,
  Switch, Tag, Space, Typography, Popconfirm, message, Tooltip
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  fetchRules, createRule, updateRule, deleteRule, toggleRule, fetchRuleHistory
} from '../api/client'

const { Text, Title } = Typography
const { Option } = Select
const { TextArea } = Input

const tierColors: Record<number, string> = { 1: '#3fb950', 2: '#d29922', 3: '#f85149' }
const tierLabels: Record<number, string> = { 1: '轻量', 2: '标准', 3: '重型' }

const KeywordRules: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [historyId, setHistoryId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: () => fetchRules(),
  })

  const { data: history = [] } = useQuery({
    queryKey: ['rule-history', historyId],
    queryFn: () => fetchRuleHistory(historyId!),
    enabled: !!historyId,
  })

  const createMut = useMutation({ mutationFn: createRule, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rules'] }); closeModal(); message.success('创建成功') },
    onError: () => message.error('创建失败'),
  })

  const updateMut = useMutation({ mutationFn: updateRule, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rules'] }); closeModal(); message.success('更新成功') },
    onError: () => message.error('更新失败'),
  })

  const deleteMut = useMutation({ mutationFn: deleteRule, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rules'] }); message.success('删除成功') },
    onError: () => message.error('删除失败'),
  })

  const toggleMut = useMutation({ mutationFn: toggleRule, 
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['rules'] }); message.success('切换成功') },
    onError: () => message.error('切换失败'),
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

  const columns = [
    {
      title: '关键词/正则',
      dataIndex: 'keyword',
      render: (v: string) => <Text code style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '目标 Tier',
      dataIndex: 'tier',
      width: 100,
      render: (tier: number) => (
        <Tag style={{ color: tierColors[tier], borderColor: tierColors[tier] }}>
          Tier-{tier} {tierLabels[tier]}
        </Tag>
      )
    },
    {
      title: '权重',
      dataIndex: 'weight',
      width: 70,
      align: 'center' as const,
      render: (v: number) => <Text style={{ color: '#8b949e' }}>{v}</Text>,
    },
    {
      title: '灰度',
      dataIndex: 'grayRatio',
      width: 80,
      align: 'center' as const,
      render: (v: number) => v > 0 ? `${v}%` : '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      render: (v: string) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 70,
      align: 'center' as const,
      render: (v: number) => <Text type="secondary">v{v}</Text>,
    },
    {
      title: '启用',
      dataIndex: 'enabled',
      width: 70,
      align: 'center' as const,
      render: (v: boolean, record: any) => (
        <Switch
          size="small" checked={v}
          onChange={() => toggleMut.mutate(record.id)}
        />
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 140,
      render: (ts: number) => ts ? dayjs(ts).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      width: 140,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Tooltip title="历史">
            <Button type="text" size="small" icon={<HistoryOutlined />}
              onClick={() => setHistoryId(record.id)} />
          </Tooltip>
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

  const groupedRules = [1, 2, 3].map(tier => ({
    tier,
    rules: rules.filter((r: any) => r.tier === tier),
  }))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ color: '#e6edf3', margin: 0 }}>关键词规则</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          新增规则
        </Button>
      </div>

      {groupedRules.map(({ tier, rules: tierRules }) => (
        <Card
          key={tier} size="small"
          title={<span style={{ color: tierColors[tier], fontWeight: 700 }}>
            Tier-{tier} {tierLabels[tier]}
            <Tag style={{ marginLeft: 8, color: '#8b949e', borderColor: '#30363d' }}>
              {tierRules.length} 条规则
            </Tag>
          </span>}
          style={{ background: '#161b22', border: '1px solid #30363d', marginBottom: 12 }}
          styles={{ header: { borderBottom: `1px solid ${tierColors[tier]}33` } }}
        >
          <Table
            dataSource={tierRules}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            size="small"
          />
        </Card>
      ))}

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingId ? '编辑规则' : '新增规则'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMut.isPending || updateMut.isPending}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="keyword" label="关键词 / 正则表达式"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <TextArea
              placeholder="如: 你好|hi 或 ^帮我.*分析$"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
          <Form.Item name="tier" label="目标 Tier" rules={[{ required: true }]}
            initialValue={1}>
            <Select>
              <Option value={1}>Tier-1 轻量模型</Option>
              <Option value={2}>Tier-2 标准模型</Option>
              <Option value={3}>Tier-3 重型模型</Option>
            </Select>
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="weight" label="权重" initialValue={5} style={{ flex: 1 }}>
              <InputNumber min={1} max={10} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="grayRatio" label="灰度比例 %" initialValue={0} style={{ flex: 1 }}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="说明">
            <Input placeholder="规则用途说明（可选）" />
          </Form.Item>
          <Form.Item name="enabled" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* 历史记录弹窗 */}
      <Modal
        title="变更历史"
        open={!!historyId}
        onCancel={() => setHistoryId(null)}
        footer={null}
        width={700}
      >
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {history.map((h: any) => (
            <Card key={h.id} size="small" style={{ background: '#161b22', marginBottom: 8 }}>
              <Space>
                <Tag color={h.action === 'DELETE' ? 'error' : h.action === 'CREATE' ? 'success' : 'processing'}>
                  {h.action}
                </Tag>
                <Text type="secondary">{dayjs(h.changedAt).format('YYYY-MM-DD HH:mm:ss')}</Text>
              </Space>
              {h.oldValue && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">旧值: </Text>
                  <pre style={{ background: '#0d1117', padding: 8, borderRadius: 4, fontSize: 11, overflowX: 'auto' }}>
                    {h.oldValue}
                  </pre>
                </div>
              )}
              {h.newValue && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary">新值: </Text>
                  <pre style={{ background: '#0d1117', padding: 8, borderRadius: 4, fontSize: 11, overflowX: 'auto' }}>
                    {h.newValue}
                  </pre>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  )
}

export default KeywordRules
