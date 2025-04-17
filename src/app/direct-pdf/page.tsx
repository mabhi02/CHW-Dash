'use client';

import React, { Suspense } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import DirectPDFContent from '../../components/DirectPDFContent';

export default function DirectPDFPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="flex items-center gap-2 p-3 bg-gray-800 border-b border-gray-700">
        <Link href="/" className="text-gray-300 hover:text-white">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="font-semibold text-white">PDF Viewer</h1>
      </div>
      
      <div className="flex-1 relative">
        <Suspense fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Loading PDF viewer...</p>
            </div>
          </div>
        }>
          <DirectPDFContent />
        </Suspense>
      </div>
    </div>
  );
} 