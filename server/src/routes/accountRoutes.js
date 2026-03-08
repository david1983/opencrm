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

/**
 * @openapi
 * /accounts:
 *   get:
 *     summary: List all accounts
 *     tags: [Accounts]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *     responses:
 *       200:
 *         description: List of accounts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccountListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.route('/')
  .get(paginationRules, validate, getAccounts)
  .post(accountRules, validate, createAccount);

/**
 * @openapi
 * /accounts:
 *   post:
 *     summary: Create a new account
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountInput'
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

/**
 * @openapi
 * /accounts/{id}:
 *   get:
 *     summary: Get an account by ID
 *     tags: [Accounts]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Account details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route('/:id')
  .get(getAccount)
  .put(accountRules, validate, updateAccount)
  .delete(deleteAccount);

/**
 * @openapi
 * /accounts/{id}:
 *   put:
 *     summary: Update an account
 *     tags: [Accounts]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountInput'
 *     responses:
 *       200:
 *         description: Account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

/**
 * @openapi
 * /accounts/{id}:
 *   delete:
 *     summary: Delete an account
 *     tags: [Accounts]
 *     parameters:
 *       - $ref: '#/components/parameters/IdParam'
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */

export default router;