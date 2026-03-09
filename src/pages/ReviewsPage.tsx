import { useState, useEffect } from 'react';
import { Table, Tag, Button, message, Popconfirm, Rate, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  product: {
    id: number;
    name: string;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/reviews');
      setReviews(response.data);
    } catch (error) {
      message.error('Lỗi tải đánh giá');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/reviews/${id}`);
      message.success('Xóa đánh giá thành công');
      fetchReviews();
    } catch (error) {
      message.error('Xóa thất bại');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Người đánh giá',
      key: 'user',
      width: 180,
      render: (_: unknown, record: Review) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.user?.name}</div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {record.user?.email}
          </div>
        </div>
      ),
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 180,
      render: (_: unknown, record: Review) => (
        <Tag color="blue">{record.product?.name}</Tag>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 160,
      render: (rating: number) => (
        <Rate disabled value={rating} style={{ fontSize: 18, whiteSpace: 'nowrap' }} />
      ),
    },
    {
      title: 'Nội dung',
      dataIndex: 'comment',
      key: 'comment',
      ellipsis: true,
      render: (comment: string) => comment || 'Không có nội dung',
    },
    {
      title: 'Ngày đánh giá',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) =>
        new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Review) => (
        <Space>
          <Popconfirm
            title="Xóa đánh giá này?"
            description="Hành động này không thể hoàn tác"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
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
        <h2 style={{ margin: 0 }}>Quản lý đánh giá</h2>
      </div>

      <Table
        columns={columns}
        dataSource={reviews}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} đánh giá`,
        }}
      />
    </div>
  );
}