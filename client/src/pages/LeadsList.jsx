import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Button, Input, Select, Card, CardHeader, CardBody, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, LeadStatusBadge } from '../components/ui';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Unqualified', label: 'Unqualified' },
  { value: 'Converted', label: 'Converted' },
];

const SOURCE_OPTIONS = [
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Trade Show', label: 'Trade Show' },
  { value: 'Cold Call', label: 'Cold Call' },
  { value: 'Advertisement', label: 'Advertisement' },
  { value: 'Other', label: 'Other' },
];

export default function LeadsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'kanban'
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    status: 'New',
    source: 'Other',
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, search, statusFilter],
    queryFn: () => api.getLeads({ page, limit: 20, search, status: statusFilter }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsCreateModalOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', company: '', title: '', status: 'New', source: 'Other' });
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

  const leads = data?.data || [];
  const pagination = data?.pagination || {};

  // Group leads by status for Kanban view
  const leadsByStatus = leads.reduce((acc, lead) => {
    if (!acc[lead.status]) {
      acc[lead.status] = [];
    }
    acc[lead.status].push(lead);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>New Lead</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Input
                type="search"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={STATUS_OPTIONS}
                className="w-40"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                Kanban
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : viewMode === 'table' ? (
            leads.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No leads found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead._id}>
                      <TableCell>
                        <Link to={`/leads/${lead._id}`} className="text-primary-600 hover:text-primary-700">
                          {lead.firstName} {lead.lastName}
                        </Link>
                      </TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.company || '-'}</TableCell>
                      <TableCell>
                        <LeadStatusBadge status={lead.status} />
                      </TableCell>
                      <TableCell>{lead.source}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-5 gap-4">
                {['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'].map((status) => (
                  <div key={status} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-700 mb-3">{status}</h3>
                    <div className="space-y-2">
                      {(leadsByStatus[status] || []).map((lead) => (
                        <Link
                          key={lead._id}
                          to={`/leads/${lead._id}`}
                          className="block bg-white p-3 rounded-md shadow-sm hover:shadow-md transition-shadow"
                        >
                          <p className="font-medium text-gray-900">{lead.firstName} {lead.lastName}</p>
                          <p className="text-sm text-gray-500">{lead.company}</p>
                          <p className="text-sm text-gray-400">{lead.email}</p>
                        </Link>
                      ))}
                      {(!leadsByStatus[status] || leadsByStatus[status].length === 0) && (
                        <p className="text-sm text-gray-400 text-center py-2">No leads</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {pagination.pages > 1 && viewMode === 'table' && (
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Lead">
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
            label="Company"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={STATUS_OPTIONS.filter(s => s.value)}
            />
            <Select
              label="Source"
              name="source"
              value={formData.source}
              onChange={handleChange}
              options={SOURCE_OPTIONS}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}