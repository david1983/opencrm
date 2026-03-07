import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Button, Input, Card, CardHeader, CardBody, Modal, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';

const OBJECT_COLORS = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Yellow' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#6366f1', label: 'Indigo' },
];

export default function CustomObjects() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    pluralLabel: '',
    description: '',
    icon: 'cube',
    color: '#3b82f6',
    enableActivities: true,
    enableTasks: true,
    enableReports: true,
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['custom-objects'],
    queryFn: () => api.get('/admin/setup/objects'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/setup/objects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-objects'] });
      setIsCreateModalOpen(false);
      setFormData({
        name: '',
        label: '',
        pluralLabel: '',
        description: '',
        icon: 'cube',
        color: '#3b82f6',
        enableActivities: true,
        enableTasks: true,
        enableReports: true,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/setup/objects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-objects'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert name to API format (remove spaces, camelCase)
    const formattedData = {
      ...formData,
      name: formData.name.replace(/\s+/g, ''),
    };
    createMutation.mutate(formattedData);
  };

  const handleDelete = (obj) => {
    if (obj.isSystem) {
      alert('Cannot delete system objects');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${obj.label}?`)) {
      deleteMutation.mutate(obj._id);
    }
  };

  const objects = data?.data || [];

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Objects & Fields</h1>
          <p className="text-gray-500 mt-1">Manage custom objects and their fields</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>New Custom Object</Button>
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : objects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No objects found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Object</TableHead>
                <TableHead>API Name</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {objects.map((obj) => (
                  <TableRow key={obj._id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div
                          className="w-8 h-8 rounded flex items-center justify-center mr-3"
                          style={{ backgroundColor: obj.color || '#3b82f6' }}
                        >
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                        <div>
                          <span className="font-medium">{obj.label}</span>
                          <p className="text-xs text-gray-500">{obj.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{obj.name}</code>
                    </TableCell>
                    <TableCell>{obj.fieldCount || 0} fields</TableCell>
                    <TableCell>
                      <Badge variant={obj.isSystem ? 'primary' : 'default'}>
                        {obj.isSystem ? 'System' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {obj.enableActivities && <Badge variant="success" size="sm">Activities</Badge>}
                        {obj.enableTasks && <Badge variant="info" size="sm">Tasks</Badge>}
                        {obj.enableReports && <Badge variant="warning" size="sm">Reports</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link to={`/admin/objects/${obj._id}`}>
                          <Button variant="ghost" size="sm">Edit</Button>
                        </Link>
                        {!obj.isSystem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(obj)}
                            className="text-red-600"
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Custom Object" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Label"
              value={formData.label}
              onChange={(e) => setFormData({
                ...formData,
                label: e.target.value,
                pluralLabel: e.target.value ? `${e.target.value}s` : '',
                name: e.target.value ? e.target.value.replace(/\s+/g, '') : '',
              })}
              placeholder="e.g., Project"
              required
            />
            <Input
              label="Plural Label"
              value={formData.pluralLabel}
              onChange={(e) => setFormData({ ...formData, pluralLabel: e.target.value })}
              placeholder="e.g., Projects"
              required
            />
          </div>
          <Input
            label="API Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.replace(/\s+/g, '') })}
            placeholder="e.g., Project"
            required
          />
          <p className="text-xs text-gray-500 -mt-2">
            This is used in API calls. No spaces allowed.
          </p>
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Brief description of this object"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <div className="flex gap-2">
                {OBJECT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: color.value })}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color.value ? 'border-gray-900' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Features</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enableActivities}
                  onChange={(e) => setFormData({ ...formData, enableActivities: e.target.checked })}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Enable Activities</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enableTasks}
                  onChange={(e) => setFormData({ ...formData, enableTasks: e.target.checked })}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Enable Tasks</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enableReports}
                  onChange={(e) => setFormData({ ...formData, enableReports: e.target.checked })}
                  className="h-4 w-4 text-primary-600 rounded border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Enable Reports</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Object'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}