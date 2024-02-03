import { Router } from 'express';
import authJWT from '../helpers/authJWT';
import IndexController from '../controller/IndexController';
import UploadDownloadHelper from '../helpers/UploadDownloadHelper';

const router = Router();

router.post('/signin', authJWT.authenticate, authJWT.login);
router.post(
  '/signup',
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.UserController.signup,
);
router.get(
  '/dropdownProvince',
  IndexController.UserController.dropdownProvince,
);
router.get('/dropdownCity', IndexController.UserController.dropdownCity);
router.get('/image/:filename', UploadDownloadHelper.showProductImage);
router.get('/listGender', IndexController.UserController.listGender);
router.get('/detailUser/:id', IndexController.UserController.detailUsers);
router.post(
  '/updateNoImage/:id',
  IndexController.UserController.updateUsersNoimage,
);
router.post(
  '/updateImage/:id',
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.UserController.updateUsersImage,
);
router.post('/createGender', IndexController.UserController.createGender);

// customer

router.get(
  '/customer/detailUser/:id',
  authJWT.ensureCustomer,
  IndexController.UserController.detailUsers,
);
router.post(
  '/customer/updateNoImage/:id',
  authJWT.ensureCustomer,
  IndexController.UserController.updateUsersNoimage,
);
router.post(
  '/customer/updateImage/:id',
  authJWT.ensureCustomer,
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.UserController.updateUsersImage,
);
router.post(
  '/customer/changePassword/:id',
  authJWT.ensureCustomer,
  IndexController.UserController.changePassword,
);

export default router;
