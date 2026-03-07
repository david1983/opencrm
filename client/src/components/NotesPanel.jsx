import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Button, Textarea, Input, Card, CardHeader, CardBody, Modal } from './ui';

export default function NotesPanel({ parentType, parentId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '' });

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notes', parentType, parentId],
    queryFn: () => api.getNotes(parentType, parentId),
    enabled: !!parentType && !!parentId,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.createNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsModalOpen(false);
      setFormData({ title: '', content: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setEditingNote(null);
      setFormData({ title: '', content: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingNote) {
      updateMutation.mutate({
        id: editingNote._id,
        data: { ...formData, parentType, parentId },
      });
    } else {
      createMutation.mutate({ ...formData, parentType, parentId });
    }
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content });
    setIsModalOpen(true);
  };

  const handleDelete = (note) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteMutation.mutate(note._id);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const notes = data?.data || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Notes ({notes.length})</h2>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          </div>
        ) : notes.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No notes yet</p>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note._id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{note.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      By {note.owner?.name || 'Unknown'} • {formatDate(note.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(note)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(note)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNote(null);
          setFormData({ title: '', content: '' });
        }}
        title={editingNote ? 'Edit Note' : 'Add Note'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
            required
          />
          <Textarea
            label="Content"
            name="content"
            value={formData.content}
            onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
            rows={4}
            required
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingNote(null);
                setFormData({ title: '', content: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {editingNote ? 'Save Changes' : 'Add Note'}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}