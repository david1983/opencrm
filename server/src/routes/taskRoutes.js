import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { taskRules, paginationRules } from '../middleware/validators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(paginationRules, validate, getTasks)
  .post(taskRules, validate, createTask);

router.route('/:id')
  .get(getTask)
  .put(taskRules, validate, updateTask)
  .delete(deleteTask);

export default router;