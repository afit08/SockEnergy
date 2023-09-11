import { Router } from "express";
import IndexController from "../controller/IndexController";
import UploadDownloadHelper from "../helpers/UploadDownloadHelper";
import authJWT from "../helpers/authJWT";

const router = Router();

// Admin
router.get(
  "/",
  authJWT.ensureAdmin,
  IndexController.ProductsController.allProducts,
);
router.post(
  "/search/products",
  authJWT.ensureAdmin,
  IndexController.ProductsController.searchProduct,
);
router.post(
  "/store",
  authJWT.ensureAdmin,
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.ProductsController.createProduct,
);
router.post(
  "/update/:id",
  authJWT.ensureAdmin,
  UploadDownloadHelper.uploadSingleFiles,
  IndexController.ProductsController.updateProducts,
);
router.post(
  "/updateNoImage/:id",
  authJWT.ensureAdmin,
  IndexController.ProductsController.updateProductsNoImage,
);
router.delete(
  "/delete/:id",
  authJWT.ensureAdmin,
  IndexController.ProductsController.deleteProducts,
);
router.get(
  "/detailProducts/:id",
  authJWT.ensureAdmin,
  IndexController.ProductsController.detailProducts,
);

// Customer
router.get(
  "/customer/all",
  authJWT.ensureCustomer,
  IndexController.ProductsController.allProducts,
);
router.get(
  "/customer/categoriProducts/:id",
  authJWT.ensureCustomer,
  IndexController.ProductsController.categoriProducts,
);
router.get(
  "/customer/detailProducts/:id",
  authJWT.ensureCustomer,
  IndexController.ProductsController.detailProducts,
);
router.post(
  "/customer/search",
  authJWT.ensureCustomer,
  IndexController.ProductsController.searchProduct,
);
router.get("/image/:filename", UploadDownloadHelper.showProductImage);
export default router;
