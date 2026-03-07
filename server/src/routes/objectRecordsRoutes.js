import express from 'express';
import {
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
} from '../controllers/objectRecordsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/:objectName', getRecords);
router.get('/:objectName/:id', getRecord);
router.post('/:objectName', createRecord);
router.put('/:objectName/:id', updateRecord);
router.delete('/:objectName/:id', deleteRecord);

export default router;