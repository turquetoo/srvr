const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const compression = require('compression');
const helmet = require('helmet');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3001;

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
        ? [
            'https://instag-api-p2pfp.ondigitalocean.app',
            'https://insta-trek-ll8dg.ondigitalocean.app'
          ] 
        : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    optionsSuccessStatus: 200
}));

// Additional CORS headers for all responses
app.use((req, res, next) => {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
        ? [
            'https://instag-api-p2pfp.ondigitalocean.app',
            'https://insta-trek-ll8dg.ondigitalocean.app'
          ]
        : ['*'];
    
    const origin = req.headers.origin;
    if (process.env.NODE_ENV === 'production') {
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
    } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});
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
        
        const curlCommand = `curl -X POST "https://spyapp.website/api/n8n/getProfileData.php" \\
          --http2 \\
          -H "Authorization: Bearer 67f891fa157d1c7819702c7d" \\
          -H 'Accept: */*' \\
          -H 'Accept-Encoding: gzip, deflate, br, zstd' \\
          -H 'Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,fr;q=0.6' \\
          -H 'Content-Type: application/json' \\
          -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36' \\
          -H 'Origin: https://spyapp.solutions' \\
          -H 'Sec-Fetch-Site: cross-site' \\
          -H 'Sec-Fetch-Mode: cors' \\
          -H 'Sec-Fetch-Dest: empty' \\
          -H 'Referer: https://spyapp.solutions/' \\
          -H 'Priority: u=1, i' \\
          --compressed \\
          -d "{\\"username\\": \\"${username}\\"}"`;

        const { stdout } = await execAsync(curlCommand);
        
        if (!stdout || stdout.trim() === "") {
            return res.json({
                data: undefined,
                message: "Empty response from API",
            });
        }

        const data = JSON.parse(stdout);
        console.log(`Profile data response for ${username}:`, data);
        res.json(data);
    } catch (error) {
        console.error('Profile data error:', error);
        res.json({
            data: undefined,
            message: "Failed to fetch profile data",
        });
    }
});

app.post('/api/followers-stories', async (req, res) => {
    try {
        const { username } = req.body;
        
        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }
        
        console.log(`Fetching followers and stories for: ${username}`);
        
        const curlCommand = `curl -X POST "https://spyapp.website/api/n8n/getFollowersAndStories.php" \\
          --http2 \\
          -H "Authorization: Bearer 67f891fa157d1c7819702c7d" \\
          -H 'Sec-Ch-Ua-Platform: "Linux"' \\
          -H 'Accept-Language: en-US,en;q=0.9' \\
          -H 'Accept: application/json, text/plain, */*' \\
          -H 'Sec-Ch-Ua: "Not?A_Brand";v="99", "Chromium";v="130"' \\
          -H 'Content-Type: application/json' \\
          -H 'Sec-Ch-Ua-Mobile: ?0' \\
          -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.70 Safari/537.36' \\
          -H 'Origin: https://spyapp.solutions' \\
          -H 'Sec-Fetch-Site: cross-site' \\
          -H 'Sec-Fetch-Mode: cors' \\
          -H 'Sec-Fetch-Dest: empty' \\
          -H 'Referer: https://spyapp.solutions/' \\
          -H 'Priority: u=1, i' \\
          --compressed \\
          -d "{\\"username\\": \\"${username}\\"}"`;

        const { stdout } = await execAsync(curlCommand);
        const data = JSON.parse(stdout);
        console.log(`Followers and stories response for ${username}:`, data);
        res.json(data);
    } catch (error) {
        console.error('Followers and stories error:', error);
        res.json({
            data: {
                count: 0,
                items: [],
            },
            stories: {
                count: 0,
                items: [],
            },
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
        
        const curlCommand = `curl -X POST "https://spyapp.website/api/n8n/getFeedMidia.php" \\
          --http2 \\
          -H "Authorization: Bearer 67f891fa157d1c7819702c7d" \\
          -H 'Sec-Ch-Ua-Platform: "Linux"' \\
          -H 'Accept-Language: en-US,en;q=0.9' \\
          -H 'Accept: application/json, text/plain, */*' \\
          -H 'Sec-Ch-Ua: "Not?A_Brand";v="99", "Chromium";v="130"' \\
          -H 'Content-Type: application/json' \\
          -H 'Sec-Ch-Ua-Mobile: ?0' \\
          -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.6723.70 Safari/537.36' \\
          -H 'Origin: https://spyapp.solutions' \\
          -H 'Sec-Fetch-Site: cross-site' \\
          -H 'Sec-Fetch-Mode: cors' \\
          -H 'Sec-Fetch-Dest: empty' \\
          -H 'Referer: https://spyapp.solutions/' \\
          -H 'Priority: u=1, i' \\
          --compressed \\
          -d "{\\"username\\": \\"${username}\\"}"`;

        const { stdout } = await execAsync(curlCommand);
        const data = JSON.parse(stdout);
        console.log(`Feed media response for ${username}:`, data);
        res.json(data);
    } catch (error) {
        console.error('Feed media error:', error);
        res.json({
            data: {
                username,
                count: 0,
                items: [],
            },
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