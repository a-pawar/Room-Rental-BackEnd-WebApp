import * as config from "../config.js"
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../config.js";
import { emailTemplate } from "../helpers/email.js";
import { hashPassword, comparePassword } from '../helpers/auth.js';
import User from '../models/user.js';
import { nanoid } from "nanoid";
import validator from "email-validator";



export const welcome = (req, res) => {
  res.json({ data: "hello from node js api from routes..." });
}

export const preRegister = async (req, res) => {
  //create jwt with email and pass then email as clickable link
  //only when user click on that email link, registeration complete

  try {
    // console.log(req.body);
    const { email, password, name } = req.body;
    //validation
    if (!validator.validate(email)) {
      return res.json({ error: 'A valid email is required' })
    }
    if (!password) {
      return res.json({ error: "Password is required" });
    }
    if (password && password?.length < 6) {
      return res.json({ error: "Password should be at least 6 characters" });
    }
    const user = await User.findOne({ email });
    if (user) {
      return res.json({ error: "email is taken" });
    }
    const token = jwt.sign({ email, password, name }, config.JWT_SECRET, {
      expiresIn: "1h",
    });
    config.AWSSES.sendEmail(emailTemplate(email, `
    <p>Please click the link below to activate your account</p>
    <a href="${config.CLIENT_URL}/auth/account-activate/${token}">Activate my account</a>
    `, config.REPLY_TO, "Activate your account"),
      (err, data) => {
        if (err) {
          console.log(err);
          return res.json({ error: "false,for developer-register email to aws" });
        } else {
          console.log(data);
          return res.json({ ok: true });
        }
      });


  }
  catch (err) {
    console.log(err);
    return res.json({ error: "Something went wrong. Try again." });
  }
}


export const register = async (req, res) => {
  try {
    // decode email, password from token
    const { email, password, name } = jwt.verify(req.body.token, config.JWT_SECRET);
    // hash password
    const hashedPassword = await hashPassword(password);
    // create user and save
    const user = await new User({
      username: nanoid(6),
      name,
      email,
      password: hashedPassword,
    }).save();
    // create token
    const jwtToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "1h",
    });
    // create refresh token
    const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "30d",
    });
    // hide fields
    user.password = undefined;
    user.resetCode = undefined;
    // send response
    return res.json({
      user,
      token: jwtToken,
      refreshToken,
    });
  } catch (err) {
    console.log(err);
    res.json({ error: "Invalid or expired token. Try again." });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    //1 find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ error: "No User Found!!! Please Register." });
    }
    // console.log(User);
    //2 compare password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({ error: "Wrong passsword" })
    }
    //3  create jwt tokens
    const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, { expiresIn: "5d" });
    const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, { expiresIn: "30d" });
    user.password = undefined;

    //4 send the response
    user.password = undefined;
    user.resetCode = undefined;
    return res.json({
      token, refreshToken, user
    })

  } catch (err) {
    console.log(err);
    return res.json({ error: "Something went wrong. Try again." });
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.json({ error: "Could not find user with that email" });
    } else {
      const resetCode = nanoid();

      const token = jwt.sign({ resetCode }, config.JWT_SECRET, {
        expiresIn: "60m",
      });
      // save to user db
      user.resetCode = resetCode;
      user.save();

      // send email
      config.AWSSES.sendEmail(
        emailTemplate(
          email,
          `
        <p>Please click the link below to access your account.</p>
        <a href="${config.CLIENT_URL}/auth/access-password/${token}">Access my account</a>
    `,
          config.REPLY_TO,
          "Access your account"
        ),
        (err, data) => {
          if (err) {
            return res.json({ error: "Provide a valid email address" });
          } else {
            return res.json({ ok: "Check email to access your account" });
          }
        }
      );
    }
  } catch (err) {
    console.log(err);
    res.json({ error: "Something went wrong. Try again." });
  }
};

export const accessAccount = async (req, res) => {
  try {
    // verify token and check expiry
    const { resetCode } = jwt.verify(req.body.resetCode, config.JWT_SECRET);

    const user = await User.findOneAndUpdate(
      { resetCode },
      { resetCode: "" }
    );

    // console.log("user", user, resetCode);
    // return;

    // generate token
    const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "1d",
    });
    // generate refresh token
    const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "30d",
    });

    user.password = undefined;
    user.resetCode = undefined;
    return res.json({
      token,
      refreshToken,
      user,
    });
  } catch (err) {
    console.log(err);
    res.json({ error: "Expired or invalid token. Try again." });
  }
};

export const refreshToken = async (req, res) => {
  try {
    // console.log("you hit refresh token endpoint => ", req.headers);

    const { _id } = jwt.verify(req.headers.refresh_token, config.JWT_SECRET);

    const user = await User.findById(_id);
    const token = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "7d",
    });
    const refreshToken = jwt.sign({ _id: user._id }, config.JWT_SECRET, {
      expiresIn: "365d",
    });
    // send user and token as response excluding password
    user.password = undefined;
    user.resetCode = undefined;
    res.json({
      user,
      token,
      refreshToken,
    });
  } catch (err) {
    console.log("===> ", err.name);
    return res.status(403).json({ error: "Refresh token failed" }); // 403 is important
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.password = undefined;
    user.resetCode = undefined;
    res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(403).json({ error: "Unauthorized" });
  }
};

export const publicProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    user.password = undefined;
    user.resetCode = undefined;
    res.json(user);
  } catch (err) {
    console.log(err);
    return res.status(403).json({ error: err });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.json({ error: "Password is required" });
    }

    // check if password meets the requirement
    if (password && password?.length < 6) {
      return res.json({
        error: "Min 6 characters long password is required",
      });
    }

    const user = await User.findById(req.user._id);
    const hashedPassword = await hashPassword(password);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    res.json({ ok: true });
  } catch (err) {
    console.log(err);
    return res.status(403).json({ error: "Unauthorized" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...req.body,
      },
      { new: true }
    );

    user.password = undefined;
    user.resetCode = undefined;
    res.json(user);
  } catch (err) {
    console.log(err);
    if (err.codeName === "DuplicateKey") {
      return res.status(403).json({ error: "Username or email is taken" });
    } else {
      return res.status(403).json({ error: "Unauhorized" });
    }
  }
};

