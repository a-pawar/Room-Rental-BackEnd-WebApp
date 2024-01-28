import express from "express";

const router = express.Router();

import * as ad from "../controllers/ad.js";
import * as config from "../config.js";
import { requireSignin } from "../middlewares/auth.js";

router.post("/upload-image", requireSignin, ad.uploadImage);
router.post("/remove-image", requireSignin, ad.removeImage);

router.post("/ad", requireSignin, ad.create);
router.get("/ads", ad.ads);
router.get("/ad/:slug", ad.read);

router.post("/wishlist", requireSignin, ad.addToWishlist);
router.delete("/wishlist/:adId", requireSignin, ad.removeFromWishlist);
router.post("/contact-seller", ad.contactSeller);

router.get("/user-ads/:page", requireSignin, ad.userAds);
router.put("/ad/:_id", requireSignin, ad.update);
router.delete("/ad/:_id", requireSignin, ad.remove);

router.get("/enquiried-properties", requireSignin, ad.enquiredProperties);
router.get("/wishlist", requireSignin, ad.wishlist);
router.get("/search", ad.search);
// payment
router.get("/getkey", (req, res) => res.status(200).json({
  key: config.RAZORPAY_API
}));
router.post("/checkout", ad.checkout);
router.post("/paymentverification", ad.paymentVerification);

export default router;