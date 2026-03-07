import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button, Input, Textarea, Card, CardHeader, CardBody, Modal } from '../components/ui';
import ActivityTimeline from '../components/ActivityTimeline';
import AuditHistory from '../components/AuditHistory';
import NotesPanel from '../components/NotesPanel';
import AttachmentsPanel from '../components/AttachmentsPanel';

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: () => api.getAccount(id),
    onSuccess: (data) => {
      setFormData(data.data);
    },
  });

  // Fetch related contacts
  const { data: contactsData } = useQuery({
    queryKey: ['contacts', { account: id }],
    queryFn: () => api.getContacts({ account: id, limit: 10 }),
  });

  // Fetch related opportunities
  const { data: opportunitiesData } = useQuery({
    queryKey: ['opportunities', { account: id }],
    queryFn: () => api.getOpportunities({ account: id, limit: 5 }),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.updateAccount(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account', id] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setIsEditModalOpen(false);
      setErrors({});
    },
    onError: (error) => {
      setErrors(error.data?.errors || { name: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      navigate('/accounts');
    },
  });

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      deleteMutation.mutate();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const account = data?.data;
  const contacts = contactsData?.data || [];
  const opportunities = opportunitiesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/accounts" className="text-sm text-primary-600 hover:text-primary-700">
            &larr; Back to Accounts
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{account?.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleEdit}>
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Account Details</h2>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Industry</dt>
                  <dd className="mt-1 text-sm text-gray-900">{account?.industry || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{account?.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Website</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {account?.website ? (
                      <a href={account.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                        {account.website}
                      </a>
                    ) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Owner</dt>
                  <dd className="mt-1 text-sm text-gray-900">{account?.owner?.name || '-'}</dd>
                </div>
              </dl>
              {account?.address && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {[account.address.street, account.address.city, account.address.state, account.address.zip, account.address.country]
                      .filter(Boolean)
                      .join(', ') || '-'}
                  </dd>
                </div>
              )}
              {account?.description && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{account.description}</dd>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Related Contacts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Contacts ({contacts.length})</h2>
                <Link to={`/contacts?account=${id}`} className="text-sm text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {contacts.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No contacts</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {contacts.slice(0, 5).map((contact) => (
                    <div key={contact._id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <Link to={`/contacts/${contact._id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                          {contact.firstName} {contact.lastName}
                        </Link>
                        <p className="text-xs text-gray-500">{contact.title || 'No title'}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {contact.email}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Related Opportunities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Opportunities ({opportunities.length})</h2>
                <Link to={`/opportunities?account=${id}`} className="text-sm text-primary-600 hover:text-primary-700">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {opportunities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No opportunities</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {opportunities.slice(0, 5).map((opp) => (
                    <div key={opp._id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <Link to={`/opportunities/${opp._id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                          {opp.name}
                        </Link>
                        <p className="text-xs text-gray-500">Close: {new Date(opp.closeDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatCurrency(opp.amount)}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {opp.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Notes and Attachments */}
          <NotesPanel parentType="Account" parentId={id} />
          <AttachmentsPanel parentType="Account" parentId={id} />
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-1 space-y-6">
          <ActivityTimeline accountId={id} />

          {/* Audit History */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">History</h2>
            </CardHeader>
            <CardBody>
              <AuditHistory entityType="Account" entityId={id} />
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Account">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Account Name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            error={errors.name}
            required
          />
          <Input
            label="Industry"
            name="industry"
            value={formData.industry || ''}
            onChange={handleChange}
          />
          <Input
            label="Website"
            name="website"
            type="url"
            value={formData.website || ''}
            onChange={handleChange}
          />
          <Input
            label="Phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
          />
          <Textarea
            label="Description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}