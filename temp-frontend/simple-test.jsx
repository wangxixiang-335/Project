import React from 'react';
import ReactDOM from 'react-dom/client';

const SimpleApp = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>简单测试页面</h1>
      <p>如果你能看到这个页面，说明React基础功能正常。</p>
      <div style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h2>测试状态</h2>
        <p>当前时间: {new Date().toLocaleString()}</p>
        <button 
          onClick={() => alert('按钮点击正常！')}
          style={{
            padding: '10px 20px',
            background: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          测试按钮
        </button>
      </div>
    </div>
  );
};

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<SimpleApp />);