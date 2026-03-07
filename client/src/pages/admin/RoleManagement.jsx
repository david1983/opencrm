import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button, Input, Card, CardHeader, CardBody, Modal, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';

const MODULES = ['accounts', 'contacts', 'leads', 'opportunities', 'activities', 'tasks', 'reports', 'admin', 'settings'];
const ACTIONS = ['view', 'edit', 'delete', 'create', 'export', 'import'];

const MODULE_LABELS = {
  accounts: 'Accounts',
  contacts: 'Contacts',
  leads: 'Leads',
  opportunities: 'Opportunities',
  activities: 'Activities',
  tasks: 'Tasks',
  reports: 'Reports',
  admin: 'Admin',
  settings: 'Settings',
};

const initialPermissions = MODULES.map(module => ({ module, actions: [] }));

export default function RoleManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: initialPermissions,
  });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => api.get('/admin/roles'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/roles', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      closeModal();
    },
    onError: (error) => {
      console.error('Failed to create role:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      closeModal();
    },
    onError: (error) => {
      console.error('Failed to update role:', error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
    },
    onError: (error) => {
      console.error('Failed to delete role:', error);
    },
  });

  const openCreateModal = () => {
    setSelectedRole(null);
    setFormData({ name: '', description: '', permissions: initialPermissions });
    setIsModalOpen(true);
  };

  const openEditModal = (role) => {
    setSelectedRole(role);
    const permissions = MODULES.map(module => {
      const existingPerm = role.permissions?.find(p => p.module === module);
      return {
        module,
        actions: existingPerm?.actions || [],
      };
    });
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
    setFormData({ name: '', description: '', permissions: initialPermissions });
  };

  const handleTogglePermission = (module, action) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.map(p => {
        if (p.module !== module) return p;
        const hasAction = p.actions.includes(action);
        return {
          ...p,
          actions: hasAction
            ? p.actions.filter(a => a !== action)
            : [...p.actions, action],
        };
      }),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const permissions = formData.permissions.filter(p => p.actions.length > 0);
    if (selectedRole) {
      updateMutation.mutate({ id: selectedRole._id, data: { ...formData, permissions } });
    } else {
      createMutation.mutate({ ...formData, permissions });
    }
  };

  const handleDelete = (role) => {
    if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      deleteMutation.mutate(role._id);
    }
  };

  const roles = data?.data || [];

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Role Management</h1>
        <p className="text-gray-500 mt-1">Manage roles and their permissions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-end">
            <Button onClick={openCreateModal}>New Role</Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No roles found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role._id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.description || '-'}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-500">
                        {role.permissions?.reduce((acc, p) => acc + p.actions.length, 0) || 0} permissions
                      </span>
                    </TableCell>
                    <TableCell>
                      {role.isSystem ? (
                        <Badge variant="primary">System</Badge>
                      ) : (
                        <Badge variant="default">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(role)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role)}
                          disabled={role.isSystem}
                          className={role.isSystem ? 'opacity-50' : 'text-red-600'}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={selectedRole ? 'Edit Role' : 'New Role'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    {ACTIONS.map(action => (
                      <th key={action} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.permissions.map(({ module, actions }) => (
                    <tr key={module}>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        {MODULE_LABELS[module]}
                      </td>
                      {ACTIONS.map(action => (
                        <td key={action} className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={actions.includes(action)}
                            onChange={() => handleTogglePermission(module, action)}
                            aria-label={`${MODULE_LABELS[module]} ${action} permission`}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Role'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}