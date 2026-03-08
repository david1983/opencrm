import express from 'express';
import {
  getRecords,
  getRecord,
  getDefinition,
  createRecord,
  updateRecord,
  deleteRecord,
} from '../controllers/objectRecordsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

/**
 * @openapi
 * /records/{objectName}/definition:
 *   get:
 *     summary: Get the definition/structure of a custom object
 *     tags: [CustomObjects]
 *     parameters:
 *       - in: path
 *         name: objectName
 *         required: true
 *         schema:
 *           type: string
 *         description: The API name of the custom object
 *     responses:
 *       200:
 *         description: Object definition including fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomObjectDefinitionResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:objectName/definition', getDefinition);

/**
 * @openapi
 * /records/{objectName}:
 *   get:
 *     summary: Get all records for a custom object
 *     tags: [CustomObjects]
 *     parameters:
 *       - in: path
 *         name: objectName
 *         required: true
 *         schema:
 *           type: string
 *         description: The API name of the custom object
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 records:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
/**
 * @openapi
 * /records/{objectName}:
 *   post:
 *     summary: Create a new record for a custom object
 *     tags: [CustomObjects]
 *     parameters:
 *       - in: path
 *         name: objectName
 *         required: true
 *         schema:
 *           type: string
 *         description: The API name of the custom object
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Record data (fields depend on object definition)
 *     responses:
 *       201:
 *         description: Record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: The created record
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route('/:objectName')
  .get(getRecords)
  .post(createRecord);

/**
 * @openapi
 * /records/{objectName}/{id}:
 *   get:
 *     summary: Get a single record by ID
 *     tags: [CustomObjects]
 *     parameters:
 *       - in: path
 *         name: objectName
 *         required: true
 *         schema:
 *           type: string
 *         description: The API name of the custom object
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     responses:
 *       200:
 *         description: Record details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: The record data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
/**
 * @openapi
 * /records/{objectName}/{id}:
 *   put:
 *     summary: Update a record
 *     tags: [CustomObjects]
 *     parameters:
 *       - in: path
 *         name: objectName
 *         required: true
 *         schema:
 *           type: string
 *         description: The API name of the custom object
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Record data to update (fields depend on object definition)
 *     responses:
 *       200:
 *         description: Record updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: The updated record
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
/**
 * @openapi
 * /records/{objectName}/{id}:
 *   delete:
 *     summary: Delete a record
 *     tags: [CustomObjects]
 *     parameters:
 *       - in: path
 *         name: objectName
 *         required: true
 *         schema:
 *           type: string
 *         description: The API name of the custom object
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Record ID
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route('/:objectName/:id')
  .get(getRecord)
  .put(updateRecord)
  .delete(deleteRecord);

export default router;