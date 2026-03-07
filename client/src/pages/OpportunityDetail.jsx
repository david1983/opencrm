import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button, Input, Select, Card, CardHeader, CardBody, Modal, StageBadge } from '../components/ui';
import ActivityTimeline from '../components/ActivityTimeline';
import AuditHistory from '../components/AuditHistory';
import NotesPanel from '../components/NotesPanel';
import AttachmentsPanel from '../components/AttachmentsPanel';

const STAGE_OPTIONS = [
  { value: 'Prospecting', label: 'Prospecting' },
  { value: 'Qualification', label: 'Qualification' },
  { value: 'Proposal', label: 'Proposal' },
  { value: 'Negotiation', label: 'Negotiation' },
  { value: 'Closed Won', label: 'Closed Won' },
  { value: 'Closed Lost', label: 'Closed Lost' },
];

const STAGE_PROBABILITIES = {
  'Prospecting': 10,
  'Qualification': 20,
  'Proposal': 50,
  'Negotiation': 75,
  'Closed Won': 100,
  'Closed Lost': 0,
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => api.getOpportunity(id),
    onSuccess: (data) => {
      setFormData({
        ...data.data,
        closeDate: data.data.closeDate?.split('T')[0] || '',
      });
    },
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.getAccounts({ limit: 100 }),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.updateOpportunity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity', id] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setIsEditModalOpen(false);
      setErrors({});
    },
    onError: (error) => {
      setErrors(error.data?.errors || { name: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      navigate('/opportunities');
    },
  });

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
      deleteMutation.mutate();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      probability: STAGE_PROBABILITIES[formData.stage] || 0,
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

  const opportunity = data?.data;
  const accountOptions = (accountsData?.data || []).map((a) => ({ value: a._id, label: a.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/opportunities" className="text-sm text-primary-600 hover:text-primary-700">
            &larr; Back to Opportunities
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">{opportunity?.name}</h1>
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
          {/* Opportunity Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Opportunity Details</h2>
                <StageBadge stage={opportunity?.stage} />
              </div>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Amount</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">{formatCurrency(opportunity?.amount)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expected Revenue</dt>
                  <dd className="mt-1 text-2xl font-bold text-gray-900">
                    {formatCurrency((opportunity?.amount || 0) * (opportunity?.probability || 0) / 100)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Close Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(opportunity?.closeDate).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Account</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {opportunity?.account ? (
                      <Link to={`/accounts/${opportunity.account._id}`} className="text-primary-600 hover:text-primary-700">
                        {opportunity.account.name}
                      </Link>
                    ) : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Probability</dt>
                  <dd className="mt-1 text-sm text-gray-900">{opportunity?.probability || 0}%</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Owner</dt>
                  <dd className="mt-1 text-sm text-gray-900">{opportunity?.owner?.name || '-'}</dd>
                </div>
              </dl>
              {opportunity?.description && (
                <div className="mt-4">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{opportunity.description}</dd>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Stage Progression */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Stage Progression</h2>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between">
                {['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed'].map((stage, index) => {
                  const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
                  const currentIndex = stages.indexOf(opportunity?.stage);
                  const isActive = index < currentIndex || (index === 4 && (opportunity?.stage === 'Closed Won' || opportunity?.stage === 'Closed Lost'));
                  const isCurrent = opportunity?.stage === stage ||
                    (stage === 'Closed' && (opportunity?.stage === 'Closed Won' || opportunity?.stage === 'Closed Lost'));

                  return (
                    <div key={stage} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isActive || isCurrent ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="mt-1 text-xs text-gray-500">{stage}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Notes and Attachments */}
          <NotesPanel parentType="Opportunity" parentId={id} />
          <AttachmentsPanel parentType="Opportunity" parentId={id} />
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-1 space-y-6">
          <ActivityTimeline opportunityId={id} />

          {/* Audit History */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">History</h2>
            </CardHeader>
            <CardBody>
              <AuditHistory entityType="Opportunity" entityId={id} />
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Opportunity">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Opportunity Name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            error={errors.name}
            required
          />
          <Select
            label="Account"
            name="account"
            value={formData.account || ''}
            onChange={handleChange}
            options={accountOptions}
            placeholder="Select account"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              name="amount"
              type="number"
              value={formData.amount || ''}
              onChange={handleChange}
              placeholder="0"
            />
            <Select
              label="Stage"
              name="stage"
              value={formData.stage || 'Prospecting'}
              onChange={handleChange}
              options={STAGE_OPTIONS}
            />
          </div>
          <Input
            label="Close Date"
            name="closeDate"
            type="date"
            value={formData.closeDate || ''}
            onChange={handleChange}
            required
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