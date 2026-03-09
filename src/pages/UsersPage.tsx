import { useState, useEffect } from 'react';
import { Table, Tag, Button, message, Avatar, Popconfirm } from 'antd';
import { UserOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const API_URL = 'http://localhost:3000';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/users');
      setUsers(response.data);
    } catch (error) {
      message.error('Lỗi tải danh sách người dùng');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (user: User) => {
    try {
      await axiosClient.put(`/users/${user.id}/toggle-active`);
      message.success(
        user.isActive
          ? `Đã khóa tài khoản "${user.name}"`
          : `Đã mở khóa tài khoản "${user.name}"`,
      );
      fetchUsers();
    } catch (error) {
      message.error('Thao tác thất bại');
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
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 70,
      render: (avatar: string) => (
        <Avatar
          src={avatar ? `${API_URL}${avatar}` : undefined}
          icon={!avatar ? <UserOutlined /> : undefined}
        />
      ),
    },
    {
      title: 'Họ tên',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || 'Chưa cập nhật',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 110,
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'purple' : 'blue'}>
          {role === 'admin' ? 'Admin' : 'Khách hàng'}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Đã khóa'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) =>
        new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      render: (_: unknown, record: User) => {
        if (record.role === 'admin') {
          return <Tag>Admin</Tag>;
        }

        return (
          <Popconfirm
            title={
              record.isActive
                ? 'Khóa tài khoản này?'
                : 'Mở khóa tài khoản này?'
            }
            description={
              record.isActive
                ? 'Người dùng sẽ không thể đăng nhập'
                : 'Người dùng sẽ có thể đăng nhập lại'
            }
            onConfirm={() => handleToggleActive(record)}
            okText={record.isActive ? 'Khóa' : 'Mở khóa'}
            cancelText="Hủy"
            okButtonProps={{ danger: record.isActive }}
          >
            <Button
              type={record.isActive ? 'default' : 'primary'}
              danger={record.isActive}
              icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
              size="small"
            >
              {record.isActive ? 'Khóa' : 'Mở khóa'}
            </Button>
          </Popconfirm>
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
        <h2 style={{ margin: 0 }}>Quản lý người dùng</h2>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} người dùng`,
        }}
      />
    </div>
  );
}