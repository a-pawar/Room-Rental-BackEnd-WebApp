// server/middlewares/auth.js
import jwt from "jsonwebtoken";
import * as config from "../config.js";

export const requireSignin = (req, res, next) => {
  // console.log("__REQ_HEADERS__", req.headers);
  try {
    const decoded = jwt.verify(req.headers.authorization, config.JWT_SECRET);
    // console.log("DECODED => ", decoded);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};