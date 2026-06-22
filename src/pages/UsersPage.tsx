import { useState, useEffect } from 'react';
import { Table, Tag, Button, message, Avatar, Modal } from 'antd';
import { UserOutlined, LockOutlined, UnlockOutlined, ExclamationCircleFilled  } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import { getImageUrl } from '../utils/image';

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

  const handleToggleActive = (user: User) => {
  const isLocking = user.isActive;

  Modal.confirm({
    title: isLocking ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?',
    icon: <ExclamationCircleFilled style={{ color: isLocking ? '#ff4d4f' : '#1677ff' }} />,
    content: (
      <div style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>
        {isLocking ? (
          <>
            Bạn có chắc chắn muốn khóa tài khoản{' '}
            <span style={{ fontWeight: 700, color: '#262626' }}>"{user.name}"</span>?
            <br />
            Người dùng sẽ không thể đăng nhập.
          </>
        ) : (
          <>
            Bạn có chắc chắn muốn mở khóa tài khoản{' '}
            <span style={{ fontWeight: 700, color: '#262626' }}>"{user.name}"</span>?
            <br />
            Người dùng sẽ có thể đăng nhập lại.
          </>
        )}
      </div>
    ),
    okText: isLocking ? 'Khóa' : 'Mở khóa',
    cancelText: 'Hủy',
    okButtonProps: { danger: isLocking },
    centered: true,
    async onOk() {
      try {
        await axiosClient.put(`/users/${user.id}/toggle-active`);
        message.success(
          isLocking
            ? `Đã khóa tài khoản "${user.name}"`
            : `Đã mở khóa tài khoản "${user.name}"`,
        );
        fetchUsers();
      } catch (error) {
        message.error('Thao tác thất bại');
        console.error(error);
        throw error; // để Modal hiển thị trạng thái lỗi
      }
    },
  });
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
          src={avatar ? getImageUrl(avatar) : undefined}
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
          <Button
            type={record.isActive ? 'default' : 'primary'}
            danger={record.isActive}
            icon={record.isActive ? <LockOutlined /> : <UnlockOutlined />}
            size="small"
            onClick={() => handleToggleActive(record)}
          >
            {record.isActive ? 'Khóa' : 'Mở khóa'}
          </Button>
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