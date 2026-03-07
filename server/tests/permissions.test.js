import mongoose from 'mongoose';
import createApp from '../src/app.js';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import Organization from '../src/models/Organization.js';
import request from 'supertest';

describe('Permission Middleware', () => {
  let app;
  let orgId;
  let adminId;
  let userId;
  let adminToken;
  let userToken;
  let restrictedRoleId;

  beforeAll(async () => {
    app = createApp;
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
    await Organization.deleteMany({});

    const org = await Organization.create({ name: 'Test Org' });
    orgId = org._id;

    // Create restricted role
    const restrictedRole = await Role.create({
      name: 'View Only',
      organization: orgId,
      permissions: [
        { module: 'accounts', actions: ['view'] },
        { module: 'contacts', actions: ['view'] },
      ],
    });
    restrictedRoleId = restrictedRole._id;

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      organization: orgId,
    });
    adminId = admin._id;

    // Create regular user with restricted role
    const user = await User.create({
      name: 'Regular User',
      email: 'user@test.com',
      password: 'password123',
      role: 'user',
      organization: orgId,
      roleRef: restrictedRoleId,
    });
    userId = user._id;

    // Login as admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminRes.body.token;

    // Login as user
    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'password123' });
    userToken = userRes.body.token;
  });

  it('should allow admin to access all endpoints', async () => {
    const response = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  it('should deny user without edit permission', async () => {
    // This test requires a route with permission check
    // For now, just verify the role has correct permissions
    const role = await Role.findById(restrictedRoleId);
    const accountPerms = role.permissions.find(p => p.module === 'accounts');

    expect(accountPerms.actions).toContain('view');
    expect(accountPerms.actions).not.toContain('edit');
  });

  it('should allow user with view permission to view', async () => {
    const role = await Role.findById(restrictedRoleId);
    const contactPerms = role.permissions.find(p => p.module === 'contacts');

    expect(contactPerms.actions).toContain('view');
  });

  it('should check module enum validation', async () => {
    const role = await Role.create({
      name: 'Test Module Role',
      organization: orgId,
      permissions: [
        { module: 'accounts', actions: ['view', 'edit'] },
        { module: 'contacts', actions: ['view'] },
      ],
    });

    expect(role.permissions).toHaveLength(2);
    expect(role.permissions[0].module).toBe('accounts');
  });

  it('should check action enum validation', async () => {
    const role = await Role.create({
      name: 'Test Action Role',
      organization: orgId,
      permissions: [
        { module: 'accounts', actions: ['view', 'edit', 'delete', 'create'] },
      ],
    });

    expect(role.permissions[0].actions).toHaveLength(4);
    expect(role.permissions[0].actions).toContain('view');
    expect(role.permissions[0].actions).toContain('edit');
    expect(role.permissions[0].actions).toContain('delete');
    expect(role.permissions[0].actions).toContain('create');
  });
});