import express from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getActiveUsers,
} from '../controllers/adminUserController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/active', getActiveUsers);
router.get('/', getUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetUserPassword);

export default router;