// src/config/api.js
import axios from 'axios';

const GITHUB_BASE_URL = 'https://api.github.com';
const SERVER_URL = 'http://localhost:3001';
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

// Updated helper function to combine all repository content
export const fetchAllRepoContent = async (owner, repo, branch = 'main') => {
    try {
        const files = await fetchRepoContents(owner, repo, branch);
        const contentPromises = files
            .filter(file => file.type === 'blob' && shouldProcessFile(file.path))
            .map(async file => {
                const content = await fetchFileContent(owner, repo, file.path, branch);
                return `File: ${file.path}\n\n${content}\n\n`;
            });
        
        const contents = await Promise.all(contentPromises);
        return contents.join('\n\n');
    } catch (error) {
        console.error('Repository content aggregation error:', error);
        throw error;
    }
};

// Helper function to determine which files to process
const shouldProcessFile = (filepath) => {
    const excludePatterns = [
        /\.git\//,
        /node_modules\//,
        /\.DS_Store/,
        /\.env/,
        /\.jpg$/, /\.png$/, /\.gif$/, /\.ico$/,
        /\.pdf$/, /\.doc$/, /\.docx$/,
        /\.min\.js$/,
        /\.min\.css$/,
    ];

    return !excludePatterns.some(pattern => pattern.test(filepath));
};