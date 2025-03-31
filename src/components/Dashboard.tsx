import React from 'react';
import { Card, Title, Text, TabGroup, TabList, Tab, TabPanels, TabPanel } from '@tremor/react';
import useSWR from 'swr';
import DataTable from './DataTable';
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

  return (
    <div className="p-4 md:p-10 mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title className="text-white">Sessions Dashboard</Title>
          <Text className="text-tremor-content">View and analyze your NeonDB sessions data</Text>
        </div>
      </div>

      <TabGroup>
        <TabList className="mt-8">
          <Tab>Data Table</Tab>
          <Tab>Analytics</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <DataTable 
              data={data?.data || []} 
              isLoading={isLoading} 
              responseTime={data?.meta?.responseTime}
              error={error as Error} 
              mutate={mutate}
            />
          </TabPanel>
          <TabPanel>
            <Card className="mt-6 bg-tremor-background-subtle">
              <Text className="text-tremor-content-emphasis">
                Analytics coming soon...
              </Text>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}