import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import morgan from "morgan";
import cors from "cors";
import authroutes from './routes/auth.js'
import mongoose from "mongoose";
import { DATABASE } from "./config.js";
import adRoutes from './routes/ad.js';
// import geocoder from 'geocoder';
// import adRoutes from ''
const app = express();
const PORT = process.env.PORT || 8000;
//db
mongoose.set("strictQuery", false);
mongoose.connect(DATABASE).then(() => console.log("db_connected")).catch((err) => console.log(err));

//middleware
// app.use(express.json());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));
app.use(cors());
//routes middleware
app.use('/api', authroutes);
app.use('/api', adRoutes);
// app.use("/api", adRoutes);



app.listen(PORT, () => {
  console.log(`server is running on ${PORT}`);
})