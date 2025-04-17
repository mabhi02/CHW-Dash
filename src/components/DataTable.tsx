import React, { useState } from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Badge,
  Card,
  Button,
  Flex,
  TextInput,
  Select,
  SelectItem,
  Divider,
} from '@tremor/react';
import { 
  ArrowPathIcon, 
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Session, SessionSummary, RagChunk, MatrixEvaluation } from '@/types';
import ExportModal from './ExportModal';
import { getSourceDisplayName, getPdfUrl } from '@/lib/pdfUtils';

interface DataTableProps {
  data: {
    conversations: Session[];
    summaries: SessionSummary[];
    chunks: RagChunk[];
    matrix: MatrixEvaluation[];
    sessionIds: string[];
  };
  isLoading: boolean;
  responseTime?: number;
  error?: Error;
  mutate: () => void;
}

interface SessionGroup {
  sessionId: string;
  messages: Session[];
  summary?: SessionSummary;
  chunkCount: number;
  matrixCount: number;
  latestTimestamp?: string;
}

export default function DataTable({
  data,
  isLoading,
  responseTime,
  error,
  mutate,
}: DataTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  // Group data by session ID
  const groupDataBySession = (): SessionGroup[] => {
    const sessionGroups = new Map<string, SessionGroup>();
    
    if (!data) return [];
    
    // Initialize session groups with empty values
    data.sessionIds.forEach(sessionId => {
      sessionGroups.set(sessionId, {
        sessionId,
        messages: [],
        chunkCount: 0,
        matrixCount: 0
      });
    });
    
    // Add conversations
    data.conversations.forEach(message => {
      const group = sessionGroups.get(message.session_id);
      if (group) {
        group.messages.push(message);
        
        // Update latest timestamp if this message is newer
        if (!group.latestTimestamp || message.timestamp > group.latestTimestamp) {
          group.latestTimestamp = message.timestamp;
        }
      }
    });
    
    // Add summaries
    data.summaries.forEach(summary => {
      const group = sessionGroups.get(summary.session_id);
      if (group) {
        group.summary = summary;
        
        // Ensure we have a timestamp even if no messages
        if (!group.latestTimestamp) {
          group.latestTimestamp = summary.timestamp;
        }
      }
    });
    
    // Count chunks and matrix evaluations
    data.chunks.forEach(chunk => {
      const group = sessionGroups.get(chunk.session_id);
      if (group) {
        group.chunkCount++;
      }
    });
    
    data.matrix.forEach(evaluation => {
      const group = sessionGroups.get(evaluation.session_id);
      if (group) {
        group.matrixCount++;
      }
    });
    
    return Array.from(sessionGroups.values());
  };

  const getInitialMessage = (messages: Session[]): string => {
    // First try to find a user message with phase 'initial'
    const userMessages = messages.filter(m => m.message_type === 'user' && m.phase === 'initial');
    if (userMessages.length > 0) {
      return userMessages[0].content;
    }
    
    // If not found, use any message's content
    if (messages.length > 0) {
      return messages[0].content;
    }
    
    return 'No initial message';
  };

  const getDiagnosis = (group: SessionGroup): string => {
    if (group.summary?.diagnosis) {
      return group.summary.diagnosis;
    }
    
    // Check if diagnosis is in metadata of any message
    const diagnosisMessage = group.messages.find(m => m.metadata && m.metadata.diagnosis);
    if (diagnosisMessage?.metadata?.diagnosis) {
      return diagnosisMessage.metadata.diagnosis;
    }
    
    return 'No diagnosis available';
  };

  const formatDate = (timestamp?: string): string => {
    if (!timestamp) return 'Unknown date';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  const sessionGroups = groupDataBySession();
  
  // Filter data based on search term
  const filteredGroups = sessionGroups.filter(group => 
    group.messages.some(message => 
      message.content.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    group.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.summary?.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.summary?.initial_complaint || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredGroups.length / rowsPerPage);
  const paginatedGroups = filteredGroups.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Prepare session names for export modal
  const sessionNames = sessionGroups.map(group => {
    let name = 'Session';
    // Try to get a meaningful name from various sources
    if (group.summary?.initial_complaint) {
      name = group.summary.initial_complaint.substring(0, 30) + '...';
    } else if (group.messages.length > 0) {
      name = getInitialMessage(group.messages).substring(0, 30) + '...';
    }
    return {
      id: group.sessionId,
      name
    };
  });

  if (error) {
    return (
      <Card className="mt-6 bg-tremor-background-subtle">
        <Text color="red">Error loading data: {error.message}</Text>
        <Button 
          className="mt-4" 
          variant="secondary" 
          icon={ArrowPathIcon}
          onClick={() => mutate()}
        >
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card className="mt-6 bg-gray-900 border border-gray-700 overflow-hidden">
        <div className="mb-6">
          <Flex className="justify-between items-center gap-4 flex-col sm:flex-row">
            <Flex className="w-full sm:w-auto">
              <TextInput
                icon={MagnifyingGlassIcon}
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page on search
                }}
                className="w-full sm:w-64 placeholder-gray-400"
              />
            </Flex>
            <Flex className="gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <Text className="text-white">
                {sessionGroups.length || 0} sessions • {responseTime || 0}ms
              </Text>
              <Button 
                variant="secondary" 
                icon={ArrowDownTrayIcon} 
                onClick={() => setShowExportModal(true)}
                className="ml-2 bg-gray-700 text-white hover:bg-gray-600"
              >
                Export
              </Button>
              <Button 
                variant="secondary" 
                icon={ArrowPathIcon} 
                loading={isLoading}
                onClick={() => mutate()}
                className="bg-gray-700 text-white hover:bg-gray-600"
              >
                Refresh
              </Button>
            </Flex>
          </Flex>
        </div>
        
        <div>
          <Table>
            <TableHead>
              <TableRow className="bg-gray-900">
                <TableHeaderCell className="w-[140px] text-gray-300">Session ID</TableHeaderCell>
                <TableHeaderCell className="text-gray-300">Initial Complaint</TableHeaderCell>
                <TableHeaderCell className="text-gray-300">Diagnosis</TableHeaderCell>
                <TableHeaderCell className="w-[180px] text-gray-300">Date/Time</TableHeaderCell>
                <TableHeaderCell className="w-[90px] text-center text-gray-300">Messages</TableHeaderCell>
                <TableHeaderCell className="w-[90px] text-center text-gray-300">RAG Chunks</TableHeaderCell>
                <TableHeaderCell className="w-[90px] text-center text-gray-300">Matrix Evals</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Text className="text-white">Loading data...</Text>
                  </TableCell>
                </TableRow>
              ) : paginatedGroups.length > 0 ? (
                paginatedGroups.map((group) => (
                  <React.Fragment key={group.sessionId}>
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-700 bg-gray-800"
                      onClick={() => toggleRow(group.sessionId)}
                    >
                      <TableCell>
                        <div className="font-mono bg-gray-700 px-2 py-1 rounded text-xs inline-block">
                          {group.sessionId.substring(0, 10)}
                          {group.sessionId.length > 10 ? '...' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate text-white">
                          {(() => {
                            const complaint = group.summary?.initial_complaint || getInitialMessage(group.messages);
                            if (complaint.length > 40) {
                              return complaint.substring(0, 40) + '...';
                            }
                            return complaint;
                          })()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="truncate text-white">
                          {(() => {
                            const diagnosis = getDiagnosis(group);
                            const limit = 50;
                            if (diagnosis.length > limit) {
                              const breakPoint = diagnosis.lastIndexOf(' ', limit);
                              const cutoffPoint = breakPoint > 30 ? breakPoint : limit;
                              return diagnosis.substring(0, cutoffPoint) + '...';
                            }
                            return diagnosis;
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{formatDate(group.latestTimestamp)}</TableCell>
                      <TableCell className="text-center text-white">{group.messages.length}</TableCell>
                      <TableCell className="text-center text-white">{group.chunkCount}</TableCell>
                      <TableCell className="text-center text-white">{group.matrixCount}</TableCell>
                    </TableRow>
                    {expandedRows.has(group.sessionId) && (
                      <TableRow className="bg-gray-900">
                        <TableCell colSpan={7} className="p-4 overflow-hidden">
                          <div className="flex flex-col gap-4 max-w-full overflow-hidden">
                            {/* Session Details Section */}
                            <div className="flex flex-col sm:flex-row justify-between gap-3">
                              <div>
                                <Text className="text-sm font-semibold mb-1 text-white">Session Details</Text>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                  <div className="font-mono bg-gray-700 px-2 py-1 rounded text-xs inline-block break-all text-white">
                                    {group.sessionId}
                                  </div>
                                  <Badge color="blue">{formatDate(group.latestTimestamp)}</Badge>
                                </div>
                              </div>
                              <div className="flex gap-2 self-start items-center">
                                <Badge color="amber" size="lg">{group.chunkCount} RAG chunks</Badge>
                                <Badge color="purple" size="lg">{group.matrixCount} Matrix evals</Badge>
                              </div>
                            </div>
                            
                            <Divider />
                            
                            {/* Conversation Section */}
                            {group.messages.length > 0 && (
                              <div>
                                <Text className="text-sm font-semibold mb-2 border-b border-gray-600 pb-1 text-white">Conversation</Text>
                                <div className="overflow-y-auto max-h-96 rounded-md border border-gray-600 overflow-x-hidden">
                                  {group.messages
                                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                                    .map((message, idx) => (
                                      <div 
                                        key={idx} 
                                        className={`p-3 ${
                                          idx % 2 === 0 ? 'bg-gray-700' : 'bg-gray-750'
                                        } ${
                                          message.message_type === 'user' ? 'border-l-4 border-blue-500' : 'border-l-4 border-green-500'
                                        }`}
                                      >
                                        <div className="flex justify-between items-start mb-1">
                                          <div className="flex items-center">
                                            <Badge color={message.message_type === 'user' ? 'blue' : 'green'} className="shadow">
                                              {message.message_type === 'user' ? 'User' : 'Assistant'}
                                            </Badge>
                                            <Badge color="gray" className="ml-2">
                                              {message.phase}
                                            </Badge>
                                          </div>
                                          <Text className="text-xs text-gray-300">
                                            {formatDate(message.timestamp)}
                                          </Text>
                                        </div>
                                        <div className="whitespace-pre-wrap text-sm mt-2 leading-relaxed break-words text-white">
                                          {message.content}
                                        </div>
                                        {message.metadata && Object.keys(message.metadata).length > 0 && (
                                          <div className="mt-3 pt-2 border-t border-gray-600">
                                            <Text className="text-xs text-gray-300 mb-1">Metadata</Text>
                                            <div className="text-xs overflow-hidden bg-gray-800 p-2 rounded">
                                              <pre className="overflow-x-auto whitespace-pre-wrap break-words text-white" style={{ maxWidth: '100%' }}>
                                                {JSON.stringify(message.metadata, null, 2)}
                                              </pre>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Summary Section */}
                            {group.summary && (
                              <div>
                                <Text className="text-sm font-semibold mb-2 border-b border-gray-600 pb-1 text-white">Session Summary</Text>
                                <Card className="bg-gray-800">
                                  <div className="flex flex-col gap-4">
                                    <div>
                                      <Text className="text-xs text-gray-300">Initial Complaint</Text>
                                      <Text className="text-sm whitespace-pre-wrap text-white">{group.summary.initial_complaint}</Text>
                                    </div>
                                    <Divider />
                                    <div>
                                      <Text className="text-xs text-gray-300">Diagnosis</Text>
                                      <Text className="text-sm whitespace-pre-wrap text-white">{group.summary.diagnosis}</Text>
                                    </div>
                                    <Divider />
                                    <div>
                                      <Text className="text-xs text-gray-300">Treatment</Text>
                                      <Text className="text-sm whitespace-pre-wrap text-white">{group.summary.treatment}</Text>
                                    </div>
                                    <Divider />
                                    <div>
                                      <Text className="text-xs text-gray-300">Chunks Used</Text>
                                      <Text className="text-sm text-white">{group.summary.chunks_used}</Text>
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            )}
                            
                            {/* RAG Chunks and Matrix Counts - update styling */}
                            {(group.chunkCount > 0 || group.matrixCount > 0) && (
                              <>
                                <Text className="text-sm font-semibold mb-2 border-b border-gray-600 pb-1 text-white">Analysis Data</Text>
                                <div className="overflow-hidden">
                                  {group.chunkCount > 0 && (
                                    <div className="flex flex-col gap-4 mb-4">
                                      <Card className="bg-gray-700 p-4 overflow-hidden">
                                        <Flex justifyContent="between" alignItems="center" className="mb-3">
                                          <div>
                                            <Text className="text-sm font-semibold text-white">RAG Chunks</Text>
                                            <Text className="text-xs text-gray-300">
                                              Retrieval-Augmented Generation chunks used in this session
                                            </Text>
                                          </div>
                                          <Badge color="amber" size="lg">{group.chunkCount}</Badge>
                                        </Flex>
                                        
                                        <div className="mt-3 space-y-3">
                                          
                                          {(() => {
                                            // Group chunks by source
                                            const sessionChunks = data.chunks.filter(chunk => chunk.session_id === group.sessionId);
                                            const chunksBySource = sessionChunks.reduce((acc, chunk) => {
                                              const source = chunk.source || 'Unknown';
                                              if (!acc[source]) {
                                                acc[source] = [];
                                              }
                                              acc[source].push(chunk);
                                              return acc;
                                            }, {} as Record<string, RagChunk[]>);
                                            
                                            return (
                                              <div className="mt-3">
                                                <Text className="text-white text-sm font-medium mb-2">Source Documents</Text>
                                                
                                                <div className="space-y-2">
                                                  {Object.entries(chunksBySource).map(([source, chunks], idx) => {
                                                    const displayName = getSourceDisplayName(source);
                                                    
                                                    return (
                                                      <div key={idx} className="bg-gray-800 p-3 rounded-md">
                                                        <Flex justifyContent="between" alignItems="center" className="mb-3 border-b border-gray-700 pb-2">
                                                          <Flex alignItems="center">
                                                            <DocumentTextIcon className="h-5 w-5 text-amber-400 mr-2" />
                                                            <div>
                                                              <Text className="text-white text-sm font-medium">{displayName}</Text>
                                                              <Text className="text-xs text-gray-400">Click on any chunk to view it in the PDF</Text>
                                                            </div>
                                                          </Flex>
                                                          <Badge color="amber" size="lg">{chunks.length}</Badge>
                                                        </Flex>
                                                        
                                                        <div className="space-y-2 mt-3">
                                                          {chunks.map((chunk, chunkIdx) => {
                                                            // Create a summary of the chunk
                                                            const chunkText = chunk.text || '';
                                                            const summary = chunkText.length > 60 
                                                              ? chunkText.substring(0, 60) + '...' 
                                                              : chunkText;
                                                              
                                                            // Generate a description based on the chunk content
                                                            let description = "WHO Guide reference";
                                                            if (chunkText.includes('diarrhea') || chunkText.includes('arrhoea')) {
                                                              description = "Diarrhea treatment guidelines";
                                                            } else if (chunkText.includes('antibiotic')) {
                                                              description = "Antibiotic recommendations";
                                                            } else if (chunkText.includes('home care')) {
                                                              description = "Home care instructions";
                                                            } else if (chunkText.includes('referral')) {
                                                              description = "Referral criteria";
                                                            } else if (chunkText.includes('blood in')) {
                                                              description = "Blood in stool analysis";
                                                            }
                                                            
                                                            // Get search text for highlighting - use a short distinctive phrase
                                                            const searchText = chunkText.split(/[.!?]/)
                                                              .filter(sentence => sentence.length > 10)
                                                              .map(sentence => sentence.trim())
                                                              [0] || chunkText.substring(0, 30);
                                                            
                                                            // Use the updated getPdfUrl with text highlighting
                                                            const highlightUrl = getPdfUrl(source, searchText) || '#';
                                                            
                                                            return (
                                                              <a 
                                                                key={chunkIdx}
                                                                href={highlightUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="block"
                                                              >
                                                                <div className="p-2 bg-gray-700 rounded hover:bg-indigo-900 transition-colors cursor-pointer flex items-start border border-gray-600 hover:border-indigo-500">
                                                                  <div className="flex-grow">
                                                                    <Text className="text-xs text-indigo-300 font-medium mb-1">{description}</Text>
                                                                    <Text className="text-xs text-gray-300 break-words">{summary}</Text>
                                                                  </div>
                                                                  <DocumentTextIcon className="h-4 w-4 text-indigo-400 ml-2 flex-shrink-0 mt-0.5" />
                                                                </div>
                                                              </a>
                                                            );
                                                          })}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      </Card>
                                    </div>
                                  )}
                                  
                                  {group.matrixCount > 0 && (
                                    <div className="flex flex-col gap-4">
                                      <Card className="bg-gray-700 p-4">
                                        <Flex justifyContent="between" alignItems="center">
                                          <Text className="text-sm font-semibold text-white">Matrix Evaluations</Text>
                                          <Badge color="purple" size="lg">{group.matrixCount}</Badge>
                                        </Flex>
                                        <Text className="text-xs text-gray-300 mt-2">
                                          AI decision-making evaluations performed
                                        </Text>
                                      </Card>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    <Text className="text-white">No data available</Text>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {filteredGroups.length > 0 && (
          <Flex className="justify-between items-center mt-4">
            <Flex className="items-center gap-2">
              <Text className="text-white">Rows per page:</Text>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value));
                  setCurrentPage(1); // Reset to first page when changing rows per page
                }}
                className="w-20 text-white bg-gray-700"
              >
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </Select>
            </Flex>
            
            <Flex className="items-center gap-2">
              <Text className="text-white">
                {filteredGroups.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-
                {Math.min(currentPage * rowsPerPage, filteredGroups.length)} of {filteredGroups.length}
              </Text>
              <Button
                icon={ChevronLeftIcon}
                variant="light"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="text-white hover:bg-gray-700"
              />
              <Button
                icon={ChevronRightIcon}
                variant="light"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="text-white hover:bg-gray-700"
              />
            </Flex>
          </Flex>
        )}
      </Card>
      
      {/* Export Modal */}
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        sessionIds={data?.sessionIds || []}
        sessionNames={sessionNames}
      />
    </>
  );
}