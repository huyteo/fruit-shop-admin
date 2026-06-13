import { useState } from 'react';
import type { ReactNode } from 'react';
import axiosClient from '../api/axiosClient';
import { AuthContext } from './AuthContextDef';
import type { User } from './AuthContextDef';

function getInitialUser(): User | null {
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('accessToken');

  if (savedUser && token) {
    return JSON.parse(savedUser) as User;
  }

  return null;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [loading] = useState(false);

  const login = async (email: string, password: string) => {
  try {
    const response = await axiosClient.post('/auth/login', { email, password });
    const { user: userData, accessToken } = response.data;

    if (userData.role !== 'admin') {
      throw new Error('Bạn không có quyền truy cập trang quản trị');
    }

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  } catch (err: unknown) {
    // Nếu là lỗi mình tự ném (sai quyền admin) thì giữ nguyên message
    if (err instanceof Error && err.message.includes('quyền truy cập')) {
      throw err;
    }
    // Lỗi từ API (sai email/mật khẩu) → lấy message từ backend
    const e = err as { response?: { data?: { message?: string } } };
    throw new Error(e.response?.data?.message || 'Email hoặc mật khẩu không đúng');
  }
};

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}