import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Button, Input, Textarea, Select, Card, CardHeader, CardBody, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TaskStatusBadge, PriorityBadge } from '../components/ui';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Deferred', label: 'Deferred' },
];

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'High' },
];

export default function TasksList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'Not Started',
    priority: 'Normal',
    contact: '',
    account: '',
    opportunity: '',
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, statusFilter],
    queryFn: () => api.getTasks({ page, limit: 20, status: statusFilter }),
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api.getContacts({ limit: 100 }),
  });

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.getAccounts({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateModalOpen(false);
      setFormData({
        subject: '',
        description: '',
        dueDate: new Date().toISOString().split('T')[0],
        status: 'Not Started',
        priority: 'Normal',
        contact: '',
        account: '',
        opportunity: '',
      });
      setErrors({});
    },
    onError: (error) => {
      setErrors(error.data?.errors || { subject: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.updateTask(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      dueDate: new Date(formData.dueDate).toISOString(),
      contact: formData.contact || undefined,
      account: formData.account || undefined,
      opportunity: formData.opportunity || undefined,
    };
    createMutation.mutate(payload);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleStatusChange = (taskId, newStatus) => {
    updateMutation.mutate({ id: taskId, status: newStatus });
  };

  const tasks = data?.data || [];
  const pagination = data?.pagination || {};
  const contactOptions = (contactsData?.data || []).map((c) => ({
    value: c._id,
    label: `${c.firstName} ${c.lastName}`,
  }));
  const accountOptions = (accountsData?.data || []).map((a) => ({ value: a._id, label: a.name }));

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (task) => {
    return new Date(task.dueDate) < new Date() && task.status !== 'Completed';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>New Task</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No tasks found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableHead>Subject</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Related To</TableHead>
                <TableHead>Actions</TableHead>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task._id} className={isOverdue(task) ? 'bg-red-50' : ''}>
                    <TableCell>
                      <span className={task.status === 'Completed' ? 'line-through text-gray-500' : ''}>
                        {task.subject}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={isOverdue(task) ? 'text-red-600 font-medium' : ''}>
                        {formatDate(task.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <TaskStatusBadge status={task.status} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={task.priority} />
                    </TableCell>
                    <TableCell>
                      {task.contact && <span>{task.contact.firstName} {task.contact.lastName}</span>}
                      {task.account && <span>{task.account.name}</span>}
                      {!task.contact && !task.account && '-'}
                    </TableCell>
                    <TableCell>
                      {task.status !== 'Completed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(task._id, 'Completed')}
                        >
                          Complete
                        </Button>
                      )}
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Task">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            error={errors.subject}
            required
          />
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              required
            />
            <Select
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={PRIORITY_OPTIONS}
            />
          </div>
          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={STATUS_OPTIONS.filter(s => s.value)}
          />
          <Select
            label="Contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            options={contactOptions}
            placeholder="Select contact"
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
              {createMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}