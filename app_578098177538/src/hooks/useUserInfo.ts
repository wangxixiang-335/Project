import { useState, useEffect } from 'react';

interface UserInfo {
  role: string;
  userId: string | null;
  username: string;
  email?: string;
}

export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    role: 'student',
    userId: null,
    username: '用户',
    email: ''
  });

  useEffect(() => {
    const updateUserInfo = () => {
      try {
        const userInfoData = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const newUserInfo: UserInfo = {
          role: userInfoData.role || 'student',
          userId: userInfoData.user_id || userInfoData.id || null,
          username: userInfoData.username || userInfoData.email || '用户',
          email: userInfoData.email || ''
        };
        setUserInfo(newUserInfo);
      } catch (error) {
        console.error('获取用户信息失败:', error);
        setUserInfo({
          role: 'student',
          userId: null,
          username: '用户',
          email: ''
        });
      }
    };

    // 初始化用户信息
    updateUserInfo();

    // 监听storage变化，支持多标签页同步
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userInfo') {
        updateUserInfo();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const refreshUserInfo = () => {
    try {
      const userInfoData = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const newUserInfo: UserInfo = {
        role: userInfoData.role || 'student',
        userId: userInfoData.user_id || userInfoData.id || null,
        username: userInfoData.username || userInfoData.email || '用户',
        email: userInfoData.email || ''
      };
      setUserInfo(newUserInfo);
    } catch (error) {
      console.error('刷新用户信息失败:', error);
    }
  };

  return {
    ...userInfo,
    refreshUserInfo
  };
};