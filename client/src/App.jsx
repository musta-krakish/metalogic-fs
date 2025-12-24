import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Folder, File, ArrowLeft, Save, Trash2, Plus,
  ChevronRight, Search, Clock, Download, X, Menu, FileText, Image as ImageIcon, Video, FileArchive
} from 'lucide-react';

const API = '/api';

function App() {
  const [roots, setRoots] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [editingFile, setEditingFile] = useState(null);
  const [content, setContent] = useState('');
  const [search, setSearch] = useState('');
  const [sortByDate, setSortByDate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    axios.get(`${API}/roots`).then(res => setRoots(res.data));
  }, []);

  const loadFiles = async (path) => {
    setCurrentPath(path);
    setEditingFile(null);
    const res = await axios.get(`${API}/files?path=${encodeURIComponent(path)}`);
    setFiles(res.data);
    if (window.innerWidth < 768) setSidebarOpen(false); // Закрыть меню на мобилках
  };

  const openFile = async (file) => {
    const isMedia = ['.mp4', '.webm', '.png', '.jpg', '.jpeg', '.gif', '.mp3'].includes(file.ext);
    const isDoc = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'].includes(file.ext);

    if (isMedia || isDoc) {
      setEditingFile({ ...file, type: isMedia ? 'media' : 'doc' });
    } else {
      try {
        const res = await axios.get(`${API}/content?path=${encodeURIComponent(file.path)}`);
        setEditingFile({ ...file, type: 'text', content: res.data.content });
        setContent(res.data.content);
      } catch (e) {
        alert("Не удалось открыть файл как текст");
      }
    }
  };

  // Фильтрация и поиск
  const filteredFiles = useMemo(() => {
    let result = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    if (sortByDate) {
      result.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    }
    return result;
  }, [files, search, sortByDate]);

  // Хлебные крошки
  const breadcrumbs = currentPath ? currentPath.split(/[/\\]/).filter(Boolean) : [];

  const getFileIcon = (f) => {
    if (f.isDirectory) return <Folder size={18} className="icon folder-icon" />;
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(f.ext)) return <ImageIcon size={18} className="icon img-icon" />;
    if (['.mp4', '.mov', '.avi'].includes(f.ext)) return <Video size={18} className="icon video-icon" />;
    if (['.zip', '.rar', '.7z'].includes(f.ext)) return <FileArchive size={18} className="icon zip-icon" />;
    return <FileText size={18} className="icon file-icon" />;
  };

  return (
    <div className="app-container">
      {/* Кнопка меню для мобилок */}
      <button className="mobile-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <Menu />
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Explorer</h2>
          <div className="search-box">
            <Search size={14} />
            <input
              placeholder="Поиск..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`sort-button ${sortByDate ? 'active' : ''}`}
            onClick={() => setSortByDate(!sortByDate)}
          >
            <Clock size={14} /> Сначала новые
          </button>
        </div>

        <div className="directory-container">
          {!currentPath ? (
            <div className="roots-list">
              {roots.map(r => (
                <div key={r.path} onClick={() => loadFiles(r.path)} className="root-item">
                  <Folder size={18} className="folder-icon" />
                  <span>{r.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="files-list">
              <button className="back-btn" onClick={() => setCurrentPath('')}><ArrowLeft size={14} /> К корню</button>
              {filteredFiles.map(f => (
                <div key={f.path} className="file-item">
                  <div className="file-name" onClick={() => f.isDirectory ? loadFiles(f.path) : openFile(f)}>
                    {getFileIcon(f)}
                    <div className="file-info">
                      <span className="name-text">{f.name}</span>
                      <span className="date-text">{new Date(f.mtime).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="breadcrumbs">
          <span onClick={() => setCurrentPath('')} className="crumb">Root</span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={14} />
              <span className="crumb" onClick={() => {
                const path = currentPath.split(crumb)[0] + crumb;
                loadFiles(path);
              }}>{crumb}</span>
            </React.Fragment>
          ))}
        </div>

        <div className="viewer-container">
          {editingFile ? (
            <div className="viewer">
              <div className="viewer-header">
                <span>{editingFile.name}</span>
                <div className="viewer-actions">
                  {editingFile.type === 'text' && <button onClick={() => {
                    axios.post(`${API}/save`, { path: editingFile.path, content });
                    alert("Сохранено");
                  }}><Save size={16} /> Сохранить</button>}
                  <a href={`${API}/raw?path=${encodeURIComponent(editingFile.path)}`} download>
                    <Download size={16} /> Скачать
                  </a>
                  <button onClick={() => setEditingFile(null)}><X size={16} /></button>
                </div>
              </div>

              <div className="viewer-body">
                {editingFile.type === 'text' && (
                  <textarea value={content} onChange={e => setContent(e.target.value)} className="editor" />
                )}

                {editingFile.type === 'media' && (
                  <div className="media-preview">
                    {['.mp4', '.webm'].includes(editingFile.ext) ? (
                      <video controls src={`${API}/raw?path=${encodeURIComponent(editingFile.path)}`} />
                    ) : (
                      <img src={`${API}/raw?path=${encodeURIComponent(editingFile.path)}`} alt="preview" />
                    )}
                  </div>
                )}

                {editingFile.type === 'doc' && (
                  <div className="doc-preview">
                    <FileText size={64} />
                    <p>Просмотр документов в браузере ограничен.</p>
                    <a className="download-big" href={`${API}/raw?path=${encodeURIComponent(editingFile.path)}`}>Скачать файл</a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">Выберите файл для просмотра</div>
          )}
        </div>
      </div>

      <style jsx>{`
        :root {
          --primary: #4a6ee0;
          --bg: #f0f2f5;
          --sidebar-w: 300px;
        }
        .app-container { display: flex; height: 100vh; background: var(--bg); font-family: sans-serif; }
        
        /* Sidebar & Mobile */
        .sidebar { 
          width: var(--sidebar-w); background: white; border-right: 1px solid #ddd; 
          display: flex; flex-direction: column; transition: 0.3s;
        }
        
        @media (max-width: 768px) {
          .sidebar { 
            position: fixed; left: -100%; top: 0; bottom: 0; z-index: 100; width: 85%; 
          }
          .sidebar.open { left: 0; }
          .mobile-menu-toggle { display: block !important; }
        }

        .mobile-menu-toggle {
            display: none; position: fixed; bottom: 20px; right: 20px; 
            z-index: 1000; background: var(--primary); color: white; 
            border: none; border-radius: 50%; width: 56px; height: 56px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .sidebar-header { padding: 15px; border-bottom: 1px solid #eee; }
        .search-box { 
            display: flex; align-items: center; background: #f5f5f5; 
            padding: 5px 10px; border-radius: 5px; margin: 10px 0;
        }
        .search-box input { border: none; background: transparent; margin-left: 5px; outline: none; width: 100%; }
        
        .sort-button { 
            width: 100%; padding: 8px; border: 1px solid #eee; background: white; 
            border-radius: 5px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 5px;
        }
        .sort-button.active { background: #eef2ff; border-color: var(--primary); color: var(--primary); }

        .directory-container { flex: 1; overflow-y: auto; }
        .file-item { 
            padding: 10px 15px; border-bottom: 1px solid #fafafa; cursor: pointer;
        }
        .file-item:hover { background: #f9f9f9; }
        .file-name { display: flex; align-items: center; gap: 10px; }
        .file-info { display: flex; flex-direction: column; }
        .name-text { font-size: 14px; color: #333; word-break: break-all; }
        .date-text { font-size: 11px; color: #999; }

        /* Main Content */
        .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .breadcrumbs { 
            padding: 10px 20px; background: white; display: flex; 
            align-items: center; gap: 5px; font-size: 13px; color: #666;
            border-bottom: 1px solid #ddd;
        }
        .crumb { cursor: pointer; color: var(--primary); }
        .crumb:hover { text-decoration: underline; }

        .viewer-container { flex: 1; padding: 20px; overflow: hidden; display: flex; }
        .viewer { background: white; flex: 1; border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .viewer-header { 
            padding: 10px 20px; border-bottom: 1px solid #eee; 
            display: flex; justify-content: space-between; align-items: center;
            background: #fdfdfd;
        }
        .viewer-actions { display: flex; gap: 10px; }
        .viewer-actions button, .viewer-actions a { 
            padding: 6px 12px; border: 1px solid #ddd; background: white; 
            border-radius: 4px; cursor: pointer; font-size: 13px; text-decoration: none; color: #333;
            display: flex; align-items: center; gap: 5px;
        }

        .viewer-body { flex: 1; overflow: auto; padding: 20px; display: flex; justify-content: center; }
        .editor { width: 100%; height: 100%; border: none; outline: none; font-family: monospace; resize: none; font-size: 14px; line-height: 1.5; }
        
        .media-preview img, .media-preview video { max-width: 100%; max-height: 80vh; border-radius: 4px; }
        
        .doc-preview { text-align: center; color: #888; margin-top: 50px; }
        .download-big { 
            display: inline-block; margin-top: 20px; padding: 12px 24px; 
            background: var(--primary); color: white; text-decoration: none; border-radius: 5px; 
        }

        .empty-state { margin: auto; color: #aaa; }
        
        .folder-icon { color: #ffca28; }
        .img-icon { color: #4caf50; }
        .video-icon { color: #f44336; }
        .file-icon { color: #2196f3; }
      `}</style>
    </div>
  );
}

export default App;