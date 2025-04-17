import React, { useState, useRef } from 'react';
import { Button, Text, Card, Flex, Badge } from '@tremor/react';
import { DocumentTextIcon, ArrowUpTrayIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function PdfUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Skip non-PDF files
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          setError(`${file.name} is not a PDF file`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Upload failed');
        }

        const data = await response.json();
        setUploadedFiles(prev => [...prev, { name: data.filename, url: data.url }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="bg-gray-900 border border-gray-700 p-4">
      <Text className="text-white font-semibold mb-2">Upload Source PDFs</Text>
      <Text className="text-gray-300 text-sm mb-4">
        Upload PDF documents that will be linked from RAG chunks
      </Text>

      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        icon={ArrowUpTrayIcon}
        variant="secondary"
        color="indigo"
        className="bg-indigo-800 hover:bg-indigo-700 text-white w-full"
        onClick={handleFileSelect}
        loading={isUploading}
        disabled={isUploading}
      >
        {isUploading ? 'Uploading...' : 'Select PDF Files'}
      </Button>

      {error && (
        <Flex className="mt-4 p-2 bg-red-900/30 border border-red-700 rounded-md">
          <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
          <Text className="text-red-300 text-sm">{error}</Text>
        </Flex>
      )}

      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <Text className="text-white text-sm mb-2">Uploaded Files:</Text>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <Flex key={index} justifyContent="between" className="p-2 bg-gray-800 rounded-md">
                <Flex alignItems="center">
                  <DocumentTextIcon className="h-4 w-4 text-indigo-400 mr-2" />
                  <Text className="text-white text-sm truncate max-w-xs">{file.name}</Text>
                </Flex>
                <Badge icon={CheckCircleIcon} color="green">
                  Uploaded
                </Badge>
              </Flex>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
} 