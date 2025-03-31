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
  Icon,
} from '@tremor/react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
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

  const toggleRow = (id: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
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
      <Flex className="justify-between items-center mb-4">
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
      
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Chat Name</TableHeaderCell>
              <TableHeaderCell>Initial Responses</TableHeaderCell>
              <TableHeaderCell>Followup Responses</TableHeaderCell>
              <TableHeaderCell>Exam Responses</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <Text>Loading data...</Text>
                </TableCell>
              </TableRow>
            ) : data && data.length > 0 ? (
              data.map((session) => (
                <React.Fragment key={session.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-gray-800"
                    onClick={() => toggleRow(session.id)}
                  >
                    <TableCell>{session.id}</TableCell>
                    <TableCell>{session.chat_name}</TableCell>
                    <TableCell>{formatJsonPreview(session.initial_responses)}</TableCell>
                    <TableCell>{formatJsonPreview(session.followup_responses)}</TableCell>
                    <TableCell>{formatJsonPreview(session.exam_responses)}</TableCell>
                  </TableRow>
                  {expandedRows.has(session.id) && (
                    <TableRow className="bg-gray-900">
                      <TableCell colSpan={5} className="p-4">
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
                <TableCell colSpan={5} className="text-center">
                  <Text>No data available</Text>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}