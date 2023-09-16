import { Router } from "express";
import IndexController from "../controller/IndexController";

const router = Router();

router.get("/province", IndexController.AddressController.showProvince);
router.get("/city/:id", IndexController.AddressController.showCity);
router.get("/district/:id", IndexController.AddressController.showDistrict);
router.get("/village/:id", IndexController.AddressController.showVillage);
router.get("/area/:id", IndexController.AddressController.showArea);
router.post("/createAddress", IndexController.AddressController.createAddress);
router.get("/", IndexController.AddressController.showAddress);
router.get("/detailAdddress/:id", IndexController.AddressController.detailAddress);
router.post("/editAddress/:id", IndexController.AddressController.updateAddress);
router.delete("/deleteAddress/:id", IndexController.AddressController.deleteAddress);

export default router;