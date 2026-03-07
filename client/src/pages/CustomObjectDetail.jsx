import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import { Button, Input, Textarea, Select, Card, CardHeader, CardBody, Modal } from '../components/ui';

export default function CustomObjectDetail() {
  const { objectName, recordId } = useParams();
  const navigate = useNavigate();
  const isNew = recordId === 'new';
  const [isEditMode, setIsEditMode] = useState(isNew);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch object definition
  const { data: objectDefData, isLoading: isLoadingObject } = useQuery({
    queryKey: ['object-definition', objectName],
    queryFn: () => api.get(`/objects/${objectName}/definition`),
  });

  // Fetch record if not new
  const { data: recordData, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['object-record', objectName, recordId],
    queryFn: () => api.get(`/objects/${objectName}/${recordId}`),
    enabled: !isNew,
    onSuccess: (data) => {
      setFormData(data.data || {});
    },
  });

  // Initialize form data for new records
  useEffect(() => {
    if (isNew && objectDefData?.fields) {
      const initialData = {};
      objectDefData.fields.forEach(field => {
        if (field.defaultValue !== undefined) {
          initialData[field.name] = field.defaultValue;
        } else if (field.type === 'Boolean') {
          initialData[field.name] = false;
        } else {
          initialData[field.name] = '';
        }
      });
      setFormData(initialData);
    }
  }, [isNew, objectDefData]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data) => api.post(`/objects/${objectName}`, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['object-records', objectName] });
      navigate(`/objects/${objectName}/${response.data._id}`);
    },
    onError: (error) => {
      setErrors(error.data?.errors || { name: error.message });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data) => api.put(`/objects/${objectName}/${recordId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-record', objectName, recordId] });
      queryClient.invalidateQueries({ queryKey: ['object-records', objectName] });
      setIsEditMode(false);
      setErrors({});
    },
    onError: (error) => {
      setErrors(error.data?.errors || { name: error.message });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/objects/${objectName}/${recordId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['object-records', objectName] });
      navigate(`/objects/${objectName}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNew) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
    setShowDeleteModal(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCancel = () => {
    if (isNew) {
      navigate(`/objects/${objectName}`);
    } else {
      setFormData(recordData?.data || {});
      setIsEditMode(false);
      setErrors({});
    }
  };

  const objectDef = objectDefData?.data || objectDefData || {};
  const fields = objectDef?.fields || [];
  const record = recordData?.data || {};

  // Sort fields by created order (or by name if no order)
  const sortedFields = [...fields].sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return (a.order || 0) - (b.order || 0);
  });

  // Filter out system fields for the form
  const editableFields = sortedFields.filter(f =>
    !['owner', 'organization', 'createdAt', 'updatedAt'].includes(f.name)
  );

  // Group fields into two columns for display
  const displayFields = sortedFields.filter(f =>
    !['owner', 'organization'].includes(f.name)
  );

  const isLoading = isLoadingObject || (!isNew && isLoadingRecord);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const renderFieldInput = (field) => {
    const commonProps = {
      label: field.label || field.name,
      name: field.name,
      value: formData[field.name] ?? '',
      onChange: handleChange,
      error: errors[field.name],
      required: field.required,
    };

    switch (field.type) {
      case 'Text':
      case 'Email':
      case 'Phone':
      case 'URL':
        return (
          <Input
            {...commonProps}
            type={field.type === 'Email' ? 'email' : field.type === 'Phone' ? 'tel' : field.type === 'URL' ? 'url' : 'text'}
          />
        );

      case 'TextArea':
        return <Textarea {...commonProps} rows={4} />;

      case 'Number':
        return (
          <Input
            {...commonProps}
            type="number"
            step={field.decimalPlaces ? `0.${'0'.repeat(field.decimalPlaces - 1)}1` : '1'}
          />
        );

      case 'Currency':
        return (
          <Input
            {...commonProps}
            type="number"
            step="0.01"
          />
        );

      case 'Percent':
        return (
          <Input
            {...commonProps}
            type="number"
            step="0.01"
            min="0"
            max="100"
          />
        );

      case 'Date':
        return <Input {...commonProps} type="date" />;

      case 'DateTime':
        return <Input {...commonProps} type="datetime-local" />;

      case 'Boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={formData[field.name] || false}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor={field.name} className="ml-2 text-sm text-gray-700">
              {field.label || field.name}
            </label>
          </div>
        );

      case 'Picklist':
        return (
          <Select
            {...commonProps}
            options={(field.options || []).map(opt => ({
              value: typeof opt === 'string' ? opt : opt.value,
              label: typeof opt === 'string' ? opt : opt.label,
            }))}
            placeholder={field.required ? 'Select...' : 'None'}
          />
        );

      case 'MultiPicklist':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label || field.name}
            </label>
            <div className="space-y-2">
              {(field.options || []).map(opt => {
                const optValue = typeof opt === 'string' ? opt : opt.value;
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                const selectedValues = formData[field.name] || [];
                return (
                  <label key={optValue} className="flex items-center">
                    <input
                      type="checkbox"
                      name={field.name}
                      value={optValue}
                      checked={selectedValues.includes(optValue)}
                      onChange={(e) => {
                        const { checked, value } = e.target;
                        setFormData(prev => ({
                          ...prev,
                          [field.name]: checked
                            ? [...(prev[field.name] || []), value]
                            : (prev[field.name] || []).filter(v => v !== value),
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{optLabel}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      default:
        return <Input {...commonProps} type="text" />;
    }
  };

  const renderFieldValue = (field, value) => {
    if (value === null || value === undefined) return '-';

    switch (field.type) {
      case 'Boolean':
        return value ? 'Yes' : 'No';
      case 'Date':
      case 'DateTime':
        return value ? new Date(value).toLocaleDateString() : '-';
      case 'Currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
      case 'Percent':
        return `${value}%`;
      case 'MultiPicklist':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return String(value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/objects/${objectName}`} className="text-sm text-primary-600 hover:text-primary-700">
            &larr; Back to {objectDef.pluralLabel || objectName}
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-1">
            {isNew ? `New ${objectDef.label || 'Record'}` : (record.name || 'Record')}
          </h1>
        </div>
        {!isNew && !isEditMode && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsEditMode(true)}>
              Edit
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">
            {isEditMode ? (isNew ? 'Create Record' : 'Edit Record') : 'Details'}
          </h2>
        </CardHeader>
        <CardBody>
          {isEditMode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {editableFields.map(field => (
                  <div key={field._id || field.name} className={field.type === 'TextArea' ? 'md:col-span-2' : ''}>
                    {renderFieldInput(field)}
                  </div>
                ))}
              </div>

              {errors.form && (
                <div className="text-sm text-red-600">{errors.form}</div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" type="button" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : isNew ? 'Create' : 'Save Changes'}
                </Button>
              </div>
            </form>
          ) : (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {displayFields.map(field => (
                <div key={field._id || field.name}>
                  <dt className="text-sm font-medium text-gray-500">{field.label || field.name}</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {renderFieldValue(field, record[field.name])}
                  </dd>
                </div>
              ))}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Modified</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {record.updatedAt ? new Date(record.updatedAt).toLocaleString() : '-'}
                </dd>
              </div>
            </dl>
          )}
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete this record? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}