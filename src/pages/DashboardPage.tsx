import { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  UserOutlined,
  ShoppingOutlined,
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

const statusColors: Record<string, string> = {
  pending: 'gold',
  confirmed: 'blue',
  shipping: 'cyan',
  completed: 'green',
  cancelled: 'red',
};

const statusLabels: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

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
      render: (id: number) => `#${id}`,
    },
    {
      title: 'Người nhận',
      dataIndex: 'receiverName',
      key: 'receiverName',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) =>
        Number(amount).toLocaleString('vi-VN') + 'đ',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) =>
        new Date(date).toLocaleDateString('vi-VN'),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <h2>Dashboard</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đơn hàng"
              value={statistics?.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu"
              value={statistics?.totalRevenue || 0}
              prefix={<DollarOutlined />}
              suffix="đ"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng sản phẩm"
              value={totalProducts}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={totalUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Đơn hàng gần đây">
        <Table
          columns={orderColumns}
          dataSource={recentOrders}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
}