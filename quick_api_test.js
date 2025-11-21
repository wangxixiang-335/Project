// 快速测试教师API
import axios from 'axios';

async function testTeacherAPI() {
    console.log('🧪 开始测试教师成果库API...\n');
    
    try {
        // 测试API端点
        console.log('📡 发送请求到: http://localhost:3000/api/teacher/student-achievements');
        console.log('🔑 使用Token: dev-teacher-token\n');
        
        const response = await axios.get('http://localhost:3000/api/teacher/student-achievements', {
            headers: {
                'Authorization': 'Bearer dev-teacher-token',
                'Content-Type': 'application/json'
            },
            params: {
                page: 1,
                pageSize: 10
            },
            timeout: 10000
        });
        
        console.log('✅ API调用成功！');
        console.log('📊 状态码:', response.status);
        console.log('📋 响应消息:', response.data.message);
        
        if (response.data.success && response.data.data) {
            const items = response.data.data.items || response.data.data;
            console.log('\n📈 获取到数据统计:');
            console.log('- 总数:', items.length);
            
            if (items.length > 0) {
                console.log('\n📋 前3条学生成果预览:');
                items.slice(0, 3).forEach((item, index) => {
                    console.log(`${index + 1}. ${item.title} - ${item.student_name} (${item.project_type || '未分类'}) - 分数: ${item.score || '未评分'}`);
                });
            }
        } else {
            console.log('⚠️ API返回成功但无数据');
        }
        
    } catch (error) {
        console.log('❌ API调用失败！');
        console.log('错误类型:', error.name);
        console.log('错误消息:', error.message);
        
        if (error.response) {
            console.log('状态码:', error.response.status);
            console.log('响应数据:', error.response.data);
        }
    }
}

// 运行测试
testTeacherAPI().then(() => {
    console.log('\n🏁 测试完成');
    process.exit(0);
}).catch(error => {
    console.error('测试过程中发生错误:', error);
    process.exit(1);
});