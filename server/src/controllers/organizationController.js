import Organization from '../models/Organization.js';

export const getOrganization = async (req, res, next) => {
  try {
    const org = await Organization.getOrganization();
    res.status(200).json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    let org = await Organization.getOrganization();

    // Update fields
    const updateFields = [
      'name', 'logo', 'address', 'phone', 'website', 'industry',
      'companySize', 'timezone', 'currency', 'dateFormat', 'fiscalYearStart', 'features'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        org[field] = req.body[field];
      }
    });

    await org.save();

    res.status(200).json({
      success: true,
      data: org,
    });
  } catch (error) {
    next(error);
  }
};