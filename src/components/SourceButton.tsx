import React, { useState } from 'react';
import { Button, Card, Text, Badge, Flex } from '@tremor/react';
import { DocumentTextIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getSourceDisplayName, getPdfUrl, parseSourceString } from '@/lib/pdfUtils';
import { RagChunk } from '@/types';

interface SourceButtonProps {
  chunks: RagChunk[];
  sessionId: string;
}

export default function SourceButton({ chunks, sessionId }: SourceButtonProps) {
  const [showSources, setShowSources] = useState(false);

  // Group chunks by source for better organization
  const chunksBySource = chunks.reduce((acc, chunk) => {
    const source = chunk.source || 'Unknown';
    if (!acc[source]) {
      acc[source] = [];
    }
    acc[source].push(chunk);
    return acc;
  }, {} as Record<string, RagChunk[]>);

  const sourceCount = Object.keys(chunksBySource).length;

  if (chunks.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        size="xs"
        icon={DocumentTextIcon}
        iconPosition="left"
        variant="secondary"
        color="indigo"
        className="bg-indigo-800 hover:bg-indigo-700 text-white"
        onClick={() => setShowSources(!showSources)}
      >
        {showSources ? 'Hide Sources' : 'Show Sources'} 
        <Badge size="xs" color="indigo" className="ml-2">{sourceCount}</Badge>
        {showSources ? 
          <ChevronUpIcon className="h-4 w-4 ml-1" /> : 
          <ChevronDownIcon className="h-4 w-4 ml-1" />
        }
      </Button>

      {showSources && (
        <Card className="absolute z-10 mt-1 w-96 max-w-full bg-gray-800 border border-gray-700 shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <Text className="text-white font-semibold">Source Documents</Text>
            <Button
              size="xs"
              icon={XMarkIcon}
              variant="light"
              color="gray"
              onClick={() => setShowSources(false)}
            />
          </div>
          
          <div className="overflow-y-auto max-h-96">
            {Object.entries(chunksBySource).map(([source, sourceChunks], idx) => {
              const displayName = getSourceDisplayName(source);
              const { fileName, page } = parseSourceString(source);
              const pdfUrl = getPdfUrl(source);
              
              return (
                <div key={idx} className="mb-3 pb-3 border-b border-gray-700 last:border-0">
                  <Flex alignItems="start" justifyContent="between">
                    <Text className="text-white text-sm font-medium">{displayName}</Text>
                    <Badge size="xs" color="indigo">{sourceChunks.length} chunks</Badge>
                  </Flex>
                  
                  <div className="mt-1 text-xs text-gray-300">
                    {pdfUrl ? (
                      <a 
                        href={`/pdfs/${fileName || 'who-guide.pdf'}#page=${page || 1}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          // Get most accurate page from source
                          const { fileName, page } = parseSourceString(source);
                          const targetPage = page || 1;
                          
                          // Use direct PDF URL
                          window.open(`/pdfs/${fileName || 'who-guide.pdf'}#page=${targetPage}`, '_blank');
                          e.preventDefault();
                        }}
                        className="flex items-center text-indigo-400 hover:text-indigo-300"
                      >
                        <DocumentTextIcon className="h-3 w-3 mr-1" />
                        Open PDF Source {page ? `(Page ${page})` : ''}
                      </a>
                    ) : (
                      <span>Source not available as PDF</span>
                    )}
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    {sourceChunks.map((chunk, chunkIdx) => {
                      // Use the original parseSourceString to get the correct page
                      const { fileName, page } = parseSourceString(source);
                      
                      return (
                        <div 
                          key={chunkIdx} 
                          className="text-xs p-1 px-2 rounded bg-gray-700 text-gray-300 cursor-pointer hover:bg-gray-600"
                          title={`Click to open PDF to page ${page || '?'} and search for text`}
                          onClick={() => {
                            // Get the page number from the source
                            const { fileName, page } = parseSourceString(source);
                            const targetPage = page || 1;
                            
                            // Log the navigation attempt
                            console.log(`Opening PDF ${fileName} at page ${targetPage}`);
                            
                            // MOST RELIABLE METHOD: Direct PDF URL with #page= fragment
                            // This works in all browsers with native PDF viewers
                            window.open(`/pdfs/${fileName || 'who-guide.pdf'}#page=${targetPage}`, '_blank');
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="line-clamp-2">"{chunk.text.substring(0, 80)}..."</span>
                            {page && <Badge size="xs" color="blue" className="ml-1 shrink-0">Pg. {page}</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
} 