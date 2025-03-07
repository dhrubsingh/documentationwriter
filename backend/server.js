// server.js
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();
const axios = require('axios');

const app = express();

// CORS configuration for Vercel frontend
app.use(cors({
    origin: ['https://documentationwriter.vercel.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
}));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    // Log CORS-related headers
    console.log('Origin:', req.headers.origin);
    console.log('Access-Control-Request-Method:', req.headers['access-control-request-method']);
    console.log('Access-Control-Request-Headers:', req.headers['access-control-request-headers']);
    next();
});

// Add CORS headers explicitly for all responses
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY,
});

// Add a simple health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Documentation Writer API is running' });
});

const DOCUMENTATION_PROMPT = `Generate a comprehensive README.md for the GitHub repository following this exact structure and formatting rules:

1. Repository Title (ONLY ONCE at the top)
   - Only include "# " followed by the repository name
   - Do not add any emojis to the title

2. Project Overview Section (titled "## 📖 Project Overview")
   - Write 2-3 detailed sentences explaining what the project does
   - Include its purpose, main functionality, and target users

3. Technical Architecture Section (titled "## 🏗️ Technical Architecture")
   - Write 1-2 sentences describing the overall technical structure
   - Explain how the main components interact
   - Mention key technologies used

4. File Documentation Section (titled "## 📁 File Documentation")
   - For each main file:
     * Use "### 📄 filename" format for file names
     * Write 1-2 specific sentences about the file's purpose and role

5. Installation & Usage Section
   - Title as "## 🔧 Installation"
   - Format installation commands in code blocks using triple backticks with bash:
     \`\`\`bash
     command here
     \`\`\`
   - Title usage section as "## 🚀 Usage"
   - Format code examples in appropriate language blocks:
     \`\`\`python
     code here
     \`\`\`

6. Requirements Section (titled "## 📋 Requirements")
   - List dependencies with version numbers
   - Include system requirements
   - Format installation commands in code blocks

7. License Section (titled "## 📝 License")
   - State the project's license

Formatting Rules:
- Never duplicate the title
- Always use triple backticks with language specifiers for code blocks
- Keep proper markdown heading hierarchy (# for title, ## for sections, ### for subsections)
- Include blank lines before and after headings and code blocks
- Use bullet points for lists
- Format inline code references with single backticks
- Maintain consistent spacing between sections`;

app.post('/api/generate-docs', async (req, res) => {
    try {
        // First check if we have the API key
        if (!process.env.DEEPSEEK_API_KEY) {
            console.error('DeepSeek API key is not configured');
            return res.status(500).json({
                error: 'Server configuration error',
                details: 'DeepSeek API key is not configured'
            });
        }

        const { repoContent, repoName, owner } = req.body;
        
        if (!repoContent) {
            return res.status(400).json({ 
                error: 'Repository content is required' 
            });
        }

        const contextPrompt = `
Repository: ${owner ? `${owner}/` : ''}${repoName || 'Unknown Repository'}

Repository Content:
${repoContent}`;

        try {
            const completion = await openai.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an expert software documentation writer who specializes in creating detailed, accurate, and practical documentation. Ensure all code blocks are properly formatted with language specifiers and triple backticks, and maintain consistent markdown formatting throughout the document."
                    },
                    {
                        role: "user",
                        content: `${DOCUMENTATION_PROMPT}\n\nRepository Details:\n${contextPrompt}`
                    }
                ],
                model: "deepseek-chat",
                temperature: 0.1,
                max_tokens: 4000,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            });

            const documentation = completion.choices[0].message.content.trim();
            res.json({ documentation });
        } catch (apiError) {
            console.error('DeepSeek API error:', apiError);
            if (apiError.message.includes('Authentication')) {
                return res.status(500).json({
                    error: 'API Authentication Error',
                    details: 'Failed to authenticate with the AI service. Please check API key configuration.'
                });
            }
            throw apiError;
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate documentation', 
            details: error.message 
        });
    }
});

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// GitHub OAuth callback endpoint
app.get('/api/github/callback', async (req, res) => {
    const code = req.query.code;
    
    if (!code) {
        return res.status(400).json({ error: 'Code is required' });
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: code
            },
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        const accessToken = tokenResponse.data.access_token;

        // Redirect back to frontend with the token
        res.redirect(`${process.env.FRONTEND_URL}?token=${accessToken}`);
    } catch (error) {
        console.error('GitHub OAuth error:', error);
        res.status(500).json({ error: 'Failed to authenticate with GitHub' });
    }
});

// Update port configuration
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});