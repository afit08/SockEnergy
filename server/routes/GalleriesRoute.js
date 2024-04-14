import { Router } from 'express';
import IndexController from '../controller/IndexController';
import UploadDownloadHelper from '../helpers/UploadDownloadHelper';
import authJWT from '../helpers/authJWT';
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();
// CUSTOMER
router.get(
  '/customer/all',
  authJWT.ensureCustomer,
  IndexController.GalleriesController.allGalleries,
);
// NO AUTH
router.get('/view/all', IndexController.GalleriesController.allGalleries);
// ADMIN
router.get(
  '/admin/all',
  authJWT.ensureAdmin,
  IndexController.GalleriesController.allGalleries,
);
router.post(
  '/admin/store',
  authJWT.ensureAdmin,
  upload.single('gall_image'),
  IndexController.GalleriesController.createGalleries,
);
router.get(
  '/admin/image/:filename',
  authJWT.ensureAdmin,
  UploadDownloadHelper.showProductImage,
);
router.post(
  '/admin/edit/:id',
  authJWT.ensureAdmin,
  upload.single('gall_image'),
  IndexController.GalleriesController.updateGalleries,
);
// router.post(
//   '/admin/editNoImage/:id',
//   authJWT.ensureAdmin,
//   IndexController.GalleriesController.updateGalleriesNoImage,
// );
router.delete(
  '/admin/delete/:id',
  authJWT.ensureAdmin,
  IndexController.GalleriesController.deleteGalleries,
);
router.get(
  '/admin/:id',
  authJWT.ensureAdmin,
  IndexController.GalleriesController.detailGalleries,
);
router.post(
  '/admin/searchCategories',
  authJWT.ensureAdmin,
  IndexController.GalleriesController.allGalleriesSearch,
);

export default router;
