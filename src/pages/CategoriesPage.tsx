import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Space,
  message,
  Image,
  Upload,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import axiosClient from '../api/axiosClient';

interface Category {
  id: number;
  name: string;
  description: string;
  image: string;
  isActive: boolean;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function StatusBadge({ active }: { active: boolean }) {
  const s = active
    ? { bg: '#f6ffed', text: '#389e0d', dot: '#52c41a', label: 'Hiển thị' }
    : { bg: '#fff1f0', text: '#cf1322', dot: '#ff4d4f', label: 'Ẩn' };
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
      {s.label}
    </span>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/categories');
      // Sắp xếp theo ID tăng dần (thấp → cao)
      setCategories([...response.data].sort((a, b) => a.id - b.id));
    } catch (error) {
      message.error('Lỗi tải danh mục');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = () => {
    setEditingCategory(null);
    form.resetFields();
    setFileList([]);
    setModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      isActive: category.isActive,
    });

    if (category.image) {
      setFileList([
        {
          uid: '-1',
          name: 'image',
          status: 'done',
          url: `${API_URL}${category.image}`,
        },
      ]);
    } else {
      setFileList([]);
    }

    setModalOpen(true);
  };

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.url;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      let imageUrl = editingCategory?.image || '';

      if (fileList.length > 0 && fileList[0].originFileObj) {
        imageUrl = await handleUpload(fileList[0].originFileObj as File);
      }

      if (fileList.length === 0) {
        imageUrl = '';
      }

      const data = {
        name: values.name,
        description: values.description || '',
        image: imageUrl,
        isActive: values.isActive ?? true,
      };

      if (editingCategory) {
        await axiosClient.put(`/categories/${editingCategory.id}`, data);
        message.success('Cập nhật danh mục thành công');
      } else {
        await axiosClient.post('/categories', data);
        message.success('Thêm danh mục thành công');
      }

      setModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = (id: number, name: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa danh mục',
      icon: <ExclamationCircleFilled style={{ color: '#ff4d4f' }} />,
      content: (
        <div style={{ fontSize: 14, color: '#595959', marginTop: 4 }}>
          Bạn có chắc chắn muốn xóa danh mục{' '}
          <span style={{ fontWeight: 700, color: '#262626' }}>"{name}"</span>?
          <br />
          Hành động này không thể hoàn tác.
        </div>
      ),
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      centered: true,
      async onOk() {
        try {
          await axiosClient.delete(`/categories/${id}`);
          message.success('Xóa danh mục thành công');
          fetchCategories();
        } catch (error) {
          console.error(error);
          message.error('Xóa thất bại. Danh mục có thể đang chứa sản phẩm');
          throw error;
        }
      },
    });
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      render: (id: number) => (
        <span style={{ fontWeight: 700, color: '#1677ff' }}>#{id}</span>
      ),
    },
    {
      title: 'Hình ảnh',
      dataIndex: 'image',
      key: 'image',
      width: 100,
      render: (image: string) =>
        image ? (
          <Image
            src={`${API_URL}${image}`}
            width={56}
            height={56}
            style={{ objectFit: 'cover', borderRadius: 10 }}
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              background: '#f5f5f5',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bfbfbf',
              fontSize: 11,
            }}
          >
            No img
          </div>
        ),
    },
    {
      title: 'Tên danh mục',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <span style={{ fontWeight: 600, color: '#262626' }}>{name}</span>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => (
        <span style={{ color: '#595959' }}>{desc || '—'}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 130,
      render: (isActive: boolean) => <StatusBadge active={isActive} />,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <span style={{ color: '#595959' }}>
          {new Date(date).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      render: (_: unknown, record: Category) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              ghost
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record.id, record.name)}
            />
          </Tooltip>
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
          alignItems: 'flex-start',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>
            Quản lý danh mục
          </h2>
          <p style={{ margin: '4px 0 0', color: '#8c8c8c', fontSize: 14 }}>
            Quản lý các danh mục trái cây trong cửa hàng
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Thêm danh mục
        </Button>
      </div>

      {/* ── BẢNG trong card ── */}
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #f0f0f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          padding: 20,
        }}
      >
        <Table
          columns={columns}
          dataSource={categories}
          rowKey="id"
          loading={loading}
          rowClassName={() => 'cat-row'}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} danh mục`,
          }}
        />
      </div>

      <style>{`
        .cat-row > td { padding-top: 14px !important; padding-bottom: 14px !important; }
        .ant-table-thead > tr > th {
          background: #fafafa !important;
          color: #595959 !important;
          font-weight: 700 !important;
          border-bottom: 1px solid #f0f0f0 !important;
        }
        .cat-row:hover > td { background: #fafffe !important; }
      `}</style>

      <Modal
        title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingCategory ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục!' }]}
          >
            <Input placeholder="VD: Trái cây nhiệt đới" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về danh mục" />
          </Form.Item>

          <Form.Item label="Hình ảnh">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {fileList.length === 0 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Trạng thái"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}