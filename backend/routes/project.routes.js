import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

router.post('/create',
  authMiddleware.authUser,
  body('name').isString().withMessage('Name is required'),
  projectController.createProject
);

router.get('/all' ,
  authMiddleware.authUser,
  projectController.getAllProject
);

router.get('/get-project/:projectId',
  authMiddleware.authUser,
  projectController.getProjectById
);

router.put('/add-user',
  authMiddleware.authUser,
  body('projectId').isString().withMessage('Project ID is required'),
  body('users').isArray({min: 1}).withMessage('Users must be an array'),
  projectController.addUserToProject
);

router.put('/remove-user',
  authMiddleware.authUser,
  body('projectId').isString().withMessage('Project ID is required'),
  body('userId').isString().withMessage('User ID is required'),
  projectController.removeUserFromProject
);

export default router;