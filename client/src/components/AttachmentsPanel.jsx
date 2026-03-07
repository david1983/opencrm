import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Button, Card, CardHeader, CardBody, Modal } from './ui';

const FILE_ICONS = {
  'image/jpeg': '📷',
  'image/png': '📷',
  'image/gif': '📷',
  'image/webp': '📷',
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'text/plain': '📃',
  'text/csv': '📊',
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function AttachmentsPanel({ parentType, parentId }) {
  const fileInputRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['attachments', parentType, parentId],
    queryFn: () => api.getAttachments(parentType, parentId),
    enabled: !!parentType && !!parentId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      setUploadError(null);
      return api.uploadAttachment(parentType, parentId, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      setUploadError(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteAttachment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDownload = (attachment) => {
    const url = api.getAttachmentUrl(attachment._id);
    const token = api.getAuthToken();
    // Open in new tab with auth
    window.open(`${url}?token=${token}`, '_blank');
  };

  const handleDelete = (attachment) => {
    if (window.confirm(`Are you sure you want to delete "${attachment.originalName}"?`)) {
      deleteMutation.mutate(attachment._id);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const attachments = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Attachments ({attachments.length})</h2>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
            <Button size="sm" onClick={() => fileInputRef.current?.click()}>
              Upload File
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        {uploadMutation.isPending && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
            Uploading file...
          </div>
        )}
        {uploadError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {uploadError}
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No attachments yet</p>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div
                key={attachment._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {FILE_ICONS[attachment.mimeType] || '📎'}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {attachment.originalName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(attachment.size)} • {formatDate(attachment.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                  >
                    Download
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(attachment)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}