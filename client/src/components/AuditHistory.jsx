import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const ACTION_LABELS = {
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
  convert: 'Converted',
};

const ACTION_COLORS = {
  create: 'bg-green-100 text-green-800',
  update: 'bg-blue-100 text-blue-800',
  delete: 'bg-red-100 text-red-800',
  convert: 'bg-purple-100 text-purple-800',
};

const FIELD_LABELS = {
  name: 'Name',
  firstName: 'First Name',
  lastName: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  title: 'Title',
  industry: 'Industry',
  website: 'Website',
  address: 'Address',
  description: 'Description',
  stage: 'Stage',
  amount: 'Amount',
  probability: 'Probability',
  closeDate: 'Close Date',
  status: 'Status',
  source: 'Source',
  company: 'Company',
  type: 'Type',
  subject: 'Subject',
  date: 'Date',
  duration: 'Duration',
  dueDate: 'Due Date',
  priority: 'Priority',
  account: 'Account',
  contact: 'Contact',
  owner: 'Owner',
};

const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export default function AuditHistory({ entityType, entityId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', entityType, entityId],
    queryFn: () => api.getAuditHistory(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Failed to load history
      </div>
    );
  }

  const logs = data?.data || [];

  if (logs.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        No history available
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {logs.map((log, index) => (
          <li key={log._id}>
            <div className="relative pb-8">
              {index !== logs.length - 1 && (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-900">
                        {log.changedBy?.name || 'Unknown User'}
                      </span>
                      <span className="text-gray-500 ml-1">
                        {log.action === 'create' && 'created this record'}
                        {log.action === 'delete' && 'deleted this record'}
                        {log.action === 'convert' && 'converted this lead'}
                        {log.action === 'update' && 'made changes'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                  {log.changes && log.changes.length > 0 && (
                    <div className="mt-2 bg-gray-50 rounded-md p-3">
                      <div className="space-y-1">
                        {log.changes.map((change, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium text-gray-700">
                              {FIELD_LABELS[change.field] || change.field}:
                            </span>{' '}
                            {change.oldValue ? (
                              <>
                                <span className="text-red-600 line-through">
                                  {change.oldValue}
                                </span>
                                {' → '}
                              </>
                            ) : null}
                            <span className="text-green-600">
                              {change.newValue || '(empty)'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}