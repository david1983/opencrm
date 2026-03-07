import mongoose from 'mongoose';
import Role from '../src/models/Role.js';
import Organization from '../src/models/Organization.js';

describe('Role Model', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Role.deleteMany({});
    await Organization.deleteMany({});
  });

  it('should create a role with permissions', async () => {
    const org = await Organization.create({ name: 'Test Org' });

    const role = await Role.create({
      name: 'Sales Rep',
      description: 'Sales representative role',
      organization: org._id,
      permissions: [
        { module: 'accounts', actions: ['view', 'edit'] },
        { module: 'contacts', actions: ['view', 'edit', 'create'] },
      ],
    });

    expect(role.name).toBe('Sales Rep');
    expect(role.permissions).toHaveLength(2);
    expect(role.isSystem).toBe(false);
  });

  it('should not allow duplicate role names in same org', async () => {
    const org = await Organization.create({ name: 'Test Org' });

    await Role.create({
      name: 'Sales Rep',
      organization: org._id,
    });

    await expect(Role.create({
      name: 'Sales Rep',
      organization: org._id,
    })).rejects.toThrow();
  });

  it('should validate module enum values', async () => {
    const org = await Organization.create({ name: 'Test Org' });

    await expect(Role.create({
      name: 'Test Role',
      organization: org._id,
      permissions: [{ module: 'invalid', actions: ['view'] }],
    })).rejects.toThrow();
  });

  it('should validate action enum values', async () => {
    const org = await Organization.create({ name: 'Test Org' });

    await expect(Role.create({
      name: 'Test Role',
      organization: org._id,
      permissions: [{ module: 'accounts', actions: ['invalid'] }],
    })).rejects.toThrow();
  });
});