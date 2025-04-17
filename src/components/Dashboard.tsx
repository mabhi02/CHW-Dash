import React, { useState, useEffect } from 'react';
import {
  Card,
  Title,
  Text,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Grid,
  Col,
  Metric,
  AreaChart,
  DonutChart,
  BarChart,
  Flex,
  Badge,
  Button,
  LineChart,
  ProgressBar,
  Divider,
} from '@tremor/react';
import {
  ArrowPathIcon,
  ChartBarIcon,
  TableCellsIcon,
  ChartPieIcon,
  BookmarkIcon,
  DocumentChartBarIcon,
  AcademicCapIcon,
  CpuChipIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import useSWR from 'swr';
import DataTable from './DataTable';
import NotesPanel from './NotesPanel';
import { Session, SessionSummary, RagChunk, MatrixEvaluation } from '@/types';

interface ApiResponse {
  data: {
    conversations: Session[];
    summaries: SessionSummary[];
    chunks: RagChunk[];
    matrix: MatrixEvaluation[];
    sessionIds: string[];
  };
  meta: {
    conversations: number;
    summaries: number;
    chunks: number;
    matrix: number;
    uniqueSessions: number;
    responseTime: number;
  };
}

interface RagChunkMetrics {
  sourceDistribution: { name: string; value: number }[];
  avgRelevanceScore: number;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  return res.json();
};

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse>('/api/sessions', fetcher, {
    refreshInterval: 0,
    revalidateOnFocus: false,
  });

  // Added manual refresh function
  const handleRefresh = () => {
    mutate();
  };

  // Process data for analytics
  const processData = (apiData?: ApiResponse) => {
    if (!apiData || !apiData.data) {
      return {
        phaseDistribution: [],
        messageTypeDistribution: [],
        timeSeriesData: [],
        sessionDiagnosisData: [],
        matrixConfidenceData: [],
        ragChunkMetrics: {
          sourceDistribution: [],
          avgRelevanceScore: 0
        } as RagChunkMetrics,
        topSessions: [],
        totalSessions: 0,
        totalMessages: 0,
        totalChunks: 0,
        totalMatrixEvals: 0,
        avgMessagesPerSession: 0,
        avgChunksPerSession: 0,
      };
    }

    const { conversations, summaries, chunks, matrix, sessionIds } = apiData.data;
    
    // Calculate phase distribution
    const phaseCounts = {
      initial: 0,
      followup: 0,
      exam: 0,
      complete: 0
    };
    
    conversations.forEach(message => {
      if (message.phase in phaseCounts) {
        phaseCounts[message.phase as keyof typeof phaseCounts]++;
      }
    });
    
    const phaseDistribution = [
      { name: 'Initial', value: phaseCounts.initial },
      { name: 'Followup', value: phaseCounts.followup },
      { name: 'Exam', value: phaseCounts.exam },
      { name: 'Complete', value: phaseCounts.complete },
    ];

    // Calculate message type distribution
    const typeCounts = {
      user: 0,
      assistant: 0
    };
    
    conversations.forEach(message => {
      if (message.message_type in typeCounts) {
        typeCounts[message.message_type as keyof typeof typeCounts]++;
      }
    });
    
    const messageTypeDistribution = [
      { name: 'User', value: typeCounts.user },
      { name: 'Assistant', value: typeCounts.assistant },
    ];

    // Group by sessions for time series
    const sessionMap = new Map<string, {
      id: string;
      messageCount: number;
      chunkCount: number;
      matrixCount: number;
      timestamp?: string;
    }>();
    
    // Initialize with all session IDs
    sessionIds.forEach(id => {
      sessionMap.set(id, {
        id,
        messageCount: 0,
        chunkCount: 0,
        matrixCount: 0
      });
    });
    
    // Add conversation data
    conversations.forEach(message => {
      const session = sessionMap.get(message.session_id);
      if (session) {
        session.messageCount++;
        if (!session.timestamp || message.timestamp > session.timestamp) {
          session.timestamp = message.timestamp;
        }
      }
    });
    
    // Add chunk data
    chunks.forEach(chunk => {
      const session = sessionMap.get(chunk.session_id);
      if (session) {
        session.chunkCount++;
      }
    });
    
    // Add matrix data
    matrix.forEach(evaluation => {
      const session = sessionMap.get(evaluation.session_id);
      if (session) {
        session.matrixCount++;
      }
    });
    
    // Sort sessions by timestamp
    const sortedSessions = Array.from(sessionMap.values())
      .filter(s => s.timestamp) // Filter only those with timestamp
      .sort((a, b) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
    
    // Create time series data
    const timeSeriesData = sortedSessions.map((session, index) => ({
      date: session.timestamp ? new Date(session.timestamp).toISOString().split('T')[0] : `Session ${index}`,
      messages: session.messageCount,
      chunks: session.chunkCount,
      matrix: session.matrixCount,
    }));

    // Session diagnosis data from summaries
    const sessionDiagnosisData = summaries
      .filter(s => s.diagnosis)
      .map(summary => ({
        sessionId: summary.session_id,
        diagnosis: summary.diagnosis.length > 30 ? summary.diagnosis.substring(0, 30) + '...' : summary.diagnosis,
        chunks: summary.chunks_used,
      }))
      .sort((a, b) => b.chunks - a.chunks)
      .slice(0, 8);

    // Matrix confidence data
    const matrixConfidenceData = matrix
      .filter(m => typeof m.confidence === 'number')
      .map(m => ({
        question: m.question.length > 25 ? m.question.substring(0, 25) + '...' : m.question,
        confidence: m.confidence,
        optimist: m.optimist_weight,
        pessimist: m.pessimist_weight,
      }))
      .slice(0, 10);

    // RAG chunk metrics
    const chunkSources = new Map<string, number>();
    chunks.forEach(chunk => {
      if (chunk.source) {
        const sourceKey = chunk.source.includes('/') 
          ? chunk.source.split('/').pop() || chunk.source
          : chunk.source;
        
        chunkSources.set(
          sourceKey, 
          (chunkSources.get(sourceKey) || 0) + 1
        );
      }
    });
    
    const ragChunkMetrics: RagChunkMetrics = {
      sourceDistribution: Array.from(chunkSources.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
      avgRelevanceScore: chunks.reduce((sum, chunk) => sum + (chunk.relevance_score || 0), 0) / (chunks.length || 1),
    };

    // Get top sessions by message count
    const topSessions = sortedSessions
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5)
      .map(session => ({
        id: session.id,
        messages: session.messageCount,
        chunks: session.chunkCount,
        matrix: session.matrixCount
      }));

    return {
      phaseDistribution,
      messageTypeDistribution,
      timeSeriesData,
      sessionDiagnosisData,
      matrixConfidenceData,
      ragChunkMetrics,
      topSessions,
      totalSessions: sessionIds.length,
      totalMessages: conversations.length,
      totalChunks: chunks.length,
      totalMatrixEvals: matrix.length,
      avgMessagesPerSession: sessionIds.length ? conversations.length / sessionIds.length : 0,
      avgChunksPerSession: sessionIds.length ? chunks.length / sessionIds.length : 0,
    };
  };

  const analytics = processData(data);

  return (
    <div className="p-4 md:p-8 mx-auto max-w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Title className="text-white">ChatCHW Logs</Title>
            <Badge color="blue">{data?.meta?.uniqueSessions || 0} Sessions</Badge>
          </div>
          <Text className="text-tremor-content mt-1">
            ChatCHW Logs & Analytics Dashboard
          </Text>
        </div>
        <Button 
          variant="secondary" 
          icon={ArrowPathIcon} 
          loading={isLoading}
          onClick={handleRefresh}
        >
          Refresh Data
        </Button>
      </div>

      {/* Analytics Overview Cards */}
      <Grid numItems={1} numItemsSm={2} numItemsMd={4} className="gap-6 mt-6">
        <Col>
          <Card className="bg-tremor-background-subtle">
            <Flex alignItems="start">
              <div>
                <Text>Total Sessions</Text>
                <Metric className="mt-2">{analytics.totalSessions}</Metric>
              </div>
              <Badge icon={TableCellsIcon} color="blue">
                {isLoading ? 'Loading...' : 'Updated'}
              </Badge>
            </Flex>
          </Card>
        </Col>
        <Col>
          <Card className="bg-tremor-background-subtle">
            <Flex alignItems="start">
              <div>
                <Text>Total Messages</Text>
                <Metric className="mt-2">{analytics.totalMessages}</Metric>
              </div>
              <Badge icon={ChatBubbleLeftRightIcon} color="green">
                {isLoading ? 'Loading...' : 'Updated'}
              </Badge>
            </Flex>
          </Card>
        </Col>
        <Col>
          <Card className="bg-tremor-background-subtle">
            <Flex alignItems="start">
              <div>
                <Text>RAG Chunks</Text>
                <Metric className="mt-2">{analytics.totalChunks}</Metric>
              </div>
              <Badge icon={DocumentChartBarIcon} color="amber">
                {isLoading ? 'Loading...' : 'Updated'}
              </Badge>
            </Flex>
          </Card>
        </Col>
        <Col>
          <Card className="bg-tremor-background-subtle">
            <Flex alignItems="start">
              <div>
                <Text>Matrix Evaluations</Text>
                <Metric className="mt-2">{analytics.totalMatrixEvals}</Metric>
              </div>
              <Badge icon={CpuChipIcon} color="purple">
                {isLoading ? 'Loading...' : 'Updated'}
              </Badge>
            </Flex>
          </Card>
        </Col>
      </Grid>

      <TabGroup className="mt-6">
        <TabList>
          <Tab icon={TableCellsIcon}>Data Table</Tab>
          <Tab icon={ChartBarIcon}>Analytics</Tab>
          <Tab icon={BookmarkIcon}>Notes</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <DataTable 
              data={data?.data || {
                conversations: [],
                summaries: [],
                chunks: [],
                matrix: [],
                sessionIds: []
              }} 
              isLoading={isLoading} 
              responseTime={data?.meta?.responseTime}
              error={error as Error} 
              mutate={handleRefresh}
            />
          </TabPanel>
          <TabPanel>
            {isLoading ? (
              <Card className="mt-6 bg-tremor-background-subtle">
                <Text className="text-tremor-content-emphasis">
                  Loading analytics data...
                </Text>
              </Card>
            ) : data?.data ? (
              <>
                {/* Message Analytics */}
                <Card className="mt-6 bg-tremor-background-subtle">
                  <Title>Message Analytics</Title>
                  <Text className="mt-2">Breakdown of conversation messages across the system</Text>
                  
                  <Grid numItems={1} numItemsMd={2} className="gap-6 mt-6">
                    <Col>
                      <Title className="text-lg">Message Distribution by Phase</Title>
                      <DonutChart
                        className="mt-6"
                        data={analytics.phaseDistribution}
                        category="value"
                        index="name"
                        colors={["blue", "cyan", "indigo", "violet"]}
                        showAnimation={true}
                        valueFormatter={(value) => `${value} messages`}
                      />
                    </Col>
                    <Col>
                      <Title className="text-lg">Message Types</Title>
                      <DonutChart
                        className="mt-6"
                        data={analytics.messageTypeDistribution}
                        category="value"
                        index="name"
                        colors={["blue", "green"]}
                        showAnimation={true}
                        valueFormatter={(value) => `${value} messages`}
                      />
                    </Col>
                  </Grid>
                  
                  <Divider className="my-8" />
                  
                  <Title className="text-lg">Activity Timeline</Title>
                  <Text className="mt-2">Messages, chunks, and matrix evaluations over time</Text>
                  <LineChart
                    className="mt-6 h-72"
                    data={analytics.timeSeriesData}
                    index="date"
                    categories={["messages", "chunks", "matrix"]}
                    colors={["blue", "amber", "purple"]}
                    valueFormatter={(value) => `${value}`}
                    showLegend
                    showAnimation={true}
                  />
                </Card>
                
                {/* RAG Chunks Analytics */}
                <Card className="mt-6 bg-tremor-background-subtle">
                  <Title>RAG Chunks Analytics</Title>
                  <Text className="mt-2">Analysis of retrieval-augmented generation chunks</Text>
                  
                  <Grid numItems={1} numItemsMd={2} className="gap-6 mt-6">
                    <Col>
                      <Title className="text-lg">Chunks by Source Document</Title>
                      <BarChart
                        className="mt-6 h-60"
                        data={analytics.ragChunkMetrics.sourceDistribution}
                        index="name"
                        categories={["value"]}
                        colors={["amber"]}
                        valueFormatter={(value) => `${value} chunks`}
                        showAnimation={true}
                      />
                    </Col>
                    <Col>
                      <Title className="text-lg">Average Relevance Score</Title>
                      <div className="mt-8">
                        <Metric className="text-center mb-4">
                          {analytics.ragChunkMetrics.avgRelevanceScore.toFixed(2)}
                        </Metric>
                        <ProgressBar 
                          value={analytics.ragChunkMetrics.avgRelevanceScore * 100}
                          color="amber"
                          className="mt-2"
                        />
                        <div className="flex justify-between mt-2">
                          <Text className="text-xs">0</Text>
                          <Text className="text-xs">Relevance</Text>
                          <Text className="text-xs">1.0</Text>
                        </div>
                      </div>
                      
                      <div className="mt-8">
                        <Title className="text-lg">Chunks per Session</Title>
                        <Metric className="text-center mt-4">
                          {analytics.avgChunksPerSession.toFixed(1)}
                        </Metric>
                        <Text className="text-center text-sm mt-1">avg. chunks per session</Text>
                      </div>
                    </Col>
                  </Grid>
                </Card>
                
                {/* Matrix Analysis */}
                <Card className="mt-6 bg-tremor-background-subtle">
                  <Title>Matrix Evaluation Analytics</Title>
                  <Text className="mt-2">Analysis of AI decision-making process</Text>
                  
                  <div className="mt-6">
                    <Title className="text-lg">Matrix Confidence by Question</Title>
                    <BarChart
                      className="mt-6 h-80"
                      data={analytics.matrixConfidenceData}
                      index="question"
                      categories={["confidence", "optimist", "pessimist"]}
                      colors={["purple", "blue", "red"]}
                      valueFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      layout="vertical"
                      showAnimation={true}
                    />
                  </div>
                </Card>
                
                {/* Session Analysis */}
                <Card className="mt-6 bg-tremor-background-subtle">
                  <Title>Session Insights</Title>
                  <Text className="mt-2">Detailed analysis of individual sessions</Text>
                  
                  <Grid numItems={1} numItemsMd={2} className="gap-6 mt-6">
                    <Col>
                      <Title className="text-lg">Top Sessions by Activity</Title>
                      <BarChart
                        className="mt-6 h-80"
                        data={analytics.topSessions}
                        index="id"
                        categories={["messages", "chunks", "matrix"]}
                        colors={["blue", "amber", "purple"]}
                        valueFormatter={(value) => `${value}`}
                        layout="vertical"
                        showAnimation={true}
                      />
                    </Col>
                    <Col>
                      <Title className="text-lg">Diagnosis and Chunks Used</Title>
                      <div className="mt-6 overflow-auto max-h-80">
                        {analytics.sessionDiagnosisData.map((item, idx) => (
                          <div key={idx} className="mb-4">
                            <Flex>
                              <Text className="truncate">{item.diagnosis}</Text>
                              <Badge color="amber">{item.chunks} chunks</Badge>
                            </Flex>
                            <ProgressBar 
                              value={(item.chunks / Math.max(...analytics.sessionDiagnosisData.map(d => d.chunks))) * 100}
                              color="amber"
                              className="mt-2"
                            />
                          </div>
                        ))}
                      </div>
                    </Col>
                  </Grid>
                </Card>
              </>
            ) : (
              <Card className="mt-6 bg-tremor-background-subtle">
                <Text className="text-tremor-content-emphasis">
                  No data available for analytics. Try refreshing the data.
                </Text>
              </Card>
            )}
          </TabPanel>
          <TabPanel>
            <NotesPanel />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}