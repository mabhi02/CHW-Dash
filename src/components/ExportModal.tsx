import React, { useState } from 'react';
import {
  Button,
  Card,
  Text,
  Select,
  SelectItem,
  Flex,
  Callout,
  Divider,
  Title,
} from '@tremor/react';
import { exportData } from '@/lib/exportUtils';
import { 
  ArrowDownTrayIcon, 
  XMarkIcon,
  DocumentTextIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { ExportOptions } from '@/types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionIds: string[];
  sessionNames: { id: string, name: string }[];
}

export default function ExportModal({
  isOpen,
  onClose,
  sessionIds,
  sessionNames
}: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle checkbox changes
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSessions([]);
    }
  };

  const handleSessionSelection = (id: string) => {
    if (selectedSessions.includes(id)) {
      setSelectedSessions(selectedSessions.filter(s => s !== id));
    } else {
      setSelectedSessions([...selectedSessions, id]);
    }
    setSelectAll(false);
  };

  // Handle export
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      
      await exportData(
        exportFormat, 
        selectAll ? 'all' : selectedSessions
      );
      
      onClose();
    } catch (err) {
      setError('Export failed. Please try again.');
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Title>Export Data</Title>
            <Button
              variant="light"
              icon={XMarkIcon}
              onClick={onClose}
            />
          </div>
          
          <Divider />
          
          <div className="my-4">
            <Text className="mb-2 font-medium">Export Format</Text>
            <Flex className="gap-4">
              <div 
                className={`cursor-pointer p-4 border rounded-md flex-1 ${exportFormat === 'csv' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                onClick={() => setExportFormat('csv')}
              >
                <Flex justifyContent="start" alignItems="center" className="gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <Text className="font-medium">CSV</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">Export as comma-separated values</Text>
                  </div>
                </Flex>
              </div>
              
              <div 
                className={`cursor-pointer p-4 border rounded-md flex-1 ${exportFormat === 'json' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}
                onClick={() => setExportFormat('json')}
              >
                <Flex justifyContent="start" alignItems="center" className="gap-2">
                  <CodeBracketIcon className="h-5 w-5 text-blue-500" />
                  <div>
                    <Text className="font-medium">JSON</Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">Export as structured JSON data</Text>
                  </div>
                </Flex>
              </div>
            </Flex>
          </div>
          
          <div className="my-4">
            <Text className="mb-2 font-medium">Select Sessions</Text>
            
            <Card className="mb-4">
              <Flex justifyContent="between" alignItems="center">
                <input 
                  type="checkbox" 
                  id="select-all" 
                  name="select-all" 
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="select-all" className="cursor-pointer flex-1 ml-2">
                  <Text>Select All Sessions</Text>
                </label>
                <Text color="gray">{sessionIds.length} sessions</Text>
              </Flex>
            </Card>
            
            {!selectAll && (
              <div className="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                <div className="p-2">
                  {sessionNames.map((session) => (
                    <div className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md" key={session.id}>
                      <input 
                        type="checkbox" 
                        id={`session-${session.id}`} 
                        name={`session-${session.id}`} 
                        value={session.id}
                        checked={selectedSessions.includes(session.id)}
                        onChange={() => handleSessionSelection(session.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`session-${session.id}`} className="cursor-pointer flex-1 ml-2">
                        <Text>{session.name || `Session ${session.id}`}</Text>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!selectAll && selectedSessions.length === 0 && (
              <Callout 
                title="No sessions selected" 
                color="amber"
                className="mt-4"
              >
                Please select at least one session to export, or choose "Select All Sessions".
              </Callout>
            )}
            
            {error && (
              <Callout 
                title="Export Error" 
                color="red"
                className="mt-4"
              >
                {error}
              </Callout>
            )}
          </div>
          
          <Flex justifyContent="end" className="mt-6 gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={ArrowDownTrayIcon}
              loading={isExporting}
              disabled={!selectAll && selectedSessions.length === 0}
              onClick={handleExport}
            >
              Export {selectAll ? 'All' : selectedSessions.length} Session{(selectAll || selectedSessions.length !== 1) ? 's' : ''}
            </Button>
          </Flex>
        </div>
      </div>
    </div>
  );
} 