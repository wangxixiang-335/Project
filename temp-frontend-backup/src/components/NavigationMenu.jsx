import React from 'react';
import './NavigationMenu.css';

const NavigationMenu = ({ activeTab, setActiveTab, userRole }) => {
  const menuItems = userRole === 'student' 
    ? [
        { id: 'home', label: '首页', icon: '🏠' },
        { id: 'publish', label: '成果发布', icon: '📤' },
        { id: 'manage', label: '成果管理', icon: '📋' },
        { id: 'dashboard', label: '数据看板', icon: '📊' }
      ]
    : [
        { id: 'teacher-home', label: '首页', icon: '🏠' },
        { id: 'teacher-approval', label: '成果审批', icon: '✅' },
        { id: 'teacher-publish', label: '成果发布', icon: '📤' },
        { id: 'teacher-manage', label: '成果管理', icon: '📋' },
        { id: 'teacher-library', label: '成果查看', icon: '📚' },
        { id: 'teacher-dashboard', label: '数据看板', icon: '📈' }
      ];

  return (
    <nav className="navigation-menu">
      <div className="menu-container">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default NavigationMenu;