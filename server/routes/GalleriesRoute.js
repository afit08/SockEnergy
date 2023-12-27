import { Router } from 'express';
import IndexController from '../controller/IndexController';
import UploadDownloadHelper from '../helpers/UploadDownloadHelper';
import authJWT from '../helpers/authJWT';

const router = Router();
// CUSTOMER
router.get(
  '/customer/all',
  authJWT.ensureCustomer,
  IndexController.GalleriesController.allGalleries,
);
// ADMIN
router.get(
  '/admin/all',
  authJWT.ensureAdmin,
  IndexController.GalleriesController.allGalleries,
);
router.post(
  '/store',
  authJWT.ensureAdmin,
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.GalleriesController.createGalleries,
);
router.get(
  '/image/:filename',
  authJWT.ensureAdmin,
  UploadDownloadHelper.showProductImage,
);
router.post(
  '/edit/:id',
  authJWT.ensureAdmin,
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.GalleriesController.updateGalleries,
);
router.post(
  '/editNoImage/:id',
  authJWT.ensureAdmin,
  IndexController.GalleriesController.updateGalleriesNoImage,
);
router.delete(
  '/delete/:id',
  authJWT.ensureAdmin,
  IndexController.GalleriesController.deleteGalleries,
);
router.get(
  '/:id',
  authJWT.ensureAdmin,
  IndexController.GalleriesController.detailGalleries,
);
router.post(
  '/searchCategories',
  authJWT.ensureAdmin,
  IndexController.GalleriesController.allGalleriesSearch,
);

export default router;
