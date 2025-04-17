'use client';

import React, { Suspense } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Import the PDF viewer component
import PDFViewerContent from '../../components/PDFViewerContent';

export default function PDFViewerPage() {
  return (
    <div className="w-full h-screen flex flex-col bg-gray-900">
      <div className="p-3 bg-gray-800 text-white border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-gray-300 hover:text-white">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="font-semibold text-lg">WHO Guide PDF</h1>
        </div>
      </div>
      
      <div className="flex-grow relative">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-70 z-10">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Loading PDF...</p>
            </div>
          </div>
        }>
          <PDFViewerContent />
        </Suspense>
      </div>
    </div>
  );
} 