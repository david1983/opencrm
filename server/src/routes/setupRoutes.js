import express from 'express';
import {
  getCustomObjects,
  getCustomObject,
  createCustomObject,
  updateCustomObject,
  deleteCustomObject,
} from '../controllers/customObjectController.js';
import {
  getFieldTypes,
  getCustomFields,
  getCustomField,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  reorderFields,
} from '../controllers/customFieldController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

// Custom Objects
router.route('/objects')
  .get(getCustomObjects)
  .post(createCustomObject);

router.route('/objects/:id')
  .get(getCustomObject)
  .put(updateCustomObject)
  .delete(deleteCustomObject);

// Field Types
router.get('/field-types', getFieldTypes);

// Custom Fields
router.route('/objects/:objectId/fields')
  .get(getCustomFields)
  .post(createCustomField);

router.route('/fields/:id')
  .get(getCustomField)
  .put(updateCustomField)
  .delete(deleteCustomField);

router.put('/objects/:objectId/fields/reorder', reorderFields);

export default router;