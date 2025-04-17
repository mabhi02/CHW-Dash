import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  // Get the PDF filename and page from query parameters
  const searchParams = new URL(request.url).searchParams;
  const filename = searchParams.get('file') || 'who-guide.pdf';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  try {
    // Path to the PDF file
    const pdfPath = path.join(process.cwd(), 'public', 'pdfs', filename);
    
    // Check if the file exists
    if (!fs.existsSync(pdfPath)) {
      return new NextResponse('PDF not found', { status: 404 });
    }
    
    // Read the PDF file
    const pdfContent = fs.readFileSync(pdfPath);
    
    // Generate a very simple HTML wrapper that embeds the PDF with the specific page
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename} - Page ${page}</title>
        <style>
          body, html { margin: 0; padding: 0; height: 100%; }
          #pdf-container { width: 100%; height: 100%; }
        </style>
        <script>
          // Function to navigate to a specific page when the PDF is loaded
          function loadPdf() {
            const pdfViewer = document.getElementById('pdf-viewer');
            // Set the PDF location with the page parameter
            pdfViewer.src = "/pdfs/${filename}#page=${page}";
          }
          
          // Attempt multiple navigation strategies after loading
          window.onload = function() {
            loadPdf();
            
            // Try multiple times with delays
            setTimeout(loadPdf, 1000);
            setTimeout(loadPdf, 2000);
          }
        </script>
      </head>
      <body>
        <iframe id="pdf-viewer" width="100%" height="100%" frameborder="0"></iframe>
      </body>
      </html>
    `;
    
    // Return the HTML wrapper
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    console.error('Error serving PDF:', error);
    return new NextResponse('Error serving PDF', { status: 500 });
  }
} 