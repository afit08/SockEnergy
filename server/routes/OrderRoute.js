import { Router } from 'express';
import IndexController from '../controller/IndexController';
import authJWT from '../helpers/authJWT';

const router = Router();

router.get(
  '/admin/allOrders',
  authJWT.ensureAdmin,
  IndexController.OrderController.allOrders,
);

router.get(
  '/admin/detailOrders/:id',
  authJWT.ensureAdmin,
  IndexController.OrderController.detailOrder,
);

router.post(
  '/admin/updateOrders/:id',
  authJWT.ensureAdmin,
  IndexController.OrderController.updateStatusOrder,
);

router.get(
  '/admin/allDoneOrders',
  authJWT.ensureAdmin,
  IndexController.OrderController.allDoneOrders,
);

router.get(
  '/admin/detailDoneOrders/:id',
  authJWT.ensureAdmin,
  IndexController.OrderController.detailDoneOrder,
);

router.post(
  '/admin/pickup/:id',
  authJWT.ensureAdmin,
  IndexController.OrderController.Pickup,
);

router.get(
  '/admin/listDone',
  authJWT.ensureAdmin,
  IndexController.OrderController.listDone,
);

export default router;
