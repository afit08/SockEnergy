import { Router } from 'express';
import IndexController from '../controller/IndexController';
import UploadDownloadHelper from '../helpers/UploadDownloadHelper';
import authJWT from '../helpers/authJWT';
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.get(
  '/admin/all',
  authJWT.ensureAdmin,
  IndexController.CategoriesController.allCategories,
);
router.post(
  '/admin/store',
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureAdmin,
  upload.single('cate_image'),
  IndexController.CategoriesController.createCategories,
);
router.get(
  '/admin/image/:filename',
  authJWT.ensureAdmin,
  UploadDownloadHelper.showProductImage,
);
router.post(
  '/admin/edit/:id',
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureAdmin,
  upload.single('cate_image'),
  IndexController.CategoriesController.editCategories,
);
router.delete(
  '/admin/delete/:id',
  authJWT.ensureAdmin,
  IndexController.CategoriesController.deleteCategories,
);
router.get(
  '/admin/:id',
  authJWT.ensureAdmin,
  IndexController.CategoriesController.detailCategories,
);
router.post(
  '/admin/searchCategories',
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureAdmin,
  IndexController.CategoriesController.allCategoriesSearch,
);
router.get(
  '/customer/detailProduct/:id',
  authJWT.ensureCustomer,
  IndexController.CategoriesController.detailProduct,
);

// CUSTOMER
router.get(
  '/customer/all',
  authJWT.ensureCustomer,
  IndexController.CategoriesController.allCategoriesCustomer,
);

router.get(
  '/customer/:id',
  authJWT.ensureCustomer,
  IndexController.CategoriesController.detailCategoriesCustomer,
);

// NO AUTH
router.get(
  '/view/all',
  IndexController.CategoriesController.allCategoriesCustomer,
);

router.get(
  '/view/:id',
  IndexController.CategoriesController.detailCategoriesCustomer,
);

export default router;
