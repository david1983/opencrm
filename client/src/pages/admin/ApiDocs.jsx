import { DocumentTextIcon, ExternalLinkIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody, Button } from '../../components/ui';

const endpointCategories = [
  {
    category: 'Authentication',
    description: 'User authentication and session management',
    endpoints: [
      { method: 'POST', path: '/auth/register', description: 'Register new user' },
      { method: 'POST', path: '/auth/login', description: 'User login' },
      { method: 'GET', path: '/auth/me', description: 'Get current user' },
      { method: 'POST', path: '/auth/logout', description: 'User logout' },
    ],
  },
  {
    category: 'CRM Core',
    description: 'Core CRM records and relationships',
    endpoints: [
      { method: 'GET', path: '/accounts', description: 'List accounts' },
      { method: 'GET', path: '/contacts', description: 'List contacts' },
      { method: 'GET', path: '/leads', description: 'List leads' },
      { method: 'GET', path: '/opportunities', description: 'List opportunities' },
    ],
  },
  {
    category: 'Activities',
    description: 'Activity tracking and task management',
    endpoints: [
      { method: 'GET', path: '/activities', description: 'List activities' },
      { method: 'GET', path: '/tasks', description: 'List tasks' },
      { method: 'GET', path: '/notes', description: 'List notes' },
      { method: 'GET', path: '/attachments', description: 'List attachments' },
    ],
  },
  {
    category: 'Administration',
    description: 'System administration and configuration',
    endpoints: [
      { method: 'GET', path: '/admin/users', description: 'List users' },
      { method: 'GET', path: '/admin/roles', description: 'List roles' },
      { method: 'GET', path: '/admin/connected-apps', description: 'List connected apps' },
      { method: 'GET', path: '/admin/cloud-storage', description: 'List cloud storage' },
    ],
  },
  {
    category: 'Reports',
    description: 'Analytics and reporting endpoints',
    endpoints: [
      { method: 'GET', path: '/reports/dashboard', description: 'Dashboard metrics' },
      { method: 'GET', path: '/reports/pipeline', description: 'Pipeline report' },
      { method: 'GET', path: '/reports/activities', description: 'Activities report' },
    ],
  },
  {
    category: 'System',
    description: 'System utilities and metadata',
    endpoints: [
      { method: 'GET', path: '/search', description: 'Global search' },
      { method: 'GET', path: '/audit', description: 'Audit logs' },
      { method: 'GET', path: '/objects', description: 'Custom objects metadata' },
    ],
  },
];

const methodColors = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-yellow-100 text-yellow-800',
  PATCH: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

export default function ApiDocs() {
  const handleOpenSwagger = () => {
    window.open('/api/docs', '_blank');
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">API Documentation</h1>
            <p className="text-gray-500 mt-1">Explore and test the OpenCRM API using Swagger UI</p>
          </div>
        </div>
        <Button onClick={handleOpenSwagger}>
          <ExternalLinkIcon className="h-5 w-5 mr-2" />
          Open Swagger UI
        </Button>
      </div>

      {/* Overview Card */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Overview</h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Base URL</label>
              <code className="block text-sm bg-gray-100 px-3 py-2 rounded border">/api</code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Authentication</label>
              <code className="block text-sm bg-gray-100 px-3 py-2 rounded border">Bearer JWT Token</code>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Format</label>
              <code className="block text-sm bg-gray-100 px-3 py-2 rounded border">JSON</code>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Authentication Instructions Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyIcon className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-medium text-gray-900">Authentication Instructions</h2>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-gray-600 mb-4">
            To authenticate API requests in Swagger UI, you need to provide your JWT token.
            Follow these steps to get your token:
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-sm">
                1
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Get token from browser DevTools</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Open DevTools (F12) and navigate to Application tab, then expand Cookies and select your domain.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-sm">
                2
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Copy token value</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Find the <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">token</code> cookie and copy its value.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-sm">
                3
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Click "Authorize" in Swagger UI</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Open Swagger UI and click the <strong>Authorize</strong> button at the top of the page.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-medium text-sm">
                4
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Paste token</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Paste your token value in the authorization dialog and click <strong>Authorize</strong>.
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Endpoint Categories Card */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">Endpoint Categories</h2>
        </CardHeader>
        <CardBody className="p-0">
          <div className="divide-y divide-gray-200">
            {endpointCategories.map((cat) => (
              <div key={cat.category} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">{cat.category}</h3>
                  <span className="text-xs text-gray-500">{cat.description}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.endpoints.map((endpoint) => (
                    <a
                      key={`${endpoint.method}-${endpoint.path}`}
                      href={`/api/docs`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs hover:bg-gray-50 transition-colors"
                      title={endpoint.description}
                    >
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${methodColors[endpoint.method]}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-gray-700">{endpoint.path}</code>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}