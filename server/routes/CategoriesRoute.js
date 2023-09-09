import { Router } from "express";
import IndexController from "../controller/IndexController";

const router = Router();

router.get("/", IndexController.CategoriesController.allCategories);
router.post("/store", IndexController.CategoriesController.createCategories);

export default router;