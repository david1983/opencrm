import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Button, Input, Select, Card, CardHeader, CardBody, Modal } from '../../components/ui';

const FIELD_TYPES = [
  { value: 'Text', label: 'Text' },
  { value: 'Number', label: 'Number' },
  { value: 'Date', label: 'Date' },
  { value: 'DateTime', label: 'Date/Time' },
  { value: 'Boolean', label: 'Checkbox' },
  { value: 'Picklist', label: 'Picklist (Dropdown)' },
  { value: 'MultiPicklist', label: 'Multi-Select Picklist' },
  { value: 'Email', label: 'Email' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Url', label: 'URL' },
  { value: 'Currency', label: 'Currency' },
  { value: 'Percent', label: 'Percent' },
  { value: 'TextArea', label: 'Text Area' },
  { value: 'LongTextArea', label: 'Long Text Area' },
];

export default function ObjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    label: '',
    type: 'Text',
    required: false,
    unique: false,
    description: '',
    options: [],
    defaultValue: '',
  });
  const [newOption, setNewOption] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['custom-object', id],
    queryFn: () => api.get(`/admin/setup/objects/${id}`),
  });

  const createFieldMutation = useMutation({
    mutationFn: (data) => api.post('/admin/setup/objects/' + id + '/fields', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-object', id] });
      closeFieldModal();
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: ({ fieldId, data }) => api.put(`/admin/setup/fields/${fieldId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-object', id] });
      closeFieldModal();
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (fieldId) => api.delete(`/admin/setup/fields/${fieldId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-object', id] });
    },
  });

  const closeFieldModal = () => {
    setIsFieldModalOpen(false);
    setEditingField(null);
    setFieldForm({
      name: '',
      label: '',
      type: 'Text',
      required: false,
      unique: false,
      description: '',
      options: [],
      defaultValue: '',
    });
    setNewOption('');
  };

  const openCreateFieldModal = () => {
    closeFieldModal();
    setIsFieldModalOpen(true);
  };

  const openEditFieldModal = (field) => {
    setEditingField(field);
    setFieldForm({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      unique: field.unique,
      description: field.description || '',
      options: field.options || [],
      defaultValue: field.defaultValue || '',
    });
    setIsFieldModalOpen(true);
  };

  const handleFieldSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...fieldForm,
      object: id,
      name: fieldForm.name.replace(/\s+/g, '_').toLowerCase(),
    };

    if (editingField) {
      updateFieldMutation.mutate({ fieldId: editingField._id, data });
    } else {
      createFieldMutation.mutate(data);
    }
  };

  const handleDeleteField = (field) => {
    if (field.name === 'name') {
      alert('Cannot delete the name field');
      return;
    }
    if (window.confirm(`Delete field "${field.label}"?`)) {
      deleteFieldMutation.mutate(field._id);
    }
  };

  const addOption = () => {
    if (newOption.trim()) {
      setFieldForm({
        ...fieldForm,
        options: [...fieldForm.options, { value: newOption.trim(), label: newOption.trim() }],
      });
      setNewOption('');
    }
  };

  const removeOption = (index) => {
    setFieldForm({
      ...fieldForm,
      options: fieldForm.options.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const obj = data?.data;
  const fields = obj?.fields || [];

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/objects')}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{obj?.label}</h1>
          <p className="text-gray-500">{obj?.description || 'Manage fields for this object'}</p>
        </div>
      </div>

      {/* Object Info */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">API Name:</span>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded">{obj?.name}</code>
            </div>
            <div>
              <span className="text-gray-500">Plural Label:</span>
              <span className="ml-2">{obj?.pluralLabel}</span>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2">{obj?.isSystem ? 'System Object' : 'Custom Object'}</span>
            </div>
            <div>
              <span className="text-gray-500">Fields:</span>
              <span className="ml-2">{fields.length}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Fields Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Fields</h2>
            <Button onClick={openCreateFieldModal}>Add Field</Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {fields.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No fields yet. Click "Add Field" to create one.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Label</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {fields.map((field) => (
                  <tr key={field._id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{field.label}</td>
                    <td className="px-4 py-3">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{field.name}</code>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{field.type}</td>
                    <td className="px-4 py-3 text-sm">
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Button variant="ghost" size="sm" onClick={() => openEditFieldModal(field)}>
                        Edit
                      </Button>
                      {field.name !== 'name' && (
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteField(field)} className="text-red-600">
                          Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Field Modal */}
      <Modal isOpen={isFieldModalOpen} onClose={closeFieldModal} title={editingField ? 'Edit Field' : 'Add Field'} size="lg">
        <form onSubmit={handleFieldSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Field Label"
              value={fieldForm.label}
              onChange={(e) => setFieldForm({
                ...fieldForm,
                label: e.target.value,
                name: e.target.value ? e.target.value.replace(/\s+/g, '_').toLowerCase() : '',
              })}
              placeholder="e.g., Annual Revenue"
              required
              disabled={!!editingField}
            />
            <Input
              label="API Name"
              value={fieldForm.name}
              onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
              placeholder="e.g., annual_revenue"
              required
              disabled={!!editingField}
            />
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Used in API calls. Use lowercase and underscores.
          </p>
          <Select
            label="Field Type"
            value={fieldForm.type}
            onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })}
            options={FIELD_TYPES}
            disabled={!!editingField}
          />
          <Input
            label="Description"
            value={fieldForm.description}
            onChange={(e) => setFieldForm({ ...fieldForm, description: e.target.value })}
            placeholder="Help text for this field"
          />
          <Input
            label="Default Value"
            value={fieldForm.defaultValue}
            onChange={(e) => setFieldForm({ ...fieldForm, defaultValue: e.target.value })}
            placeholder="Default value for new records"
          />

          {/* Picklist Options */}
          {(fieldForm.type === 'Picklist' || fieldForm.type === 'MultiPicklist') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
              <div className="space-y-2">
                {fieldForm.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="flex-1 text-sm bg-gray-100 px-3 py-2 rounded">{option.label}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeOption(index)} className="text-red-600">
                      Remove
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option..."
                    className="flex-1"
                  />
                  <Button type="button" variant="secondary" onClick={addOption}>Add</Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={fieldForm.required}
                onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                className="h-4 w-4 text-primary-600 rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Required field</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={fieldForm.unique}
                onChange={(e) => setFieldForm({ ...fieldForm, unique: e.target.checked })}
                className="h-4 w-4 text-primary-600 rounded border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700">Unique values only</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={closeFieldModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={createFieldMutation.isPending || updateFieldMutation.isPending}>
              {editingField ? 'Save Changes' : 'Create Field'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}