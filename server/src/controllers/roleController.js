import Role from '../models/Role.js';

// Get all roles for organization
export const getRoles = async (req, res, next) => {
  try {
    const roles = await Role.find({ organization: req.user.organization })
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

// Get single role
export const getRole = async (req, res, next) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

// Create role
export const createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    // Check if role name already exists
    const existing = await Role.findOne({
      name,
      organization: req.user.organization,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Role name already exists',
      });
    }

    const role = await Role.create({
      name,
      description,
      permissions,
      organization: req.user.organization,
      isSystem: false,
    });

    res.status(201).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

// Update role
export const updateRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    let role = await Role.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        error: 'Cannot modify system role',
      });
    }

    role = await Role.findByIdAndUpdate(
      req.params.id,
      { name, description, permissions },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: role,
    });
  } catch (error) {
    next(error);
  }
};

// Delete role
export const deleteRole = async (req, res, next) => {
  try {
    const role = await Role.findOne({
      _id: req.params.id,
      organization: req.user.organization,
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        error: 'Role not found',
      });
    }

    if (role.isSystem) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete system role',
      });
    }

    await role.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};