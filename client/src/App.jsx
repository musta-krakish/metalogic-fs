import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Folder, File, ArrowLeft, Save, Trash2, Plus, ChevronRight } from 'lucide-react';

const API = '/api';

function App() {
  const [roots, setRoots] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);
  const [content, setContent] = useState('');

  useEffect(() => {
    axios.get(`${API}/roots`).then(res => setRoots(res.data));
  }, []);

  const loadFiles = async (path) => {
    setCurrentPath(path);
    setEditingFile(null);
    const res = await axios.get(`${API}/files?path=${encodeURIComponent(path)}`);
    setFiles(res.data);
  };

  const openFile = async (file) => {
    const res = await axios.get(`${API}/content?path=${encodeURIComponent(file.path)}`);
    setEditingFile(file.path);
    setContent(res.data.content);
  };

  const saveFile = async () => {
    await axios.post(`${API}/save`, { path: editingFile, content });
    alert('Сохранено!');
  };

  const deleteItem = async (path) => {
    if (window.confirm('Удалить?')) {
      await axios.delete(`${API}/delete?path=${encodeURIComponent(path)}`);
      loadFiles(currentPath);
    }
  };

  const createItem = async (type) => {
    const name = prompt(`Имя ${type === 'dir' ? 'папки' : 'файла'}:`);
    if (name) {
      await axios.post(`${API}/create`, { path: `${currentPath}/${name}`, type });
      loadFiles(currentPath);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>File Explorer</h2>
          {currentPath && (
            <button className="back-button" onClick={() => setCurrentPath('')}>
              <ArrowLeft size={16} /> Back to Root
            </button>
          )}
        </div>

        <div className="directory-container">
          {!currentPath ? (
            <div className="roots-list">
              {roots.map(r => (
                <div
                  key={r.path}
                  onClick={() => loadFiles(r.path)}
                  className="root-item"
                >
                  <Folder size={18} className="icon folder-icon" />
                  <span>{r.name}</span>
                  <ChevronRight size={16} className="chevron-icon" />
                </div>
              ))}
            </div>
          ) : (
            <div className="files-container">
              <div className="action-buttons">
                <button className="create-button" onClick={() => createItem('file')}>
                  <Plus size={14} /> New File
                </button>
                <button className="create-button" onClick={() => createItem('dir')}>
                  <Plus size={14} /> New Folder
                </button>
              </div>

              <div className="files-list">
                {files.map(f => (
                  <div key={f.path} className="file-item">
                    <div
                      className="file-name"
                      onClick={() => f.isDirectory ? loadFiles(f.path) : openFile(f)}
                    >
                      {f.isDirectory ?
                        <Folder size={18} className="icon folder-icon" /> :
                        <File size={18} className="icon file-icon" />
                      }
                      <span>{f.name}</span>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => deleteItem(f.path)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="editor-container">
        {editingFile ? (
          <>
            <div className="editor-header">
              <div className="file-path">{editingFile}</div>
              <button className="save-button" onClick={saveFile}>
                <Save size={16} /> Save
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="code-editor"
              spellCheck="false"
            />
          </>
        ) : (
          <div className="empty-editor">
            <File size={48} className="empty-icon" />
            <p>Select a file to edit</p>
          </div>
        )}
      </div>

      <style jsx>{`
        :root {
          --primary-color: #4a6ee0;
          --bg-color: #f5f7fa;
          --sidebar-bg: #ffffff;
          --border-color: #e1e5eb;
          --hover-bg: #f0f4ff;
          --text-color: #333;
          --text-secondary: #666;
}

        * {
          box-sizing: border-box;
        }
        
        .app-container {
          display: flex;
          height: 100vh;
          font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
          background-color: var(--bg-color);
          color: var(--text-color);
        }
        
        .sidebar {
          width: 280px;
          background-color: var(--sidebar-bg);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
          z-index: 10;
        }
        
        .sidebar-header {
          padding: 16px;
          border-bottom: 1px solid var(--border-color);
        }
        
        .sidebar-header h2 {
          margin: 0 0 10px 0;
          font-size: 18px;
          color: var(--primary-color);
        }
        
        .back-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 12px;
          color: var(--text-secondary);
          transition: all 0.2s;
        }
        
        .back-button:hover {
          background-color: var(--hover-bg);
          color: var(--primary-color);
        }
        
        .directory-container {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
        }
        
        .roots-list, .files-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .root-item {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          background-color: #f8f9fa;
          justify-content: space-between;
        }
        
        .root-item span {
          flex: 1;
          margin-left: 8px;
        }
        
        .root-item:hover {
          background-color: var(--hover-bg);
          color: var(--primary-color);
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .create-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
          flex: 1;
          justify-content: center;
        }
        
        .create-button:hover {
          background-color: #3a5bc7;
        }
        
        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .file-item:hover {
          background-color: var(--hover-bg);
        }
        
        .file-name {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          flex: 1;
        }
        
        .delete-button {
          visibility: hidden;
          background: transparent;
          border: none;
          color: #ff4757;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .delete-button:hover {
          background-color: rgba(255, 71, 87, 0.1);
        }
        
        .file-item:hover .delete-button {
          visibility: visible;
        }
        
        .icon {
          flex-shrink: 0;
        }
        
        .folder-icon {
          color: #ffc107;
        }
        
        .file-icon {
          color: #4a6ee0;
        }
        
        .chevron-icon {
          color: #aaa;
        }
        
        .editor-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          background-color: white;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
          margin: 16px;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-color);
          background-color: #f8f9fa;
        }
        
        .file-path {
          font-size: 14px;
          color: var(--text-secondary);
          font-family: monospace;
        }
        
        .save-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .save-button:hover {
          background-color: #3a5bc7;
        }
        
        .code-editor {
          flex: 1;
          padding: 16px;
          font-size: 14px;
          font-family: 'Fira Code', 'Courier New', monospace;
          border: none;
          resize: none;
          line-height: 1.6;
          outline: none;
        }
        
        .empty-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #aaa;
        }
        
        .empty-icon {
          margin-bottom: 16px;
          opacity: 0.5;
        }
      `}</style>
    </div>
  );
}

export default App;