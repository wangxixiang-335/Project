import React, { useRef, useState, useCallback } from 'react';
import styles from './styles.module.css';

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '请输入内容...',
  className = '',
  height = '300px'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 执行编辑器命令
  const execCommand = useCallback((command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      handleContentChange();
    }
  }, []);

  // 处理内容变化
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // 处理图片上传
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const file = files[0];

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      setIsUploading(false);
      return;
    }

    // 验证文件大小 (最大 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB');
      setIsUploading(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      insertImageAtCursor(imageUrl);
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('图片读取失败，请重试');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);

    // 清空input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // 在光标位置插入图片
  const insertImageAtCursor = useCallback((imageUrl: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    
    // 获取当前选择范围
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    
    // 创建图片元素
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.margin = '8px 0';
    img.style.borderRadius = '4px';
    img.alt = '插入的图片';

    // 在光标位置插入图片
    range.insertNode(img);
    
    // 将光标移动到图片后面
    range.setStartAfter(img);
    range.setEndAfter(img);
    selection.removeAllRanges();
    selection.addRange(range);

    // 触发内容变化
    handleContentChange();
  }, [handleContentChange]);

  // 处理拖拽上传
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      // 只处理第一张图片
      const file = imageFiles[0];
      
      if (file.size > 10 * 1024 * 1024) {
        alert('图片大小不能超过 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        insertImageAtCursor(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  }, [insertImageAtCursor]);

  // 初始化编辑器内容
  React.useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || `<p>${placeholder}</p>`;
    }
  }, [value, placeholder]);

  return (
    <div className={`${styles.richTextEditor} ${className}`}>
      {/* 工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => execCommand('bold')}
            className={styles.toolbarButton}
            title="加粗"
          >
            <i className="fas fa-bold"></i>
          </button>
          <button
            type="button"
            onClick={() => execCommand('italic')}
            className={styles.toolbarButton}
            title="斜体"
          >
            <i className="fas fa-italic"></i>
          </button>
          <button
            type="button"
            onClick={() => execCommand('underline')}
            className={styles.toolbarButton}
            title="下划线"
          >
            <i className="fas fa-underline"></i>
          </button>
        </div>

        <div className={styles.toolbarDivider}></div>

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => execCommand('insertUnorderedList')}
            className={styles.toolbarButton}
            title="无序列表"
          >
            <i className="fas fa-list-ul"></i>
          </button>
          <button
            type="button"
            onClick={() => execCommand('insertOrderedList')}
            className={styles.toolbarButton}
            title="有序列表"
          >
            <i className="fas fa-list-ol"></i>
          </button>
        </div>

        <div className={styles.toolbarDivider}></div>

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => execCommand('justifyLeft')}
            className={styles.toolbarButton}
            title="左对齐"
          >
            <i className="fas fa-align-left"></i>
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyCenter')}
            className={styles.toolbarButton}
            title="居中对齐"
          >
            <i className="fas fa-align-center"></i>
          </button>
          <button
            type="button"
            onClick={() => execCommand('justifyRight')}
            className={styles.toolbarButton}
            title="右对齐"
          >
            <i className="fas fa-align-right"></i>
          </button>
        </div>

        <div className={styles.toolbarDivider}></div>

        <div className={styles.toolbarGroup}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`${styles.toolbarButton} ${styles.imageButton}`}
            title="插入图片"
            disabled={isUploading}
          >
            <i className="fas fa-image"></i>
            {isUploading && <span className={styles.uploadingIndicator}></span>}
          </button>
        </div>

        <div className={styles.toolbarGroup}>
          <span className={styles.dragHint}>
            支持拖拽上传图片
          </span>
        </div>
      </div>

      {/* 编辑器内容区域 */}
      <div
        ref={editorRef}
        className={styles.editorContent}
        contentEditable={!isUploading}
        onInput={handleContentChange}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        suppressContentEditableWarning={true}
        style={{ minHeight: height }}
        data-placeholder={placeholder}
      />

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className={styles.hiddenInput}
      />
    </div>
  );
};

export default RichTextEditor;