import { Router } from 'express';
import IndexController from '../controller/IndexController';
import UploadDownloadHelper from '../helpers/UploadDownloadHelper';

const router = Router();

router.get('/', IndexController.GalleriesController.allGalleries);
router.post(
  '/store',
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.GalleriesController.createGalleries,
);
router.get('/image/:filename', UploadDownloadHelper.showProductImage);
router.post(
  '/edit/:id',
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.GalleriesController.updateGalleries,
);
router.post(
  '/editNoImage/:id',
  IndexController.GalleriesController.updateGalleriesNoImage,
);
router.delete(
  '/delete/:id',
  IndexController.GalleriesController.deleteGalleries,
);
router.get('/:id', IndexController.GalleriesController.detailGalleries);
router.post(
  '/searchCategories',
  IndexController.GalleriesController.allGalleriesSearch,
);

router.post(
  '/validation',
  IndexController.GalleriesController.ValidationSanitization,
);

export default router;
