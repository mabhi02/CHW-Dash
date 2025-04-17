'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function DirectPDFContent() {
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Get filename and page from query params
  const file = searchParams?.get('file') || 'who-guide.pdf';
  const page = parseInt(searchParams?.get('page') || '1', 10);
  
  useEffect(() => {
    // Add message listener for cross-origin communication
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'pdf-loaded' && iframeRef.current) {
        // Try to navigate to the page
        try {
          const iframeWindow = iframeRef.current.contentWindow as any;
          if (iframeWindow && iframeWindow.PDFViewerApplication) {
            iframeWindow.PDFViewerApplication.page = page;
          }
        } catch (error) {
          // Silently handle error
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [page]);
  
  const handleIframeLoad = () => {
    setIsLoaded(true);
  };
  
  // JavaScript to be injected into the page
  const injectJS = `
    if (typeof PDFViewerApplication !== 'undefined') {
      PDFViewerApplication.initialBookmark = "page=${page}";
    }
  `;
  
  return (
    <>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-10">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2">Loading PDF...</p>
            <p className="text-xs text-gray-400 mt-1">Navigating to page {page}</p>
          </div>
        </div>
      )}
      
      <iframe 
        ref={iframeRef}
        src={`/pdfs/${file}#page=${page}`}
        className="absolute inset-0 w-full h-full"
        title="PDF Viewer"
        onLoad={handleIframeLoad}
      />
      
      {/* Inject script to navigate to the page */}
      <script dangerouslySetInnerHTML={{ __html: injectJS }} />
    </>
  );
} 