import React from 'react';

// 测试基本的JSX语法结构
const TestJSX: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [useMockData, setUseMockData] = React.useState(false);

  return (
    <div className="page-wrapper">
      <header>顶部导航</header>
      <aside>侧边栏</aside>
      <main className="main-content">
        {loading ? (
          <div>加载中...</div>
        ) : (
          <>
            {useMockData && <div>模拟数据提示</div>}
            <div className="content">
              <h1>标题</h1>
              <div className="grid">
                <div className="left">
                  <section>左侧内容</section>
                </div>
                <div className="right">
                  <section>右侧内容</section>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <div>模态框</div>
    </div>
  );
};

export default TestJSX;