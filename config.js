import dotenv from 'dotenv';
dotenv.config();

import SES from "aws-sdk/clients/ses.js";
import S3 from "aws-sdk/clients/s3.js";
import NodeGeocoder from "node-geocoder";
import Razorpay from 'razorpay';


// export const DATABASE = "mongodb://127.0.0.1:27017/room-rental";
export const DATABASE = process.env.DATABASEURL;

export const APP_NAME = process.env.APP_NAMEURL;

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID_URL;

export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY_URL;
export const RAZORPAY_API = process.env.RAZORPAY_API_KEY;
export const RAZORPAY_SECRET_ACESS_KEY = process.env.RAZORPAY_API_SECRET;

export const EMAIL_FROM = "Room Rental" + process.env.EMAIL_FROMURL;

export const REPLY_TO = process.env.REPLY_TOURL;

const awsConfig = {
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: "ap-south-1",
  apiVersion: "2010-12-01",
}

export const AWSSES = new SES(awsConfig);
export const AWSS3 = new S3(awsConfig);

export const OPENCAGE_GEOCODER_API_KEY = process.env.OPENCAGE_GEOCODER_API_KEY_URL;

export const OPENCAGE_GEOCODER = NodeGeocoder({
  provider: 'opencage',
  apiKey: OPENCAGE_GEOCODER_API_KEY
});


export const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

export const JWT_SECRET = process.env.JWT_SECRET_URL;

export const CLIENT_URL = process.env.CLIENT_URLA;

// import dotenv from 'dotenv';
// dotenv.config();

// import SES from "aws-sdk/clients/ses.js";
// import S3 from "aws-sdk/clients/s3.js";
// import NodeGeocoder from "node-geocoder";



// // export const DATABASE = "mongodb://127.0.0.1:27017/room-rental";
// export const DATABASE = process.env.DATABASEURL;

// export const APP_NAME = process.env.APP_NAMEURL;

// export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID_URL;

// export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY_URL;

// export const EMAIL_FROM = "Room Rental" + process.env.EMAIL_FROMURL;

// export const REPLY_TO = process.env.REPLY_TOURL;

// const awsConfig = {
//   accessKeyId: AWS_ACCESS_KEY_ID,
//   secretAccessKey: AWS_SECRET_ACCESS_KEY,
//   region: "ap-south-1",
//   apiVersion: "2010-12-01",
// }

// export const AWSSES = new SES(awsConfig);
// export const AWSS3 = new S3(awsConfig);

// export const OPENCAGE_GEOCODER_API_KEY = process.env.OPENCAGE_GEOCODER_API_KEY_URL;

// export const OPENCAGE_GEOCODER = NodeGeocoder({
//   provider: 'opencage',
//   apiKey: OPENCAGE_GEOCODER_API_KEY
// });

// export const JWT_SECRET = process.env.JWT_SECRET_URL;

// export const CLIENT_URL = process.env.CLIENT_URLA;
