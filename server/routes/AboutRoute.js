import { Router } from 'express';
import IndexController from '../controller/IndexController';
import authJWT from '../helpers/authJWT';
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.get('/allAbout', IndexController.AboutController.allAbout);
router.post(
  '/createAbout',
  upload.single('abt_image'),
  IndexController.AboutController.createAbout,
);
router.get('/oneAbout/:id', IndexController.AboutController.oneAbout);
router.post(
  '/updateAbout/:id',
  upload.single('abt_image'),
  IndexController.AboutController.updateAbout,
);

export default router;
