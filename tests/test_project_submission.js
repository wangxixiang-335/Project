import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// 创建Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testProjectSubmission() {
  console.log('🚀 开始测试项目提交功能...\n');

  try {
    // 1. 检查数据库连接和表结构
    console.log('🔍 检查数据库状态...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ 检查profiles表失败:', profilesError);
      return;
    }

    console.log('📊 当前用户数量:', profiles?.length || 0);
    if (profiles && profiles.length > 0) {
      console.log('用户列表:');
      profiles.forEach(user => console.log(`  - ${user.username} (${user.email}) - ${user.role}`));
    }

    // 2. 检查projects表
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);

    if (projectsError && projectsError.code !== 'PGRST116') {
      console.error('❌ 检查projects表失败:', projectsError);
      return;
    }

    console.log('📊 当前项目数量:', projects?.length || 0);

    // 3. 如果没有学生用户，创建测试学生用户
    const testStudents = [
      {
        username: 'student_test1',
        email: 'student1@test.com',
        role: 'student'
      },
      {
        username: 'student_test2',
        email: 'student2@test.com',
        role: 'student'
      }
    ];

    let hasStudent = false;
    let testUserId = null;

    if (profiles && profiles.length > 0) {
      const student = profiles.find(p => p.role === 'student');
      if (student) {
        hasStudent = true;
        testUserId = student.id;
        console.log('✅ 发现现有学生用户:', student.username);
      }
    }

    // 4. 如果没有学生用户，需要先创建
    if (!hasStudent) {
      console.log('\n📝 需要创建测试学生用户...');
      console.log('💡 请先通过前端注册一个学生用户，然后重新运行此测试');
      console.log('   或者通过Supabase Dashboard手动创建用户');
      return;
    }

    // 5. 准备测试项目数据
    const testProjects = [
      {
        title: "在线购物网站",
        description: "使用React和Node.js构建的完整电商平台",
        category: "web",
        project_url: "https://ecommerce-demo.com",
        github_url: "https://github.com/test/ecommerce",
        thumbnail_url: "https://via.placeholder.com/300x200"
      },
      {
        title: "移动端学习应用",
        description: "使用Flutter开发的跨平台移动学习应用",
        category: "mobile",
        project_url: "https://learning-app.com",
        github_url: "https://github.com/test/learning-app",
        thumbnail_url: "https://via.placeholder.com/300x200"
      },
      {
        title: "数据分析仪表板",
        description: "使用Python和D3.js构建的数据可视化系统",
        category: "data",
        project_url: "https://analytics-demo.com",
        github_url: "https://github.com/test/analytics",
        thumbnail_url: "https://via.placeholder.com/300x200"
      }
    ];

    console.log('\n🎯 准备提交测试项目...');
    
    // 6. 提交测试项目
    for (let i = 0; i < testProjects.length; i++) {
      const project = testProjects[i];
      
      console.log(`\n📤 提交项目 ${i+1}: ${project.title}`);
      
      const { data: result, error } = await supabase
        .from('projects')
        .insert({
          user_id: testUserId,
          ...project,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ 提交失败:`, error.message);
      } else {
        console.log(`✅ 提交成功! 项目ID: ${result.id}`);
      }
    }

    // 7. 验证提交结果
    console.log('\n🔍 验证项目提交结果...');
    
    const { data: finalProjects, error: finalError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false });

    if (finalError) {
      console.error('❌ 验证失败:', finalError);
    } else {
      console.log(`✅ 验证成功! 用户共有 ${finalProjects.length} 个项目:`);
      finalProjects.forEach(project => {
        console.log(`  - ${project.title} (${project.status}) - 创建时间: ${project.created_at}`);
      });
    }

    console.log('\n🎉 项目提交测试完成!');
    console.log('💡 现在您可以：');
    console.log('   1. 启动后端服务: npm run dev');
    console.log('   2. 访问临时前端: http://localhost:3000');
    console.log('   3. 登录学生账户测试项目提交功能');

  } catch (error) {
    console.error('❌ 测试过程中出现异常:', error);
  }
}

// 执行测试
testProjectSubmission();