import React, { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Row, Col, Card, Statistic, Progress, Table, Tag, Space, Typography } from 'antd'
import {
  ThunderboltOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  RiseOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { fetchDashboardSummary, fetchTrend } from '../api/client'

const { Title, Text } = Typography

const TierDot: React.FC<{ tier: number }> = ({ tier }) => {
  const colors = ['#3fb950', '#d29922', '#f85149']
  return <span style={{ color: colors[tier - 1], fontWeight: 700 }}>Tier-{tier}</span>
}

const formatToken = (n: number | null | undefined): string => {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

const Dashboard: React.FC = () => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
    refetchInterval: 30000,
  })

  const { data: trend } = useQuery({
    queryKey: ['dashboard-trend', 7],
    queryFn: () => fetchTrend(7),
    refetchInterval: 60000,
  })

  const trendOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', backgroundColor: '#161b22', borderColor: '#30363d' },
    legend: {
      data: ['Token 消耗', '请求数'],
      textStyle: { color: '#8b949e' }
    },
    xAxis: {
      type: 'category',
      data: trend?.dates || [],
      axisLine: { lineStyle: { color: '#30363d' } },
      axisLabel: { color: '#8b949e' },
    },
    yAxis: [
      {
        type: 'value', name: 'Token',
        axisLine: { lineStyle: { color: '#30363d' } },
        axisLabel: { color: '#8b949e', formatter: (v: number) => formatToken(v) },
        splitLine: { lineStyle: { color: '#21262d' } },
      },
      {
        type: 'value', name: '请求',
        axisLine: { lineStyle: { color: '#30363d' } },
        axisLabel: { color: '#8b949e' },
        splitLine: { show: false },
      }
    ],
    series: [
      {
        name: 'Token 消耗',
        type: 'bar',
        data: trend?.tokenCounts || [],
        itemStyle: { color: '#00d4aa', borderRadius: [4, 4, 0, 0] },
        barWidth: '50%',
      },
      {
        name: '请求数',
        type: 'line',
        yAxisIndex: 1,
        data: trend?.requestCounts || [],
        smooth: true,
        lineStyle: { color: '#58a6ff', width: 2 },
        symbol: 'circle',
        symbolSize: 6,
        itemStyle: { color: '#58a6ff' },
      }
    ],
    grid: { left: 60, right: 20, top: 40, bottom: 40 }
  }

  const tierDistOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#161b22', borderColor: '#30363d' },
    legend: { orient: 'vertical', right: 20, top: 'center', textStyle: { color: '#8b949e' } },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['35%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#0d1117', borderWidth: 3 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#e6edf3' } },
      data: [
        { value: summary?.tierDistribution?.['Tier-1'] || 0, name: 'Tier-1 轻量', itemStyle: { color: '#3fb950' } },
        { value: summary?.tierDistribution?.['Tier-2'] || 0, name: 'Tier-2 标准', itemStyle: { color: '#d29922' } },
        { value: summary?.tierDistribution?.['Tier-3'] || 0, name: 'Tier-3 重型', itemStyle: { color: '#f85149' } },
      ]
    }]
  }

  const modelRankingData = (summary?.modelRanking || []).map((item: any, idx: number) => ({
    ...item,
    key: idx,
    cost: item.cost ? `$${Number(item.cost).toFixed(4)}` : '$0.0000'
  }))

  const modelColumns = [
    { title: '#', dataIndex: 'key', width: 50, render: (_: any, __: any, i: number) => i + 1 },
    { title: '模型', dataIndex: 'displayName', render: (v: string) => <Text style={{ color: '#58a6ff' }}>{v}</Text> },
    { title: 'Token 消耗', dataIndex: 'totalTokens', render: (v: number) => formatToken(v) },
    { title: '费用', dataIndex: 'cost' },
  ]

  const budget = summary?.budgetStatus || {}

  return (
    <div>
      <Title level={3} style={{ color: '#e6edf3', marginBottom: 20 }}>
        看板总览
        <span style={{ fontSize: 13, color: '#8b949e', marginLeft: 12 }}>
          {dayjs().format('YYYY-MM-DD HH:mm:ss')}
        </span>
      </Title>

      {/* 核心指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ background: '#161b22', border: '1px solid #30363d' }}>
            <Statistic
              title={<Text style={{ color: '#8b949e' }}>今日 Token 消耗</Text>}
              value={formatToken(summary?.totalTokensToday)}
              prefix={<ThunderboltOutlined style={{ color: '#00d4aa' }} />}
              valueStyle={{ color: '#00d4aa', fontSize: 22 }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ background: '#161b22', border: '1px solid #30363d' }}>
            <Statistic
              title={<Text style={{ color: '#8b949e' }}>本周 Token 消耗</Text>}
              value={formatToken(summary?.totalTokensWeek)}
              prefix={<RiseOutlined style={{ color: '#58a6ff' }} />}
              valueStyle={{ color: '#58a6ff', fontSize: 22 }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ background: '#161b22', border: '1px solid #30363d' }}>
            <Statistic
              title={<Text style={{ color: '#8b949e' }}>今日请求数</Text>}
              value={summary?.requestCountToday || 0}
              prefix={<ClockCircleOutlined style={{ color: '#d29922' }} />}
              valueStyle={{ color: '#d29922', fontSize: 22 }}
              loading={isLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small" style={{ background: '#161b22', border: '1px solid #30363d' }}>
            <Statistic
              title={<Text style={{ color: '#8b949e' }}>失败率</Text>}
              value={summary?.failRate?.toFixed(2) + '%' || '0%'}
              prefix={summary?.failRate > 5
                ? <WarningOutlined style={{ color: '#f85149' }} />
                : <CheckCircleOutlined style={{ color: '#3fb950' }} />}
              valueStyle={{ color: summary?.failRate > 5 ? '#f85149' : '#3fb950', fontSize: 22 }}
              loading={isLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            size="small" title={<Text style={{ color: '#e6edf3' }}>Token 消耗趋势（7天）</Text>}
            style={{ background: '#161b22', border: '1px solid #30363d' }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            size="small" title={<Text style={{ color: '#e6edf3' }}>Tier 分布</Text>}
            style={{ background: '#161b22', border: '1px solid #30363d' }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <ReactECharts option={tierDistOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      {/* 预算 + 模型排行 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            size="small" title={<Text style={{ color: '#e6edf3' }}>预算消耗</Text>}
            style={{ background: '#161b22', border: '1px solid #30363d' }}
          >
            <div style={{ marginBottom: 20 }}>
              <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                <Text style={{ color: '#8b949e' }}>日预算</Text>
                <Text style={{ color: '#e6edf3' }}>
                  {formatToken(budget.dailyUsed)} / {formatToken(budget.dailyLimit)}
                </Text>
              </Space>
              <Progress
                percent={Math.min(100, budget.dailyPercent || 0)}
                strokeColor={budget.dailyPercent > 80 ? '#f85149' : '#00d4aa'}
                trailColor="#21262d"
                showInfo={false}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 4 }}>
                <Text style={{ color: '#8b949e' }}>周预算</Text>
                <Text style={{ color: '#e6edf3' }}>
                  {formatToken(budget.weeklyUsed)} / {formatToken(budget.weeklyLimit)}
                </Text>
              </Space>
              <Progress
                percent={Math.min(100, budget.weeklyPercent || 0)}
                strokeColor={budget.weeklyPercent > 80 ? '#d29922' : '#58a6ff'}
                trailColor="#21262d"
                showInfo={false}
              />
            </div>
            <div>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text style={{ color: '#8b949e' }}>活跃会话</Text>
                <Text style={{ color: '#00d4aa' }}>{summary?.activeSessions || 0}</Text>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card
            size="small" title={<Text style={{ color: '#e6edf3' }}>模型消耗排行 Top 10</Text>}
            style={{ background: '#161b22', border: '1px solid #30363d' }}
          >
            <Table
              size="small"
              dataSource={modelRankingData}
              columns={modelColumns}
              pagination={false}
              style={{ background: 'transparent' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
