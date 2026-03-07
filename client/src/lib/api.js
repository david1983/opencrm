const API_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_URL;
  }

  getAuthToken() {
    return localStorage.getItem('token');
  }

  setAuthToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getAuthToken();

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || 'An error occurred');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // Auth
  login(credentials) {
    return this.post('/auth/login', credentials);
  }

  register(data) {
    return this.post('/auth/register', data);
  }

  logout() {
    this.setAuthToken(null);
    return this.post('/auth/logout');
  }

  getMe() {
    return this.get('/auth/me');
  }

  // Accounts
  getAccounts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/accounts${query ? `?${query}` : ''}`);
  }

  getAccount(id) {
    return this.get(`/accounts/${id}`);
  }

  createAccount(data) {
    return this.post('/accounts', data);
  }

  updateAccount(id, data) {
    return this.put(`/accounts/${id}`, data);
  }

  deleteAccount(id) {
    return this.delete(`/accounts/${id}`);
  }

  // Contacts
  getContacts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/contacts${query ? `?${query}` : ''}`);
  }

  getContact(id) {
    return this.get(`/contacts/${id}`);
  }

  createContact(data) {
    return this.post('/contacts', data);
  }

  updateContact(id, data) {
    return this.put(`/contacts/${id}`, data);
  }

  deleteContact(id) {
    return this.delete(`/contacts/${id}`);
  }

  // Leads
  getLeads(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/leads${query ? `?${query}` : ''}`);
  }

  getLead(id) {
    return this.get(`/leads/${id}`);
  }

  createLead(data) {
    return this.post('/leads', data);
  }

  updateLead(id, data) {
    return this.put(`/leads/${id}`, data);
  }

  deleteLead(id) {
    return this.delete(`/leads/${id}`);
  }

  convertLead(id, data) {
    return this.post(`/leads/${id}/convert`, data);
  }

  // Opportunities
  getOpportunities(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/opportunities${query ? `?${query}` : ''}`);
  }

  getOpportunity(id) {
    return this.get(`/opportunities/${id}`);
  }

  createOpportunity(data) {
    return this.post('/opportunities', data);
  }

  updateOpportunity(id, data) {
    return this.put(`/opportunities/${id}`, data);
  }

  deleteOpportunity(id) {
    return this.delete(`/opportunities/${id}`);
  }

  // Activities
  getActivities(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/activities${query ? `?${query}` : ''}`);
  }

  getActivity(id) {
    return this.get(`/activities/${id}`);
  }

  createActivity(data) {
    return this.post('/activities', data);
  }

  updateActivity(id, data) {
    return this.put(`/activities/${id}`, data);
  }

  deleteActivity(id) {
    return this.delete(`/activities/${id}`);
  }

  // Tasks
  getTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/tasks${query ? `?${query}` : ''}`);
  }

  getTask(id) {
    return this.get(`/tasks/${id}`);
  }

  createTask(data) {
    return this.post('/tasks', data);
  }

  updateTask(id, data) {
    return this.put(`/tasks/${id}`, data);
  }

  deleteTask(id) {
    return this.delete(`/tasks/${id}`);
  }

  // Reports
  getDashboard() {
    return this.get('/reports/dashboard');
  }

  getPipelineReport() {
    return this.get('/reports/pipeline');
  }

  getLeadsBySource() {
    return this.get('/reports/leads-by-source');
  }

  getLeadsByStatus() {
    return this.get('/reports/leads-by-status');
  }

  getActivitySummary(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/reports/activities${query ? `?${query}` : ''}`);
  }

  // Admin - Organization
  getOrganization() {
    return this.get('/admin/organization');
  }

  updateOrganization(data) {
    return this.put('/admin/organization', data);
  }

  // Admin - Users
  getAdminUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.get(`/admin/users${query ? `?${query}` : ''}`);
  }

  getAdminUser(id) {
    return this.get(`/admin/users/${id}`);
  }

  updateAdminUser(id, data) {
    return this.put(`/admin/users/${id}`, data);
  }

  deleteAdminUser(id) {
    return this.delete(`/admin/users/${id}`);
  }

  resetUserPassword(id, password) {
    return this.post(`/admin/users/${id}/reset-password`, { password });
  }

  // Admin - Custom Objects
  getCustomObjects() {
    return this.get('/admin/setup/objects');
  }

  getCustomObject(id) {
    return this.get(`/admin/setup/objects/${id}`);
  }

  createCustomObject(data) {
    return this.post('/admin/setup/objects', data);
  }

  updateCustomObject(id, data) {
    return this.put(`/admin/setup/objects/${id}`, data);
  }

  deleteCustomObject(id) {
    return this.delete(`/admin/setup/objects/${id}`);
  }

  // Admin - Custom Fields
  getFieldTypes() {
    return this.get('/admin/setup/field-types');
  }

  getCustomFields(objectId) {
    return this.get(`/admin/setup/objects/${objectId}/fields`);
  }

  createCustomField(objectId, data) {
    return this.post(`/admin/setup/objects/${objectId}/fields`, data);
  }

  updateCustomField(id, data) {
    return this.put(`/admin/setup/fields/${id}`, data);
  }

  deleteCustomField(id) {
    return this.delete(`/admin/setup/fields/${id}`);
  }

  // Global Search
  search(query) {
    return this.get(`/search?q=${encodeURIComponent(query)}`);
  }

  // Audit History
  getAuditHistory(entityType, entityId) {
    return this.get(`/audit/${entityType}/${entityId}`);
  }

  // Notes
  getNotes(parentType, parentId) {
    return this.get(`/notes?parentType=${parentType}&parentId=${parentId}`);
  }

  getNote(id) {
    return this.get(`/notes/${id}`);
  }

  createNote(data) {
    return this.post('/notes', data);
  }

  updateNote(id, data) {
    return this.put(`/notes/${id}`, data);
  }

  deleteNote(id) {
    return this.delete(`/notes/${id}`);
  }

  // Attachments
  getAttachments(parentType, parentId) {
    return this.get(`/attachments?parentType=${parentType}&parentId=${parentId}`);
  }

  getAttachmentUrl(id) {
    return `${this.baseUrl}/attachments/${id}`;
  }

  uploadAttachment(parentType, parentId, file) {
    const formData = new FormData();
    formData.append('parentType', parentType);
    formData.append('parentId', parentId);
    formData.append('file', file);

    const token = this.getAuthToken();
    return fetch(`${this.baseUrl}/attachments`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      credentials: 'include',
      body: formData,
    }).then(res => {
      if (!res.ok) {
        return res.json().then(data => {
          throw new Error(data.error || 'Upload failed');
        });
      }
      return res.json();
    });
  }

  deleteAttachment(id) {
    return this.delete(`/attachments/${id}`);
  }
}

const api = new ApiClient();
export default api;