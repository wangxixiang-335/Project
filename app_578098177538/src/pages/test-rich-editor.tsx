import React, { useState } from 'react';
import RichTextEditor from '../components/RichTextEditor';

const TestRichEditor: React.FC = () => {
  const [content, setContent] = useState('<p>测试富文本编辑器内容...</p>');
  const [previewMode, setPreviewMode] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-900">富文本编辑器测试</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  previewMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {previewMode ? '编辑模式' : '预览模式'}
              </button>
            </div>
          </div>
          
          {!previewMode ? (
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="请输入内容，支持直接插入图片..."
              height="400px"
            />
          ) : (
            <div className="border rounded-lg p-4 min-h-[400px]">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">内容预览：</h3>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          )}
        </div>

        {/* 显示原始HTML内容 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">HTML内容：</h3>
          <div className="bg-gray-100 rounded p-4 font-mono text-sm overflow-auto max-h-48">
            <pre>{content}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestRichEditor;