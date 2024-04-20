import { Router } from 'express';
import IndexController from '../controller/IndexController';
import authJWT from '../helpers/authJWT';
import UploadDownloadHelper from '../helpers/UploadDownloadHelper';
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.get(
  '/detailRating/:id/:ids',
  IndexController.RatingController.detailRating,
);

router.post(
  '/createRating',
  IndexController.csrfController.validateCSRFToken,
  authJWT.ensureCustomer,
  upload.single('rat_image'),
  IndexController.RatingController.createRating,
);

router.get(
  '/listRating',
  authJWT.ensureAdmin,
  IndexController.RatingController.ListRating,
);
export default router;
