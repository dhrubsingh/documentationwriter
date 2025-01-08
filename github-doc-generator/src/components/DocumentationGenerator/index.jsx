import React, { useState } from 'react';
import { Github, GitPullRequest, AlertCircle } from 'lucide-react';
import { parseGitHubUrl, processRepository, generateReadme } from './documentationUtils';
import { createPullRequest } from '../../config/api';
import MDEditor from '@uiw/react-md-editor';

const DocumentationGenerator = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [documentation, setDocumentation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [editableContent, setEditableContent] = useState('');
    const [prUrl, setPrUrl] = useState('');

    const handleGenerateDocumentation = async () => {
        setIsLoading(true);
        setError('');
        setPrUrl('');
        
        try {
            const { owner, repo } = parseGitHubUrl(repoUrl);
            const { repoData, documentation } = await processRepository(owner, repo);
            const readmeContent = generateReadme(repoData, documentation);
            
            setDocumentation(readmeContent);
            setEditableContent(readmeContent);
        } catch (err) {
            setError(err.message);
            console.error('Documentation generation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitPR = async () => {
        setIsLoading(true);
        setError('');

        try {
            const { owner, repo } = parseGitHubUrl(repoUrl);
            const prUrl = await createPullRequest(owner, repo, editableContent);
            setPrUrl(prUrl);
        } catch (err) {
            setError(err.message);
            console.error('PR submission error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex items-center gap-2 border-b pb-4">
                    <Github className="h-6 w-6" />
                    <h1 className="text-2xl font-bold">GitHub Documentation Generator</h1>
                </div>

                {/* Input Section */}
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
                        className="flex-1 p-3 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleGenerateDocumentation}
                        disabled={isLoading || !repoUrl}
                        className={`px-6 py-3 rounded font-medium text-white transition-colors 
                            ${isLoading || !repoUrl 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-500 hover:bg-blue-600'}`}
                    >
                        {isLoading ? 'Generating...' : 'Generate Docs'}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 p-4 text-red-500 bg-red-50 rounded">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* PR Success Message */}
                {prUrl && (
                    <div className="flex items-center gap-2 p-4 text-green-600 bg-green-50 rounded">
                        <GitPullRequest className="h-5 w-5" />
                        <span>Pull request created successfully! </span>
                        <a 
                            href={prUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                        >
                            View PR
                        </a>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-8">
                        <div className="animate-pulse">
                            <p className="text-gray-600">Analyzing repository and generating documentation...</p>
                            <p className="text-sm text-gray-500 mt-2">This may take a few minutes depending on the repository size</p>
                        </div>
                    </div>
                )}

                {/* Documentation Output with Editor */}
                {documentation && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                            <h3 className="text-lg font-semibold">Edit README.md</h3>
                            <button
                                onClick={handleSubmitPR}
                                disabled={isLoading}
                                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors
                                    ${isLoading 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-green-500 hover:bg-green-600'} text-white`}
                            >
                                <GitPullRequest className="h-4 w-4" />
                                Submit PR
                            </button>
                        </div>
                        <div data-color-mode="light">
                            <MDEditor
                                value={editableContent}
                                onChange={setEditableContent}
                                preview="live"
                                height={600}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentationGenerator;