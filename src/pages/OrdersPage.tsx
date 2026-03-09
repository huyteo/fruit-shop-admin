import { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Modal,
  Select,
  Space,
  message,
  Descriptions,
  List,
  Card,
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

interface OrderItem {
  id: number;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  userId: number;
  totalAmount: number;
  shippingAddress: string;
  shippingPhone: string;
  receiverName: string;
  status: string;
  paymentMethod: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
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

const paymentLabels: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng',
  banking: 'Chuyển khoản ngân hàng',
};

const validTransitions: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['completed'],
  completed: [],
  cancelled: [],
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/orders');
      setOrders(response.data);
    } catch (error) {
      message.error('Lỗi tải đơn hàng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await axiosClient.put(`/orders/${orderId}/status`, {
        status: newStatus,
      });
      message.success(`Cập nhật trạng thái thành "${statusLabels[newStatus]}"`);
      fetchOrders();

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(
        err.response?.data?.message || 'Cập nhật trạng thái thất bại',
      );
    }
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const filteredOrders =
    filterStatus === 'all'
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <strong>#{id}</strong>,
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 180,
      render: (_: unknown, record: Order) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.receiverName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {record.shippingPhone}
          </div>
        </div>
      ),
    },
    {
      title: 'Sản phẩm',
      key: 'items',
      width: 200,
      render: (_: unknown, record: Order) => (
        <div>
          {record.items.slice(0, 2).map((item) => (
            <div key={item.id} style={{ fontSize: 13 }}>
              {item.productName} x{item.quantity}
            </div>
          ))}
          {record.items.length > 2 && (
            <div style={{ fontSize: 12, color: '#888' }}>
              +{record.items.length - 2} sản phẩm khác
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 130,
      render: (amount: number) => (
        <strong style={{ color: '#f5222d' }}>
          {Number(amount).toLocaleString('vi-VN')}đ
        </strong>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (method: string) => paymentLabels[method] || method,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      ),
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) =>
        new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      render: (_: unknown, record: Order) => {
        const nextStatuses = validTransitions[record.status] || [];

        return (
          <Space>
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetail(record)}
            >
              Chi tiết
            </Button>

            {nextStatuses.length > 0 && (
              <Select
                placeholder="Chuyển trạng thái"
                size="small"
                style={{ width: 140 }}
                onChange={(value: string) =>
                  handleUpdateStatus(record.id, value)
                }
                value={undefined}
              >
                {nextStatuses.map((status) => (
                  <Select.Option key={status} value={status}>
                    {statusLabels[status]}
                  </Select.Option>
                ))}
              </Select>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0 }}>Quản lý đơn hàng</h2>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <span>Lọc theo trạng thái:</span>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 180 }}
          >
            <Select.Option value="all">Tất cả</Select.Option>
            <Select.Option value="pending">Chờ xác nhận</Select.Option>
            <Select.Option value="confirmed">Đã xác nhận</Select.Option>
            <Select.Option value="shipping">Đang giao</Select.Option>
            <Select.Option value="completed">Hoàn thành</Select.Option>
            <Select.Option value="cancelled">Đã hủy</Select.Option>
          </Select>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} đơn hàng`,
        }}
      />

      <Modal
        title={`Chi tiết đơn hàng #${selectedOrder?.id}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Người nhận">
                {selectedOrder.receiverName}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {selectedOrder.shippingPhone}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>
                {selectedOrder.shippingAddress}
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                {paymentLabels[selectedOrder.paymentMethod]}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusColors[selectedOrder.status]}>
                  {statusLabels[selectedOrder.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">
                {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {new Date(selectedOrder.updatedAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              {selectedOrder.note && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {selectedOrder.note}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card
              size="small"
              title="Thông tin tài khoản"
              style={{ marginTop: 16 }}
            >
              <p>
                <strong>Tên:</strong> {selectedOrder.user?.name}
              </p>
              <p>
                <strong>Email:</strong> {selectedOrder.user?.email}
              </p>
              <p>
                <strong>SĐT:</strong> {selectedOrder.user?.phone || 'Chưa cập nhật'}
              </p>
            </Card>

            <Card
              size="small"
              title="Sản phẩm đã đặt"
              style={{ marginTop: 16 }}
            >
              <List
                dataSource={selectedOrder.items}
                renderItem={(item: OrderItem) => (
                  <List.Item>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100%',
                      }}
                    >
                      <div>
                        <strong>{item.productName}</strong>
                        <div style={{ color: '#888', fontSize: 13 }}>
                          {Number(item.productPrice).toLocaleString('vi-VN')}đ
                          x {item.quantity}
                        </div>
                      </div>
                      <strong style={{ color: '#f5222d' }}>
                        {Number(item.subtotal).toLocaleString('vi-VN')}đ
                      </strong>
                    </div>
                  </List.Item>
                )}
              />
              <div
                style={{
                  textAlign: 'right',
                  marginTop: 12,
                  paddingTop: 12,
                  borderTop: '1px solid #f0f0f0',
                  fontSize: 16,
                }}
              >
                Tổng cộng:{' '}
                <strong style={{ color: '#f5222d', fontSize: 18 }}>
                  {Number(selectedOrder.totalAmount).toLocaleString('vi-VN')}đ
                </strong>
              </div>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}