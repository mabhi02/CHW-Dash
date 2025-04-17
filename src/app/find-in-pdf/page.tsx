'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function FindInPDF() {
  const searchParams = useSearchParams();
  const [isSearching, setIsSearching] = useState(false);
  
  // Get query parameters
  const file = searchParams.get('file') || 'who-guide.pdf';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const searchText = searchParams.get('text') || '';
  
  useEffect(() => {
    // Simple method: directly open the PDF with page parameter
    // and call window.find() after a delay
    const url = `/pdfs/${file}#page=${page}`;
    const newWindow = window.open(url, '_blank');
    
    // Give the PDF time to load, then search for text
    if (newWindow && searchText) {
      setIsSearching(true);
      
      setTimeout(() => {
        try {
          // Try to find the text in the new window
          newWindow.focus();
          (newWindow as any).find(searchText);
          
          // Try again after a bit more time
          setTimeout(() => {
            newWindow.focus();
            (newWindow as any).find(searchText);
          }, 2000);
        } catch (error) {
          console.error('Error searching:', error);
        }
        setIsSearching(false);
      }, 1500);
    }
  }, [file, page, searchText]);
  
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-6">
          <Link href="/" className="mr-3 text-gray-300 hover:text-white">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">PDF Helper</h1>
        </div>
        
        {isSearching ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p>Opening PDF at page {page} and searching for "{searchText}"...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p>PDF should be opening in a new tab.</p>
            <p className="text-sm text-gray-400">
              If the PDF didn't open or the search didn't work, try these tips:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
              <li>Make sure popup blockers are disabled</li>
              <li>Try again with a more specific search term</li>
              <li>Navigate manually to page {page}</li>
              <li>Use Ctrl+F to search for "{searchText}" once the PDF is open</li>
            </ul>
            
            <div className="mt-6 pt-4 border-t border-gray-700">
              <Link 
                href={`/pdfs/${file}#page=${page}`}
                target="_blank"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded"
              >
                Open PDF Directly (Page {page})
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 