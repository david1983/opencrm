import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Button, Input, Select, Card, CardHeader, CardBody, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StageBadge } from '../components/ui';

const STAGE_OPTIONS = [
  { value: '', label: 'All Stages' },
  { value: 'Prospecting', label: 'Prospecting' },
  { value: 'Qualification', label: 'Qualification' },
  { value: 'Proposal', label: 'Proposal' },
  { value: 'Negotiation', label: 'Negotiation' },
  { value: 'Closed Won', label: 'Closed Won' },
  { value: 'Closed Lost', label: 'Closed Lost' },
];

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function OpportunitiesList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [viewMode, setViewMode] = useState('table');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    account: '',
    amount: '',
    stage: 'Prospecting',
    closeDate: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['opportunities', page, search, stageFilter],
    queryFn: () => api.getOpportunities({ page, limit: 20, search, stage: stageFilter }),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.getAccounts({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', account: '', amount: '', stage: 'Prospecting', closeDate: new Date().toISOString().split('T')[0] });
      setErrors({});
    },
    onError: (error) => {
      setErrors(error.data?.errors || { name: error.message });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      account: formData.account || undefined,
    });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const opportunities = data?.data || [];
  const pagination = data?.pagination || {};
  const accountOptions = (accountsData?.data || []).map((a) => ({ value: a._id, label: a.name }));

  // Group by stage for pipeline view
  const pipelineStages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const opportunitiesByStage = opportunities.reduce((acc, opp) => {
    if (!acc[opp.stage]) {
      acc[opp.stage] = [];
    }
    acc[opp.stage].push(opp);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Opportunities</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>New Opportunity</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Input
                type="search"
                placeholder="Search opportunities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64"
              />
              <Select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                options={STAGE_OPTIONS}
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
                variant={viewMode === 'pipeline' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('pipeline')}
              >
                Pipeline
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
            opportunities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No opportunities found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Opportunity Name</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Close Date</TableHead>
                </TableHeader>
                <TableBody>
                  {opportunities.map((opp) => (
                    <TableRow key={opp._id}>
                      <TableCell>
                        <Link to={`/opportunities/${opp._id}`} className="text-primary-600 hover:text-primary-700">
                          {opp.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {opp.account ? (
                          <Link to={`/accounts/${opp.account._id}`} className="text-primary-600 hover:text-primary-700">
                            {opp.account.name}
                          </Link>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(opp.amount)}</TableCell>
                      <TableCell>
                        <StageBadge stage={opp.stage} />
                      </TableCell>
                      <TableCell>{new Date(opp.closeDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="p-4 overflow-x-auto">
              <div className="flex gap-4 min-w-max">
                {pipelineStages.map((stage) => (
                  <div key={stage} className="w-72 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-700">{stage}</h3>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(
                          (opportunitiesByStage[stage] || []).reduce((sum, opp) => sum + (opp.amount || 0), 0)
                        )}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {(opportunitiesByStage[stage] || []).map((opp) => (
                        <Link
                          key={opp._id}
                          to={`/opportunities/${opp._id}`}
                          className="block bg-white p-3 rounded-md shadow-sm hover:shadow-md transition-shadow"
                        >
                          <p className="font-medium text-gray-900">{opp.name}</p>
                          <p className="text-sm text-gray-500">{opp.account?.name || 'No Account'}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(opp.amount)}</span>
                            <span className="text-xs text-gray-400">{new Date(opp.closeDate).toLocaleDateString()}</span>
                          </div>
                        </Link>
                      ))}
                      {(!opportunitiesByStage[stage] || opportunitiesByStage[stage].length === 0) && (
                        <p className="text-sm text-gray-400 text-center py-2">No opportunities</p>
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Opportunity">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Opportunity Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
          <Select
            label="Account"
            name="account"
            value={formData.account}
            onChange={handleChange}
            options={accountOptions}
            placeholder="Select account"
          />
          <Input
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            placeholder="0"
          />
          <Select
            label="Stage"
            name="stage"
            value={formData.stage}
            onChange={handleChange}
            options={STAGE_OPTIONS.filter(s => s.value)}
          />
          <Input
            label="Close Date"
            name="closeDate"
            type="date"
            value={formData.closeDate}
            onChange={handleChange}
            required
          />
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Opportunity'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}