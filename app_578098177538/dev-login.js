// 开发者模式：直接在前端模拟登录，用于测试界面功能

// 模拟不同角色的用户数据
const mockUsers = {
  teacher: {
    token: 'mock-teacher-token-12345',
    user: {
      user_id: 'teacher-001',
      email: 'teacher@example.com',
      username: 'testteacher',
      role: 'teacher'
    }
  },
  student: {
    token: 'mock-student-token-67890',
    user: {
      user_id: 'student-001',
      email: 'student@example.com',
      username: 'teststudent',
      role: 'student'
    }
  },
  admin: {
    token: 'mock-admin-token-11111',
    user: {
      user_id: 'admin-001',
      email: 'admin@example.com',
      username: 'testadmin',
      role: 'admin'
    }
  }
};

// 设置模拟用户登录
function setMockUser(role) {
  const userData = mockUsers[role];
  if (userData) {
    localStorage.setItem('token', userData.token);
    localStorage.setItem('userInfo', JSON.stringify(userData.user));
    console.log(`✅ 模拟${role}登录成功`);
    console.log('用户信息:', userData.user);
    console.log('Token:', userData.token);
    
    // 根据角色跳转到对应页面
    switch(role) {
      case 'teacher':
        window.location.href = '/teacher-home';
        break;
      case 'admin':
        window.location.href = '/admin-home';
        break;
      default:
        window.location.href = '/home';
        break;
    }
  } else {
    console.error('❌ 无效的角色:', role);
  }
}

// 使用说明
console.log('🔧 开发者模式使用说明：');
console.log('setMockUser("teacher") - 模拟教师登录');
console.log('setMockUser("student") - 模拟学生登录');
console.log('setMockUser("admin") - 模拟管理员登录');
console.log('');
console.log('💡 在浏览器控制台中直接调用上述函数即可模拟对应角色登录');

// 自动设置教师登录（可选）
// setMockUser('teacher');