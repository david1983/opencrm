import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Card, CardHeader, CardBody, StageBadge, TaskStatusBadge, PriorityBadge, Button } from '../components/ui';

export default function Dashboard() {
  const { data: dashboardData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-red-600">Error loading dashboard: {error?.message || 'Unknown error'}</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const dashboard = dashboardData?.data;

  const stats = [
    { name: 'Accounts', value: dashboard?.counts?.accounts || 0, href: '/accounts', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { name: 'Contacts', value: dashboard?.counts?.contacts || 0, href: '/contacts', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { name: 'Leads', value: dashboard?.counts?.leads || 0, href: '/leads', icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { name: 'Opportunities', value: dashboard?.counts?.opportunities || 0, href: '/opportunities', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Tasks', value: dashboard?.counts?.tasks || 0, href: '/tasks', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pipeline Value Card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Pipeline Value</h2>
        </CardHeader>
        <CardBody>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(dashboard?.pipelineValue || 0)}
          </div>
          <p className="text-sm text-gray-500 mt-1">Total value of open opportunities</p>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overdue Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Overdue Tasks</h2>
              <span className="text-sm text-red-600 font-medium">
                {Array.isArray(dashboard?.overdueTasks) ? dashboard.overdueTasks.length : 0} overdue
              </span>
            </div>
          </CardHeader>
          <CardBody>
            {!Array.isArray(dashboard?.overdueTasks) || dashboard.overdueTasks.length === 0 ? (
              <p className="text-sm text-gray-500">No overdue tasks</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {dashboard.overdueTasks.slice(0, 5).map((task) => (
                  <li key={task._id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.subject}</p>
                        <p className="text-xs text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <PriorityBadge priority={task.priority} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Open Opportunities */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Open Opportunities</h2>
          </CardHeader>
          <CardBody>
            {!Array.isArray(dashboard?.openOpportunities) || dashboard.openOpportunities.length === 0 ? (
              <p className="text-sm text-gray-500">No open opportunities</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {dashboard.openOpportunities.slice(0, 5).map((opp) => (
                  <li key={opp._id} className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opp.name}</p>
                        <p className="text-xs text-gray-500">
                          {opp.account?.name || 'No Account'} | Close: {new Date(opp.closeDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(opp.amount)}</p>
                        <StageBadge stage={opp.stage} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}