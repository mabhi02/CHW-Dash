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
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { Session } from '@/types';

interface DataTableProps {
  data: Session[];
  isLoading: boolean;
  responseTime?: number;
  error?: Error;
  mutate: () => void;
}

export default function DataTable({
  data,
  isLoading,
  responseTime,
  error,
  mutate,
}: DataTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleRow = (id: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  // Format date (mock function as actual data doesn't have date fields)
  // In a real scenario, you would use the actual date from your data
  const formatDate = (id: number) => {
    // Create a mock date based on id for demonstration purposes
    const baseDate = new Date(2025, 0, 1);
    baseDate.setDate(baseDate.getDate() + id - 1);
    
    return baseDate.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatJsonPreview = (json: any) => {
    if (!json || (Array.isArray(json) && json.length === 0)) {
      return <Badge color="gray">Empty</Badge>;
    }
    
    return (
      <Text className="max-w-sm truncate cursor-pointer text-blue-400 hover:text-blue-300">
        {JSON.stringify(json).substring(0, 50)}
        {JSON.stringify(json).length > 50 ? '...' : ''}
      </Text>
    );
  };

  // Filter data based on search term
  const filteredData = data.filter(session => 
    session.chat_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(session.id).includes(searchTerm)
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
    <Card className="mt-6 bg-tremor-background-subtle">
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
              className="w-full sm:w-64"
            />
          </Flex>
          <Flex className="gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <Text className="text-tremor-content-emphasis">
              {data?.length || 0} rows • {responseTime || 0}ms
            </Text>
            <Button 
              variant="secondary" 
              icon={ArrowPathIcon} 
              loading={isLoading}
              onClick={() => mutate()}
            >
              Refresh
            </Button>
          </Flex>
        </Flex>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Chat Name</TableHeaderCell>
              <TableHeaderCell>Date/Time</TableHeaderCell>
              <TableHeaderCell>Initial Responses</TableHeaderCell>
              <TableHeaderCell>Followup Responses</TableHeaderCell>
              <TableHeaderCell>Exam Responses</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <Text>Loading data...</Text>
                </TableCell>
              </TableRow>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((session) => (
                <React.Fragment key={session.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-gray-800"
                    onClick={() => toggleRow(session.id)}
                  >
                    <TableCell>{session.id}</TableCell>
                    <TableCell>{session.chat_name}</TableCell>
                    <TableCell>{formatDate(session.id)}</TableCell>
                    <TableCell>{formatJsonPreview(session.initial_responses)}</TableCell>
                    <TableCell>{formatJsonPreview(session.followup_responses)}</TableCell>
                    <TableCell>{formatJsonPreview(session.exam_responses)}</TableCell>
                  </TableRow>
                  {expandedRows.has(session.id) && (
                    <TableRow className="bg-gray-900">
                      <TableCell colSpan={6} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="bg-gray-800">
                            <Text className="text-sm font-semibold mb-2">Initial Responses</Text>
                            <pre className="text-xs overflow-auto max-h-80 scrollbar-hide">
                              {JSON.stringify(session.initial_responses, null, 2)}
                            </pre>
                          </Card>
                          <Card className="bg-gray-800">
                            <Text className="text-sm font-semibold mb-2">Followup Responses</Text>
                            <pre className="text-xs overflow-auto max-h-80 scrollbar-hide">
                              {JSON.stringify(session.followup_responses, null, 2)}
                            </pre>
                          </Card>
                          <Card className="bg-gray-800">
                            <Text className="text-sm font-semibold mb-2">Exam Responses</Text>
                            <pre className="text-xs overflow-auto max-h-80 scrollbar-hide">
                              {JSON.stringify(session.exam_responses, null, 2)}
                            </pre>
                          </Card>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  <Text>No data available</Text>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filteredData.length > 0 && (
        <Flex className="justify-between items-center mt-4">
          <Flex className="items-center gap-2">
            <Text>Rows per page:</Text>
            <Select
              value={String(rowsPerPage)}
              onValueChange={(value) => {
                setRowsPerPage(Number(value));
                setCurrentPage(1); // Reset to first page when changing rows per page
              }}
              className="w-20"
            >
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </Select>
          </Flex>
          
          <Flex className="items-center gap-2">
            <Text>
              {(currentPage - 1) * rowsPerPage + 1}-
              {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length}
            </Text>
            <Button
              icon={ChevronLeftIcon}
              variant="light"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            />
            <Button
              icon={ChevronRightIcon}
              variant="light"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            />
          </Flex>
        </Flex>
      )}
    </Card>
  );
}