import { Card, CardHeader, CardBody, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';

const endpointCategories = [
  {
    category: 'Authentication',
    endpoints: 'register, login, me, logout',
    description: 'User authentication and session management',
  },
  {
    category: 'CRM Core',
    endpoints: 'accounts, contacts, leads, opportunities',
    description: 'Core CRM records and relationships',
  },
  {
    category: 'Activities',
    endpoints: 'activities, tasks, notes, attachments',
    description: 'Activity tracking and task management',
  },
  {
    category: 'Administration',
    endpoints: 'users, roles, connected-apps, cloud-storage',
    description: 'System administration and configuration',
  },
  {
    category: 'Reports',
    endpoints: 'dashboard, pipeline, activities',
    description: 'Analytics and reporting endpoints',
  },
  {
    category: 'System',
    endpoints: 'search, audit, objects',
    description: 'System utilities and metadata',
  },
];

export default function ApiDocs() {
  const handleOpenSwagger = () => {
    window.open('/api/docs', '_blank');
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">API Documentation</h1>
          <p className="text-gray-500 mt-1">Explore and test the OpenCRM API using Swagger UI</p>
        </div>
        <Button onClick={handleOpenSwagger}>
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
          <h2 className="text-lg font-medium text-gray-900">Authentication Instructions</h2>
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
          <Table>
            <TableHeader>
              <TableHead>Category</TableHead>
              <TableHead>Endpoints</TableHead>
              <TableHead>Description</TableHead>
            </TableHeader>
            <TableBody>
              {endpointCategories.map((cat) => (
                <TableRow key={cat.category}>
                  <TableCell className="font-medium">{cat.category}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {cat.endpoints}
                    </code>
                  </TableCell>
                  <TableCell className="text-gray-500">{cat.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}