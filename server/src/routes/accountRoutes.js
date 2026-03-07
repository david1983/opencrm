import express from 'express';
import {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
} from '../controllers/accountController.js';
import { protect } from '../middleware/auth.js';
import { accountRules, paginationRules } from '../middleware/validators.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(paginationRules, getAccounts)
  .post(accountRules, validate, createAccount);

router.route('/:id')
  .get(getAccount)
  .put(accountRules, validate, updateAccount)
  .delete(deleteAccount);

export default router;