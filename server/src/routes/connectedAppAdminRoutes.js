import express from 'express';
import {
  getConnectedApps,
  getConnectedApp,
  createConnectedApp,
  updateConnectedApp,
  deleteConnectedApp,
  regenerateSecret,
  regenerateApiKey,
} from '../controllers/connectedAppController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/', getConnectedApps);
router.get('/:id', getConnectedApp);
router.post('/', createConnectedApp);
router.put('/:id', updateConnectedApp);
router.delete('/:id', deleteConnectedApp);
router.post('/:id/regenerate-secret', regenerateSecret);
router.post('/:id/regenerate-key', regenerateApiKey);

export default router;