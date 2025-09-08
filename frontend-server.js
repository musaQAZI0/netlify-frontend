const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from current directory
app.use(express.static(__dirname));

// Default route - serve event-builder.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'event-builder.html'));
});

// Serve specific HTML files
app.get('*.html', (req, res) => {
    const filename = req.path.substring(1); // Remove leading slash
    const filePath = path.join(__dirname, filename);
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).sendFile(path.join(__dirname, 'event-builder.html'));
        }
    });
});

// Handle API calls - redirect to backend
app.use('/api', (req, res) => {
    res.status(404).json({ 
        error: 'API endpoint not found. Backend should be running on http://localhost:3001' 
    });
});

// Handle all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'event-builder.html'));
});

app.listen(PORT, () => {
    console.log(`🎨 Frontend server running on http://localhost:${PORT}`);
    console.log(`📄 Event Builder available at http://localhost:${PORT}/event-builder.html`);
    console.log(`📡 Make sure backend is running on http://localhost:3002`);
});