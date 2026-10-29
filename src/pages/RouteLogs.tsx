import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table, Card, Input, Select, DatePicker, Space, Tag, Typography,
  Button, Drawer, Descriptions, Timeline, Spin, message
} from 'antd'
import {
  SearchOutlined, FilterOutlined, ExpandOutlined, DownloadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { fetchLogs, fetchLogById } from '../api/client'

const { Text, Title } = Typography
const { RangePicker } = DatePicker
const { Option } = Select

const formatToken = (n: number) => {
  if (!n) return '0'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

const RouteLogs: React.FC = () => {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState<any>({})
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [drawerId, setDrawerId] = useState<string | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['logs', page, pageSize, filters],
    queryFn: () => {
      const params: any = { page: page - 1, size: pageSize, ...filters }
      if (filters.from) params.from = filters.from
      if (filters.to) params.to = filters.to
      return fetchLogs(params)
    }
  })

  const { data: detail } = useQuery({
    queryKey: ['log-detail', drawerId],
    queryFn: () => fetchLogById(drawerId!),
    enabled: !!drawerId,
  })

  const columns = [
    {
      title: '时间',
      dataIndex: 'ts',
      width: 160,
      render: (ts: number) => ts ? dayjs(ts).format('MM-DD HH:mm:ss') : '-',
    },
    {
      title: '请求ID',
      dataIndex: 'requestId',
      width: 140,
      ellipsis: true,
      render: (v: string) => <Text copyable={{ text: v }} style={{ fontSize: 11 }}>{v}</Text>,
    },
    {
      title: '会话',
      dataIndex: 'sessionId',
      width: 100,
      ellipsis: true,
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      width: 70,
      render: (tier: number) => {
        const colors = { 1: '#3fb950', 2: '#d29922', 3: '#f85149' }
        return <span style={{ color: colors[tier as keyof typeof colors], fontWeight: 700 }}>
          Tier-{tier}
        </span>
      }
    },
    {
      title: '模型',
      dataIndex: 'targetModel',
      width: 150,
      render: (v: string) => <Text style={{ color: '#58a6ff' }}>{v || '-'}</Text>,
    },
    {
      title: '输入 Token',
      dataIndex: 'promptTokens',
      width: 100,
      align: 'right' as const,
      render: (v: number) => formatToken(v),
    },
    {
      title: '输出 Token',
      dataIndex: 'completionTokens',
      width: 100,
      align: 'right' as const,
      render: (v: number) => formatToken(v),
    },
    {
      title: '总 Token',
      dataIndex: 'totalTokens',
      width: 90,
      align: 'right' as const,
      render: (v: number) => <Text style={{ color: '#00d4aa' }}>{formatToken(v)}</Text>,
    },
    {
      title: '延迟 (ms)',
      dataIndex: 'latencyMs',
      width: 90,
      align: 'right' as const,
      render: (v: number) => {
        let color = '#3fb950'
        if (v > 5000) color = '#f85149'
        else if (v > 2000) color = '#d29922'
        return <Text style={{ color }}>{v}</Text>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: string) => s === 'fail'
        ? <Tag color="error">失败</Tag>
        : <Tag color="success">成功</Tag>
    },
    {
      title: '切换',
      dataIndex: 'switchedTo',
      width: 120,
      render: (v: string, row: any) => {
        if (!v) return <Text type="secondary">-</Text>
        return <Text style={{ color: '#d29922', fontSize: 11 }}>
          {row.switchedFrom} → {v}
        </Text>
      }
    },
    {
      title: '操作',
      width: 60,
      render: (_: any, row: any) => (
        <Button
          type="text" size="small"
          icon={<ExpandOutlined />}
          onClick={() => setDrawerId(row.requestId)}
        />
      )
    }
  ]

  return (
    <div>
      <Title level={3} style={{ color: '#e6edf3', marginBottom: 16 }}>路由日志</Title>

      {/* 筛选栏 */}
      <Card
        size="small" style={{ background: '#161b22', border: '1px solid #30363d', marginBottom: 12 }}
      >
        <Space wrap>
          <Select
            placeholder="Tier" allowClear style={{ width: 120 }}
            onChange={v => setFilters((f: any) => ({ ...f, tier: v }))}
          >
            <Option value={1}>Tier-1 轻量</Option>
            <Option value={2}>Tier-2 标准</Option>
            <Option value={3}>Tier-3 重型</Option>
          </Select>
          <Select
            placeholder="状态" allowClear style={{ width: 100 }}
            onChange={v => setFilters((f: any) => ({ ...f, status: v }))}
          >
            <Option value="success">成功</Option>
            <Option value="fail">失败</Option>
          </Select>
          <RangePicker
            showTime placeholder={['开始时间', '结束时间']}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                const from = dates[0].valueOf()
                const to = dates[1].valueOf()
                setFilters((f: any) => ({ ...f, from, to }))
              } else {
                setFilters((f: any) => ({ from: undefined, to: undefined, ...f }))
              }
            }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={() => refetch()}>
            查询
          </Button>
        </Space>
      </Card>

      {/* 表格 */}
      <Card size="small" style={{ background: '#161b22', border: '1px solid #30363d' }}>
        <Table
          dataSource={data?.content || []}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          expandable={{
            expandedRowKeys: expandedRow ? [expandedRow] : [],
            onExpand: (_, record) => setExpandedRow(_ ? String(record.id) : null),
            expandedRowRender: (record) => (
              <div style={{ padding: '8px 0' }}>
                <Space wrap>
                  <Text type="secondary">Agent: </Text>
                  <Text>{record.agentId || '-'}</Text>
                  <Text type="secondary">Provider: </Text>
                  <Text>{record.provider || '-'}</Text>
                  <Text type="secondary">队列等待: </Text>
                  <Text>{record.queueWaitMs}ms</Text>
                  <Text type="secondary">重试: </Text>
                  <Text>{record.retryCount}次</Text>
                  <Text type="secondary">缓存: </Text>
                  <Text>{record.cachedTokens} tokens</Text>
                  {record.failReason && (
                    <>
                      <Text type="secondary">失败原因: </Text>
                      <Tag color="error">{record.failReason}</Tag>
                    </>
                  )}
                </Space>
              </div>
            )
          }}
          pagination={{
            current: page,
            pageSize,
            total: data?.totalElements || 0,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </Card>

      {/* 详情抽屉 */}
      <Drawer
        title="请求详情"
        open={!!drawerId}
        onClose={() => setDrawerId(null)}
        width={640}
        styles={{ body: { background: '#0d1117', padding: 16 } }}
      >
        {detail ? (
          <div>
            <Descriptions size="small" column={2} bordered
              style={{ marginBottom: 16 }}
              styles={{ label: { background: '#161b22', color: '#8b949e' }, content: { background: '#0d1117', color: '#e6edf3' } }}
            >
              <Descriptions.Item label="请求ID">{detail.requestId}</Descriptions.Item>
              <Descriptions.Item label="会话ID">{detail.sessionId}</Descriptions.Item>
              <Descriptions.Item label="Tier">
                <span style={{ color: ['#3fb950','#d29922','#f85149'][(detail.tier||1)-1], fontWeight: 700 }}>
                  Tier-{detail.tier}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="模型">{detail.targetModel}</Descriptions.Item>
              <Descriptions.Item label="输入 Token">{detail.promptTokens}</Descriptions.Item>
              <Descriptions.Item label="输出 Token">{detail.completionTokens}</Descriptions.Item>
              <Descriptions.Item label="总消耗">{detail.totalTokens}</Descriptions.Item>
              <Descriptions.Item label="延迟">{detail.latencyMs}ms</Descriptions.Item>
              <Descriptions.Item label="状态">
                {detail.status === 'fail' ? <Tag color="error">失败</Tag> : <Tag color="success">成功</Tag>}
              </Descriptions.Item>
            </Descriptions>

            {detail.userMessage && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5} style={{ color: '#e6edf3' }}>用户输入</Title>
                <Card size="small" style={{ background: '#161b22', border: '1px solid #30363d' }}>
                  <Text style={{ color: '#c9d1d9', whiteSpace: 'pre-wrap' }}>
                    {detail.userMessage}
                  </Text>
                </Card>
              </div>
            )}

            {detail.assistantMessage && (
              <div>
                <Title level={5} style={{ color: '#e6edf3' }}>模型输出</Title>
                <Card size="small" style={{ background: '#161b22', border: '1px solid #30363d' }}>
                  <Text style={{ color: '#c9d1d9', whiteSpace: 'pre-wrap' }}>
                    {detail.assistantMessage}
                  </Text>
                </Card>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default RouteLogs
