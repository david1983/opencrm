import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Button, Input, Select, Card, CardHeader, CardBody, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui';

export default function ContactsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    account: '',
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', page, search],
    queryFn: () => api.getContacts({ page, limit: 20, search }),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.getAccounts({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsCreateModalOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', title: '', account: '' });
      setErrors({});
    },
    onError: (error) => {
      setErrors(error.data?.errors || { email: error.message });
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

  const contacts = data?.data || [];
  const pagination = data?.pagination || {};
  const accountOptions = (accountsData?.data || []).map((a) => ({ value: a._id, label: a.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Contacts</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>New Contact</Button>
      </div>

      <Card>
        <CardHeader>
          <Input
            type="search"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No contacts found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Account</TableHead>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact._id}>
                    <TableCell>
                      <Link to={`/contacts/${contact._id}`} className="text-primary-600 hover:text-primary-700">
                        {contact.firstName} {contact.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.phone || '-'}</TableCell>
                    <TableCell>{contact.title || '-'}</TableCell>
                    <TableCell>
                      {contact.account ? (
                        <Link to={`/accounts/${contact.account._id}`} className="text-primary-600 hover:text-primary-700">
                          {contact.account.name}
                        </Link>
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
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={page === pagination.pages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Contact">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
            />
          </div>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          <Input
            label="Phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />
          <Select
            label="Account"
            name="account"
            value={formData.account}
            onChange={handleChange}
            options={accountOptions}
            placeholder="Select account"
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}