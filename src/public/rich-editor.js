/**
 * 富文本编辑器模块 - 支持图片上传到Supabase存储桶
 * 类似学习通的图文混合编辑体验
 */

class RichTextEditor {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.options = {
            placeholder: options.placeholder || '请输入内容，支持文字和图片混合编辑...',
            maxImages: options.maxImages || 10,
            uploadEndpoint: options.uploadEndpoint || '/api/upload/image',
            onImageUpload: options.onImageUpload || null,
            onContentChange: options.onContentChange || null
        };
        
        this.editor = null;
        this.toolbar = null;
        this.imageUploadInput = null;
        this.uploadedImages = [];
        
        this.init();
    }

    init() {
        this.createEditor();
        this.setupEventListeners();
        this.setupImageUpload();
    }

    createEditor() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('富文本编辑器容器未找到:', this.containerId);
            return;
        }

        // 创建编辑器HTML结构
        container.innerHTML = `
            <div class="rich-editor-container">
                <div class="rich-editor-toolbar">
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" data-command="bold" title="加粗">
                            <strong>B</strong>
                        </button>
                        <button type="button" class="toolbar-btn" data-command="italic" title="斜体">
                            <em>I</em>
                        </button>
                        <button type="button" class="toolbar-btn" data-command="underline" title="下划线">
                            <u>U</u>
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" data-command="justifyLeft" title="左对齐">
                            ⬅️
                        </button>
                        <button type="button" class="toolbar-btn" data-command="justifyCenter" title="居中">
                            ↔️
                        </button>
                        <button type="button" class="toolbar-btn" data-command="justifyRight" title="右对齐">
                            ➡️
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" data-command="insertOrderedList" title="有序列表">
                            1️⃣
                        </button>
                        <button type="button" class="toolbar-btn" data-command="insertUnorderedList" title="无序列表">
                            •
                        </button>
                    </div>
                    <div class="toolbar-group">
                        <button type="button" class="toolbar-btn" id="insertImageBtn" title="插入图片">
                            🖼️
                        </button>
                        <button type="button" class="toolbar-btn" data-command="removeFormat" title="清除格式">
                            🧹
                        </button>
                    </div>
                </div>
                <div class="rich-editor-content" 
                     contenteditable="true" 
                     data-placeholder="${this.options.placeholder}">
                </div>
                <div class="rich-editor-status">
                    <span class="image-count">图片: <span id="imageCount">0</span>/${this.options.maxImages}</span>
                    <span class="upload-status" id="uploadStatus"></span>
                </div>
            </div>
        `;

        this.toolbar = container.querySelector('.rich-editor-toolbar');
        this.editor = container.querySelector('.rich-editor-content');
        this.imageCountElement = container.querySelector('#imageCount');
        this.uploadStatusElement = container.querySelector('#uploadStatus');

        // 设置编辑器样式
        this.applyStyles();
    }

    applyStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .rich-editor-container {
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
                background: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .rich-editor-toolbar {
                background: #f8f9fa;
                border-bottom: 1px solid #ddd;
                padding: 8px;
                display: flex;
                gap: 15px;
                flex-wrap: wrap;
            }
            
            .toolbar-group {
                display: flex;
                gap: 5px;
                align-items: center;
            }
            
            .toolbar-btn {
                padding: 6px 10px;
                border: 1px solid #ccc;
                background: white;
                cursor: pointer;
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .toolbar-btn:hover {
                background: #e6f2ff;
                border-color: #007bff;
            }
            
            .toolbar-btn:active {
                background: #007bff;
                color: white;
            }
            
            .rich-editor-content {
                min-height: 300px;
                padding: 20px;
                font-size: 16px;
                line-height: 1.6;
                outline: none;
            }
            
            .rich-editor-content:empty::before {
                content: attr(data-placeholder);
                color: #999;
                font-style: italic;
            }
            
            .rich-editor-content img {
                max-width: 100%;
                height: auto;
                border-radius: 8px;
                margin: 10px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
            
            .rich-editor-content img:hover {
                box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            }
            
            .rich-editor-status {
                background: #f8f9fa;
                border-top: 1px solid #ddd;
                padding: 8px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                color: #666;
            }
            
            .image-count {
                font-weight: 500;
            }
            
            .upload-status {
                color: #28a745;
                font-size: 12px;
            }
            
            .upload-status.error {
                color: #dc3545;
            }
            
            .upload-status.info {
                color: #17a2b8;
            }
        `;
        
        if (!document.querySelector('#rich-editor-styles')) {
            style.id = 'rich-editor-styles';
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // 工具栏按钮事件
        this.toolbar.addEventListener('click', (e) => {
            const btn = e.target.closest('.toolbar-btn');
            if (btn && btn.dataset.command) {
                e.preventDefault();
                this.execCommand(btn.dataset.command);
            }
        });

        // 插入图片按钮
        const insertImageBtn = document.getElementById('insertImageBtn');
        if (insertImageBtn) {
            insertImageBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.triggerImageUpload();
            });
        }

        // 编辑器内容变化事件
        if (this.editor) {
            this.editor.addEventListener('input', () => {
                this.updateImageCount();
                if (this.options.onContentChange) {
                    this.options.onContentChange(this.getContent());
                }
            });

            // 粘贴事件处理
            this.editor.addEventListener('paste', (e) => {
                this.handlePaste(e);
            });
        }
    }

    setupImageUpload() {
        // 创建隐藏的文件输入框
        this.imageUploadInput = document.createElement('input');
        this.imageUploadInput.type = 'file';
        this.imageUploadInput.accept = 'image/*';
        this.imageUploadInput.style.display = 'none';
        this.imageUploadInput.addEventListener('change', (e) => {
            this.handleImageUpload(e.target.files[0]);
        });
        document.body.appendChild(this.imageUploadInput);
    }

    execCommand(command) {
        document.execCommand(command, false, null);
        this.editor.focus();
    }

    triggerImageUpload() {
        // 检查图片数量限制
        if (this.uploadedImages.length >= this.options.maxImages) {
            this.showUploadStatus(`最多允许上传 ${this.options.maxImages} 张图片`, 'error');
            return;
        }
        
        // 确保编辑器有焦点，并且光标在合适的位置
        this.ensureEditorFocusAndCursor();
        
        this.imageUploadInput.click();
    }

    ensureEditorFocusAndCursor() {
        if (!this.editor) return;
        
        // 确保编辑器获得焦点
        this.editor.focus();
        
        const selection = window.getSelection();
        
        // 检查是否有有效的选择范围
        if (!selection || selection.rangeCount === 0) {
            this.log('没有选择范围，创建默认光标位置');
            this.createCursorAtEnd();
            return;
        }
        
        const range = selection.getRangeAt(0);
        
        // 检查光标是否在编辑器内
        if (!this.editor.contains(range.commonAncestorContainer)) {
            this.log('光标不在编辑器内，重新定位');
            this.createCursorAtEnd();
            return;
        }
        
        this.log('光标位置检查通过');
    }

    async handleImageUpload(file) {
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            this.showUploadStatus('请选择图片文件', 'error');
            return;
        }

        // 验证文件大小（最大5MB）
        if (file.size > 5 * 1024 * 1024) {
            this.showUploadStatus('图片大小不能超过5MB', 'error');
            return;
        }

        this.showUploadStatus('正在上传图片...', 'info');

        const formData = new FormData();
        formData.append('file', file);

        try {
            // 获取认证token
            const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            if (!token) {
                throw new Error('未找到认证token，请先登录');
            }

            const response = await fetch(this.options.uploadEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            const result = await response.json();

            if (result.success && result.data && result.data.url) {
                // 记录上传的图片
                this.uploadedImages.push({
                    url: result.data.url,
                    originalName: file.name,
                    size: file.size,
                    uploadTime: new Date().toISOString()
                });

                // 在编辑器中插入图片
                this.insertImageToEditor(result.data.url, file.name);
                
                this.showUploadStatus('图片上传成功！', 'success');
                
                // 调用回调函数
                if (this.options.onImageUpload) {
                    this.options.onImageUpload(result.data);
                }

                this.updateImageCount();
            } else {
                throw new Error(result.message || '上传失败');
            }
        } catch (error) {
            console.error('图片上传错误:', error);
            this.showUploadStatus(`上传失败: ${error.message}`, 'error');
        }
    }

    insertImageToEditor(imageUrl, altText = '上传的图片') {
        if (!this.editor) return;

        this.log(`开始插入图片: ${imageUrl}`);
        
        // 确保编辑器获得焦点并检查光标位置
        this.ensureEditorFocusAndCursor();
        
        // 获取当前选择
        const selection = window.getSelection();
        let range = null;
        
        // 尝试获取当前光标位置
        if (selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0);
            
            // 检查是否在编辑器内部
            if (!this.editor.contains(range.commonAncestorContainer)) {
                this.log('光标不在编辑器内，创建新的光标位置');
                range = this.createCursorAtEnd();
                if (!range) {
                    this.insertAtEnd(this.createImageHtml(imageUrl, altText));
                    return;
                }
            }
        } else {
            this.log('没有选择范围，创建新的光标位置');
            range = this.createCursorAtEnd();
            if (!range) {
                this.insertAtEnd(this.createImageHtml(imageUrl, altText));
                return;
            }
        }
        
        // 记录插入位置信息
        this.logCursorPosition(range);
        
        // 创建并插入图片
        const imgElement = this.createImageElement(imageUrl, altText);
        
        try {
            // 在光标位置插入图片
            range.insertNode(imgElement);
            
            // 在图片后添加换行符，方便继续输入
            const br = document.createElement('br');
            range.insertNode(br);
            
            // 将光标移动到换行符后面
            range.setStartAfter(br);
            range.collapse(true);
            
            // 更新选择
            selection.removeAllRanges();
            selection.addRange(range);
            
            this.log('✅ 图片已插入到光标位置');
            this.showUploadStatus('图片已插入到光标位置', 'success');
            
            // 触发内容变化事件
            if (this.options.onContentChange) {
                this.options.onContentChange(this.getContent());
            }
            
        } catch (error) {
            console.warn('光标位置插入失败，使用后备方案:', error);
            this.insertAtEnd(this.createImageHtml(imageUrl, altText));
        }
        
        this.editor.focus();
    }

    createImageElement(imageUrl, altText) {
        const imgElement = document.createElement('img');
        imgElement.src = imageUrl;
        imgElement.alt = altText;
        imgElement.style.maxWidth = '100%';
        imgElement.style.height = 'auto';
        imgElement.style.borderRadius = '8px';
        imgElement.style.margin = '10px 0';
        imgElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        return imgElement;
    }

    createImageHtml(imageUrl, altText) {
        return `<img src="${imageUrl}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 10px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" />`;
    }

    logCursorPosition(range) {
        try {
            const container = range.commonAncestorContainer;
            const containerText = container.textContent || '';
            const cursorPosition = range.startOffset;
            
            this.log(`光标位置信息:`);
            this.log(`- 容器类型: ${container.nodeType === Node.TEXT_NODE ? '文本节点' : '元素节点'}`);
            this.log(`- 容器内容: "${containerText.substring(Math.max(0, cursorPosition - 20), cursorPosition + 20)}"`);
            this.log(`- 光标位置: ${cursorPosition} / ${containerText.length}`);
            
        } catch (error) {
            this.log(`获取光标位置信息失败: ${error.message}`);
        }
    }

    createCursorAtEnd() {
        try {
            const selection = window.getSelection();
            const range = document.createRange();
            
            // 获取编辑器的最后一个子节点
            let lastNode = this.editor.lastChild;
            
            if (!lastNode) {
                // 如果编辑器为空，添加一个空文本节点
                const emptyText = document.createTextNode('');
                this.editor.appendChild(emptyText);
                lastNode = emptyText;
            }
            
            // 如果是元素节点，在其内部末尾创建位置
            if (lastNode.nodeType === Node.ELEMENT_NODE) {
                range.selectNodeContents(lastNode);
                range.collapse(false);
            } else {
                // 如果是文本节点，在末尾创建位置
                range.setStart(lastNode, lastNode.textContent.length);
                range.collapse(true);
            }
            
            selection.removeAllRanges();
            selection.addRange(range);
            
            this.log('✅ 已在编辑器末尾创建光标位置');
            return range;
            
        } catch (error) {
            console.error('创建光标位置失败:', error);
            return null;
        }
    }

    insertAtEnd(imgHtml) {
        // 确保编辑器最后有一个换行符
        if (!this.editor.innerHTML.endsWith('<br>')) {
            this.editor.innerHTML += '<br>';
        }
        
        // 在末尾插入图片和换行符
        this.editor.innerHTML += imgHtml + '<br>';
        
        // 将光标移动到最后
        this.setCursorToEnd();
        
        this.log('图片已插入到编辑器末尾');
    }

    setCursorToEnd() {
        const range = document.createRange();
        const selection = window.getSelection();
        
        // 选择编辑器的最后一个子节点
        const lastChild = this.editor.lastChild;
        if (lastChild) {
            range.selectNodeContents(lastChild);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    log(message) {
        console.log(`[RichTextEditor] ${message}`);
    }

    handlePaste(e) {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                this.handleImageUpload(file);
                break;
            }
        }
    }

    updateImageCount() {
        if (!this.imageCountElement) return;
        
        // 重新统计编辑器中的图片
        const images = this.editor.querySelectorAll('img');
        this.uploadedImages = Array.from(images).map(img => ({
            url: img.src,
            alt: img.alt || '图片'
        }));
        
        this.imageCountElement.textContent = images.length;
    }

    showUploadStatus(message, type = 'info') {
        if (!this.uploadStatusElement) return;
        
        this.uploadStatusElement.textContent = message;
        this.uploadStatusElement.className = `upload-status ${type}`;
        
        // 3秒后清除状态信息
        setTimeout(() => {
            this.uploadStatusElement.textContent = '';
            this.uploadStatusElement.className = 'upload-status';
        }, 3000);
    }

    getContent() {
        return this.editor ? this.editor.innerHTML : '';
    }

    setContent(content) {
        if (this.editor) {
            this.editor.innerHTML = content;
            this.updateImageCount();
        }
    }

    getTextContent() {
        return this.editor ? this.editor.textContent || '' : '';
    }

    getImages() {
        return this.uploadedImages;
    }

    clear() {
        if (this.editor) {
            this.editor.innerHTML = '';
            this.uploadedImages = [];
            this.updateImageCount();
        }
    }

    focus() {
        if (this.editor) {
            this.editor.focus();
        }
    }

    // 验证内容（检查图片数量等）
    validate() {
        const content = this.getContent();
        const images = this.getImages();
        
        if (images.length > this.options.maxImages) {
            return {
                valid: false,
                error: `最多允许上传 ${this.options.maxImages} 张图片`
            };
        }
        
        return {
            valid: true,
            content: content,
            images: images
        };
    }

    // 销毁编辑器
    destroy() {
        if (this.imageUploadInput) {
            this.imageUploadInput.remove();
        }
        
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
}

// 导出供全局使用
window.RichTextEditor = RichTextEditor;

export default RichTextEditor;