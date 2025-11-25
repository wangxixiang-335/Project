import React, { useState } from 'react'
import axios from 'axios'

const API_BASE = '/api'

function FileUpload({ onUploadSuccess }) {
  const [uploading, setUploading] = useState(false)
  const [uploadType, setUploadType] = useState('image')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadResult, setUploadResult] = useState(null)

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      // 验证文件大小
      const maxSize = uploadType === 'image' ? 5 * 1024 * 1024 : 200 * 1024 * 1024
      if (file.size > maxSize) {
        alert(`文件太大！最大允许${uploadType === 'image' ? '5MB' : '200MB'}`)
        return
      }
      
      // 验证文件类型
      const imageTypes = ['image/jpeg', 'image/png', 'image/webp']
      const videoTypes = ['video/mp4', 'video/quicktime']
      
      const allowedTypes = uploadType === 'image' ? imageTypes : videoTypes
      if (!allowedTypes.includes(file.type)) {
        alert(`不支持的文件类型！请上传${uploadType === 'image' ? 'JPG、PNG或WEBP图片' : 'MP4或MOV视频'}`)
        return
      }
      
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请先选择文件')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      alert('请先登录')
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append(uploadType, selectedFile)

      const endpoint = uploadType === 'image' ? '/upload/image' : '/upload/video'
      const response = await axios.post(`${API_BASE}${endpoint}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setUploadResult(response.data.data)
        if (onUploadSuccess) {
          onUploadSuccess(response.data.data)
        }
        alert(`${uploadType === 'image' ? '图片' : '视频'}上传成功！`)
      }
    } catch (error) {
      console.error('上传失败:', error)
      alert('上传失败：' + (error.response?.data?.error || '网络错误'))
    }
    
    setUploading(false)
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
      <h3>文件上传</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <label>
          <input 
            type="radio" 
            value="image" 
            checked={uploadType === 'image'} 
            onChange={(e) => setUploadType(e.target.value)} 
          />
          上传图片 (最大5MB,支持JPG/PNG/WEBP)
        </label>
        <br />
        <label>
          <input 
            type="radio" 
            value="video" 
            checked={uploadType === 'video'} 
            onChange={(e) => setUploadType(e.target.value)} 
          />
          上传视频 (最大200MB,支持MP4/MOV)
        </label>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <input 
          type="file" 
          accept={uploadType === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/quicktime'}
          onChange={handleFileSelect}
        />
      </div>

      {selectedFile && (
        <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
          已选择文件: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
        </div>
      )}

      <button 
        onClick={handleUpload} 
        disabled={!selectedFile || uploading}
        style={{
          padding: '10px 20px',
          background: uploading ? '#ccc' : '#007acc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        {uploading ? '上传中...' : '开始上传'}
      </button>

      {uploadResult && (
        <div style={{ marginTop: '15px', padding: '10px', background: '#f0f8ff', borderRadius: '4px' }}>
          <h4>上传成功！</h4>
          <p><strong>文件URL:</strong> {uploadResult.url}</p>
          <p><strong>文件名:</strong> {uploadResult.file_name}</p>
          <p><strong>文件大小:</strong> {(uploadResult.file_size / 1024 / 1024).toFixed(2)}MB</p>
          {uploadResult.duration && <p><strong>视频时长:</strong> {uploadResult.duration}秒</p>}
        </div>
      )}
    </div>
  )
}

export default FileUpload