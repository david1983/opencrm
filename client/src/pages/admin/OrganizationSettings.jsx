import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button, Input, Select, Card, CardHeader, CardBody } from '../../components/ui';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
];

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'JPY', label: 'Japanese Yen (¥)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const INDUSTRIES = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Education', label: 'Education' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Other', label: 'Other' },
];

export default function OrganizationSettings() {
  const [formData, setFormData] = useState({});
  const [saved, setSaved] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: () => api.get('/admin/organization'),
    onSuccess: (data) => {
      setFormData(data.data);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/admin/organization', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('features.')) {
      const feature = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        features: { ...prev.features, [feature]: checked },
      }));
    } else if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const org = formData;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Organization Settings</h1>
        <p className="text-gray-500 mt-1">Manage your organization's profile and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Company Information</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Organization Name"
                name="name"
                value={org.name || ''}
                onChange={handleChange}
              />
              <Select
                label="Industry"
                name="industry"
                value={org.industry || ''}
                onChange={handleChange}
                options={INDUSTRIES}
                placeholder="Select industry"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Website"
                name="website"
                type="url"
                value={org.website || ''}
                onChange={handleChange}
                placeholder="https://example.com"
              />
              <Input
                label="Phone"
                name="phone"
                value={org.phone || ''}
                onChange={handleChange}
              />
            </div>
            <Select
              label="Company Size"
              name="companySize"
              value={org.companySize || ''}
              onChange={handleChange}
              options={COMPANY_SIZES}
              placeholder="Select company size"
            />
          </CardBody>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Address</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Street"
              name="address.street"
              value={org.address?.street || ''}
              onChange={handleChange}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                name="address.city"
                value={org.address?.city || ''}
                onChange={handleChange}
              />
              <Input
                label="State/Province"
                name="address.state"
                value={org.address?.state || ''}
                onChange={handleChange}
              />
              <Input
                label="ZIP/Postal Code"
                name="address.zip"
                value={org.address?.zip || ''}
                onChange={handleChange}
              />
            </div>
            <Input
              label="Country"
              name="address.country"
              value={org.address?.country || ''}
              onChange={handleChange}
            />
          </CardBody>
        </Card>

        {/* Locale Settings */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Locale Settings</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Select
                label="Timezone"
                name="timezone"
                value={org.timezone || ''}
                onChange={handleChange}
                options={TIMEZONES}
              />
              <Select
                label="Currency"
                name="currency"
                value={org.currency || ''}
                onChange={handleChange}
                options={CURRENCIES}
              />
              <Select
                label="Date Format"
                name="dateFormat"
                value={org.dateFormat || ''}
                onChange={handleChange}
                options={DATE_FORMATS}
              />
            </div>
          </CardBody>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Features</h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-500 mb-4">Enable or disable features for your organization</p>
            <div className="space-y-3">
              {[
                { key: 'leads', label: 'Leads', description: 'Manage leads and lead conversion' },
                { key: 'opportunities', label: 'Opportunities', description: 'Track sales opportunities and pipeline' },
                { key: 'activities', label: 'Activities', description: 'Log calls, emails, meetings, and notes' },
                { key: 'tasks', label: 'Tasks', description: 'Create and manage tasks' },
                { key: 'reports', label: 'Reports', description: 'View reports and dashboards' },
              ].map((feature) => (
                <label key={feature.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{feature.label}</span>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    name={`features.${feature.key}`}
                    checked={org.features?.[feature.key] || false}
                    onChange={handleChange}
                    className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                  />
                </label>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          {saved && (
            <span className="text-green-600 text-sm">Changes saved successfully!</span>
          )}
        </div>
      </form>
    </div>
  );
}