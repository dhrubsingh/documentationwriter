import React, { useState } from 'react';
import { Github, FileText, AlertCircle } from 'lucide-react';
import { parseGitHubUrl, processRepository, generateReadme } from './documentationUtils';

const DocumentationGenerator = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [documentation, setDocumentation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateDocumentation = async () => {
        setIsLoading(true);
        setError('');
        
        try {
            // Parse GitHub URL to get owner and repo
            const { owner, repo } = parseGitHubUrl(repoUrl);
            
            // Process repository and generate documentation
            const { repoData, documentation } = await processRepository(owner, repo);
            
            // Generate final README content
            const readmeContent = generateReadme(repoData, documentation);
            
            setDocumentation(readmeContent);
        } catch (err) {
            setError(err.message);
            console.error('Documentation generation error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        const blob = new Blob([documentation], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'README.md';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
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

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center py-8">
                        <div className="animate-pulse">
                            <p className="text-gray-600">Analyzing repository and generating documentation...</p>
                            <p className="text-sm text-gray-500 mt-2">This may take a few minutes depending on the repository size</p>
                        </div>
                    </div>
                )}

                {/* Documentation Output */}
                {documentation && (
                    <div className="mt-6 border rounded-lg overflow-hidden">
                        <div className="flex justify-between items-center p-4 bg-gray-50 border-b">
                            <h3 className="text-lg font-semibold">Generated README.md</h3>
                            <button
                                onClick={handleDownload}
                                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                            >
                                <FileText className="h-4 w-4" />
                                Download README.md
                            </button>
                        </div>
                        <div className="p-4 bg-white">
                            <pre className="whitespace-pre-wrap font-mono text-sm">
                                {documentation}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentationGenerator;