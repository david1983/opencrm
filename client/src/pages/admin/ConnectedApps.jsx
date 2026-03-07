import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button, Input, Select, Card, CardHeader, CardBody, Modal, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';

const initialFormData = {
  name: '',
  description: '',
  authType: 'oauth',
  redirectUris: '',
  scopes: '',
  rateLimit: 1000,
  isActive: true,
};

export default function ConnectedApps() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [newSecret, setNewSecret] = useState(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-connected-apps'],
    queryFn: () => api.get('/admin/connected-apps'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/admin/connected-apps', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-connected-apps'] });
      setNewSecret(response.data);
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/connected-apps/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-connected-apps'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/connected-apps/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-connected-apps'] });
    },
  });

  const regenerateSecretMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/connected-apps/${id}/regenerate-secret`),
    onSuccess: (response) => {
      setNewSecret(response.data);
      queryClient.invalidateQueries({ queryKey: ['admin-connected-apps'] });
    },
  });

  const regenerateKeyMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/connected-apps/${id}/regenerate-key`),
    onSuccess: (response) => {
      setNewSecret(response.data);
      queryClient.invalidateQueries({ queryKey: ['admin-connected-apps'] });
    },
  });

  const openCreateModal = () => {
    setSelectedApp(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (app) => {
    setSelectedApp(app);
    setFormData({
      name: app.name,
      description: app.description || '',
      authType: app.authType,
      redirectUris: (app.redirectUris || []).join(', '),
      scopes: (app.scopes || []).join(', '),
      rateLimit: app.rateLimit || 1000,
      isActive: app.isActive,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      authType: formData.authType,
      isActive: formData.isActive,
    };

    if (formData.authType === 'oauth') {
      payload.redirectUris = formData.redirectUris
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      payload.scopes = formData.scopes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (formData.authType === 'apikey') {
      payload.rateLimit = Number(formData.rateLimit) || 1000;
    }

    if (selectedApp) {
      updateMutation.mutate({ id: selectedApp._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (app) => {
    if (window.confirm(`Are you sure you want to delete "${app.name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(app._id);
    }
  };

  const handleRegenerateSecret = (app) => {
    setSelectedApp(app);
    setNewSecret(null);
    setIsSecretModalOpen(true);
    regenerateSecretMutation.mutate(app._id);
  };

  const handleRegenerateKey = (app) => {
    setSelectedApp(app);
    setNewSecret(null);
    setIsSecretModalOpen(true);
    regenerateKeyMutation.mutate(app._id);
  };

  const closeSecretModal = () => {
    setIsSecretModalOpen(false);
    setSelectedApp(null);
    setNewSecret(null);
  };

  const apps = data?.data || [];

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Connected Apps</h1>
        <p className="text-gray-500 mt-1">Manage OAuth applications and API keys for external integrations</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-end">
            <Button onClick={openCreateModal}>New App</Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No connected apps found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client ID / Key Prefix</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {apps.map((app) => (
                  <TableRow key={app._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{app.name}</div>
                        {app.description && (
                          <div className="text-sm text-gray-500">{app.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={app.authType === 'oauth' ? 'primary' : 'default'}>
                        {app.authType === 'oauth' ? 'OAuth' : 'API Key'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {app.authType === 'oauth' ? app.clientId : app.apiKeyPrefix}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={app.isActive ? 'success' : 'default'}>
                        {app.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(app)}>
                          Edit
                        </Button>
                        {app.authType === 'oauth' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerateSecret(app)}
                            disabled={regenerateSecretMutation.isPending}
                          >
                            Regenerate Secret
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRegenerateKey(app)}
                            disabled={regenerateKeyMutation.isPending}
                          >
                            Regenerate Key
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(app)}
                          className="text-red-600"
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
        title={selectedApp ? 'Edit Connected App' : 'New Connected App'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <Select
            label="Auth Type"
            value={formData.authType}
            onChange={(e) => setFormData({ ...formData, authType: e.target.value })}
            options={[
              { value: 'oauth', label: 'OAuth 2.0' },
              { value: 'apikey', label: 'API Key' },
            ]}
            disabled={!!selectedApp}
          />

          {formData.authType === 'oauth' && (
            <>
              <Input
                label="Redirect URIs"
                placeholder="https://example.com/callback, https://example.com/oauth/callback"
                value={formData.redirectUris}
                onChange={(e) => setFormData({ ...formData, redirectUris: e.target.value })}
              />
              <p className="text-sm text-gray-500 -mt-2">
                Comma-separated list of allowed redirect URIs
              </p>
              <Input
                label="Scopes"
                placeholder="read, write, admin"
                value={formData.scopes}
                onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
              />
              <p className="text-sm text-gray-500 -mt-2">
                Comma-separated list of permission scopes
              </p>
            </>
          )}

          {formData.authType === 'apikey' && (
            <Input
              label="Rate Limit"
              type="number"
              placeholder="1000"
              value={formData.rateLimit}
              onChange={(e) => setFormData({ ...formData, rateLimit: e.target.value })}
            />
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>

          {(createMutation.error || updateMutation.error) && (
            <p className="text-sm text-red-600">
              {createMutation.error?.response?.data?.error ||
                updateMutation.error?.response?.data?.error ||
                'Failed to save connected app'}
            </p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" type="button" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : selectedApp
                  ? 'Save Changes'
                  : 'Create App'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Secret/Key Display Modal */}
      <Modal
        isOpen={isSecretModalOpen}
        onClose={closeSecretModal}
        title={selectedApp?.authType === 'oauth' ? 'Client Secret' : 'API Key'}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {selectedApp?.authType === 'oauth'
              ? 'A new client secret has been generated. Make sure to copy it now as it won\'t be shown again.'
              : 'A new API key has been generated. Make sure to copy it now as it won\'t be shown again.'}
          </p>
          {regenerateSecretMutation.isPending || regenerateKeyMutation.isPending ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : newSecret ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectedApp?.authType === 'oauth' ? 'Client Secret' : 'API Key'}
              </label>
              <code className="block text-sm bg-white px-3 py-2 rounded border break-all">
                {newSecret.clientSecret || newSecret.apiKey}
              </code>
            </div>
          ) : null}
          <div className="flex justify-end gap-3">
            <Button onClick={closeSecretModal}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}