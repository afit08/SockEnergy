import { Router } from "express";
import IndexController from "../controller/IndexController";
import authJWT from "../helpers/authJWT";

const router = Router();

router.get("/", authJWT.ensureCustomer, IndexController.OngkirController.ongkirDestination);
// router.post("/store", IndexController.CategoriesController.createCategories);

export default router;