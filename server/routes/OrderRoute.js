import { Router } from 'express';
import IndexController from '../controller/IndexController';
import authJWT from '../helpers/authJWT';

const router = Router();

router.get(
  '/allOrders',
  authJWT.ensureAdmin,
  IndexController.OrderController.allOrders,
);

router.get(
  '/detailOrders/:id',
  authJWT.ensureAdmin,
  IndexController.OrderController.detailOrder,
);

router.post(
  '/updateOrders/:id',
  authJWT.ensureAdmin,
  IndexController.OrderController.updateStatusOrder,
);

router.get(
  '/allDoneOrders',
  authJWT.ensureAdmin,
  IndexController.OrderController.allDoneOrders,
);

router.get(
  '/detailDoneOrders/:id',
  authJWT.ensureAdmin,
  IndexController.OrderController.detailDoneOrder,
);

export default router;
