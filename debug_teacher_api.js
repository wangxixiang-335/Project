// 调试教师个人成果API
import axios from 'axios';

async function debugTeacherAPI() {
    console.log('🔍 调试教师个人成果API...\n');
    
    try {
        const response = await axios.get('http://localhost:3000/api/teacher/my-projects', {
            headers: {
                'Authorization': 'Bearer dev-teacher-token',
                'Content-Type': 'application/json'
            },
            params: { page: 1, pageSize: 10 }
        });
        
        console.log('✅ API响应状态:', response.status);
        console.log('📋 完整响应:');
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n📊 数据结构分析:');
            console.log('- response.data.success:', response.data.success);
            console.log('- response.data.message:', response.data.message);
            console.log('- response.data.data type:', typeof response.data.data);
            console.log('- response.data.data is Array:', Array.isArray(response.data.data));
            
            if (response.data.data) {
                if (Array.isArray(response.data.data)) {
                    console.log('- 数组长度:', response.data.data.length);
                    if (response.data.data.length > 0) {
                        console.log('- 第一个项目:', response.data.data[0]);
                    }
                } else if (response.data.data.items) {
                    console.log('- 对象.items存在');
                    console.log('- items is Array:', Array.isArray(response.data.data.items));
                    console.log('- items.length:', response.data.data.items.length);
                } else if (response.data.data.data) {
                    console.log('- 对象.data存在');
                    console.log('- data is Array:', Array.isArray(response.data.data.data));
                    console.log('- data.length:', response.data.data.data.length);
                } else {
                    console.log('- 数据结构未知:', Object.keys(response.data.data));
                }
            }
        }
        
    } catch (error) {
        console.error('❌ API调试失败:', error.message);
        if (error.response) {
            console.error('状态码:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行调试
debugTeacherAPI().then(() => {
    console.log('\n🏁 API调试完成');
    process.exit(0);
}).catch(error => {
    console.error('调试过程中发生错误:', error);
    process.exit(1);
});