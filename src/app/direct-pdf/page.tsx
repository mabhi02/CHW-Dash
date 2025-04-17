'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function DirectPDFViewer() {
  const searchParams = useSearchParams();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Get filename and page from query params
  const file = searchParams.get('file') || 'who-guide.pdf';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
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
          console.error('Error setting page:', error);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [page]);
  
  // JavaScript to be injected into the page
  const injectJS = `
    if (typeof PDFViewerApplication !== 'undefined') {
      PDFViewerApplication.initialBookmark = "page=${page}";
    }
  `;
  
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="flex items-center gap-2 p-3 bg-gray-800 border-b border-gray-700">
        <Link href="/" className="text-gray-300 hover:text-white">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-white">PDF Viewer - Page {page}</h1>
      </div>
      
      <div className="flex-1 relative">
        <iframe 
          ref={iframeRef}
          src={`/pdfs/${file}#page=${page}`}
          className="absolute inset-0 w-full h-full"
          title="PDF Viewer"
        />
        
        {/* Inject script to navigate to the page */}
        <script dangerouslySetInnerHTML={{ __html: injectJS }} />
      </div>
    </div>
  );
} 