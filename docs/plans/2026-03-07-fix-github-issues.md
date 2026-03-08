# Fix 11 GitHub Issues Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 11 open GitHub issues covering a server startup crash, security vulnerabilities, broken features, and frontend bugs.

**Architecture:** Issues are grouped by area and fixed in dependency order. Security and correctness fixes go first, then model changes, then OAuth, then lead conversion, then frontend. Each task follows TDD: write a failing test, make it pass, commit.

**Tech Stack:** Node.js/Express, Mongoose/MongoDB, React, TanStack Query v5, Jest + Supertest (server tests), in-memory MongoDB via `mongodb-memory-server`

---

## Issue Reference

| Issue | Task | Summary |
|---|---|---|
| #14 | 1 | Missing `objectRecordsRoutes` import crashes server |
| #15 | 2 | Auth middleware passes null user when account deleted |
| #16 | 3 | IDOR on single-entity GET endpoints |
| #17 | 4 | `getUsers` has no organization filter |
| #18 | 5 | Custom objects not scoped to an organization |
| #19 | 6 | API key auth always fails (no authorization record created) |
| #20 | 7 | OAuth refresh tokens never expire |
| #21 | 8 | In-memory OAuth auth codes lost on server restart |
| #22 | 9 | Lead conversion has no transaction |
| #23 | 10 | `'Url'` vs `'URL'` field type case mismatch |
| #24 | 11 | `onSuccess` removed in TanStack Query v5 — edit form loads blank |

---

### Task 1: Fix missing `objectRecordsRoutes` import (Issue #14)

**Files:**
- Modify: `server/src/app.js:10-28` (imports section)

**Step 1: Verify the bug**

```bash
cd server && node --input-type=module < src/app.js 2>&1 | head -5
```

Expected: `ReferenceError: objectRecordsRoutes is not defined`

**Step 2: Add the missing import**

In `server/src/app.js`, add after the last route import (line ~28):

```js
import objectRecordsRoutes from './routes/objectRecordsRoutes.js';
```

**Step 3: Run existing tests to confirm nothing broke**

```bash
cd server && npm test -- --testPathPattern=auth 2>&1 | tail -5
```

Expected: PASS

**Step 4: Commit**

```bash
git add server/src/app.js
git commit -m "fix: add missing objectRecordsRoutes import to app.js (closes #14)"
```

---

### Task 2: Auth middleware — reject requests with deleted user (Issue #15)

**Files:**
- Modify: `server/src/middleware/auth.js:24-27`
- Test: `server/tests/auth-middleware.test.js` (create new)

**Step 1: Write the failing test**

Create `server/tests/auth-middleware.test.js`:

```js
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';

describe('Auth Middleware - deleted user', () => {
  let app;

  beforeAll(async () => {
    app = createApp;
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Organization.deleteMany({});
  });

  it('should return 401 when user no longer exists in database', async () => {
    const org = await Organization.create({ name: 'Test Org' });
    const user = await User.create({
      name: 'Ghost User',
      email: 'ghost@example.com',
      password: 'password123',
      organization: org._id,
    });

    // Generate a valid token for the user
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Delete the user (simulates account deletion)
    await User.deleteOne({ _id: user._id });

    // Token is valid but user is gone
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toMatch(/no longer exists/i);
  });
});
```

**Step 2: Run test to confirm it fails**

```bash
cd server && npm test -- --testPathPattern=auth-middleware 2>&1 | tail -10
```

Expected: FAIL (currently returns 500 or throws)

**Step 3: Fix the middleware**

In `server/src/middleware/auth.js`, update the inner try block (lines 24-27):

```js
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'User no longer exists',
    });
  }
  next();
} catch (error) {
  return res.status(401).json({
    success: false,
    error: 'Not authorized to access this route',
  });
}
```

**Step 4: Run tests**

```bash
cd server && npm test -- --testPathPattern=auth-middleware 2>&1 | tail -5
```

Expected: PASS

**Step 5: Run full suite to check no regressions**

```bash
cd server && npm test -- --testPathPattern=auth 2>&1 | tail -5
```

**Step 6: Commit**

```bash
git add server/src/middleware/auth.js server/tests/auth-middleware.test.js
git commit -m "fix: reject requests when user no longer exists after JWT decode (closes #15)"
```

---

### Task 3: Fix IDOR on single-entity GET endpoints (Issue #16)

Affects 8 controllers. The fix is to add owner/org scoping to each `findById` call.

**Files:**
- Modify: `server/src/controllers/accountController.js:50`
- Modify: `server/src/controllers/contactController.js:45`
- Modify: `server/src/controllers/leadController.js:48`
- Modify: `server/src/controllers/opportunityController.js:49`
- Modify: `server/src/controllers/activityController.js:55`
- Modify: `server/src/controllers/taskController.js:59`
- Modify: `server/src/controllers/noteController.js:36`
- Modify: `server/src/controllers/attachmentController.js:55`
- Test: `server/tests/idor.test.js` (create new)

**Step 1: Write failing tests**

Create `server/tests/idor.test.js`:

```js
import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import Account from '../src/models/Account.js';
import Contact from '../src/models/Contact.js';
import Lead from '../src/models/Lead.js';
import Opportunity from '../src/models/Opportunity.js';

describe('IDOR Prevention — single-entity GET endpoints', () => {
  let app;
  let user1Token, user2Token;
  let org1Id, user1Id, user2Id;

  beforeAll(async () => {
    app = createApp;
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Account.deleteMany({});
    await Contact.deleteMany({});
    await Lead.deleteMany({});
    await Opportunity.deleteMany({});

    const org1 = await Organization.create({ name: 'Org 1' });
    org1Id = org1._id;

    const u1 = await User.create({
      name: 'User 1', email: 'u1@test.com', password: 'pass1234', organization: org1._id,
    });
    user1Id = u1._id;

    const u2 = await User.create({
      name: 'User 2', email: 'u2@test.com', password: 'pass1234', organization: org1._id,
    });
    user2Id = u2._id;

    const r1 = await request(app).post('/api/auth/login').send({ email: 'u1@test.com', password: 'pass1234' });
    user1Token = r1.body.token;

    const r2 = await request(app).post('/api/auth/login').send({ email: 'u2@test.com', password: 'pass1234' });
    user2Token = r2.body.token;
  });

  it('should not allow user2 to GET an account owned by user1', async () => {
    const account = await Account.create({ name: 'Secret Corp', owner: user1Id, organization: org1Id });

    const response = await request(app)
      .get(`/api/accounts/${account._id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(response.status).toBe(404);
  });

  it('should allow user1 to GET their own account', async () => {
    const account = await Account.create({ name: 'My Corp', owner: user1Id, organization: org1Id });

    const response = await request(app)
      .get(`/api/accounts/${account._id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('My Corp');
  });

  it('should not allow user2 to GET a contact owned by user1', async () => {
    const contact = await Contact.create({
      firstName: 'Secret', lastName: 'Person', email: 'secret@test.com',
      owner: user1Id, organization: org1Id,
    });

    const response = await request(app)
      .get(`/api/contacts/${contact._id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(response.status).toBe(404);
  });

  it('should not allow user2 to GET a lead owned by user1', async () => {
    const lead = await Lead.create({
      firstName: 'Secret', lastName: 'Lead', email: 'sleadd@test.com',
      owner: user1Id, organization: org1Id,
    });

    const response = await request(app)
      .get(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(response.status).toBe(404);
  });

  it('should not allow user2 to GET an opportunity owned by user1', async () => {
    const account = await Account.create({ name: 'Acme', owner: user1Id, organization: org1Id });
    const opp = await Opportunity.create({
      name: 'Secret Deal', stage: 'Prospecting', closeDate: new Date(),
      owner: user1Id, organization: org1Id, account: account._id,
    });

    const response = await request(app)
      .get(`/api/opportunities/${opp._id}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(response.status).toBe(404);
  });
});
```

**Step 2: Run tests to confirm they fail**

```bash
cd server && npm test -- --testPathPattern=idor 2>&1 | tail -10
```

Expected: FAIL (currently returns 200 for all)

**Step 3: Fix accountController.js**

In `server/src/controllers/accountController.js`, update `getAccount` (line ~50):

```js
export const getAccount = async (req, res, next) => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      owner: req.user.id,
    }).populate('owner', 'name email');

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    res.status(200).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
};
```

**Step 4: Fix contactController.js**

In `server/src/controllers/contactController.js`, update `getContact` (line ~45):

```js
export const getContact = async (req, res, next) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      owner: req.user.id,
    })
      .populate('owner', 'name email')
      .populate('account', 'name industry phone website');

    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' });
    }

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};
```

**Step 5: Fix leadController.js**

In `server/src/controllers/leadController.js`, update `getLead` (line ~48):

```js
export const getLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      owner: req.user.id,
    }).populate('owner', 'name email');

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.status(200).json({ success: true, data: lead });
  } catch (error) {
    next(error);
  }
};
```

**Step 6: Fix opportunityController.js**

In `server/src/controllers/opportunityController.js`, update `getOpportunity` (line ~49):

```js
export const getOpportunity = async (req, res, next) => {
  try {
    const opportunity = await Opportunity.findOne({
      _id: req.params.id,
      owner: req.user.id,
    })
      .populate('owner', 'name email')
      .populate('account', 'name industry phone website');

    if (!opportunity) {
      return res.status(404).json({ success: false, error: 'Opportunity not found' });
    }

    res.status(200).json({ success: true, data: opportunity });
  } catch (error) {
    next(error);
  }
};
```

**Step 7: Fix activityController.js**

In `server/src/controllers/activityController.js`, update `getActivity` (line ~55):

```js
export const getActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      owner: req.user.id,
    })
      .populate('owner', 'name email')
      .populate('contact', 'firstName lastName email phone')
      .populate('account', 'name industry')
      .populate('opportunity', 'name stage amount');

    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    res.status(200).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};
```

**Step 8: Fix taskController.js**

In `server/src/controllers/taskController.js`, update `getTask` (line ~59):

```js
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user.id,
    })
      .populate('owner', 'name email')
      .populate('contact', 'firstName lastName email phone')
      .populate('account', 'name industry')
      .populate('opportunity', 'name stage amount');

    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};
```

**Step 9: Fix noteController.js**

In `server/src/controllers/noteController.js`, update `getNote` (line ~36). Notes are org-scoped (not per-user), so use organization:

```js
export const getNote = async (req, res, next) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    }).populate('owner', 'name email');

    if (!note) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }

    res.status(200).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};
```

**Step 10: Fix attachmentController.js**

In `server/src/controllers/attachmentController.js`, update `getAttachment` (line ~55). Attachments are org-scoped:

```js
export const getAttachment = async (req, res, next) => {
  try {
    const attachment = await Attachment.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!attachment) {
      return res.status(404).json({ success: false, error: 'Attachment not found' });
    }

    // Return metadata only (for API)
    if (req.query.meta === 'true') {
      return res.status(200).json({
        success: true,
        data: {
          _id: attachment._id,
          filename: attachment.filename,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          size: attachment.size,
          createdAt: attachment.createdAt,
          owner: attachment.owner,
        },
      });
    }

    // Download file
    if (attachment.content) {
      res.setHeader('Content-Type', attachment.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.originalName}"`);
      return res.send(attachment.content);
    }

    if (attachment.url) {
      return res.redirect(attachment.url);
    }

    res.status(404).json({ success: false, error: 'File content not found' });
  } catch (error) {
    next(error);
  }
};
```

**Step 11: Run all IDOR tests**

```bash
cd server && npm test -- --testPathPattern=idor 2>&1 | tail -10
```

Expected: All PASS

**Step 12: Run full test suite**

```bash
cd server && npm test 2>&1 | tail -15
```

**Step 13: Commit**

```bash
git add server/src/controllers/accountController.js \
        server/src/controllers/contactController.js \
        server/src/controllers/leadController.js \
        server/src/controllers/opportunityController.js \
        server/src/controllers/activityController.js \
        server/src/controllers/taskController.js \
        server/src/controllers/noteController.js \
        server/src/controllers/attachmentController.js \
        server/tests/idor.test.js
git commit -m "fix: add owner/org scoping to single-entity GET endpoints to prevent IDOR (closes #16)"
```

---

### Task 4: Fix getUsers missing organization filter (Issue #17)

**Files:**
- Modify: `server/src/controllers/adminUserController.js:9` and `:166`
- Test: `server/tests/adminUsers.test.js` (add tests)

**Step 1: Write failing test**

Open `server/tests/adminUsers.test.js` and add inside the existing `describe` block after existing tests:

```js
describe('GET /api/admin/users — organization isolation', () => {
  it('should only return users from the same organization', async () => {
    // Create a second org with its own user
    const org2 = await Organization.create({ name: 'Org 2' });
    await User.create({
      name: 'Other Org User',
      email: 'other@org2.com',
      password: 'password123',
      organization: org2._id,
      role: 'user',
    });

    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    // Should only see users from admin's org, not other org
    const emails = response.body.data.map(u => u.email);
    expect(emails).not.toContain('other@org2.com');
  });
});
```

> Note: Look at the existing `adminUsers.test.js` to find the `adminToken` variable name and `beforeEach` setup pattern — it creates an admin user and gets a token. Match that pattern.

**Step 2: Run test to confirm it fails**

```bash
cd server && npm test -- --testPathPattern=adminUsers 2>&1 | grep -E "(PASS|FAIL|✓|✗|×)" | tail -10
```

**Step 3: Fix adminUserController.js**

In `server/src/controllers/adminUserController.js`:

Line 9 — add org filter to `getUsers`:
```js
let query = { organization: req.user.organization };
```

Line 165-168 — fix `getActiveUsers` to count only org's users:
```js
export const getActiveUsers = async (req, res, next) => {
  try {
    const count = await User.countDocuments({ organization: req.user.organization });
    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};
```

**Step 4: Run test**

```bash
cd server && npm test -- --testPathPattern=adminUsers 2>&1 | tail -10
```

Expected: PASS

**Step 5: Commit**

```bash
git add server/src/controllers/adminUserController.js server/tests/adminUsers.test.js
git commit -m "fix: scope getUsers and getActiveUsers to requesting user's organization (closes #17)"
```

---

### Task 5: Add organization scoping to Custom Objects (Issue #18)

This is the most complex task. The `CustomObject` model has no `organization` field, so custom objects are visible globally.

**Files:**
- Modify: `server/src/models/CustomObject.js` — add `organization` field, fix unique index
- Modify: `server/src/controllers/customObjectController.js` — scope all queries
- Test: `server/tests/customObjects.test.js` (add isolation test)

**Step 1: Update the CustomObject model**

In `server/src/models/CustomObject.js`, add `organization` field and change uniqueness:

Replace the schema definition (remove `unique: true` from `name`, add `organization`):

```js
import mongoose from 'mongoose';

const customObjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Object name is required'],
      trim: true,
      // unique removed — uniqueness is now per-organization (see index below)
    },
    label: {
      type: String,
      required: [true, 'Object label is required'],
      trim: true,
    },
    pluralLabel: {
      type: String,
      required: [true, 'Plural label is required'],
    },
    description: { type: String },
    icon: { type: String, default: 'cube' },
    color: { type: String, default: '#3b82f6' },
    enableActivities: { type: Boolean, default: true },
    enableTasks: { type: Boolean, default: true },
    enableReports: { type: Boolean, default: true },
    enableSharing: { type: Boolean, default: false },
    recordNameField: { type: String, default: 'name' },
    recordNameLabel: { type: String, default: 'Name' },
    isSystem: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
  },
  { timestamps: true }
);

// Unique name per organization
customObjectSchema.index({ name: 1, organization: 1 }, { unique: true });

// Keep static for system objects
customObjectSchema.statics.SYSTEM_OBJECTS = [
  { name: 'Account', label: 'Account', pluralLabel: 'Accounts', icon: 'office-building', color: '#3b82f6', isSystem: true },
  { name: 'Contact', label: 'Contact', pluralLabel: 'Contacts', icon: 'user', color: '#10b981', isSystem: true },
  { name: 'Lead', label: 'Lead', pluralLabel: 'Leads', icon: 'user-add', color: '#f59e0b', isSystem: true },
  { name: 'Opportunity', label: 'Opportunity', pluralLabel: 'Opportunities', icon: 'chart-bar', color: '#8b5cf6', isSystem: true },
  { name: 'Activity', label: 'Activity', pluralLabel: 'Activities', icon: 'calendar', color: '#ef4444', isSystem: true },
  { name: 'Task', label: 'Task', pluralLabel: 'Tasks', icon: 'check-circle', color: '#06b6d4', isSystem: true },
];

const CustomObject = mongoose.model('CustomObject', customObjectSchema);
export default CustomObject;
```

**Step 2: Update customObjectController.js**

In `server/src/controllers/customObjectController.js`:

`getCustomObjects` (line 5):
```js
export const getCustomObjects = async (req, res, next) => {
  try {
    const objects = await CustomObject.find({
      organization: req.user.organization,
    }).sort({ name: 1 });
    // ... rest unchanged
```

`getCustomObject` (line 28):
```js
const object = await CustomObject.findOne({
  _id: req.params.id,
  organization: req.user.organization,
});
```

`createCustomObject` (line 53) — scope name uniqueness check and include org on create:
```js
const existing = await CustomObject.findOne({
  name,
  organization: req.user.organization,
});
// ...
const object = await CustomObject.create({
  name, label, pluralLabel: pluralLabel || `${label}s`,
  description, icon, color,
  enableActivities, enableTasks, enableReports,
  organization: req.user.organization,  // ADD THIS
});
```

`updateCustomObject` (line 97):
```js
let object = await CustomObject.findOne({
  _id: req.params.id,
  organization: req.user.organization,
});
```

`deleteCustomObject` (line 132):
```js
const object = await CustomObject.findOne({
  _id: req.params.id,
  organization: req.user.organization,
});
```

**Step 3: Write failing test**

Add to `server/tests/customObjects.test.js` inside the describe block:

```js
describe('Custom Object organization isolation', () => {
  it('should not return custom objects from another organization', async () => {
    // Create a second org with its own custom object
    const org2 = await Organization.create({ name: 'Org 2' });
    await CustomObject.create({
      name: 'SecretObject',
      label: 'Secret',
      pluralLabel: 'Secrets',
      organization: org2._id,
    });

    const response = await request(app)
      .get('/api/admin/objects')   // adjust route if needed — check adminRoutes.js
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    const names = response.body.data.map(o => o.name);
    expect(names).not.toContain('SecretObject');
  });
});
```

> Check `server/src/routes/adminRoutes.js` for the exact route path for custom objects endpoint.

**Step 4: Run test**

```bash
cd server && npm test -- --testPathPattern=customObjects 2>&1 | tail -10
```

Expected: PASS

**Step 5: Run full suite**

```bash
cd server && npm test 2>&1 | tail -10
```

**Step 6: Commit**

```bash
git add server/src/models/CustomObject.js \
        server/src/controllers/customObjectController.js \
        server/tests/customObjects.test.js
git commit -m "fix: add organization field to CustomObject and scope all queries per org (closes #18)"
```

---

### Task 6: Create ConnectedAppAuthorization when API key app is created (Issue #19)

**Files:**
- Modify: `server/src/controllers/connectedAppController.js:75-82` (`createConnectedApp`)
- Test: `server/tests/connectedApp.test.js` (add test)

**Background:** When `authType === 'apikey'`, the `authenticateApiKey` middleware looks for a `ConnectedAppAuthorization` record with `isApiKey: true`. That record is never created. We need to create it at app-creation time, using the creating user as the "service account".

**Step 1: Add import to connectedAppController.js**

At top of `server/src/controllers/connectedAppController.js`, add:

```js
import ConnectedAppAuthorization from '../models/ConnectedAppAuthorization.js';
```

**Step 2: Write failing test**

Add to `server/tests/connectedApp.test.js`:

```js
describe('API key app creates authorization record', () => {
  it('should create a ConnectedAppAuthorization record when creating an API key app', async () => {
    const response = await request(app)
      .post('/api/admin/connected-apps')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'My API Key App',
        description: 'Test',
        authType: 'apikey',
        scopes: ['accounts:read'],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.apiKey).toBeDefined();

    // Verify authorization record was created
    const auth = await ConnectedAppAuthorization.findOne({
      connectedApp: response.body.data._id,
      isApiKey: true,
    });
    expect(auth).not.toBeNull();
    expect(auth.grantedScopes).toContain('accounts:read');
  });
});
```

**Step 3: Run test to confirm it fails**

```bash
cd server && npm test -- --testPathPattern=connectedApp 2>&1 | grep -E "(PASS|FAIL|✓|✗)" | tail -10
```

**Step 4: Update createConnectedApp**

In `server/src/controllers/connectedAppController.js`, after `const app = await ConnectedApp.create(appData);` and inside the `if (authType === 'apikey')` block, add:

```js
if (authType === 'apikey') {
  const apiKey = generateApiKey();
  appData.apiKeyHash = await hashSecret(apiKey);
  appData.apiKeyPrefix = getApiKeyPrefix(apiKey);

  response.apiKey = apiKey;
  response.apiKeyPrefix = appData.apiKeyPrefix;
}

const app = await ConnectedApp.create(appData);

// For API key apps, create the authorization record linking to the creator
if (authType === 'apikey') {
  await ConnectedAppAuthorization.create({
    user: req.user._id,
    connectedApp: app._id,
    organization: req.user.organization,
    grantedScopes: appData.scopes,
    isApiKey: true,
  });
}
```

**Step 5: Run tests**

```bash
cd server && npm test -- --testPathPattern=connectedApp 2>&1 | tail -10
```

Expected: PASS

**Step 6: Commit**

```bash
git add server/src/controllers/connectedAppController.js server/tests/connectedApp.test.js
git commit -m "fix: create ConnectedAppAuthorization record when API key app is created (closes #19)"
```

---

### Task 7: Check refresh token expiry before issuing new tokens (Issue #20)

**Files:**
- Modify: `server/src/controllers/oauthController.js:190`
- Test: `server/tests/oauthController.test.js` (create or add to existing)

**Step 1: Write failing test**

Create `server/tests/oauth-refresh.test.js`:

```js
import request from 'supertest';
import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Organization from '../src/models/Organization.js';
import ConnectedApp from '../src/models/ConnectedApp.js';
import ConnectedAppAuthorization from '../src/models/ConnectedAppAuthorization.js';
import { generateRefreshToken, hashToken, generateClientId, hashSecret } from '../src/utils/tokenUtils.js';

describe('OAuth Token Refresh — expiry', () => {
  let app;
  let appDoc, authRecord, refreshTokenValue;

  beforeAll(async () => {
    app = createApp;
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Organization.deleteMany({});
    await ConnectedApp.deleteMany({});
    await ConnectedAppAuthorization.deleteMany({});

    const org = await Organization.create({ name: 'Test Org' });
    const user = await User.create({
      name: 'OAuth User', email: 'oauth@test.com',
      password: 'pass1234', organization: org._id,
    });

    const clientSecret = 'test-secret-value';
    appDoc = await ConnectedApp.create({
      name: 'Test OAuth App',
      authType: 'oauth',
      clientId: generateClientId(),
      clientSecretHash: await hashSecret(clientSecret),
      redirectUris: ['http://localhost/callback'],
      scopes: ['accounts:read'],
      organization: org._id,
      createdBy: user._id,
    });
    appDoc._plainSecret = clientSecret;

    refreshTokenValue = generateRefreshToken();
    authRecord = await ConnectedAppAuthorization.create({
      user: user._id,
      connectedApp: appDoc._id,
      organization: org._id,
      refreshTokenHash: hashToken(refreshTokenValue),
      grantedScopes: ['accounts:read'],
      expiresAt: new Date(Date.now() - 1000), // already expired
    });
  });

  it('should reject an expired refresh token', async () => {
    const response = await request(app)
      .post('/api/oauth/token')
      .send({
        grant_type: 'refresh_token',
        refresh_token: refreshTokenValue,
        client_id: appDoc.clientId,
        client_secret: appDoc._plainSecret,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/expired/i);
  });
});
```

**Step 2: Run test to confirm it fails**

```bash
cd server && npm test -- --testPathPattern=oauth-refresh 2>&1 | tail -10
```

Expected: FAIL (currently returns 200 with new tokens)

**Step 3: Fix oauthController.js**

In `server/src/controllers/oauthController.js`, update the `refresh_token` branch (after finding `auth`):

```js
} else if (grant_type === 'refresh_token') {
  const auth = await ConnectedAppAuthorization.findOne({
    connectedApp: app._id,
    refreshTokenHash: hashToken(refresh_token),
  });

  if (!auth || auth.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired refresh token',
    });
  }

  // Generate new tokens
  // ... rest unchanged
```

**Step 4: Run tests**

```bash
cd server && npm test -- --testPathPattern=oauth-refresh 2>&1 | tail -5
```

Expected: PASS

**Step 5: Commit**

```bash
git add server/src/controllers/oauthController.js server/tests/oauth-refresh.test.js
git commit -m "fix: check refresh token expiry before issuing new access tokens (closes #20)"
```

---

### Task 8: Replace in-memory auth code store with MongoDB (Issue #21)

**Files:**
- Create: `server/src/models/AuthCode.js`
- Modify: `server/src/controllers/oauthController.js:12` (remove Map, use AuthCode model)

**Step 1: Create the AuthCode model**

Create `server/src/models/AuthCode.js`:

```js
import mongoose from 'mongoose';

const authCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  clientId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  appId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConnectedApp', required: true },
  scopes: [{ type: String }],
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // MongoDB TTL: auto-delete at expiresAt
  },
});

const AuthCode = mongoose.model('AuthCode', authCodeSchema);
export default AuthCode;
```

**Step 2: Update oauthController.js**

In `server/src/controllers/oauthController.js`:

Remove line 12: `const authCodes = new Map();`

Add import at top:
```js
import AuthCode from '../models/AuthCode.js';
```

Update `consent` handler — replace `authCodes.set(...)`:
```js
// Generate authorization code
const code = crypto.randomBytes(32).toString('hex');

await AuthCode.create({
  code,
  clientId: client_id,
  userId: req.user._id,
  organizationId: req.user.organization,
  appId: app._id,
  scopes,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
});

res.status(200).json({ success: true, data: { code } });
```

Update `token` handler — replace `authCodes.get(code)` and `authCodes.delete(code)`:
```js
if (grant_type === 'authorization_code') {
  const authCode = await AuthCode.findOne({ code });

  if (!authCode || authCode.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired authorization code',
    });
  }

  if (authCode.clientId !== client_id) {
    return res.status(400).json({
      success: false,
      error: 'Client ID mismatch',
    });
  }

  // Delete used code (one-time use)
  await AuthCode.deleteOne({ code });

  // Create or update authorization — use authCode fields
  const accessToken = generateAccessToken({
    userId: authCode.userId.toString(),
    orgId: authCode.organizationId.toString(),
    appId: app._id.toString(),
    scopes: authCode.scopes,
  });
  // ... rest of the authorization creation code unchanged, but use authCode.userId, authCode.organizationId, authCode.scopes
```

**Step 3: Run existing OAuth tests**

```bash
cd server && npm test -- --testPathPattern=connectedApp 2>&1 | tail -10
```

Expected: PASS (basic connected app tests still work)

**Step 4: Commit**

```bash
git add server/src/models/AuthCode.js server/src/controllers/oauthController.js
git commit -m "fix: replace in-memory Map with MongoDB TTL collection for OAuth auth codes (closes #21)"
```

---

### Task 9: Add transaction safety to lead conversion (Issue #22)

> **Note:** MongoDB transactions require a replica set. `mongodb-memory-server`'s default `MongoMemoryServer` is a standalone instance. This fix implements the transaction code correctly, but integration testing of rollback behavior requires `MongoMemoryReplSet`. The unit-level behavior (all records created or none) will be tested manually against a real replica set.

**Files:**
- Modify: `server/src/controllers/leadController.js:181` (`convertLead`)

**Step 1: Update convertLead to use a session**

In `server/src/controllers/leadController.js`, update `convertLead`:

```js
export const convertLead = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const lead = await Lead.findById(req.params.id).session(session);

    if (!lead) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    if (lead.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, error: 'Not authorized to convert this lead' });
    }

    if (lead.status === 'Converted') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, error: 'Lead has already been converted' });
    }

    const Account = (await import('../models/Account.js')).default;
    const Contact = (await import('../models/Contact.js')).default;
    const Opportunity = (await import('../models/Opportunity.js')).default;

    const { createAccount, createOpportunity, accountName, opportunityName } = req.body;

    let account = null;
    let contact = null;
    let opportunity = null;

    if (createAccount && accountName) {
      [account] = await Account.create([{
        name: accountName,
        industry: lead.industry || 'Other',
        website: lead.website || '',
        phone: lead.phone || '',
        owner: req.user.id,
      }], { session });

      await createAuditLog({
        entityType: 'Account', entityId: account._id, action: 'create',
        changes: [{ field: 'name', oldValue: null, newValue: accountName }],
        userId: req.user.id, organizationId: req.user.organization,
      });
    }

    [contact] = await Contact.create([{
      firstName: lead.firstName, lastName: lead.lastName,
      email: lead.email, phone: lead.phone, title: lead.title,
      account: account?._id || null, owner: req.user.id, leadSource: lead.source,
    }], { session });

    await createAuditLog({
      entityType: 'Contact', entityId: contact._id, action: 'create',
      changes: [
        { field: 'firstName', oldValue: null, newValue: lead.firstName },
        { field: 'lastName', oldValue: null, newValue: lead.lastName },
      ],
      userId: req.user.id, organizationId: req.user.organization,
    });

    if (createOpportunity && opportunityName && account) {
      [opportunity] = await Opportunity.create([{
        name: opportunityName, account: account._id, stage: 'Prospecting',
        probability: 10, amount: 0,
        closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        owner: req.user.id,
      }], { session });

      await createAuditLog({
        entityType: 'Opportunity', entityId: opportunity._id, action: 'create',
        changes: [{ field: 'name', oldValue: null, newValue: opportunityName }],
        userId: req.user.id, organizationId: req.user.organization,
      });
    }

    const oldLead = lead.toObject();
    lead.status = 'Converted';
    lead.convertedAt = new Date();
    lead.convertedTo = { account: account?._id, contact: contact._id, opportunity: opportunity?._id };
    await lead.save({ session });

    await createAuditLog({
      entityType: 'Lead', entityId: lead._id, action: 'convert',
      changes: [{ field: 'status', oldValue: oldLead.status, newValue: 'Converted' }],
      userId: req.user.id, organizationId: req.user.organization,
    });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, data: { lead, account, contact, opportunity } });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
```

Add `import mongoose from 'mongoose';` at the top of `leadController.js` if not already present.

**Step 2: Run existing lead tests**

```bash
cd server && npm test -- --testPathPattern=lead 2>&1 | tail -10
```

Expected: PASS (existing tests pass; transaction tests require replica set)

**Step 3: Commit**

```bash
git add server/src/controllers/leadController.js
git commit -m "fix: wrap lead conversion in MongoDB transaction to prevent orphaned records (closes #22)"
```

---

### Task 10: Fix 'Url' vs 'URL' field type case mismatch (Issue #23)

The canonical type is `'Url'` (defined in `CustomField.js` FIELD_TYPES array). The frontend uses `'URL'` — fix the frontend.

**Files:**
- Modify: `client/src/pages/CustomObjectDetail.jsx:168`

**Step 1: Update the switch case in CustomObjectDetail.jsx**

Find the `renderFieldInput` function (around line 164). Change:

```jsx
case 'URL':
```

to:

```jsx
case 'Url':
```

The full updated case:
```jsx
case 'Text':
case 'Email':
case 'Phone':
case 'Url':  // was 'URL'
  return (
    <Input
      {...commonProps}
      type={field.type === 'Email' ? 'email' : field.type === 'Phone' ? 'tel' : field.type === 'Url' ? 'url' : 'text'}
    />
  );
```

**Step 2: Verify no other 'URL' references exist in the client**

```bash
grep -r "'URL'" client/src/ --include="*.jsx" --include="*.js"
```

Expected: no results (or only string-literal data, not switch cases)

**Step 3: Commit**

```bash
git add client/src/pages/CustomObjectDetail.jsx
git commit -m "fix: use canonical 'Url' field type in CustomObjectDetail to match backend enum (closes #23)"
```

---

### Task 11: Fix deprecated onSuccess in useQuery for record loading (Issue #24)

TanStack Query v5 removed `onSuccess` from `useQuery`. The edit form for custom object records currently loads blank because `setFormData` is never called.

**Files:**
- Modify: `client/src/pages/CustomObjectDetail.jsx:25-32`

**Step 1: Remove `onSuccess` from the record query and add a `useEffect`**

In `client/src/pages/CustomObjectDetail.jsx`:

Remove `onSuccess` from the `useQuery` call (lines 25-32):
```jsx
// BEFORE
const { data: recordData, isLoading: isLoadingRecord } = useQuery({
  queryKey: ['object-record', objectName, recordId],
  queryFn: () => api.get(`/objects/${objectName}/${recordId}`),
  enabled: !isNew,
  onSuccess: (data) => {          // ← remove these 3 lines
    setFormData(data.data || {});  //
  },                              //
});
```

```jsx
// AFTER
const { data: recordData, isLoading: isLoadingRecord } = useQuery({
  queryKey: ['object-record', objectName, recordId],
  queryFn: () => api.get(`/objects/${objectName}/${recordId}`),
  enabled: !isNew,
});
```

Add a new `useEffect` after the existing one (after line 49):
```jsx
// Populate form data when record loads (for edit mode)
useEffect(() => {
  if (recordData?.data && !isNew) {
    setFormData(recordData.data || {});
  }
}, [recordData, isNew]);
```

**Step 2: Verify the fix is correct**

The `isNew` check prevents overwriting edits when the query refetches on window focus. The `useEffect` only runs when `recordData` changes (i.e., when the fetch completes or data updates).

**Step 3: Build to check for type errors**

```bash
cd client && npm run build 2>&1 | tail -10
```

Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add client/src/pages/CustomObjectDetail.jsx
git commit -m "fix: replace removed onSuccess with useEffect to initialize form data on record load (closes #24)"
```

---

## Final Verification

**Run full server test suite:**

```bash
cd server && npm test 2>&1 | tail -20
```

Expected: All tests pass

**Close issues via PR:**

```bash
git push origin feature/connected-apps-roles
gh pr create --title "fix: resolve all 11 open GitHub issues" \
  --body "Fixes #14 #15 #16 #17 #18 #19 #20 #21 #22 #23 #24"
```
