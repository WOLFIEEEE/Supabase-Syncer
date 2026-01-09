'use client';

import { Box, VStack, HStack, Card, CardBody, Text, Select, Button, SimpleGrid, useToast } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import LineChart from '@/components/admin/charts/LineChart';
import BarChart from '@/components/admin/charts/BarChart';
import MetricCard from '@/components/admin/charts/MetricCard';

export default function AnalyticsDashboardClient({ adminUser }: { adminUser: { id: string; email: string } }) {
  const [days, setDays] = useState(30);
  const [userGrowth, setUserGrowth] = useState<any>(null);
  const [syncPerformance, setSyncPerformance] = useState<any>(null);
  const [apiUsage, setApiUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [userRes, syncRes, apiRes] = await Promise.all([
        fetch(`/api/admin/analytics?type=user-growth&days=${days}`),
        fetch(`/api/admin/analytics?type=sync-performance&days=${days}`),
        fetch(`/api/admin/analytics?type=api-usage&days=${days}`),
      ]);
      const [userData, syncData, apiData] = await Promise.all([userRes.json(), syncRes.json(), apiRes.json()]);
      if (userData.success) setUserGrowth(userData.data);
      if (syncData.success) setSyncPerformance(syncData.data);
      if (apiData.success) setApiUsage(apiData.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch analytics', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Text fontSize="2xl" fontWeight="700" color="white">Analytics Dashboard</Text>
        <HStack>
          <Select value={days} onChange={(e) => setDays(parseInt(e.target.value))} bg="surface.900" borderColor="surface.700" color="white" w="200px">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </Select>
          <Button onClick={() => fetch('/api/admin/export', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'analytics', format: 'json' }) }).then(r => r.json()).then(d => { const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }); const u = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = 'analytics.json'; a.click(); })}>Export</Button>
        </HStack>
      </HStack>

      {userGrowth && (
        <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
          <CardBody>
            <LineChart data={userGrowth.data} title="User Growth" color="#3182ce" />
          </CardBody>
        </Card>
      )}

      {syncPerformance && (
        <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
          <CardBody>
            <BarChart data={syncPerformance.data} title="Sync Performance" color="#38a169" />
          </CardBody>
        </Card>
      )}

      {apiUsage && (
        <Card bg="surface.800" borderColor="surface.700" borderWidth="1px">
          <CardBody>
            <LineChart data={apiUsage.data} title="API Usage" color="#d69e2e" />
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}

