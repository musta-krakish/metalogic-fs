const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config.json');

const app = express();
app.use(cors());
app.use(express.json());

const validatePath = (requestedPath) => {
    if (!requestedPath) throw new Error("Path is required");
    const absolutePath = path.resolve(requestedPath);
    const isAllowed = config.directories.some(dir => absolutePath.startsWith(path.resolve(dir.path)));
    if (!isAllowed) throw new Error("Access Denied");
    return absolutePath;
};

app.get('/api/roots', (req, res) => res.json(config.directories));

// Расширенный список файлов с датами и размерами
app.get('/api/files', async (req, res) => {
    try {
        const targetPath = validatePath(req.query.path);
        const items = await fs.readdir(targetPath, { withFileTypes: true });

        const list = await Promise.all(items.map(async item => {
            const fullPath = path.join(targetPath, item.name);
            const stats = await fs.stat(fullPath);
            return {
                name: item.name,
                isDirectory: item.isDirectory(),
                path: path.join(req.query.path, item.name),
                size: stats.size,
                mtime: stats.mtime, // Дата изменения
                ext: path.extname(item.name).toLowerCase()
            };
        }));
        res.json(list);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

// Отдельный эндпоинт для скачивания/просмотра медиа (бинарный)
app.get('/api/raw', (req, res) => {
    try {
        const targetPath = validatePath(req.query.path);
        res.sendFile(targetPath);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

app.get('/api/content', async (req, res) => {
    try {
        const targetPath = validatePath(req.query.path);
        const content = await fs.readFile(targetPath, 'utf-8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: "Этот файл нельзя открыть как текст" });
    }
});

// Остальные методы (save, create, delete) оставляем как были...
app.post('/api/save', async (req, res) => {
    try {
        const targetPath = validatePath(req.body.path);
        await fs.writeFile(targetPath, req.body.content, 'utf-8');
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/create', async (req, res) => {
    try {
        const targetPath = validatePath(req.body.path);
        if (req.body.type === 'dir') await fs.ensureDir(targetPath);
        else await fs.ensureFile(targetPath);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/delete', async (req, res) => {
    try {
        const targetPath = validatePath(req.query.path);
        await fs.remove(targetPath);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));