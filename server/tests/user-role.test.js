import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Role from '../src/models/Role.js';
import Organization from '../src/models/Organization.js';

describe('User Role Reference', () => {
  let orgId;

  beforeAll(async () => {
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
  });

  it('should create user with role reference', async () => {
    const role = await Role.create({
      name: 'Sales Rep',
      organization: orgId,
      permissions: [{ module: 'accounts', actions: ['view', 'edit'] }],
    });

    const user = await User.create({
      name: 'Test User',
      email: 'roleuser@test.com',
      password: 'password123',
      organization: orgId,
      roleRef: role._id,
    });

    const foundUser = await User.findById(user._id).populate('roleRef');
    expect(foundUser.roleRef.name).toBe('Sales Rep');
  });

  it('should allow null role reference', async () => {
    const user = await User.create({
      name: 'No Role User',
      email: 'norole@test.com',
      password: 'password123',
      organization: orgId,
    });

    expect(user.roleRef).toBeUndefined();
  });
});