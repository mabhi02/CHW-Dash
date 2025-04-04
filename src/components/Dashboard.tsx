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
  TextInput,
  Textarea,
} from '@tremor/react';
import {
  ArrowPathIcon,
  ChartBarIcon,
  TableCellsIcon,
  ChartPieIcon,
  BookmarkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import useSWR from 'swr';
import DataTable from './DataTable';
import NotesPanel from './NotesPanel';
import { Session } from '@/types';

interface ApiResponse {
  data: Session[];
  meta: {
    count: number;
    responseTime: number;
  };
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
  const processData = (sessions: Session[] = []) => {
    if (!sessions || sessions.length === 0) {
      return {
        responseDistribution: [],
        timeSeriesData: [],
        topSessions: [],
        totalSessions: 0,
        totalResponses: 0,
        avgResponsesPerSession: 0,
      };
    }

    // Calculate response type distribution
    const initialTotal = sessions.reduce((sum, session) => sum + (session.initial_responses?.length || 0), 0);
    const followupTotal = sessions.reduce((sum, session) => sum + (session.followup_responses?.length || 0), 0);
    const examTotal = sessions.reduce((sum, session) => sum + (session.exam_responses?.length || 0), 0);
    
    const responseDistribution = [
      { name: 'Initial', value: initialTotal },
      { name: 'Followup', value: followupTotal },
      { name: 'Exam', value: examTotal },
    ];

    // Sort sessions by id to visualize trends over time
    const sortedSessions = [...sessions].sort((a, b) => a.id - b.id);
    const timeSeriesData = sortedSessions.map(session => ({
      id: session.id,
      name: `Session ${session.id}`,
      initial: session.initial_responses?.length || 0,
      followup: session.followup_responses?.length || 0,
      exam: session.exam_responses?.length || 0,
    }));

    // Get top sessions by total responses
    const sessionsWithTotal = sessions.map(session => ({
      id: session.id,
      name: session.chat_name,
      total: (session.initial_responses?.length || 0) + 
             (session.followup_responses?.length || 0) + 
             (session.exam_responses?.length || 0)
    }));
    
    const topSessions = [...sessionsWithTotal]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      responseDistribution,
      timeSeriesData,
      topSessions,
      totalSessions: sessions.length,
      totalResponses: initialTotal + followupTotal + examTotal,
      avgResponsesPerSession: sessions.length > 0 
        ? (initialTotal + followupTotal + examTotal) / sessions.length 
        : 0,
    };
  };

  const analytics = processData(data?.data);

  return (
    <div className="p-4 md:p-8 mx-auto max-w-full">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Title className="text-white">ChatCHW Logs</Title>
            <Badge color="blue">{data?.meta?.count || 0} Sessions</Badge>
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
      <Grid numItems={1} numItemsMd={3} className="gap-6 mt-6">
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
                <Text>Total Responses</Text>
                <Metric className="mt-2">{analytics.totalResponses}</Metric>
              </div>
              <Badge icon={ChartBarIcon} color="green">
                {isLoading ? 'Loading...' : 'Updated'}
              </Badge>
            </Flex>
          </Card>
        </Col>
        <Col>
          <Card className="bg-tremor-background-subtle">
            <Flex alignItems="start">
              <div>
                <Text>Avg Responses per Session</Text>
                <Metric className="mt-2">{analytics.avgResponsesPerSession.toFixed(1)}</Metric>
              </div>
              <Badge icon={ChartPieIcon} color="purple">
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
              data={data?.data || []} 
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
            ) : data?.data && data.data.length > 0 ? (
              <>
                <Grid numItems={1} numItemsMd={2} className="gap-6 mt-6">
                  <Col>
                    <Card className="bg-tremor-background-subtle">
                      <Title>Response Distribution</Title>
                      <Text className="mt-2">Breakdown of response types across sessions</Text>
                      <DonutChart
                        className="mt-6"
                        data={analytics.responseDistribution}
                        category="value"
                        index="name"
                        colors={["blue", "cyan", "indigo"]}
                        showAnimation={true}
                        valueFormatter={(value) => `${value} responses`}
                      />
                    </Card>
                  </Col>
                  <Col>
                    <Card className="bg-tremor-background-subtle">
                      <Title>Response Trend</Title>
                      <Text className="mt-2">Response count trends across sessions</Text>
                      <AreaChart
                        className="mt-6 h-64"
                        data={analytics.timeSeriesData}
                        index="name"
                        categories={["initial", "followup", "exam"]}
                        colors={["blue", "cyan", "indigo"]}
                        valueFormatter={(value) => `${value} responses`}
                        showLegend
                        showAnimation={true}
                      />
                    </Card>
                  </Col>
                </Grid>

                <Card className="mt-6 bg-tremor-background-subtle">
                  <Title>Top Sessions by Total Responses</Title>
                  <Text className="mt-2">Sessions with the highest number of total responses</Text>
                  <BarChart
                    className="mt-6 h-60"
                    data={analytics.topSessions}
                    index="name"
                    categories={["total"]}
                    colors={["blue"]}
                    valueFormatter={(value) => `${value} responses`}
                    showAnimation={true}
                  />
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