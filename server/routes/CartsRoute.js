import { Router } from "express";
import IndexController from "../controller/IndexController";
import UploadDownloadHelper from "../helpers/UploadDownloadHelper";
import authJWT from "../helpers/authJWT";

const router = Router();

// Admin
router.post("/addCarts", authJWT.ensureCustomer, IndexController.CartsController.addCart);
router.get("/showCarts", authJWT.ensureCustomer, IndexController.CartsController.allCart);
router.post("/createPayment/:id", authJWT.ensureCustomer, IndexController.CartsController.postToPayment);
router.get("/formPayment/:id", authJWT.ensureCustomer, IndexController.CartsController.showPayment);
router.get("/checkout/:id", authJWT.ensureCustomer, IndexController.CartsController.checkout);

export default router;