import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Button, Input, Card, CardHeader, CardBody, Badge } from '../components/ui';

export default function CustomObjectList() {
  const { objectName } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['object-records', objectName, page, search],
    queryFn: () => api.get(`/objects/${objectName}?page=${page}&limit=20&search=${search}`),
  });

  const records = data?.data || [];
  const objectDef = data?.object || {};
  const fields = objectDef?.fields || [];
  const pagination = data?.pagination || {};

  // Get visible fields for table (skip owner, organization, timestamps)
  const visibleFields = fields.filter(f =>
    !['owner', 'organization', 'createdAt', 'updatedAt'].includes(f.name)
  ).slice(0, 5); // Limit to first 5 fields

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{objectDef.pluralLabel || objectName}</h1>
        {objectDef.description && (
          <p className="text-gray-500 mt-1">{objectDef.description}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Input
              type="search"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <Button onClick={() => navigate(`/objects/${objectName}/new`)}>
              New {objectDef.label || 'Record'}
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No records found</p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={() => navigate(`/objects/${objectName}/new`)}
              >
                Create first record
              </Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  {visibleFields.map(field => (
                    <th key={field.name} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {records.map((record) => (
                  <tr
                    key={record._id}
                    onClick={() => navigate(`/objects/${objectName}/${record._id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-primary-600">
                      {record.name || 'Unnamed'}
                    </td>
                    {visibleFields.map(field => (
                      <td key={field.name} className="px-4 py-3 text-sm text-gray-500">
                        {renderFieldValue(record[field.name], field)}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === pagination.pages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function renderFieldValue(value, field) {
  if (value === null || value === undefined) return '-';

  switch (field.type) {
    case 'Boolean':
      return value ? 'Yes' : 'No';
    case 'Date':
    case 'DateTime':
      return new Date(value).toLocaleDateString();
    case 'Currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    case 'Percent':
      return `${value}%`;
    case 'Picklist':
      return value;
    case 'MultiPicklist':
      return Array.isArray(value) ? value.join(', ') : value;
    default:
      return String(value);
  }
}