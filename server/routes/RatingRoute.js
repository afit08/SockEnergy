import { Router } from 'express';
import IndexController from '../controller/IndexController';
import authJWT from '../helpers/authJWT';
import UploadDownloadHelper from '../helpers/UploadDownloadHelper';

const router = Router();

router.get(
  '/detailRating/:id/:ids',
  IndexController.RatingController.detailRating,
);

router.post(
  '/createRating',
  authJWT.ensureCustomer,
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.RatingController.createRating,
);
export default router;
