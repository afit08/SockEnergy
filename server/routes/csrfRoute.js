import { Router } from 'express';
import IndexController from '../controller/IndexController';

const router = Router();

router.get('/get-csrf-token', IndexController.csrfController.generateCSRFToken);

export default router;
