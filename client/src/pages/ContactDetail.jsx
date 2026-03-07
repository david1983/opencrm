import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button, Input, Select, Card, CardHeader, CardBody, Modal } from '../components/ui';
import ActivityTimeline from '../components/ActivityTimeline';
import AuditHistory from '../components/AuditHistory';
import NotesPanel from '../components/NotesPanel';
import AttachmentsPanel from '../components/AttachmentsPanel';

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => api.getContact(id),
    onSuccess: (data) => {
      setFormData(data.data);
    },
  });

  // Fetch related opportunities
  const { data: opportunitiesData } = useQuery({
    queryKey: ['opportunities', { contact: id }],
    queryFn: () => api.getOpportunities({ contact: id, limit: 5 }),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', id] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setIsEditModalOpen(false);
      setErrors({});
    },
    onError: (error) => {
      setErrors(error.data?.errors || { email: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      navigate('/contacts');
    },
  });

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteMutation.mutate();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      ...formData,
      account: formData.account || undefined,
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const contact = data?.data;
  const opportunities = opportunitiesData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/contacts" className="text-sm text-primary-600 hover:text-primary-700">
            &larr; Back to Contacts
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">
            {contact?.firstName} {contact?.lastName}
          </h1>
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
              <h2 className="text-lg font-medium text-gray-900">Contact Details</h2>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contact?.email ? (
                      <a href={`mailto:${contact.email}`} className="text-primary-600 hover:text-primary-700">
                        {contact.email}
                      </a>
                    ) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contact?.phone ? (
                      <a href={`tel:${contact.phone}`} className="text-primary-600 hover:text-primary-700">
                        {contact.phone}
                      </a>
                    ) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Title</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact?.title || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {contact?.account ? (
                      <Link to={`/accounts/${contact.account._id}`} className="text-primary-600 hover:text-primary-700">
                        {contact.account.name}
                      </Link>
                    ) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead Source</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact?.leadSource || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Owner</dt>
                  <dd className="mt-1 text-sm text-gray-900">{contact?.owner?.name || '-'}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          {/* Related Opportunities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Related Opportunities ({opportunities.length})</h2>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {opportunities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No opportunities</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {opportunities.map((opp) => (
                    <div key={opp._id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <Link to={`/opportunities/${opp._id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                          {opp.name}
                        </Link>
                        <p className="text-xs text-gray-500">Close: {new Date(opp.closeDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(opp.amount || 0)}
                        </p>
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
          <NotesPanel parentType="Contact" parentId={id} />
          <AttachmentsPanel parentType="Contact" parentId={id} />
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-1 space-y-6">
          <ActivityTimeline contactId={id} />

          {/* Audit History */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">History</h2>
            </CardHeader>
            <CardBody>
              <AuditHistory entityType="Contact" entityId={id} />
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Contact">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName || ''}
              onChange={handleChange}
              error={errors.firstName}
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName || ''}
              onChange={handleChange}
              error={errors.lastName}
              required
            />
          </div>
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            error={errors.email}
            required
          />
          <Input
            label="Phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
          />
          <Input
            label="Title"
            name="title"
            value={formData.title || ''}
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