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

/**
 * @openapi
 * /setup/objects:
 *   get:
 *     summary: Get all custom objects
 *     tags: [Setup]
 *     responses:
 *       200:
 *         description: List of custom objects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomObjectDefinitionListResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
/**
 * @openapi
 * /setup/objects:
 *   post:
 *     summary: Create a new custom object
 *     tags: [Setup]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomObjectInput'
 *     responses:
 *       201:
 *         description: Custom object created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomObjectDefinition'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.route('/objects')
  .get(getCustomObjects)
  .post(createCustomObject);

/**
 * @openapi
 * /setup/objects/{id}:
 *   get:
 *     summary: Get a custom object by ID
 *     tags: [Setup]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Custom object ID
 *     responses:
 *       200:
 *         description: Custom object definition
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomObjectDefinitionResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
/**
 * @openapi
 * /setup/objects/{id}:
 *   put:
 *     summary: Update a custom object
 *     tags: [Setup]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Custom object ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomObjectInput'
 *     responses:
 *       200:
 *         description: Custom object updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomObjectDefinition'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
/**
 * @openapi
 * /setup/objects/{id}:
 *   delete:
 *     summary: Delete a custom object
 *     tags: [Setup]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Custom object ID
 *     responses:
 *       200:
 *         description: Custom object deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route('/objects/:id')
  .get(getCustomObject)
  .put(updateCustomObject)
  .delete(deleteCustomObject);

/**
 * @openapi
 * /setup/field-types:
 *   get:
 *     summary: Get available field types
 *     tags: [Setup]
 *     responses:
 *       200:
 *         description: List of available field types
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fieldTypes:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/field-types', getFieldTypes);

/**
 * @openapi
 * /setup/objects/{objectId}/fields:
 *   get:
 *     summary: Get all fields for a custom object
 *     tags: [Setup]
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Custom object ID
 *     responses:
 *       200:
 *         description: List of custom fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fields:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CustomObjectField'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
/**
 * @openapi
 * /setup/objects/{objectId}/fields:
 *   post:
 *     summary: Create a new field for a custom object
 *     tags: [Setup]
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Custom object ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomFieldInput'
 *     responses:
 *       201:
 *         description: Field created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomObjectField'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route('/objects/:objectId/fields')
  .get(getCustomFields)
  .post(createCustomField);

/**
 * @openapi
 * /setup/fields/{id}:
 *   get:
 *     summary: Get a custom field by ID
 *     tags: [Setup]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Field ID
 *     responses:
 *       200:
 *         description: Custom field details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomObjectField'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
/**
 * @openapi
 * /setup/fields/{id}:
 *   put:
 *     summary: Update a custom field
 *     tags: [Setup]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Field ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CustomFieldInput'
 *     responses:
 *       200:
 *         description: Field updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomObjectField'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
/**
 * @openapi
 * /setup/fields/{id}:
 *   delete:
 *     summary: Delete a custom field
 *     tags: [Setup]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Field ID
 *     responses:
 *       200:
 *         description: Field deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.route('/fields/:id')
  .get(getCustomField)
  .put(updateCustomField)
  .delete(deleteCustomField);

/**
 * @openapi
 * /setup/objects/{objectId}/fields/reorder:
 *   put:
 *     summary: Reorder fields for a custom object
 *     tags: [Setup]
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *         description: Custom object ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fieldIds
 *             properties:
 *               fieldIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Ordered array of field IDs
 *     responses:
 *       200:
 *         description: Fields reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fields:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CustomObjectField'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/objects/:objectId/fields/reorder', reorderFields);

export default router;