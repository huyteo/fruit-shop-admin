import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  message,
  Popconfirm,
  Image,
  Upload,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import axiosClient from '../api/axiosClient';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  thumbnail: string;
  images: string[];
  stock: number;
  unit: string;
  isActive: boolean;
  categoryId: number;
  createdAt: string;
  category: {
    id: number;
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
}

const API_URL = 'http://localhost:3000';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [thumbnailList, setThumbnailList] = useState<UploadFile[]>([]);
  const [imagesList, setImagesList] = useState<UploadFile[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [form] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/products');
      setProducts(response.data);
    } catch (error) {
      message.error('Lỗi tải sản phẩm');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosClient.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      fetchProducts();
      return;
    }

    setLoading(true);
    try {
      const response = await axiosClient.get(
        `/products/search?keyword=${searchKeyword}`,
      );
      setProducts(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosClient.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response.data.url;
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setThumbnailList([]);
    setImagesList([]);
    setModalOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
      categoryId: product.categoryId,
      isActive: product.isActive,
    });

    if (product.thumbnail) {
      setThumbnailList([
        {
          uid: '-1',
          name: 'thumbnail',
          status: 'done',
          url: `${API_URL}${product.thumbnail}`,
        },
      ]);
    } else {
      setThumbnailList([]);
    }

    if (product.images && product.images.length > 0) {
      setImagesList(
        product.images.map((img, index) => ({
          uid: `-${index + 2}`,
          name: `image-${index}`,
          status: 'done' as const,
          url: `${API_URL}${img}`,
        })),
      );
    } else {
      setImagesList([]);
    }

    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      let thumbnailUrl = editingProduct?.thumbnail || '';
      if (thumbnailList.length > 0 && thumbnailList[0].originFileObj) {
        thumbnailUrl = await uploadFile(
          thumbnailList[0].originFileObj as File,
        );
      }
      if (thumbnailList.length === 0) {
        thumbnailUrl = '';
      }

      let imagesUrls: string[] = editingProduct?.images || [];

      const newFiles = imagesList.filter((f) => f.originFileObj);

      const oldImages = imagesList
        .filter((f) => !f.originFileObj && f.url)
        .map((f) => (f.url as string).replace(API_URL, ''));

      if (newFiles.length > 0) {
        const uploadedUrls = await Promise.all(
          newFiles.map((f) => uploadFile(f.originFileObj as File)),
        );
        imagesUrls = [...oldImages, ...uploadedUrls];
      } else {
        imagesUrls = oldImages;
      }

      const data = {
        name: values.name,
        description: values.description,
        price: values.price,
        stock: values.stock,
        unit: values.unit,
        categoryId: values.categoryId,
        thumbnail: thumbnailUrl,
        images: imagesUrls,
        isActive: values.isActive ?? true,
      };

      if (editingProduct) {
        await axiosClient.put(`/products/${editingProduct.id}`, data);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await axiosClient.post('/products', data);
        message.success('Thêm sản phẩm thành công');
      }

      setModalOpen(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await axiosClient.delete(`/products/${id}`);
      message.success('Xóa sản phẩm thành công');
      fetchProducts();
    } catch (error) {
      console.error(error);
      message.error('Xóa thất bại');
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
      title: 'Ảnh',
      dataIndex: 'thumbnail',
      key: 'thumbnail',
      width: 80,
      render: (thumbnail: string) =>
        thumbnail ? (
          <Image
            src={`${API_URL}${thumbnail}`}
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: 8 }}
          />
        ) : (
          <div
            style={{
              width: 50,
              height: 50,
              background: '#f0f0f0',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: 10,
            }}
          >
            No img
          </div>
        ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: { name: string } | null) =>
        category ? <Tag color="blue">{category.name}</Tag> : '-',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) =>
        Number(price).toLocaleString('vi-VN') + 'đ',
    },
    {
      title: 'Tồn kho',
      dataIndex: 'stock',
      key: 'stock',
      width: 90,
      render: (stock: number, record: Product) => (
        <span style={{ color: stock <= 10 ? 'red' : 'inherit' }}>
          {stock} {record.unit}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hiển thị' : 'Ẩn'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Product) => (
        <Space>
          <Button
            type="primary"
            ghost
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xóa sản phẩm?"
            description="Bạn có chắc chắn muốn xóa sản phẩm này?"
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
        <h2 style={{ margin: 0 }}>Quản lý sản phẩm</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm sản phẩm
        </Button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            allowClear
            onClear={() => {
              setSearchKeyword('');
              fetchProducts();
            }}
          />
          <Button type="primary" onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Tổng ${total} sản phẩm`,
        }}
      />

      <Modal
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editingProduct ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="name"
                label="Tên sản phẩm"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên sản phẩm!' },
                ]}
              >
                <Input placeholder="VD: Xoài cát Hòa Lộc" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="categoryId"
                label="Danh mục"
                rules={[
                  { required: true, message: 'Vui lòng chọn danh mục!' },
                ]}
              >
                <Select placeholder="Chọn danh mục">
                  {categories.map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>
                      {cat.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <Input.TextArea rows={3} placeholder="Mô tả chi tiết sản phẩm" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Giá bán (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập giá!' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  placeholder="85000"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="stock"
                label="Tồn kho"
                rules={[
                  { required: true, message: 'Vui lòng nhập số lượng!' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="100"
                />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="unit"
                label="Đơn vị"
                rules={[
                  { required: true, message: 'Vui lòng nhập đơn vị!' },
                ]}
              >
                <Select placeholder="Chọn đơn vị">
                  <Select.Option value="kg">kg</Select.Option>
                  <Select.Option value="trái">trái</Select.Option>
                  <Select.Option value="hộp">hộp</Select.Option>
                  <Select.Option value="chục">chục</Select.Option>
                  <Select.Option value="gói">gói</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Ảnh đại diện">
                <Upload
                  listType="picture-card"
                  fileList={thumbnailList}
                  onChange={({ fileList }) => setThumbnailList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                  accept="image/*"
                >
                  {thumbnailList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Chọn ảnh</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Ảnh chi tiết (tối đa 5)">
                <Upload
                  listType="picture-card"
                  fileList={imagesList}
                  onChange={({ fileList }) => setImagesList(fileList)}
                  beforeUpload={() => false}
                  maxCount={5}
                  multiple
                  accept="image/*"
                >
                  {imagesList.length < 5 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Thêm ảnh</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>

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