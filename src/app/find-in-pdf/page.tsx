'use client';

import React, { Suspense } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import FindInPDFContent from '../../components/FindInPDFContent';

export default function FindInPDFPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md w-full bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center mb-6">
          <Link href="/" className="mr-3 text-gray-300 hover:text-white">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">PDF Helper</h1>
        </div>
        
        <Suspense fallback={
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p>Loading PDF viewer...</p>
          </div>
        }>
          <FindInPDFContent />
        </Suspense>
      </div>
    </div>
  );
} 