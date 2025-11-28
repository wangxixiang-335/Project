import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const TestMinimal: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState({
    title: '测试项目',
    submitTime: '2024-01-01',
    updateTime: '2024-01-01',
    image: 'test.jpg',
    background: '<p>背景</p>',
    description: '<p>描述</p>'
  });

  const renderContent = () => (
    <React.Fragment>
      <div className="content">
        <h1>{projectData.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: projectData.description }} />
      </div>
    </React.Fragment>
  );

  return (
    <div className="page-wrapper">
      <header>Header</header>
      <aside>Sidebar</aside>
      <main>
        {loading ? (
          <div>Loading...</div>
        ) : (
          renderContent()
        )}
      </main>
    </div>
  );
};

export default TestMinimal;