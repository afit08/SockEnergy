import { Router } from 'express';
import IndexController from '../controller/IndexController';
import authJWT from '../helpers/authJWT';
import UploadDownloadHelper from '../helpers/UploadDownloadHelper';

const router = Router();

router.get('/allAbout', IndexController.AboutController.allAbout);
router.post(
  '/createAbout',
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.AboutController.createAbout,
);
router.get('/oneAbout/:id', IndexController.AboutController.oneAbout);
router.post(
  '/updateAbout/:id',
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.AboutController.updateAbout,
);

export default router;
