# 后端API "接口不存在" 问题解决方案

## 问题诊断

✅ **后端服务器状态**: 正常运行在端口3000
✅ **API路由配置**: `/api/review/pending` 等路由正确配置
✅ **数据库连接**: Supabase连接正常
❌ **认证问题**: 前端缺少有效的Supabase认证token

## 核心问题

后端返回的 `{"success":false,"error":"接口不存在"}` 实际上是认证错误。

当调用需要认证的API时：
1. 后端检查 `Authorization: Bearer <token>` 头
2. 使用Supabase验证token有效性
3. 如果token无效或不存在，返回认证错误

## 解决方案

### 方法1: 通过登录页面获取token (推荐)

1. 访问前端登录页面
2. 使用以下凭据登录：
   ```
   邮箱: testteacher123@example.com
   密码: 123456
   ```
3. 登录成功后，token会自动存储到 `localStorage`
4. 教师审核功能正常工作

### 方法2: 手动设置测试token (临时)

在浏览器开发者工具(F12)的Console中运行：

```javascript
// 1. 加载Supabase客户端
const script = document.createElement('script')
script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
document.head.appendChild(script)

// 等待加载完成后运行
setTimeout(async () => {
  const { createClient } = supabase
  const supabaseClient = createClient(
    'https://crwdfiwjfgrfurfhuizk.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNyd2RmaXdqZmdyZnVyZmh1aXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjEwNDMsImV4cCI6MjA3ODYzNzA0M30.xJE5RKMkINBpuU0xvMEDWtu78Gl9_SJAEmJJdQ0G4wU'
  )
  
  // 登录获取token
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: 'testteacher123@example.com',
    password: '123456'
  })
  
  if (data.session) {
    localStorage.setItem('token', data.session.access_token)
    console.log('✅ Token设置成功')
    console.log('Token:', data.session.access_token)
    // 刷新页面
    location.reload()
  } else {
    console.error('❌ 登录失败:', error)
  }
}, 1000)
```

## 验证修复

修复后应该看到：
- 教师审核页面正常显示待审核项目列表
- 点击审核按钮可以正常操作
- API调用返回正确的数据而非"接口不存在"错误

## 技术细节

### 认证流程
1. 前端发送请求时携带 `Authorization: Bearer <token>` 头
2. 后端中间件 `authenticateToken` 验证token
3. 使用 `supabase.auth.getUser(token)` 验证有效性
4. 从token中提取用户角色信息
5. `requireTeacher` 中间件确保只有教师可以访问审核API

### 用户角色映射
- 数字 `1` = 学生 = 字符串 `'student'`
- 数字 `2` = 教师 = 字符串 `'teacher'`

### 已修复的数据
- ✅ Supabase Auth用户元数据已更新
- ✅ 角色映射已正确设置
- ✅ 测试教师账户已创建

## 前端检查清单

确保前端代码：
1. ✅ 在所有API请求中包含 `Authorization` 头
2. ✅ 从 `localStorage.getItem('token')` 获取token
3. ✅ 处理401认证错误并引导用户登录
4. ✅ 登录成功后正确存储token

## 常见问题

**Q: 为什么之前可以工作，现在不行了？**
A: 可能是token过期或用户会话失效。

**Q: 如何检查当前token是否有效？**
A: 在浏览器控制台检查 `localStorage.getItem('token')` 是否存在且不为空。

**Q: 如果还是不行怎么办？**
A: 重新登录获取新token，或者检查用户角色是否正确设置为'teacher'。