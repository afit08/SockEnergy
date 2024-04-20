import { Router } from 'express';
import IndexController from '../controller/IndexController';
import authJWT from '../helpers/authJWT';
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

// ADMIN
router.get(
  '/allAbout',
  authJWT.ensureAdmin,
  IndexController.AboutController.allAbout,
);
router.post(
  '/createAbout',
  upload.single('abt_image'),
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureAdmin,
  IndexController.AboutController.createAbout,
);
router.get(
  '/oneAbout/:id',
  authJWT.ensureAdmin,
  IndexController.AboutController.oneAbout,
);
router.post(
  '/updateAbout/:id',
  upload.single('abt_image'),
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureAdmin,
  IndexController.AboutController.updateAbout,
);

// CUSTOMER
router.get(
  '/customer/allAbout',
  authJWT.ensureCustomer,
  IndexController.AboutController.allAbout,
);

router.get('/view/allAbout', IndexController.AboutController.allAbout);

export default router;
