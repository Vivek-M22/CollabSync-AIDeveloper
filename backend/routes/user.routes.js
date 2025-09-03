import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { body } from 'express-validator';
import * as authMiddleware from '../middleware/auth.middleware.js';

const router = Router();



router.post('/register',
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    userController.createUserController);

router.post('/login',
    body('email').isEmail().withMessage('Email must be a valid email address'),
    body('password').isLength({ min: 3 }).withMessage('Password must be at least 3 characters long'),
    userController.loginController);

router.get('/profile', authMiddleware.authUser, userController.profileController);


router.get('/logout', authMiddleware.authUser, userController.logoutController);


router.get('/all', authMiddleware.authUser, userController.getAllUsersController);


export default router;

/*
**`routes/user.routes.js`**:
    - **Express Router**: Creates an Express Router instance specifically for user-related endpoints.
    - **Route Definitions**: Defines specific routes (e.g., `POST /signup`, `POST /login`, `GET /profile`) and maps them to the corresponding controller functions in `user.controller.js`.
    - **Middleware Application**: Applies the authentication middleware (`auth.middleware.js`) to routes that require a logged-in user (e.g., `/profile`).
    - **Exports**: Exports the configured router to be used in `app.js`.
*/