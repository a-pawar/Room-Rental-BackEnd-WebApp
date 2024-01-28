import * as config from "../config.js";
import { nanoid } from "nanoid";
import Ad from "../models/ad.js";
import User from "../models/user.js";
import slugify from "slugify";
import router from "../routes/ad.js";
import { OPENCAGE_GEOCODER } from "../config.js";
import { emailTemplate } from "../helpers/email.js"
import { query } from "express";
import crypto from 'crypto';

export const uploadImage = async (req, res) => {
  try {

    const { image } = req.body;
    if (!image) return res.status(400).send("No image");

    // // prepare the image
    // imageUpload controller function

    const base64Image = new Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const type = image.split(";")[0].split("/")[1];

    //     // image params
    const params = {
      Bucket: "room-rental-bucket-app",
      Key: `${nanoid()}.${type}`,
      Body: base64Image,
      ACL: "public-read",
      ContentEncoding: "base64",
      ContentType: `image/${type}`,
    };

    //     // upload to s3
    config.AWSS3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      } else {
        // console.log(data);
        res.send(data);
      }
    });
  } catch (err) {
    console.log(err);
    res.json({ error: "Upload failed. Try again." });
  }
};

export const removeImage = async (req, res) => {
  // console.log("Req body" + req.body);
  try {
    const { Key, Bucket } = req.body;
    // console.log(Key + " " + Bucket);

    // upload to s3
    config.AWSS3.deleteObject({ Bucket, Key }, (err, data) => {
      if (err) {
        console.log(err);
        res.sendStatus(400);
      } else {
        res.send({ ok: true });
      }
    });
  } catch (err) {
    console.log(err);
  }
};


export const create = async (req, res) => {
  try {
    // console.log(req.body);
    const { photos, price, address, description, type, laundry, wifi, ROwater, completeMap } = req.body;
    console.log("address inside controller create:", address);
    console.log("completemap inside controller create:", completeMap);

    if (!photos?.length) {
      return res.json({ error: "Photos are required" });
    }
    if (!price) {
      return res.json({ error: "Price is required" });
    }
    if (!type) {
      return res.json({ error: "Is it room or flat?" });
    }
    if (!address) {
      return res.json({ error: "Address is required" });
    }
    if (!description) {
      return res.json({ error: "Description is required" });
    }

    //// const geo = await config.GOOGLE_GEOCODER.geocode(address);
    const geo = await OPENCAGE_GEOCODER.geocode(address?.label);
    // console.log("ad.js controller me address", geo);

    var isLaundry = laundry == "yes" ? true : false;
    var isWifi = wifi == "yes" ? true : false;
    var isROwater = ROwater == "yes" ? true : false;

    const ad = await new Ad({
      ...req.body,
      slug: slugify(`${type}-${address?.label}-${price}-${nanoid(6)}`),
      postedBy: req.user._id,
      location: {
        type: "Point",
        coordinates: [geo?.[0]?.longitude, geo?.[0]?.latitude]
      },
      laundry: isLaundry,
      ROwater: isROwater,
      wifi: isWifi,
      label: address?.label,
      street: address?.address?.street,
      district: address?.address?.district,
      city: address?.address?.city,
      country: address?.address?.country,
      completeMap: address,
      openCageMap: geo
    }).save();

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { role: "Seller" },
      },
      { new: true }
    );
    user.password = undefined;
    user.resetCode = undefined;
    res.json({
      ad,
      user,
    });
  } catch (err) {
    console.log(err);
    res.json({ error: "Something went wrong. Try later." });
  }
};

export const ads = async (req, res) => {
  try {
    // const adsForSell = await Ad.find({ action: "Sell", published: true })
    //   .select(
    //     "-photos.Key -photos.key -photos.ETag -photos.Bucket -location -googleMap"
    //   )
    //   .populate("postedBy", "name username email phone company")
    //   .sort({ createdAt: -1 })
    //   .limit(12);

    const adsForRent = await Ad.find()
      .select(
        "-photos.Key -photos.key -photos.ETag -photos.Bucket "
      )
      .populate("postedBy", "name username email phone company")
      .sort({ createdAt: -1 })
      .limit(12);

    res.json({ adsForRent });
  } catch (err) {
    console.log(err);
  }
};

export const read = async (req, res) => {
  try {
    const { slug } = req.params;

    const ad = await Ad.findOne({ slug })
      // .select("-photos.Key -photos.key -photos.ETag -photos.Bucket")
      .populate("postedBy", "name username email phone company photo.Location");

    // const geo = await config.GOOGLE_GEOCODER.geocode(ad.address);
    // related
    // const match = ad?.completeMap?.matchLevel;
    // // console.log(match);

    const related = await Ad.find({
      _id: { $ne: ad._id },
      // action: ad?.action,
      type: ad?.type,
      // address: {
      //   $regex: ad.city || "",
      //   $options: "i",
      // },
      city: ad.city,
    })
      .limit(3)
      // .select("-photos.Key -photos.key -photos.ETag -photos.Bucket");
      .populate("postedBy", "name username email phone company photo.Location");

    // console.log("AD => ", ad);

    res.json({ ad, related });
  } catch (err) {
    console.log(err);
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { wishlist: req.body.adId },
      },
      { new: true }
    );
    const { password, resetCode, ...rest } = user._doc;
    res.json(rest);
  } catch (err) {
    console.log(err);
  }
};
export const removeFromWishlist = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { wishlist: req.params.adId },
      },
      { new: true }
    );
    const { password, resetCode, ...rest } = user._doc;
    res.json(rest);
  } catch (err) {
    console.log(err);
  }
};

export const contactSeller = async (req, res) => {
  try {
    const { name, email, message, phone, adId } = req.body;

    const user = await User.findOneAndUpdate(
      { email },
      {
        $addToSet: { enquiredProperties: adId },
      }
    );

    const ad = await Ad.findById(adId).populate("postedBy", "email");

    if (!user) {
      res.json({ error: "Could not find user with that email" });
    } else {
      // send email
      config.AWSSES.sendEmail(
        emailTemplate(
          ad.postedBy.email,
          `
        <p>You have received a new customer enquiry.</p>
        
        <h4>Customer details</h4>
        <p>Name: ${name}</p>
        <p>Email ${email}</p>
        <p>Phone: ${phone}</p>
        <p>Message: ${message}</p>
        <p>Enquiried property:</p>
         <a href="${config.APP_NAME}/ad/${ad.slug}">${ad?.type} in ${ad?.label} for Rent $${ad?.price}</a>
        
        `,
          email,
          "New enquiry received"
        ),
        (err, data) => {
          if (err) {
            return res.json({ error: "Provide a valid email address" });
          } else {
            return res.json({ success: "Check email to access your account" });
          }
        }
      );
    }
  } catch (err) {
    console.log(err);
    res.json({ error: "Something went wrong. Try again." });
  }
};

export const userAds = async (req, res) => {
  try {
    const perPage = 3; // change as required
    const page = req.params.page ? req.params.page : 1;

    const total = await Ad.find({
      postedBy: req.user._id,
    });

    const ads = await Ad.find({ postedBy: req.user._id })
      .select(
        "-photos.Key -photos.key -photos.ETag -photos.Bucket -location -googleMap"
      )
      .populate("postedBy", "name username email phone company")
      .skip((page - 1) * perPage)
      .sort({ createdAt: -1 })
      .limit(perPage);
    res.json({ ads, total: total?.length });
  } catch (err) {
    console.log(err);
  }
};

export const update = async (req, res) => {
  try {
    // console.log("req.body update => ", req.body);
    const { photos, price, type, address, description, laundry, wifi, ROwater } = req.body;
    // console.log("complete map in controller",completeMap);

    let ad = await Ad.findById(req.params._id);
    // console.log("This ad inside update : ", ad);
    const owner = req.user._id == ad?.postedBy;
    if (!owner) {
      return res.json({ error: "Permission denied" });
    } else {
      //validation
      if (!photos?.length) {
        return res.json({ error: "Photos are required" });
      }
      if (!price) {
        return res.json({ error: "Price is required" });
      }
      if (!type) {
        return res.json({ error: "Is property house or land?" });
      }

      if (!description) {
        return res.json({ error: "Description is required" });
      }

      // const geo = await config.GOOGLE_GEOCODER.geocode(address);
      // console.log("geo => ", [geo?.[0]?.longitude, geo?.[0]?.latitude]);
      var isLaundry = laundry == "yes" ? true : false;
      var isWifi = wifi == "yes" ? true : false;
      var isROwater = ROwater == "yes" ? true : false;

      if (address) {
        const geo = await OPENCAGE_GEOCODER.geocode(address?.label);
        // console.log("ad.js controller me address", geo);
        await ad.updateOne({
          ...req.body,
          slug: ad.slug,
          location: {
            type: "Point",
            coordinates: [geo?.[0]?.longitude, geo?.[0]?.latitude]
          },
          laundry: isLaundry,
          ROwater: isROwater,
          wifi: isWifi,
          label: address?.label,
          street: address?.address?.street,
          district: address?.address?.district,
          city: address?.address?.city,
          country: address?.address?.country,
          completeMap: address,
          openCageMap: geo,
        });
      } else {
        await ad.updateOne({
          ...req.body,
          slug: ad.slug,
          laundry: isLaundry,
          ROwater: isROwater,
          wifi: isWifi,
        });
      }
      res.json({ ok: true });
    }
  } catch (err) {
    console.log(err);
  }
};

export const enquiredProperties = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const ads = await Ad.find({ _id: user.enquiredProperties }).sort({
      createdAt: -1,
    });
    res.json(ads);
  } catch (err) {
    console.log(err);
  }
};

export const wishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const ads = await Ad.find({ _id: user.wishlist }).sort({ createdAt: -1 });
    res.json(ads);
  } catch (err) {
    console.log(err);
  }
};
export const remove = async (req, res) => {
  try {
    const adId = req.params._id;

    const ad = await Ad.findById(adId);

    const owner = req.user._id == ad?.postedBy;

    if (!owner) {
      return res.json({ error: "Permission denied" });
    } else {
      await Ad.findByIdAndDelete(adId);
      res.json({ ok: true });
    }
  } catch (err) {
    console.log(err);
  }
};

export const search = async (req, res) => {
  try {
    // console.log("req query of search in controller", req.query);
    const { address, type, priceRange, label, laundry, wifi, ROWater, matchLevel, street, district, city, country } = req.query;


    const Islaundry = laundry === "yes" ? true : false;
    const Iswifi = wifi === "yes" ? true : false;
    const IsROwater = ROWater === "yes" ? true : false;


    const adsQuery = {
      type,
      price: {
        $gte: parseInt(priceRange[0]),
        $lte: parseInt(priceRange[1]),
      },
    };

    if (matchLevel == "street") {
      adsQuery.street = street;
    } else if (matchLevel == "district") {
      adsQuery.district = district;
    } else if (matchLevel == "city") {
      adsQuery.city = city;
    } else {
      adsQuery.country = country;
    }
    // Conditionally add the laundry field to the query
    if (Islaundry !== false) {
      adsQuery.laundry = Islaundry;
    }
    if (Iswifi !== false) {
      adsQuery.wifi = Iswifi;
    }
    if (IsROwater !== false) {
      adsQuery.ROwater = IsROwater;
    }

    const ads = await Ad.find(adsQuery).limit(48).sort({ createdAt: -1 }).select(
      "-photos.Key -photos.key -photos.ETag -photos.Bucket "
    );

    // console.log("ads search result => ", ads);
    res.json(ads);


  } catch (err) {
    console.log(err);
  }
}

export const checkout = async (req, res) => {
  try {
    const options = {
      amount: Number(req.body.amount * 100),
      currency: "INR",
    };
    const order = await config.instance.orders.create(options);
    console.log(order);


    return res.status(200).json({
      sucess: true,
      order
    });
  }
  catch (err) {
    console.log(err);
  }
}

export const paymentVerification = async (req, res) => {
  console.log(req.body);

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, adid } =
      req.body;
    console.log("adid" + adid);
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", config.RAZORPAY_SECRET_ACESS_KEY)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    console.log("isAuthentic1:", isAuthentic);
    if (isAuthentic) {

      console.log("verify controller want to update database");
      console.log("adid" + adid);
      let ad = await Ad.findById(adid);
      await ad.updateOne({
        rented: true
      });
      res.status(200).json({
        success: true,
      });
    } else {
      res.status(400).json({
        success: false,
      });
    }
  }
  catch (err) {
    console.log(err);
  }

}
