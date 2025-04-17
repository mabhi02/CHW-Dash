import { Session, SessionSummary, RagChunk, MatrixEvaluation } from '@/types';

interface ExportData {
  conversations: Session[];
  summaries: SessionSummary[];
  chunks: RagChunk[];
  matrix: MatrixEvaluation[];
}

/**
 * Convert an object to a CSV row
 */
const objectToCSVRow = (obj: any): string => {
  const values = Object.values(obj);
  return values.map(value => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
    return `"${String(value).replace(/"/g, '""')}"`;
  }).join(',');
};

/**
 * Convert data to CSV format
 */
export const convertToCSV = (data: ExportData): string => {
  const csvContent: string[] = [];
  
  // Add conversation messages
  if (data.conversations.length > 0) {
    const headers = Object.keys(data.conversations[0]).join(',');
    csvContent.push('CONVERSATION MESSAGES');
    csvContent.push(headers);
    
    data.conversations.forEach(row => {
      csvContent.push(objectToCSVRow(row));
    });
    
    csvContent.push(''); // Empty line between tables
  }
  
  // Add session summaries
  if (data.summaries.length > 0) {
    const headers = Object.keys(data.summaries[0]).join(',');
    csvContent.push('SESSION SUMMARIES');
    csvContent.push(headers);
    
    data.summaries.forEach(row => {
      csvContent.push(objectToCSVRow(row));
    });
    
    csvContent.push(''); // Empty line between tables
  }
  
  // Add RAG chunks
  if (data.chunks.length > 0) {
    const headers = Object.keys(data.chunks[0]).join(',');
    csvContent.push('RAG CHUNKS');
    csvContent.push(headers);
    
    data.chunks.forEach(row => {
      csvContent.push(objectToCSVRow(row));
    });
    
    csvContent.push(''); // Empty line between tables
  }
  
  // Add matrix evaluations
  if (data.matrix.length > 0) {
    const headers = Object.keys(data.matrix[0]).join(',');
    csvContent.push('MATRIX EVALUATIONS');
    csvContent.push(headers);
    
    data.matrix.forEach(row => {
      csvContent.push(objectToCSVRow(row));
    });
  }
  
  return csvContent.join('\n');
};

/**
 * Initiate download of a file
 */
export const downloadFile = (content: string, fileName: string, contentType: string): void => {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
};

/**
 * Export data in the selected format
 */
export const exportData = async (format: 'csv' | 'json', sessions: string[] | 'all'): Promise<void> => {
  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        format,
        sessions,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Export request failed');
    }
    
    const result = await response.json();
    const { data } = result;
    
    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const timestamp = `${dateStr}_${timeStr}`;
    
    // Export based on format
    if (format === 'csv') {
      const csvContent = convertToCSV(data);
      downloadFile(csvContent, `chatCHW_export_${timestamp}.csv`, 'text/csv');
    } else {
      // JSON format
      const jsonContent = JSON.stringify(data, null, 2);
      downloadFile(jsonContent, `chatCHW_export_${timestamp}.json`, 'application/json');
    }
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}; 