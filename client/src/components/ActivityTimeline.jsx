import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Card, CardHeader, CardBody, TaskStatusBadge, PriorityBadge } from './ui';

const TYPE_ICONS = {
  Call: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  Email: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Meeting: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Note: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

const TYPE_COLORS = {
  Call: 'bg-blue-100 text-blue-800',
  Email: 'bg-green-100 text-green-800',
  Meeting: 'bg-purple-100 text-purple-800',
  Note: 'bg-yellow-100 text-yellow-800',
};

export default function ActivityTimeline({ accountId, contactId, opportunityId }) {
  // Build query params
  const params = { limit: 10 };
  if (accountId) params.account = accountId;
  if (contactId) params.contact = contactId;
  if (opportunityId) params.opportunity = opportunityId;

  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', params],
    queryFn: () => api.getActivities(params),
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', params],
    queryFn: () => api.getTasks(params),
  });

  const activities = activitiesData?.data || [];
  const tasks = tasksData?.data || [];

  // Combine and sort by date
  const timelineItems = [
    ...activities.map((a) => ({ ...a, itemType: 'activity' })),
    ...tasks.map((t) => ({ ...t, itemType: 'task' })),
  ].sort((a, b) => {
    const dateA = new Date(a.date || a.dueDate || a.createdAt);
    const dateB = new Date(b.date || b.dueDate || b.createdAt);
    return dateB - dateA;
  });

  if (activitiesLoading || tasksLoading) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Activity Timeline</h2>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-medium text-gray-900">Activity Timeline</h2>
      </CardHeader>
      <CardBody>
        {timelineItems.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No activities or tasks</p>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {timelineItems.slice(0, 10).map((item, index) => (
                <li key={item._id}>
                  <div className="relative pb-8">
                    {index !== timelineItems.length - 1 && (
                      <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        {item.itemType === 'activity' ? (
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ${TYPE_COLORS[item.type] || 'bg-gray-100 text-gray-800'}`}>
                            {TYPE_ICONS[item.type] || TYPE_ICONS.Note}
                          </span>
                        ) : (
                          <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">
                          {item.itemType === 'activity' ? (
                            <div>
                              <p className="font-medium text-gray-900">{item.subject}</p>
                              <p className="text-gray-500">{item.description}</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-gray-900">{item.subject}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <TaskStatusBadge status={item.status} />
                                <PriorityBadge priority={item.priority} />
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(item.date || item.dueDate || item.createdAt).toLocaleDateString()} • {item.owner?.name || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardBody>
    </Card>
  );
}