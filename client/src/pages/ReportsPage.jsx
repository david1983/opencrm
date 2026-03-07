import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardHeader, CardBody } from '../components/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function ReportsPage() {
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => api.getPipelineReport(),
  });

  const { data: leadsSourceData, isLoading: leadsSourceLoading } = useQuery({
    queryKey: ['leads-source'],
    queryFn: () => api.getLeadsBySource(),
  });

  const { data: leadsStatusData, isLoading: leadsStatusLoading } = useQuery({
    queryKey: ['leads-status'],
    queryFn: () => api.getLeadsByStatus(),
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activities-summary'],
    queryFn: () => api.getActivitySummary(),
  });

  const pipeline = pipelineData?.data?.stages || [];
  const pipelineSummary = pipelineData?.data?.summary || {};
  const leadsBySource = leadsSourceData?.data?.sources || [];
  const leadsByStatus = leadsStatusData?.data || [];
  const activitySummary = activityData?.data?.byType || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-500">Pipeline Value</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(pipelineSummary.totalValue)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-500">Total Opportunities</p>
            <p className="text-2xl font-bold text-gray-900">{pipelineSummary.totalCount || 0}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm font-medium text-gray-500">Avg Deal Size</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(pipelineSummary.avgDealSize)}</p>
          </CardBody>
        </Card>
      </div>

      {/* Pipeline by Stage */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Pipeline by Stage</h2>
        </CardHeader>
        <CardBody>
          {pipelineLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : pipeline.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No opportunity data available</p>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipeline} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'Amount' ? formatCurrency(value) : value,
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalAmount" name="Amount" fill="#3b82f6" />
                  <Bar yAxisId="right" dataKey="count" name="Count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leads by Source */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Leads by Source</h2>
          </CardHeader>
          <CardBody>
            {leadsSourceLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : leadsBySource.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No lead data available</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsBySource}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ _id, count }) => `${_id}: ${count}`}
                    >
                      {leadsBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Leads by Status */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Leads by Status</h2>
          </CardHeader>
          <CardBody>
            {leadsStatusLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : leadsByStatus.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No lead data available</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leadsByStatus}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ _id, count }) => `${_id}: ${count}`}
                    >
                      {leadsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Activities by Type</h2>
        </CardHeader>
        <CardBody>
          {activityLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : activitySummary.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No activity data available</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activitySummary} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}