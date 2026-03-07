import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button, Input, Select, Card, CardHeader, CardBody, Modal, LeadStatusBadge } from '../components/ui';
import AuditHistory from '../components/AuditHistory';
import NotesPanel from '../components/NotesPanel';
import AttachmentsPanel from '../components/AttachmentsPanel';

const STATUS_OPTIONS = [
  { value: 'New', label: 'New' },
  { value: 'Contacted', label: 'Contacted' },
  { value: 'Qualified', label: 'Qualified' },
  { value: 'Unqualified', label: 'Unqualified' },
];

const SOURCE_OPTIONS = [
  { value: 'Website', label: 'Website' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Trade Show', label: 'Trade Show' },
  { value: 'Cold Call', label: 'Cold Call' },
  { value: 'Advertisement', label: 'Advertisement' },
  { value: 'Other', label: 'Other' },
];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [convertData, setConvertData] = useState({
    createAccount: true,
    accountName: '',
    createOpportunity: true,
    opportunityName: '',
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => api.getLead(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.updateLead(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditModalOpen(false);
      setErrors({});
    },
    onError: (error) => {
      setErrors(error.data?.errors || { email: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      navigate('/leads');
    },
  });

  const convertMutation = useMutation({
    mutationFn: (data) => api.convertLead(id, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setIsConvertModalOpen(false);
      // Navigate to the created contact
      if (result.data?.contact?._id) {
        navigate(`/contacts`);
      } else {
        navigate('/leads');
      }
    },
    onError: (error) => {
      setErrors({ convert: error.message });
    },
  });

  const handleEdit = () => {
    setFormData(data?.data || {});
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate();
    }
  };

  const handleConvert = () => {
    const lead = data?.data;
    setConvertData({
      createAccount: true,
      accountName: lead?.company || '',
      createOpportunity: true,
      opportunityName: lead?.company ? `${lead.company} - New Business` : '',
    });
    setIsConvertModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleConvertSubmit = (e) => {
    e.preventDefault();
    convertMutation.mutate(convertData);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleConvertChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConvertData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const lead = data?.data;

  // Check if lead is already converted
  const isConverted = lead?.status === 'Converted';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/leads" className="text-sm text-primary-600 hover:text-primary-700">
            &larr; Back to Leads
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">
            {lead?.firstName} {lead?.lastName}
          </h1>
        </div>
        <div className="flex gap-2">
          {!isConverted && (
            <>
              <Button variant="secondary" onClick={handleEdit}>
                Edit
              </Button>
              <Button onClick={handleConvert}>
                Convert
              </Button>
            </>
          )}
          <Button variant="danger" onClick={handleDelete} disabled={deleteMutation.isPending}>
            Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Lead Details</h2>
            <LeadStatusBadge status={lead?.status} />
          </div>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead?.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead?.phone || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Company</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead?.company || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Title</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead?.title || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Source</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead?.source || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Owner</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead?.owner?.name || '-'}</dd>
            </div>
          </dl>
          {lead?.description && (
            <div className="mt-4">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.description}</dd>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Audit History */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">History</h2>
        </CardHeader>
        <CardBody>
          <AuditHistory entityType="Lead" entityId={id} />
        </CardBody>
      </Card>

      {/* Notes and Attachments */}
      <NotesPanel parentType="Lead" parentId={id} />
      <AttachmentsPanel parentType="Lead" parentId={id} />

      {/* Conversion Info */}
      {isConverted && lead?.convertedTo && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Converted Records</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-4">
              This lead was converted on {new Date(lead.convertedAt).toLocaleDateString()}.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {lead.convertedTo.account && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Account</h3>
                  <Link to={`/accounts/${lead.convertedTo.account._id}`} className="text-primary-600 hover:text-primary-700">
                    View Account
                  </Link>
                </div>
              )}
              {lead.convertedTo.contact && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                  <Link to={`/contacts/${lead.convertedTo.contact._id}`} className="text-primary-600 hover:text-primary-700">
                    View Contact
                  </Link>
                </div>
              )}
              {lead.convertedTo.opportunity && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Opportunity</h3>
                  <Link to={`/opportunities/${lead.convertedTo.opportunity._id}`} className="text-primary-600 hover:text-primary-700">
                    View Opportunity
                  </Link>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Lead">
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
            label="Company"
            name="company"
            value={formData.company || ''}
            onChange={handleChange}
          />
          <Input
            label="Title"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              name="status"
              value={formData.status || 'New'}
              onChange={handleChange}
              options={STATUS_OPTIONS}
            />
            <Select
              label="Source"
              name="source"
              value={formData.source || 'Other'}
              onChange={handleChange}
              options={SOURCE_OPTIONS}
            />
          </div>
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

      <Modal isOpen={isConvertModalOpen} onClose={() => setIsConvertModalOpen(false)} title="Convert Lead">
        <form onSubmit={handleConvertSubmit} className="space-y-4">
          <p className="text-sm text-gray-600">
            Converting this lead will create a Contact and optionally an Account and Opportunity.
          </p>

          <div className="border-t pt-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="createAccount"
                name="createAccount"
                checked={convertData.createAccount}
                onChange={handleConvertChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="createAccount" className="ml-2 text-sm font-medium text-gray-700">
                Create Account
              </label>
            </div>
            {convertData.createAccount && (
              <Input
                label="Account Name"
                name="accountName"
                value={convertData.accountName}
                onChange={handleConvertChange}
                placeholder="Company name"
              />
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="createOpportunity"
                name="createOpportunity"
                checked={convertData.createOpportunity}
                onChange={handleConvertChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="createOpportunity" className="ml-2 text-sm font-medium text-gray-700">
                Create Opportunity
              </label>
            </div>
            {convertData.createOpportunity && (
              <Input
                label="Opportunity Name"
                name="opportunityName"
                value={convertData.opportunityName}
                onChange={handleConvertChange}
                placeholder="Opportunity name"
              />
            )}
          </div>

          {errors.convert && (
            <p className="text-sm text-red-600">{errors.convert}</p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsConvertModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={convertMutation.isPending}>
              {convertMutation.isPending ? 'Converting...' : 'Convert Lead'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}