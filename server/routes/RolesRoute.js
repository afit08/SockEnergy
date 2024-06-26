import { Router } from 'express';
import IndexController from '../controller/IndexController';

const router = Router();

router.get('/showAll', IndexController.RolesController.allRoles);
router.post(
  '/store',
  IndexController.csrfController.validateCSRFToken,
  IndexController.RolesController.createRoles,
);

export default router;
