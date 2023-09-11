import { Router } from "express";
import IndexController from "../controller/IndexController";
import UploadDownloadHelper from "../helpers/UploadDownloadHelper";

const router = Router();

router.get("/", IndexController.CategoriesController.allCategories);
router.post("/store",  UploadDownloadHelper.uploadSingleFiles, IndexController.CategoriesController.createCategories);
router.get("/image/:filename", UploadDownloadHelper.showProductImage);
router.post("/edit/:id", UploadDownloadHelper.uploadSingleFiles, IndexController.CategoriesController.editCategories);
router.delete("/delete/:id", IndexController.CategoriesController.deleteCategories);

export default router;