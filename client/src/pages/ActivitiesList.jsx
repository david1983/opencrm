import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Button, Input, Textarea, Select, Card, CardHeader, CardBody, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../components/ui';

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'Call', label: 'Call' },
  { value: 'Email', label: 'Email' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Note', label: 'Note' },
];

const TYPE_COLORS = {
  Call: 'primary',
  Email: 'success',
  Meeting: 'warning',
  Note: 'default',
};

const TYPE_ICONS = {
  Call: '📞',
  Email: '📧',
  Meeting: '📅',
  Note: '📝',
};

// Calendar helper functions
const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  return new Date(year, month, 1).getDay();
};

const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ActivitiesList() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Call',
    subject: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    contact: '',
    account: '',
    opportunity: '',
  });
  const [errors, setErrors] = useState({});

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['activities', page, typeFilter],
    queryFn: () => api.getActivities({ page, limit: 100, type: typeFilter }),
  });

  // Fetch all activities for calendar (no pagination)
  const { data: calendarData } = useQuery({
    queryKey: ['activities-calendar', typeFilter],
    queryFn: () => api.getActivities({ limit: 100, type: typeFilter }),
  });

  // Fetch tasks for calendar
  const { data: tasksData } = useQuery({
    queryKey: ['tasks-calendar'],
    queryFn: () => api.getTasks({ limit: 100 }),
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
    mutationFn: (data) => api.createActivity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities-calendar'] });
      setIsCreateModalOpen(false);
      setFormData({
        type: 'Call',
        subject: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      date: new Date(formData.date).toISOString(),
      duration: formData.duration ? parseInt(formData.duration) : undefined,
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

  const activities = data?.data || [];
  const calendarActivities = calendarData?.data || [];
  const tasks = tasksData?.data || [];
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

  // Calendar navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Group items by date for calendar
  const itemsByDate = {};
  [...calendarActivities.map(a => ({ ...a, itemType: 'activity' })),
   ...tasks.map(t => ({ ...t, itemType: 'task', date: t.dueDate }))]
    .forEach(item => {
      if (item.date) {
        const dateKey = new Date(item.date).toDateString();
        if (!itemsByDate[dateKey]) {
          itemsByDate[dateKey] = [];
        }
        itemsByDate[dateKey].push(item);
      }
    });

  // Generate calendar days
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const calendarDays = [];
  // Empty cells for days before the first day of month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Activities</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>Log Activity</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={TYPE_OPTIONS}
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
                variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {viewMode === 'table' ? (
            isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No activities found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Duration</TableHead>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity._id}>
                      <TableCell>
                        <Badge variant={TYPE_COLORS[activity.type] || 'default'}>{activity.type}</Badge>
                      </TableCell>
                      <TableCell>{activity.subject}</TableCell>
                      <TableCell>{formatDate(activity.date)}</TableCell>
                      <TableCell>
                        {activity.contact && <span>Contact: {activity.contact.firstName} {activity.contact.lastName}</span>}
                        {activity.account && <span>Account: {activity.account.name}</span>}
                        {activity.opportunity && <span>Opp: {activity.opportunity.name}</span>}
                        {!activity.contact && !activity.account && !activity.opportunity && '-'}
                      </TableCell>
                      <TableCell>{activity.duration ? `${activity.duration} min` : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="p-4">
              {/* Calendar Navigation */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={prevMonth}>
                    ← Prev
                  </Button>
                  <Button variant="secondary" size="sm" onClick={nextMonth}>
                    Next →
                  </Button>
                  <Button variant="secondary" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {MONTHS[month]} {year}
                </h2>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
                {/* Day headers */}
                {DAYS.map((day) => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                {/* Calendar days */}
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="bg-white p-2 min-h-[100px]" />;
                  }

                  const date = new Date(year, month, day);
                  const dateKey = date.toDateString();
                  const isToday = isSameDay(date, today);
                  const dayItems = itemsByDate[dateKey] || [];

                  return (
                    <div
                      key={day}
                      className={`bg-white p-2 min-h-[100px] ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayItems.slice(0, 3).map((item, i) => (
                          <div
                            key={i}
                            className={`text-xs p-1 rounded truncate ${
                              item.itemType === 'activity'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                            title={item.subject}
                          >
                            {TYPE_ICONS[item.type] || '📌'} {item.subject}
                          </div>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{dayItems.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-100 rounded"></div>
                  <span className="text-xs text-gray-600">Activity</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-100 rounded"></div>
                  <span className="text-xs text-gray-600">Task</span>
                </div>
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

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Log Activity">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={TYPE_OPTIONS.filter(t => t.value)}
            required
          />
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
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
            <Input
              label="Duration (minutes)"
              name="duration"
              type="number"
              value={formData.duration}
              onChange={handleChange}
              placeholder="e.g., 30"
            />
          </div>
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
              {createMutation.isPending ? 'Saving...' : 'Log Activity'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}