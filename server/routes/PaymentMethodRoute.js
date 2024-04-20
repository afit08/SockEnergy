import { Router } from 'express';
import IndexController from '../controller/IndexController';

const router = Router();

router.get('/', IndexController.PaymentMethodController.allPaymentMethod);
router.post(
  '/store',
  IndexController.csrfController.validateCSRFToken,
  IndexController.PaymentMethodController.createPaymentMethod,
);

export default router;
