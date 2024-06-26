import { Router } from 'express';
import IndexController from '../controller/IndexController';
import UploadDownloadHelper from '../helpers/UploadDownloadHelper';
import authJWT from '../helpers/authJWT';
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

// Customer
router.post(
  '/addCarts',
  authJWT.ensureCustomer,
  IndexController.CartsController.addCart,
);
router.get(
  '/showCarts',
  authJWT.ensureCustomer,
  IndexController.CartsController.allCart,
);
router.post(
  '/createPayment/:id',
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureCustomer,
  IndexController.CartsController.postToPayment,
);
router.get(
  '/formPayment/:id',
  authJWT.ensureCustomer,
  IndexController.CartsController.showPayment,
);
router.get(
  '/checkout/:id',
  authJWT.ensureCustomer,
  IndexController.CartsController.checkout,
);
router.post(
  '/updateCart/:id',
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureCustomer,
  IndexController.CartsController.updateAddCart,
);
router.delete(
  '/deleteCart/:id',
  authJWT.ensureCustomer,
  IndexController.CartsController.deleteCart,
);
router.get(
  '/listPayment',
  authJWT.ensureCustomer,
  IndexController.CartsController.listPayment,
);
router.get(
  '/listUnpayment',
  authJWT.ensureCustomer,
  IndexController.CartsController.listUnpayment,
);
router.post(
  '/upload_bukti/:id',
  upload.single('fopa_image_transaction'),
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureCustomer,
  IndexController.CartsController.uploadPayment,
);
router.get(
  '/detailPayment/:id',
  authJWT.ensureCustomer,
  IndexController.CartsController.detailPayment,
);
router.get(
  '/listCancel',
  authJWT.ensureCustomer,
  IndexController.CartsController.listCancel,
);
router.post(
  '/sendCancel/:id',
  authJWT.ensureCustomer,
  IndexController.csrfController.validateCSRFToken,
  IndexController.CartsController.sendCancel,
);
router.get(
  '/listDelivery',
  authJWT.ensureCustomer,
  IndexController.CartsController.listDelivery,
);
router.get(
  '/listDone',
  authJWT.ensureCustomer,
  IndexController.CartsController.listDone,
);

// Admin
router.get(
  '/allOrders',
  authJWT.ensureAdmin,
  IndexController.CartsController.allOrders,
);

export default router;
