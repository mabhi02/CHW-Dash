'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ArrowDownCircleIcon } from '@heroicons/react/24/outline';

export default function PDFViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [iframeUrl, setIframeUrl] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    // Get parameters
    const file = searchParams.get('file') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const search = searchParams.get('search') || '';
    
    setPageNumber(page);
    setSearchTerm(search);
    
    // Use URL hash parameters directly in the iframe src
    // This is more reliable than script injection
    let url = `/pdfs/${file}#page=${page}`;
    setIframeUrl(url);
    setIsLoaded(false);
    setSearchAttempted(false);
  }, [searchParams]);
  
  // Function to perform search when user clicks the search button
  const performSearch = () => {
    if (!iframeRef.current || !searchTerm) return;
    
    try {
      // Try a more reliable approach for PDF searching
      // 1. Focus the iframe first
      iframeRef.current.focus();
      
      // 2. Use window.find which is more reliable
      window.setTimeout(() => {
        try {
          // Focus and try find in the parent window first
          window.focus();
          (window as any).find(searchTerm);
          
          // Then try in the iframe
          iframeRef.current?.contentWindow?.focus();
          (iframeRef.current?.contentWindow as any)?.find?.(searchTerm);
        } catch (e) {
          // Silently handle error
        }
      }, 500);
      
      setSearchAttempted(true);
    } catch (error) {
      // Silently handle error
    }
  };
  
  // Force navigation to the correct page after PDF loads
  const navigateToPage = () => {
    if (!iframeRef.current) return;
    
    try {
      // Update the iframe src with the hash parameter
      const file = searchParams.get('file') || '';
      iframeRef.current.src = `/pdfs/${file}#page=${pageNumber}`;
    } catch (error) {
      // Silently handle error
    }
  };
  
  // Handle iframe loaded event
  const handleIframeLoad = () => {
    setIsLoaded(true);
    
    // If we have a search term, attempt to find it after a short delay
    if (searchTerm && !searchAttempted) {
      setTimeout(() => {
        performSearch();
      }, 1000);
    }
  };
  
  // Allow manual page navigation
  const goToPage = (page: number) => {
    const file = searchParams.get('file') || '';
    const search = searchParams.get('search') || '';
    
    // Update URL
    const params = new URLSearchParams();
    params.set('file', file);
    params.set('page', page.toString());
    if (search) params.set('search', search);
    
    // Also update iframe src directly with hash parameter
    if (iframeRef.current) {
      iframeRef.current.src = `/pdfs/${file}#page=${page}`;
    }
    
    // Also update the URL for future reference
    router.push(`/pdf-viewer?${params.toString()}`);
  };
  
  // Get returnUrl from query params or default to '/'
  const returnUrl = searchParams?.get('returnUrl') || '/';
  
  return (
    <>
      <div className="flex items-center gap-2 p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center ml-4">
          <button 
            onClick={() => goToPage(Math.max(1, pageNumber - 1))}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-l"
          >
            Prev
          </button>
          <div className="bg-gray-700 px-2 py-1 text-xs flex items-center">
            Page
            <input 
              type="number" 
              value={pageNumber}
              min={1}
              max={80}
              onChange={(e) => {
                const page = parseInt(e.target.value, 10);
                if (!isNaN(page) && page > 0) {
                  setPageNumber(page);
                }
              }}
              onBlur={() => goToPage(pageNumber)}
              onKeyDown={(e) => e.key === 'Enter' && goToPage(pageNumber)}
              className="w-12 mx-1 bg-gray-600 text-center px-1 py-0.5 rounded"
            />
            of 80
          </div>
          <button 
            onClick={() => goToPage(Math.min(80, pageNumber + 1))}
            className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-r"
          >
            Next
          </button>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <div className="bg-gray-700 rounded-md flex items-center px-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Find in document..."
              className="px-2 py-1 text-sm bg-transparent text-white border-none outline-none w-64"
            />
            <button 
              onClick={performSearch}
              className="p-1 text-gray-300 hover:text-white"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
          </div>
          
          <button 
            onClick={() => window.open(`/pdfs/${searchParams.get('file') || ''}`, '_blank')}
            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Open in New Tab
          </button>
        </div>
      </div>
      
      <div className="flex items-center mt-2 text-sm text-gray-300 px-3">
        <div className="flex items-center">
          <span className="font-medium mr-1">{searchParams.get('file') || 'No file'}</span>
          {pageNumber > 1 && (
            <span className="bg-blue-700 text-xs px-2 py-0.5 rounded-full">
              Page {pageNumber}
            </span>
          )}
        </div>
        
        {searchTerm && (
          <div className="ml-4 flex items-center text-yellow-300 text-xs">
            <ArrowDownCircleIcon className="h-4 w-4 mr-1" />
            <span>Showing relevant content from "{searchTerm}"</span>
          </div>
        )}
      </div>

      <div className="flex-grow relative h-full">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-10">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Loading PDF...</p>
              <p className="text-xs text-gray-400 mt-1">Navigating to page {pageNumber}</p>
            </div>
          </div>
        )}
        
        {iframeUrl ? (
          <iframe 
            ref={iframeRef}
            src={iframeUrl}
            className="absolute inset-0 w-full h-full border-none"
            title="PDF Viewer"
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <p>No PDF specified</p>
          </div>
        )}
      </div>
    </>
  );
} 