import { useState, useEffect } from 'react';
import { Table, Spin } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  ShoppingOutlined,
  ArrowUpOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CarOutlined,
  CloseCircleOutlined,
  FileDoneOutlined,
} from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
}

interface Order {
  id: number;
  receiverName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const statusDot: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: '#fffbe6', text: '#d48806', dot: '#faad14' },
  confirmed: { bg: '#e6f4ff', text: '#0958d9', dot: '#1677ff' },
  shipping: { bg: '#e6fffb', text: '#08979c', dot: '#13c2c2' },
  completed: { bg: '#f6ffed', text: '#389e0d', dot: '#52c41a' },
  cancelled: { bg: '#fff1f0', text: '#cf1322', dot: '#ff4d4f' },
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <ClockCircleOutlined />,
  confirmed: <CheckCircleOutlined />,
  shipping: <CarOutlined />,
  completed: <FileDoneOutlined />,
  cancelled: <CloseCircleOutlined />,
};

function StatusBadge({ status }: { status: string }) {
  const s = statusDot[status] || statusDot.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: s.bg,
        color: s.text,
        padding: '4px 12px',
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: s.dot,
          display: 'inline-block',
        }}
      />
      {statusLabels[status]}
    </span>
  );
}

export default function DashboardPage() {
  const [statistics, setStatistics] = useState<OrderStatistics | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes, usersRes, productsRes] =
          await Promise.all([
            axiosClient.get('/orders/statistics'),
            axiosClient.get('/orders'),
            axiosClient.get('/users'),
            axiosClient.get('/products'),
          ]);

        setStatistics(statsRes.data);
        setRecentOrders(ordersRes.data.slice(0, 5));
        setTotalUsers(usersRes.data.length);
        setTotalProducts(productsRes.data.length);
      } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const orderColumns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => (
        <span style={{ fontWeight: 700, color: '#1677ff' }}>#{id}</span>
      ),
    },
    {
      title: 'Người nhận',
      dataIndex: 'receiverName',
      key: 'receiverName',
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: '#262626' }}>{name}</span>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => (
        <span style={{ color: '#f5222d', fontWeight: 700 }}>
          {Number(amount).toLocaleString('vi-VN')}đ
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span style={{ color: '#595959' }}>
          {new Date(date).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Tổng đơn hàng',
      value: (statistics?.totalOrders || 0).toLocaleString('vi-VN'),
      icon: <ShoppingCartOutlined />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #1677ff 100%)',
      shadow: 'rgba(22,119,255,0.35)',
    },
    {
      label: 'Doanh thu',
      value: `${(statistics?.totalRevenue || 0).toLocaleString('vi-VN')}đ`,
      icon: <DollarOutlined />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #2bb673 100%)',
      shadow: 'rgba(43,182,115,0.35)',
    },
    {
      label: 'Tổng sản phẩm',
      value: totalProducts.toLocaleString('vi-VN'),
      icon: <ShoppingOutlined />,
      gradient: 'linear-gradient(135deg, #a78bfa 0%, #722ed1 100%)',
      shadow: 'rgba(114,46,209,0.35)',
    },
    {
      label: 'Tổng người dùng',
      value: totalUsers.toLocaleString('vi-VN'),
      icon: <UserOutlined />,
      gradient: 'linear-gradient(135deg, #ffb347 0%, #fa8c16 100%)',
      shadow: 'rgba(250,140,22,0.35)',
    },
  ];

  const statusOrder = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
  const byStatus = statistics?.ordersByStatus || {};

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1a1a1a' }}>
          Dashboard
        </h2>
        <p style={{ margin: '4px 0 0', color: '#8c8c8c', fontSize: 14 }}>
          Tổng quan hoạt động cửa hàng Halona Fruits
        </p>
      </div>

      {/* ── THẺ THỐNG KÊ GRADIENT ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: card.gradient,
              borderRadius: 18,
              padding: '22px 24px',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 8px 24px ${card.shadow}`,
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* Bong bóng trang trí */}
            <div
              style={{
                position: 'absolute',
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                top: -40,
                right: -30,
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.10)',
                bottom: -20,
                right: 40,
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 16,
                  backdropFilter: 'blur(4px)',
                }}
              >
                {card.icon}
              </div>
              <div
                style={{
                  fontSize: 14,
                  opacity: 0.9,
                  marginBottom: 6,
                  fontWeight: 500,
                }}
              >
                {card.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── PHÂN TÍCH TRẠNG THÁI ĐƠN HÀNG ── */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          padding: 22,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#262626',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ArrowUpOutlined style={{ color: '#1677ff' }} />
          Phân tích đơn hàng theo trạng thái
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 14,
          }}
        >
          {statusOrder.map((status) => {
            const s = statusDot[status];
            const count = byStatus[status] || 0;
            return (
              <div
                key={status}
                style={{
                  background: s.bg,
                  borderRadius: 14,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: '#fff',
                    color: s.dot,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                    boxShadow: `0 2px 8px ${s.bg}`,
                  }}
                >
                  {statusIcons[status]}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: s.text,
                      lineHeight: 1,
                    }}
                  >
                    {count}
                  </div>
                  <div style={{ fontSize: 12, color: s.text, opacity: 0.85, marginTop: 4 }}>
                    {statusLabels[status]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ĐƠN HÀNG GẦN ĐÂY ── */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          padding: 22,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#262626',
            marginBottom: 18,
          }}
        >
          Đơn hàng gần đây
        </div>
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
          rowClassName={() => 'dash-row'}
        />
      </div>

      <style>{`
        .dash-row > td { padding-top: 16px !important; padding-bottom: 16px !important; }
        .ant-table-thead > tr > th {
          background: #fafafa !important;
          color: #595959 !important;
          font-weight: 700 !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .dash-row:hover > td { background: #fafffe !important; }
      `}</style>
    </div>
  );
}