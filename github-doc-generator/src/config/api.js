// src/config/api.js
import axios from 'axios';

const GITHUB_BASE_URL = 'https://api.github.com';
const SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const RAW_GITHUB_URL = 'https://raw.githubusercontent.com';

class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
    }
}

// Updated function to generate documentation
export const generateDocumentation = async (owner, repo, repoContent) => {
    try {
        const response = await fetch(`${SERVER_URL}/api/generate-docs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                repoContent,
                repoName: repo,
                owner
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new APIError(
                data.details || 'Failed to generate documentation',
                response.status
            );
        }

        return data.documentation;
    } catch (error) {
        console.error('Documentation generation error:', error);
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(
            'Failed to connect to documentation service',
            500
        );
    }
};

// Function to fetch GitHub repository data
export const fetchRepoData = async (owner, repo) => {
    try {
        const response = await axios.get(
            `${GITHUB_BASE_URL}/repos/${owner}/${repo}`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Repository data fetch error:', error);
        const message = error.response?.status === 404
            ? `Repository ${owner}/${repo} not found`
            : 'Failed to fetch repository data';
        throw new APIError(message, error.response?.status || 500);
    }
};

// Function to fetch repository contents
export const fetchRepoContents = async (owner, repo, branch = 'main') => {
    try {
        const response = await axios.get(
            `${GITHUB_BASE_URL}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        if (!response.data.tree) {
            throw new APIError('Repository structure not found', 404);
        }

        return response.data.tree;
    } catch (error) {
        console.error('Repository contents fetch error:', error);
        const message = error.response?.status === 404
            ? `Branch ${branch} not found in ${owner}/${repo}`
            : 'Failed to fetch repository contents';
        throw new APIError(message, error.response?.status || 500);
    }
};

// Function to fetch file content from GitHub
export const fetchFileContent = async (owner, repo, path, branch = 'main') => {
    try {
        const response = await axios.get(
            `${RAW_GITHUB_URL}/${owner}/${repo}/${branch}/${path}`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3.raw'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('File content fetch error:', error);
        const message = error.response?.status === 404
            ? `File ${path} not found in ${owner}/${repo}`
            : `Failed to fetch content for ${path}`;
        throw new APIError(message, error.response?.status || 500);
    }
};

// Helper function to determine which files to process
const shouldProcessFile = (filepath) => {
    // Only process these file types
    const includePatterns = [
        /\.(js|jsx|ts|tsx|py|java|rb|go|rs|php|cs)$/,  // Common programming languages
        /\.(md|txt)$/,  // Documentation files
        /package\.json$/,  // Package info
        /requirements\.txt$/,  // Python requirements
        /Cargo\.toml$/,  // Rust package info
        /composer\.json$/,  // PHP package info
        /\.gemspec$/,  // Ruby package info
    ];

    const excludePatterns = [
        /\.git\//,
        /node_modules\//,
        /venv\//,
        /dist\//,
        /build\//,
        /\.DS_Store/,
        /\.env/,
        /\.jpg$/, /\.png$/, /\.gif$/, /\.ico$/, /\.svg$/,
        /\.pdf$/, /\.doc$/, /\.docx$/,
        /\.min\.js$/,
        /\.min\.css$/,
        /\.test\.|\.spec\./,  // Test files
        /\.d\.ts$/,  // TypeScript declaration files
    ];

    // Check if file matches include patterns and doesn't match exclude patterns
    return includePatterns.some(pattern => pattern.test(filepath)) &&
           !excludePatterns.some(pattern => pattern.test(filepath));
};

// Updated helper function to combine all repository content with size limits
export const fetchAllRepoContent = async (owner, repo, branch = 'main') => {
    try {
        const files = await fetchRepoContents(owner, repo, branch);
        const MAX_FILES = 50; // Maximum number of files to process
        const MAX_FILE_SIZE = 100 * 1024; // Maximum file size (100KB)
        
        // Filter and limit files
        const eligibleFiles = files
            .filter(file => file.type === 'blob' && shouldProcessFile(file.path))
            .filter(file => file.size <= MAX_FILE_SIZE)
            .slice(0, MAX_FILES);

        const contentPromises = eligibleFiles.map(async file => {
            try {
                const content = await fetchFileContent(owner, repo, file.path, branch);
                return `File: ${file.path}\n\n${content}\n\n`;
            } catch (error) {
                console.warn(`Failed to fetch content for ${file.path}:`, error);
                return ''; // Skip files that fail to fetch
            }
        });
        
        const contents = await Promise.all(contentPromises);
        return contents.filter(content => content !== '').join('\n\n');
    } catch (error) {
        console.error('Repository content aggregation error:', error);
        throw error;
    }
};

// Function to create a pull request
export const createPullRequest = async (owner, repo, content, branch = 'update-readme') => {
    const token = process.env.REACT_APP_GITHUB_TOKEN;
    if (!token) {
        throw new APIError('GitHub service account token not configured', 500);
    }

    try {
        // 1. Create a fork of the repository
        const forkResponse = await axios.post(
            `${GITHUB_BASE_URL}/repos/${owner}/${repo}/forks`,
            {},
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // Wait a bit for the fork to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));

        const forkOwner = forkResponse.data.owner.login;

        // 2. Get the default branch's latest commit SHA from the original repo
        const baseRef = await axios.get(
            `${GITHUB_BASE_URL}/repos/${owner}/${repo}/git/ref/heads/main`,
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        const baseSha = baseRef.data.object.sha;

        // 3. Create a new branch in the fork
        try {
            await axios.post(
                `${GITHUB_BASE_URL}/repos/${forkOwner}/${repo}/git/refs`,
                {
                    ref: `refs/heads/${branch}`,
                    sha: baseSha
                },
                {
                    headers: {
                        'Authorization': `token ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );
        } catch (error) {
            // If branch already exists, we'll update it later
            console.log('Branch might already exist, continuing...');
        }

        // 4. Create or update README.md blob in the fork
        const blobResponse = await axios.post(
            `${GITHUB_BASE_URL}/repos/${forkOwner}/${repo}/git/blobs`,
            {
                content: content,
                encoding: 'utf-8'
            },
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // 5. Create a new tree in the fork
        const treeResponse = await axios.post(
            `${GITHUB_BASE_URL}/repos/${forkOwner}/${repo}/git/trees`,
            {
                base_tree: baseSha,
                tree: [{
                    path: 'README.md',
                    mode: '100644',
                    type: 'blob',
                    sha: blobResponse.data.sha
                }]
            },
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // 6. Create a commit in the fork
        const commitResponse = await axios.post(
            `${GITHUB_BASE_URL}/repos/${forkOwner}/${repo}/git/commits`,
            {
                message: 'docs: update README.md with AI-generated documentation',
                tree: treeResponse.data.sha,
                parents: [baseSha]
            },
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // 7. Update branch reference in the fork
        await axios.patch(
            `${GITHUB_BASE_URL}/repos/${forkOwner}/${repo}/git/refs/heads/${branch}`,
            {
                sha: commitResponse.data.sha,
                force: true
            },
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        // 8. Create pull request from the fork to the original repo
        const prResponse = await axios.post(
            `${GITHUB_BASE_URL}/repos/${owner}/${repo}/pulls`,
            {
                title: 'docs: update README with AI-generated documentation',
                body: 'This PR updates the README.md with AI-generated documentation based on the repository content.',
                head: `${forkOwner}:${branch}`,
                base: 'main'
            },
            {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );

        return prResponse.data.html_url;
    } catch (error) {
        console.error('Pull request creation error:', error);
        throw new APIError(
            error.response?.data?.message || 'Failed to create pull request',
            error.response?.status || 500
        );
    }
};