import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Button,
  Modal,
  Select,
  Space,
  message,
  Descriptions,
  List,
  Card,
  Tooltip,
} from 'antd';
import {
  EyeOutlined,
  CarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  ExclamationCircleFilled,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
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

// Badge trạng thái dạng pill có chấm tròn
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  // Lưu trạng thái đang được chọn ở dropdown của từng hàng (chưa cập nhật)
  const [pendingStatus, setPendingStatus] = useState<Record<number, string>>({});

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

  const doUpdateStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await axiosClient.put(`/orders/${orderId}/status`, { status: newStatus });
      message.success(`Cập nhật trạng thái thành "${statusLabels[newStatus]}"`);
      setPendingStatus((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmUpdate = (orderId: number) => {
    const newStatus = pendingStatus[orderId];
    if (!newStatus) {
      message.warning('Vui lòng chọn trạng thái mới');
      return;
    }
    const isCancel = newStatus === 'cancelled';
    Modal.confirm({
      title: isCancel ? 'Xác nhận hủy đơn hàng' : 'Xác nhận cập nhật trạng thái',
      icon: (
        <ExclamationCircleFilled
          style={{ color: isCancel ? '#ff4d4f' : '#1677ff' }}
        />
      ),
      content: (
        <div style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>
          {isCancel ? (
            <>
              Bạn có chắc chắn muốn hủy đơn hàng{' '}
              <span style={{ fontWeight: 700, color: '#262626' }}>#{orderId}</span>?
              <br />
              Hành động này không thể hoàn tác.
            </>
          ) : (
            <>
              Cập nhật đơn hàng{' '}
              <span style={{ fontWeight: 700, color: '#262626' }}>#{orderId}</span>{' '}
              sang trạng thái{' '}
              <span style={{ fontWeight: 700, color: '#262626' }}>
                "{statusLabels[newStatus]}"
              </span>
              ?
            </>
          )}
        </div>
      ),
      okText: isCancel ? 'Hủy đơn' : 'Cập nhật',
      cancelText: 'Đóng',
      okButtonProps: { danger: isCancel },
      centered: true,
      onOk: () => doUpdateStatus(orderId, newStatus),
    });
  };

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const filteredOrders =
    filterStatus === 'all'
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  // ── Thống kê ──
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const shipping = orders.filter((o) => o.status === 'shipping').length;
    const revenue = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);
    return { totalOrders, pending, shipping, revenue };
  }, [orders]);

  const statCards = [
    {
      label: 'Tổng đơn hàng',
      value: stats.totalOrders,
      icon: <ShoppingCartOutlined />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #1677ff 100%)',
      shadow: 'rgba(22,119,255,0.35)',
    },
    {
      label: 'Chờ xác nhận',
      value: stats.pending,
      icon: <ClockCircleOutlined />,
      gradient: 'linear-gradient(135deg, #ffd34e 0%, #f59e0b 100%)',
      shadow: 'rgba(245,158,11,0.35)',
    },
    {
      label: 'Đang giao',
      value: stats.shipping,
      icon: <CarOutlined />,
      gradient: 'linear-gradient(135deg, #2af598 0%, #13c2c2 100%)',
      shadow: 'rgba(19,194,194,0.35)',
    },
    {
      label: 'Doanh thu (hoàn thành)',
      value: `${stats.revenue.toLocaleString('vi-VN')}đ`,
      icon: <DollarOutlined />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #2bb673 100%)',
      shadow: 'rgba(43,182,115,0.35)',
    },
  ];

  const columns = [
    {
      title: 'Mã đơn',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => (
        <span style={{ fontWeight: 700, color: '#1677ff' }}>#{id}</span>
      ),
    },
    {
      title: 'Khách hàng',
      key: 'customer',
      width: 180,
      render: (_: unknown, record: Order) => (
        <div>
          <div style={{ fontWeight: 600, color: '#262626' }}>
            {record.receiverName}
          </div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            {record.shippingPhone}
          </div>
        </div>
      ),
    },
    {
      title: 'Sản phẩm',
      key: 'items',
      width: 190,
      render: (_: unknown, record: Order) => (
        <div>
          {record.items.slice(0, 2).map((item) => (
            <div key={item.id} style={{ fontSize: 13, color: '#595959' }}>
              {item.productName}{' '}
              <span style={{ color: '#bfbfbf' }}>×{item.quantity}</span>
            </div>
          ))}
          {record.items.length > 2 && (
            <div style={{ fontSize: 12, color: '#1677ff' }}>
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
      width: 120,
      render: (amount: number) => (
        <span style={{ color: '#f5222d', fontWeight: 700, fontSize: 14 }}>
          {Number(amount).toLocaleString('vi-VN')}đ
        </span>
      ),
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (method: string) => (
        <span style={{ fontSize: 13, color: '#595959' }}>
          {paymentLabels[method] || method}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      render: (date: string) => (
        <span style={{ fontSize: 13, color: '#595959' }}>
          {new Date(date).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 300,
      render: (_: unknown, record: Order) => {
        const nextStatuses = validTransitions[record.status] || [];
        const isFinal = nextStatuses.length === 0;
        return (
          <Space size={8}>
            <Tooltip title="Xem chi tiết">
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => handleViewDetail(record)}
              />
            </Tooltip>

            {isFinal ? (
              <span style={{ fontSize: 12, color: '#bfbfbf', fontStyle: 'italic' }}>
                Đã kết thúc
              </span>
            ) : (
              <>
                <Select
                  placeholder="Chọn trạng thái"
                  size="small"
                  style={{ width: 150 }}
                  value={pendingStatus[record.id]}
                  onChange={(value: string) =>
                    setPendingStatus((prev) => ({ ...prev, [record.id]: value }))
                  }
                  options={nextStatuses.map((status) => ({
                    value: status,
                    label: statusLabels[status],
                  }))}
                />
                <Button
                  type="primary"
                  size="small"
                  icon={<SyncOutlined />}
                  loading={updatingId === record.id}
                  disabled={!pendingStatus[record.id]}
                  onClick={() => handleConfirmUpdate(record.id)}
                >
                  Cập nhật
                </Button>
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1a1a1a' }}>
          Quản lý đơn hàng
        </h2>
        <p style={{ margin: '4px 0 0', color: '#8c8c8c', fontSize: 14 }}>
          Theo dõi và xử lý đơn hàng của khách hàng
        </p>
      </div>

      {/* ── THẺ THỐNG KÊ ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: card.gradient,
              borderRadius: 18,
              padding: '20px 22px',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: `0 8px 24px ${card.shadow}`,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
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
                width: 110,
                height: 110,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                top: -40,
                right: -30,
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.10)',
                bottom: -18,
                right: 36,
              }}
            />
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
              }}
            >
              {card.icon}
            </div>
            <div style={{ minWidth: 0, position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 4, fontWeight: 500 }}>
                {card.label}
              </div>
              <div
                style={{
                  fontSize: 26,
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

      {/* ── BẢNG ── */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          padding: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Space>
            <span style={{ color: '#595959', fontWeight: 500 }}>
              Lọc theo trạng thái:
            </span>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 180 }}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'pending', label: 'Chờ xác nhận' },
                { value: 'confirmed', label: 'Đã xác nhận' },
                { value: 'shipping', label: 'Đang giao' },
                { value: 'completed', label: 'Hoàn thành' },
                { value: 'cancelled', label: 'Đã hủy' },
              ]}
            />
          </Space>
          <Button icon={<SyncOutlined />} onClick={fetchOrders}>
            Làm mới
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={filteredOrders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1150 }}
          rowClassName={() => 'order-row'}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} đơn hàng`,
          }}
        />
      </div>

      {/* CSS cho hàng cao thoáng + hover */}
      <style>{`
        .order-row > td { padding-top: 16px !important; padding-bottom: 16px !important; }
        .ant-table-thead > tr > th {
          background: #fafafa !important;
          color: #595959 !important;
          font-weight: 700 !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .order-row:hover > td { background: #fafffe !important; }
      `}</style>

      {/* ── MODAL CHI TIẾT ── */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>
              Đơn hàng #{selectedOrder?.id}
            </span>
            {selectedOrder && <StatusBadge status={selectedOrder.status} />}
          </div>
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={720}
      >
        {selectedOrder && (
          <div style={{ marginTop: 8 }}>
            {/* Thông tin giao hàng */}
            <div
              style={{
                background: '#fafafa',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  color: '#262626',
                  marginBottom: 12,
                  fontSize: 14,
                }}
              >
                Thông tin giao hàng
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <InfoRow
                  icon={<UserOutlined />}
                  label="Người nhận"
                  value={selectedOrder.receiverName}
                />
                <InfoRow
                  icon={<PhoneOutlined />}
                  label="Số điện thoại"
                  value={selectedOrder.shippingPhone}
                />
                <InfoRow
                  icon={<EnvironmentOutlined />}
                  label="Địa chỉ"
                  value={selectedOrder.shippingAddress}
                />
                <InfoRow
                  icon={<CreditCardOutlined />}
                  label="Thanh toán"
                  value={paymentLabels[selectedOrder.paymentMethod]}
                />
              </div>
            </div>

            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Tài khoản">
                {selectedOrder.user?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedOrder.user?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày đặt">
                {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật">
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
              title="Sản phẩm đã đặt"
              styles={{ header: { fontWeight: 700 } }}
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
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong style={{ color: '#262626' }}>
                          {item.productName}
                        </strong>
                        <div style={{ color: '#8c8c8c', fontSize: 13 }}>
                          {Number(item.productPrice).toLocaleString('vi-VN')}đ ×{' '}
                          {item.quantity}
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
                  fontSize: 15,
                }}
              >
                Tổng cộng:{' '}
                <strong style={{ color: '#f5222d', fontSize: 20 }}>
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

// Hàng thông tin trong modal
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ color: '#8c8c8c', fontSize: 14, marginTop: 2 }}>{icon}</span>
      <div style={{ display: 'flex', gap: 8, flex: 1 }}>
        <span style={{ color: '#8c8c8c', fontSize: 13, minWidth: 100 }}>
          {label}:
        </span>
        <span style={{ color: '#262626', fontSize: 13, fontWeight: 500, flex: 1 }}>
          {value}
        </span>
      </div>
    </div>
  );
}