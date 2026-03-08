/**
 * OpenAPI Schema Definitions for OpenCRM API
 */

// Helper functions for DRY schema creation
export const createListResponse = (itemSchema) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { $ref: itemSchema },
        },
        pagination: { $ref: '#/components/schemas/PaginationMeta' },
      },
    },
  },
});

export const createSingleResponse = (itemSchema) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: { $ref: itemSchema },
  },
});

export default {
  // ============================================
  // Common Schemas
  // ============================================
  SuccessResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Operation completed successfully' },
    },
  },

  ErrorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Invalid input data' },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email format' },
              },
            },
          },
        },
      },
    },
  },

  PaginationQuery: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number for pagination',
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
        description: 'Number of items per page',
      },
      sort: {
        type: 'string',
        description: 'Sort field (prefix with - for descending)',
        example: 'createdAt',
      },
      search: {
        type: 'string',
        description: 'Search query string',
      },
    },
  },

  PaginationMeta: {
    type: 'object',
    properties: {
      currentPage: { type: 'integer', example: 1 },
      totalPages: { type: 'integer', example: 5 },
      totalItems: { type: 'integer', example: 100 },
      itemsPerPage: { type: 'integer', example: 20 },
      hasNextPage: { type: 'boolean', example: true },
      hasPrevPage: { type: 'boolean', example: false },
    },
  },

  ObjectId: {
    type: 'string',
    format: 'mongodb-objectid',
    pattern: '^[a-f\\d]{24}$',
    example: '507f1f77bcf86cd799439011',
  },

  // ============================================
  // Auth Schemas
  // ============================================
  User: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@example.com',
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
      avatar: {
        type: 'string',
        example: 'https://example.com/avatar.jpg',
      },
      role: {
        type: 'string',
        enum: ['user', 'admin'],
        default: 'user',
      },
      roleRef: {
        $ref: '#/components/schemas/ObjectId',
        description: 'Reference to custom role',
      },
      organization: {
        $ref: '#/components/schemas/ObjectId',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        example: 'securePassword123',
      },
    },
  },

  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'name', 'organizationName'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@example.com',
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 6,
        example: 'securePassword123',
      },
      name: {
        type: 'string',
        example: 'John Doe',
      },
      organizationName: {
        type: 'string',
        example: 'Acme Corporation',
      },
    },
  },

  AuthResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          token: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
    },
  },

  // ============================================
  // CRM Schemas
  // ============================================
  Address: {
    type: 'object',
    properties: {
      street: { type: 'string', example: '123 Main St' },
      city: { type: 'string', example: 'San Francisco' },
      state: { type: 'string', example: 'CA' },
      zip: { type: 'string', example: '94105' },
      country: { type: 'string', example: 'USA' },
    },
  },

  Account: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      name: {
        type: 'string',
        example: 'Acme Corporation',
        description: 'Account name',
      },
      industry: {
        type: 'string',
        example: 'Technology',
        description: 'Industry type',
      },
      website: {
        type: 'string',
        format: 'uri',
        example: 'https://acme.com',
      },
      phone: {
        type: 'string',
        example: '+1-555-123-4567',
      },
      address: { $ref: '#/components/schemas/Address' },
      description: {
        type: 'string',
        example: 'A leading technology company',
      },
      owner: { $ref: '#/components/schemas/ObjectId' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  AccountInput: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Acme Corporation' },
      industry: { type: 'string', example: 'Technology' },
      website: { type: 'string', format: 'uri', example: 'https://acme.com' },
      phone: { type: 'string', example: '+1-555-123-4567' },
      address: { $ref: '#/components/schemas/Address' },
      description: { type: 'string', example: 'A leading technology company' },
    },
  },

  Contact: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      email: { type: 'string', format: 'email', example: 'john.doe@acme.com' },
      phone: { type: 'string', example: '+1-555-123-4567' },
      title: { type: 'string', example: 'CTO' },
      account: { $ref: '#/components/schemas/ObjectId' },
      owner: { $ref: '#/components/schemas/ObjectId' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      leadSource: {
        type: 'string',
        enum: ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Advertisement', 'Other'],
      },
      description: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  ContactInput: {
    type: 'object',
    required: ['firstName', 'lastName', 'email'],
    properties: {
      firstName: { type: 'string', example: 'John' },
      lastName: { type: 'string', example: 'Doe' },
      email: { type: 'string', format: 'email', example: 'john.doe@acme.com' },
      phone: { type: 'string', example: '+1-555-123-4567' },
      title: { type: 'string', example: 'CTO' },
      account: { $ref: '#/components/schemas/ObjectId' },
      leadSource: {
        type: 'string',
        enum: ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Advertisement', 'Other'],
      },
      description: { type: 'string' },
    },
  },

  Lead: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      firstName: { type: 'string', example: 'Jane' },
      lastName: { type: 'string', example: 'Smith' },
      email: { type: 'string', format: 'email', example: 'jane.smith@example.com' },
      phone: { type: 'string', example: '+1-555-987-6543' },
      company: { type: 'string', example: 'Startup Inc' },
      title: { type: 'string', example: 'CEO' },
      status: {
        type: 'string',
        enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Converting'],
        default: 'New',
      },
      source: {
        type: 'string',
        enum: ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Advertisement', 'Other'],
      },
      owner: { $ref: '#/components/schemas/ObjectId' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      description: { type: 'string' },
      convertedAt: { type: 'string', format: 'date-time' },
      convertedTo: {
        type: 'object',
        properties: {
          account: { $ref: '#/components/schemas/ObjectId' },
          contact: { $ref: '#/components/schemas/ObjectId' },
          opportunity: { $ref: '#/components/schemas/ObjectId' },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  LeadInput: {
    type: 'object',
    required: ['firstName', 'lastName', 'email'],
    properties: {
      firstName: { type: 'string', example: 'Jane' },
      lastName: { type: 'string', example: 'Smith' },
      email: { type: 'string', format: 'email', example: 'jane.smith@example.com' },
      phone: { type: 'string', example: '+1-555-987-6543' },
      company: { type: 'string', example: 'Startup Inc' },
      title: { type: 'string', example: 'CEO' },
      status: {
        type: 'string',
        enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted', 'Converting'],
      },
      source: {
        type: 'string',
        enum: ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Advertisement', 'Other'],
      },
      description: { type: 'string' },
    },
  },

  Opportunity: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      name: { type: 'string', example: 'Enterprise Deal' },
      account: { $ref: '#/components/schemas/ObjectId' },
      amount: { type: 'number', example: 50000 },
      stage: {
        type: 'string',
        enum: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
        default: 'Prospecting',
      },
      probability: { type: 'number', minimum: 0, maximum: 100, example: 10 },
      closeDate: { type: 'string', format: 'date' },
      owner: { $ref: '#/components/schemas/ObjectId' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      description: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  OpportunityInput: {
    type: 'object',
    required: ['name', 'closeDate'],
    properties: {
      name: { type: 'string', example: 'Enterprise Deal' },
      account: { $ref: '#/components/schemas/ObjectId' },
      amount: { type: 'number', example: 50000 },
      stage: {
        type: 'string',
        enum: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
      },
      closeDate: { type: 'string', format: 'date' },
      description: { type: 'string' },
    },
  },

  Activity: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      type: {
        type: 'string',
        enum: ['Call', 'Email', 'Meeting', 'Note'],
      },
      subject: { type: 'string', example: 'Initial discovery call' },
      description: { type: 'string', example: 'Discussed product requirements' },
      date: { type: 'string', format: 'date-time' },
      duration: { type: 'number', description: 'Duration in minutes', example: 30 },
      contact: { $ref: '#/components/schemas/ObjectId' },
      account: { $ref: '#/components/schemas/ObjectId' },
      opportunity: { $ref: '#/components/schemas/ObjectId' },
      lead: { $ref: '#/components/schemas/ObjectId' },
      owner: { $ref: '#/components/schemas/ObjectId' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  ActivityInput: {
    type: 'object',
    required: ['type', 'subject'],
    properties: {
      type: {
        type: 'string',
        enum: ['Call', 'Email', 'Meeting', 'Note'],
      },
      subject: { type: 'string', example: 'Initial discovery call' },
      description: { type: 'string', example: 'Discussed product requirements' },
      date: { type: 'string', format: 'date-time' },
      duration: { type: 'number', description: 'Duration in minutes' },
      contact: { $ref: '#/components/schemas/ObjectId' },
      account: { $ref: '#/components/schemas/ObjectId' },
      opportunity: { $ref: '#/components/schemas/ObjectId' },
      lead: { $ref: '#/components/schemas/ObjectId' },
    },
  },

  Task: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      subject: { type: 'string', example: 'Follow up with prospect' },
      description: { type: 'string', example: 'Send pricing information' },
      dueDate: { type: 'string', format: 'date-time' },
      status: {
        type: 'string',
        enum: ['Not Started', 'In Progress', 'Completed', 'Deferred'],
        default: 'Not Started',
      },
      priority: {
        type: 'string',
        enum: ['Low', 'Normal', 'High'],
        default: 'Normal',
      },
      contact: { $ref: '#/components/schemas/ObjectId' },
      account: { $ref: '#/components/schemas/ObjectId' },
      opportunity: { $ref: '#/components/schemas/ObjectId' },
      lead: { $ref: '#/components/schemas/ObjectId' },
      owner: { $ref: '#/components/schemas/ObjectId' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  TaskInput: {
    type: 'object',
    required: ['subject', 'dueDate'],
    properties: {
      subject: { type: 'string', example: 'Follow up with prospect' },
      description: { type: 'string', example: 'Send pricing information' },
      dueDate: { type: 'string', format: 'date-time' },
      status: {
        type: 'string',
        enum: ['Not Started', 'In Progress', 'Completed', 'Deferred'],
      },
      priority: {
        type: 'string',
        enum: ['Low', 'Normal', 'High'],
      },
      contact: { $ref: '#/components/schemas/ObjectId' },
      account: { $ref: '#/components/schemas/ObjectId' },
      opportunity: { $ref: '#/components/schemas/ObjectId' },
      lead: { $ref: '#/components/schemas/ObjectId' },
    },
  },

  Note: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      title: { type: 'string', example: 'Meeting notes' },
      content: { type: 'string', example: 'Detailed meeting notes...' },
      parentType: {
        type: 'string',
        enum: ['Account', 'Contact', 'Lead', 'Opportunity', 'Activity', 'Task'],
      },
      parentId: { $ref: '#/components/schemas/ObjectId' },
      owner: { $ref: '#/components/schemas/ObjectId' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  NoteInput: {
    type: 'object',
    required: ['title', 'content', 'parentType', 'parentId'],
    properties: {
      title: { type: 'string', maxLength: 200, example: 'Meeting notes' },
      content: { type: 'string', maxLength: 10000, example: 'Detailed meeting notes...' },
      parentType: {
        type: 'string',
        enum: ['Account', 'Contact', 'Lead', 'Opportunity', 'Activity', 'Task'],
      },
      parentId: { $ref: '#/components/schemas/ObjectId' },
    },
  },

  Attachment: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      filename: { type: 'string', example: 'contract.pdf' },
      originalName: { type: 'string', example: 'Contract - Acme.pdf' },
      mimeType: { type: 'string', example: 'application/pdf' },
      size: { type: 'number', description: 'File size in bytes', example: 102400 },
      url: { type: 'string', format: 'uri', example: 'https://storage.example.com/files/abc123' },
      storageType: {
        type: 'string',
        enum: ['local', 'google', 'dropbox'],
        default: 'local',
      },
      cloudProvider: {
        type: 'string',
        enum: ['google', 'dropbox'],
      },
      cloudUrl: { type: 'string', format: 'uri' },
      thumbnailUrl: { type: 'string', format: 'uri' },
      parentType: {
        type: 'string',
        enum: ['Account', 'Contact', 'Lead', 'Opportunity', 'Activity', 'Task'],
      },
      parentId: { $ref: '#/components/schemas/ObjectId' },
      owner: { $ref: '#/components/schemas/ObjectId' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  // ============================================
  // Admin Schemas
  // ============================================
  Permission: {
    type: 'object',
    properties: {
      module: {
        type: 'string',
        enum: ['accounts', 'contacts', 'leads', 'opportunities', 'activities', 'tasks', 'reports', 'admin', 'settings'],
        example: 'accounts',
      },
      actions: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['view', 'edit', 'delete', 'create', 'export', 'import'],
        },
        example: ['view', 'edit', 'create'],
      },
    },
  },

  Role: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      name: { type: 'string', example: 'Sales Manager' },
      description: { type: 'string', example: 'Sales team management role' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      isSystem: { type: 'boolean', default: false },
      permissions: {
        type: 'array',
        items: { $ref: '#/components/schemas/Permission' },
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  RoleInput: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string', example: 'Sales Manager' },
      description: { type: 'string', example: 'Sales team management role' },
      permissions: {
        type: 'array',
        items: { $ref: '#/components/schemas/Permission' },
      },
    },
  },

  ConnectedApp: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      name: { type: 'string', example: 'Mobile App' },
      description: { type: 'string', example: 'Mobile application for sales team' },
      logo: { type: 'string', format: 'uri' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      authType: {
        type: 'string',
        enum: ['oauth', 'apikey'],
      },
      clientId: { type: 'string', example: 'app_client_123' },
      redirectUris: {
        type: 'array',
        items: { type: 'string', format: 'uri' },
      },
      scopes: {
        type: 'array',
        items: { type: 'string' },
        example: ['read:accounts', 'write:accounts'],
      },
      isActive: { type: 'boolean', default: true },
      rateLimit: { type: 'number', example: 1000, description: 'Requests per hour' },
      apiKeyPrefix: { type: 'string', example: 'live_' },
      createdBy: { $ref: '#/components/schemas/ObjectId' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  ConnectedAppInput: {
    type: 'object',
    required: ['name', 'authType'],
    properties: {
      name: { type: 'string', example: 'Mobile App' },
      description: { type: 'string', example: 'Mobile application for sales team' },
      logo: { type: 'string', format: 'uri' },
      authType: {
        type: 'string',
        enum: ['oauth', 'apikey'],
      },
      redirectUris: {
        type: 'array',
        items: { type: 'string', format: 'uri' },
      },
      scopes: {
        type: 'array',
        items: { type: 'string' },
      },
      isActive: { type: 'boolean' },
      rateLimit: { type: 'number', description: 'Requests per hour' },
    },
  },

  ConnectedAppSecret: {
    type: 'object',
    properties: {
      clientSecret: {
        type: 'string',
        description: 'OAuth client secret (only shown once)',
        example: 'secret_xyz123',
      },
      apiKey: {
        type: 'string',
        description: 'API key (only shown once)',
        example: 'live_abc123def456',
      },
    },
  },

  CloudStorageCredential: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      provider: {
        type: 'string',
        enum: ['google', 'dropbox'],
      },
      status: {
        type: 'string',
        enum: ['active', 'error', 'pending'],
      },
      lastError: { type: 'string' },
      lastUsed: { type: 'string', format: 'date-time' },
      createdBy: { $ref: '#/components/schemas/ObjectId' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  // ============================================
  // Custom Object Schemas
  // ============================================
  CustomObjectDefinition: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      name: { type: 'string', example: 'Project' },
      label: { type: 'string', example: 'Project' },
      pluralLabel: { type: 'string', example: 'Projects' },
      description: { type: 'string', example: 'Track projects for customers' },
      icon: { type: 'string', default: 'cube' },
      color: { type: 'string', default: '#3b82f6' },
      enableActivities: { type: 'boolean', default: true },
      enableTasks: { type: 'boolean', default: true },
      enableReports: { type: 'boolean', default: true },
      enableSharing: { type: 'boolean', default: false },
      recordNameField: { type: 'string', default: 'name' },
      recordNameLabel: { type: 'string', default: 'Name' },
      isSystem: { type: 'boolean', default: false },
      active: { type: 'boolean', default: true },
      organization: { $ref: '#/components/schemas/ObjectId' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },

  CustomObjectDefinitionInput: {
    type: 'object',
    required: ['name', 'label', 'pluralLabel'],
    properties: {
      name: {
        type: 'string',
        pattern: '^[A-Z][a-zA-Z0-9]*$',
        example: 'Project',
        description: 'Object name in PascalCase (must start with uppercase letter)',
      },
      label: { type: 'string', example: 'Project' },
      pluralLabel: { type: 'string', example: 'Projects' },
      description: { type: 'string', example: 'Track projects for customers' },
      icon: { type: 'string' },
      color: { type: 'string' },
      enableActivities: { type: 'boolean' },
      enableTasks: { type: 'boolean' },
      enableReports: { type: 'boolean' },
      enableSharing: { type: 'boolean' },
      recordNameField: { type: 'string' },
      recordNameLabel: { type: 'string' },
    },
  },

  CustomObjectRecord: {
    type: 'object',
    description: 'Dynamic record structure depends on custom object definition',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      name: { type: 'string', description: 'Record name field' },
      organization: { $ref: '#/components/schemas/ObjectId' },
      owner: { $ref: '#/components/schemas/ObjectId' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
    additionalProperties: true,
  },

  // ============================================
  // Search Schemas
  // ============================================
  SearchResult: {
    type: 'object',
    properties: {
      _id: { $ref: '#/components/schemas/ObjectId' },
      type: { type: 'string', example: 'Account' },
      title: { type: 'string', example: 'Acme Corporation' },
      subtitle: { type: 'string', example: 'Technology' },
      url: { type: 'string', example: '/accounts/507f1f77bcf86cd799439011' },
      score: { type: 'number', example: 0.95 },
    },
  },

  GlobalSearchResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: { $ref: '#/components/schemas/SearchResult' },
          },
          total: { type: 'integer', example: 15 },
          types: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            example: { Account: 5, Contact: 7, Lead: 3 },
          },
        },
      },
    },
  },
};