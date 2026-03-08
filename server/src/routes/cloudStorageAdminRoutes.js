import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  getCloudStorageSettings,
  configureGoogleDrive,
  configureDropbox,
  removeCloudStorage,
  testCloudStorage,
} from '../controllers/cloudStorageController.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getCloudStorageSettings);
router.post('/google', configureGoogleDrive);
router.post('/dropbox', configureDropbox);
router.delete('/:provider', removeCloudStorage);
router.get('/:provider/test', testCloudStorage);

export default router;