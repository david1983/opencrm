import swaggerJsdoc from 'swagger-jsdoc';
import schemas, { createListResponse, createSingleResponse } from './schemas.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'OpenCRM API',
      version: '1.0.0',
      description: 'RESTful API for OpenCRM - A modern, open-source Customer Relationship Management platform',
      contact: {
        name: 'OpenCRM Support',
        email: 'support@opencrm.io',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API server (relative path)',
      },
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Enter your JWT token in the format: Bearer {token}',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API Key authentication for Connected Apps',
        },
      },
      schemas: schemas,
      responses: {
        UnauthorizedError: {
          description: 'Unauthorized - Invalid or missing authentication token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'Unauthorized',
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid or expired token',
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Not Found - The requested resource does not exist',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'Not Found',
                  },
                  message: {
                    type: 'string',
                    example: 'Resource not found',
                  },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation Error - Invalid input data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'Validation Error',
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid input data',
                  },
                  details: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: {
                          type: 'string',
                          example: 'email',
                        },
                        message: {
                          type: 'string',
                          example: 'Invalid email format',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'Forbidden',
                  },
                  message: {
                    type: 'string',
                    example: 'You do not have permission to perform this action',
                  },
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Too Many Requests - Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  error: {
                    type: 'string',
                    example: 'Too Many Requests',
                  },
                  message: {
                    type: 'string',
                    example: 'Rate limit exceeded. Please try again later.',
                  },
                },
              },
            },
          },
        },
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field (prefix with - for descending order)',
          required: false,
          schema: {
            type: 'string',
          },
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search query string',
          required: false,
          schema: {
            type: 'string',
          },
        },
        IdParam: {
          name: 'id',
          in: 'path',
          description: 'Resource ID (MongoDB ObjectId)',
          required: true,
          schema: {
            type: 'string',
            pattern: '^[a-f\\d]{24}$',
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Accounts',
        description: 'Account management operations',
      },
      {
        name: 'Contacts',
        description: 'Contact management operations',
      },
      {
        name: 'Leads',
        description: 'Lead management operations',
      },
      {
        name: 'Opportunities',
        description: 'Opportunity management operations',
      },
      {
        name: 'Activities',
        description: 'Activity management operations',
      },
      {
        name: 'Tasks',
        description: 'Task management operations',
      },
      {
        name: 'Notes',
        description: 'Note management operations',
      },
      {
        name: 'Attachments',
        description: 'Attachment management operations',
      },
      {
        name: 'Roles',
        description: 'Role management operations (Admin)',
      },
      {
        name: 'Connected Apps',
        description: 'Connected App management operations (Admin)',
      },
      {
        name: 'Cloud Storage',
        description: 'Cloud storage configuration operations (Admin)',
      },
      {
        name: 'Search',
        description: 'Global search operations',
      },
      {
        name: 'Reports',
        description: 'Report operations',
      },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerSpec, createListResponse, createSingleResponse };
export default swaggerSpec;