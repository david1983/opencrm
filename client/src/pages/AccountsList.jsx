import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Button, Input, Card, CardHeader, CardBody, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui';

export default function AccountsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    website: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', page, search],
    queryFn: () => api.getAccounts({ page, limit: 20, search }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', industry: '', website: '', phone: '' });
      setErrors({});
    },
    onError: (error) => {
      setErrors(error.data?.errors || { name: error.message });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const accounts = data?.data || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>New Account</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Input
              type="search"
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No accounts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Account Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Website</TableHead>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account._id}>
                    <TableCell>
                      <Link to={`/accounts/${account._id}`} className="text-primary-600 hover:text-primary-700">
                        {account.name}
                      </Link>
                    </TableCell>
                    <TableCell>{account.industry || '-'}</TableCell>
                    <TableCell>{account.phone || '-'}</TableCell>
                    <TableCell>
                      {account.website ? (
                        <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                          {account.website}
                        </a>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
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

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Account"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Account Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
          <Input
            label="Industry"
            name="industry"
            value={formData.industry}
            onChange={handleChange}
            placeholder="e.g., Technology, Healthcare"
          />
          <Input
            label="Website"
            name="website"
            type="url"
            value={formData.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}