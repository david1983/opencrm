# API Documentation with OpenAPI - Design Document

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:writing-plans to create the implementation plan.

**Goal:** Add interactive API documentation using OpenAPI/Swagger, accessible both as Swagger UI endpoint and admin page link.

**Architecture:** Hybrid approach - swagger-jsdoc for route documentation (docs live with code) + central schemas.js for model definitions. Swagger UI endpoint is public for reading, but "Try it out" requires JWT token.

**Tech Stack:** swagger-ui-express, swagger-jsdoc

---

## Backend Components

### File Structure

```
server/src/
├── docs/
│   ├── index.js          # OpenAPI config + swagger-jsdoc setup
│   └── schemas.js        # Central schema definitions
├── routes/
│   └── *.routes.js       # Existing routes with added @openapi JSDoc
└── app.js                # Mount /api/docs endpoint
```

### docs/index.js

- Exports `swaggerSpec` (OpenAPI JSON) and `swaggerUi` handler
- Defines OpenAPI metadata:
  - title: OpenCRM API
  - version: 1.0.0
  - description: RESTful API for OpenCRM
  - servers: development/production URLs
  - security schemes: bearerAuth (JWT)
- Uses `swagger-jsdoc` to scan route files for `@openapi` comments

### docs/schemas.js

Exports OpenAPI schema objects for all models:

**Models:**
- Account, Contact, Lead, Opportunity, Activity, Task, Note, Attachment

**Auth:**
- User, LoginRequest, RegisterRequest, TokenResponse

**Admin:**
- Role, Permission, ConnectedApp, CloudStorageCredential

**Custom:**
- CustomObjectDefinition, CustomObjectRecord

**Common:**
- PaginationQuery, ErrorResponse, SuccessResponse

### Route Documentation Pattern

```javascript
/**
 * @openapi
 * /accounts:
 *   get:
 *     summary: List all accounts
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *     responses:
 *       200:
 *         description: List of accounts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', protect, getAccounts);
```

---

## Frontend Components

### client/src/pages/admin/ApiDocs.jsx

- Card-based layout showing API documentation overview
- Link to Swagger UI (`/api/docs`) opens in new tab
- Instructions section for authentication:
  1. Open browser DevTools → Application → Cookies
  2. Copy the `token` cookie value
  3. In Swagger UI, click "Authorize" button
  4. Paste token with `Bearer ` prefix
- Quick reference table showing endpoint categories

### Routing Updates

**App.jsx:**
- Add `<Route path="api-docs" element={<ApiDocs />} />` to admin routes

**AdminLayout.jsx:**
- Add "API Docs" link in sidebar navigation

---

## Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/docs` | Public | Swagger UI HTML |
| `GET /api/docs/swagger.json` | Public | OpenAPI JSON spec |

---

## Routes to Document

| Category | Route Files |
|----------|-------------|
| Core CRM | authRoutes, accountRoutes, contactRoutes, leadRoutes, opportunityRoutes |
| Activity | activityRoutes, taskRoutes, noteRoutes, attachmentRoutes |
| Admin | adminRoutes, userAdminRoutes, roleAdminRoutes, connectedAppAdminRoutes, cloudStorageAdminRoutes |
| System | reportRoutes, searchRoutes, auditRoutes, setupRoutes, oauthRoutes, objectRecordsRoutes |

---

## Dependencies

```json
{
  "swagger-ui-express": "^5.0.0",
  "swagger-jsdoc": "^6.2.8"
}
```

---

## Testing

- `GET /api/docs` returns Swagger UI HTML
- `GET /api/docs/swagger.json` returns valid OpenAPI 3.0 spec
- All endpoints appear in generated spec
- Frontend page renders correctly
- Links to Swagger UI work