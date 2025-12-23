const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config.json');

const app = express();
app.use(cors());
app.use(express.json());

// Проверка, что путь находится внутри разрешенных директорий (безопасность)
const validatePath = (requestedPath) => {
    const absolutePath = path.resolve(requestedPath);
    const isAllowed = config.directories.some(dir => absolutePath.startsWith(path.resolve(dir.path)));
    if (!isAllowed) throw new Error("Access Denied");
    return absolutePath;
};

// Получить список папок из конфига
app.get('/api/roots', (req, res) => {
    res.json(config.directories);
});

// Список файлов в директории
app.get('/api/files', async (req, res) => {
    try {
        const targetPath = validatePath(req.query.path);
        const items = await fs.readdir(targetPath, { withFileTypes: true });
        const list = items.map(item => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.join(req.query.path, item.name)
        }));
        res.json(list);
    } catch (err) {
        res.status(403).json({ error: err.message });
    }
});

// Чтение файла
app.get('/api/content', async (req, res) => {
    try {
        const targetPath = validatePath(req.query.path);
        const content = await fs.readFile(targetPath, 'utf-8');
        res.json({ content });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Сохранение файла
app.post('/api/save', async (req, res) => {
    try {
        const targetPath = validatePath(req.body.path);
        await fs.writeFile(targetPath, req.body.content, 'utf-8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Создание файла или папки
app.post('/api/create', async (req, res) => {
    try {
        const targetPath = validatePath(req.body.path);
        if (req.body.type === 'dir') {
            await fs.ensureDir(targetPath);
        } else {
            await fs.ensureFile(targetPath);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Удаление
app.delete('/api/delete', async (req, res) => {
    try {
        const targetPath = validatePath(req.query.path);
        await fs.remove(targetPath);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));