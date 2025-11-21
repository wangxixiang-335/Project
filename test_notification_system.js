import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// 测试通知系统
async function testNotificationSystem() {
  console.log('🚀 开始测试通知系统...\n');

  try {
    // 1. 测试学生登录
    console.log('📋 步骤1: 学生登录');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'studentdemo@example.com',
      password: 'demo123456'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ 登录成功');
      console.log(`👤 用户: ${loginResponse.data.data.username}`);
      console.log(`🔑 Token: ${token.substring(0, 20)}...\n`);

      // 2. 测试获取通知列表
      console.log('📋 步骤2: 获取通知列表');
      const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (notificationsResponse.data.success) {
        const notifications = notificationsResponse.data.data;
        console.log(`✅ 获取通知成功，共 ${notifications.length} 条通知`);
        
        notifications.forEach((notification, index) => {
          console.log(`\n通知 ${index + 1}:`);
          console.log(`  📄 项目: ${notification.project_title}`);
          console.log(`  📝 状态: ${notification.status === 1 ? '通过' : '驳回'}`);
          console.log(`  ⭐ 分数: ${notification.score || '无'}`);
          console.log(`  💬 反馈: ${notification.feedback || '无'}`);
          console.log(`  🕐 时间: ${new Date(notification.created_at).toLocaleString()}`);
        });
      } else {
        console.log('❌ 获取通知失败:', notificationsResponse.data.error);
      }

      // 3. 测试更新用户资料
      console.log('\n📋 步骤3: 更新用户资料');
      const profileResponse = await axios.put(`${API_BASE}/users/profile`, {
        avatar: 'https://via.placeholder.com/150',
        signature: '这是一个测试签名'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileResponse.data.success) {
        console.log('✅ 用户资料更新成功');
        console.log(`  🖼️ 头像: ${profileResponse.data.data.avatar}`);
        console.log(`  ✍️ 签名: ${profileResponse.data.data.signature}`);
      } else {
        console.log('❌ 更新用户资料失败:', profileResponse.data.error);
      }

      // 4. 测试获取未读通知数量
      console.log('\n📋 步骤4: 获取未读通知数量');
      const unreadResponse = await axios.get(`${API_BASE}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (unreadResponse.data.success) {
        console.log(`✅ 未读通知数量: ${unreadResponse.data.data.unreadCount}`);
      } else {
        console.log('❌ 获取未读通知数量失败:', unreadResponse.data.error);
      }

    } else {
      console.log('❌ 登录失败:', loginResponse.data.error);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }

  console.log('\n🎉 测试完成！');
}

// 运行测试
testNotificationSystem();