const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Security and performance middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            connectSrc: ["'self'", "https:", "http:"],
            fontSrc: ["'self'", "https:", "data:"],
        },
    },
}));
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com', 'https://www.yourdomain.com'] 
        : '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API proxy endpoints
app.post('/api/profile-data', async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        console.log(`Fetching profile data for: ${username}`);
        
        const response = await fetch('https://spyapp.website/api/n8n/getProfileData.php', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 67f891fa157d1c7819702c7d',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.6',
                'Origin': 'https://spyapp.solutions',
                'Referer': 'https://spyapp.solutions/',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Priority': 'u=1, i'
            },
            body: JSON.stringify({ username }),
            timeout: 30000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Profile data response for ${username}:`, data);
        res.json(data);
    } catch (error) {
        console.error('Profile data error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch profile data', 
            message: error.message 
        });
    }
});

app.post('/api/followers-stories', async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        console.log(`Fetching followers for: ${username}`);
        
        const response = await fetch('https://spyapp.website/api/n8n/getFollowersAndStories.php', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 67f891fa157d1c7819702c7d',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.70 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://spyapp.solutions',
                'Referer': 'https://spyapp.solutions/',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Priority': 'u=1, i'
            },
            body: JSON.stringify({ username }),
            timeout: 30000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Followers data response for ${username}:`, data);
        res.json(data);
    } catch (error) {
        console.error('Followers error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch followers', 
            message: error.message 
        });
    }
});

app.post('/api/feed-media', async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        console.log(`Fetching feed media for: ${username}`);
        
        const response = await fetch('https://spyapp.website/api/n8n/getFeedMidia.php', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 67f891fa157d0c7819702c7d',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.70 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://spyapp.solutions',
                'Referer': 'https://spyapp.solutions/',
                'Sec-Fetch-Site': 'cross-site',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Dest': 'empty',
                'Priority': 'u=1, i'
            },
            body: JSON.stringify({ username }),
            timeout: 30000
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Feed media response for ${username}:`, data);
        res.json(data);
    } catch (error) {
        console.error('Feed media error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch feed media', 
            message: error.message 
        });
    }
});

// Image proxy
app.get('/api/proxy/instagram-image', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'URL parameter required' });
        }

        console.log(`Proxying image: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
                'Referer': 'https://www.instagram.com/',
                'Accept': 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            },
            timeout: 15000
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.set('Content-Type', contentType);
        }
        
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('Access-Control-Allow-Origin', '*');
        response.body.pipe(res);
    } catch (error) {
        console.error('Image proxy error:', error);
        
        // Return a fallback image on error
        const fallbackImageUrl = `https://picsum.photos/150/150?random=${Date.now()}`;
        try {
            const fallbackResponse = await fetch(fallbackImageUrl);
            if (fallbackResponse.ok) {
                res.set('Content-Type', 'image/jpeg');
                res.set('Cache-Control', 'public, max-age=3600');
                fallbackResponse.body.pipe(res);
            } else {
                res.status(500).json({ error: 'Failed to proxy image and fallback failed' });
            }
        } catch (fallbackError) {
            res.status(500).json({ error: 'Failed to proxy image' });
        }
    }
});

// Serve the Instagram clone
app.get('/upinstagram1.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upinstagram1.html'));
});

// Serve WhatsApp clone (if exists)
app.get('/upwhatsapp1.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upwhatsapp1.html'));
});

// Default route
app.get('/', (req, res) => {
    res.json({
        message: 'Instagram Clone Server API',
        version: '1.0.0',
        endpoints: {
            'Instagram Clone': '/upinstagram1.html?username=c.dthr',
            'Health Check': '/health',
            'API Endpoints': [
                'POST /api/profile-data',
                'POST /api/followers-stories', 
                'POST /api/feed-media',
                'GET /api/proxy/instagram-image'
            ]
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`📱 Instagram clone: http://0.0.0.0:${PORT}/upinstagram1.html?username=c.dthr`);
    console.log(`🔍 Health check: http://0.0.0.0:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 