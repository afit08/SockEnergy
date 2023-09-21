import { Router } from "express";
import IndexController from "../controller/IndexController";
import authJWT from "../helpers/authJWT";

const router = Router();

router.get("/province", IndexController.AddressController.showProvince);
router.get("/city/:id", IndexController.AddressController.showCity);
router.get("/district/:id", IndexController.AddressController.showDistrict);
router.get("/village/:id", IndexController.AddressController.showVillage);
router.get("/area/:id", IndexController.AddressController.showArea);
router.post("/createAddress", authJWT.ensureCustomer, IndexController.AddressController.createAddress);
router.get("/", authJWT.ensureCustomer, IndexController.AddressController.showAddress);
router.get("/detailAdddress/:id", authJWT.ensureCustomer, IndexController.AddressController.detailAddress);
router.post("/editAddress/:id", authJWT.ensureCustomer, IndexController.AddressController.updateAddress);
router.delete("/deleteAddress/:id", authJWT.ensureCustomer, IndexController.AddressController.deleteAddress);

export default router;