import { Router } from 'express';
import IndexController from '../controller/IndexController';
import UploadDownloadHelper from '../helpers/UploadDownloadHelper';
import authJWT from '../helpers/authJWT';
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

// Admin
router.get(
  '/',
  authJWT.ensureAdmin,
  IndexController.ProductsController.allProducts,
);
router.post(
  '/search/products',
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureAdmin,
  IndexController.ProductsController.searchProduct,
);
router.post(
  '/store',
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureAdmin,
  upload.single('prod_image'),
  IndexController.ProductsController.createProduct,
);
router.post(
  '/update/:id',
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureAdmin,
  upload.single('prod_image'),
  IndexController.ProductsController.updateProducts,
);
router.delete(
  '/delete/:id',
  authJWT.ensureAdmin,
  IndexController.ProductsController.deleteProducts,
);
router.get(
  '/detailProducts/:id',
  authJWT.ensureAdmin,
  IndexController.ProductsController.detailProducts,
);

// Customer
router.get(
  '/customer/all',
  authJWT.ensureCustomer,
  IndexController.ProductsController.allProducts,
);
router.get(
  '/customer/categoriProducts/:id',
  authJWT.ensureCustomer,
  IndexController.ProductsController.categoriProducts,
);
router.get(
  '/customer/detailProducts/:id',
  authJWT.ensureCustomer,
  IndexController.ProductsController.detailProducts,
);
router.post(
  '/customer/search',
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureCustomer,
  IndexController.ProductsController.searchProduct,
);
router.get('/image/:filename', UploadDownloadHelper.showProductImage);

// NO AUTH
router.get('/view/all', IndexController.ProductsController.allProducts);
router.get(
  '/view/detailProducts/:id',
  IndexController.ProductsController.detailProducts,
);
router.post(
  '/view/search',
  IndexController.csrfController.validateCSRFToken,
  IndexController.ProductsController.searchProduct,
);
export default router;
