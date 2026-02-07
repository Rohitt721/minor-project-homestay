import express, { Request, Response } from "express";
import User from "../models/user";
import jwt from "jsonwebtoken";
import { check, validationResult } from "express-validator";
import verifyToken from "../middleware/auth";

import UserProfile from "../models/userProfile";
import OwnerProfile from "../models/ownerProfile";
import AdminProfile from "../models/adminProfile";

const router = express.Router();

router.get("/me", verifyToken, async (req: Request, res: Response) => {
  const userId = req.userId;

  try {
    const user = await User.findById(userId).select("-password -__v");
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Fetch relevant profile data
    const userProfile = await UserProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt");

    // If owner, fetch owner profile
    let ownerProfile = null;
    if (user.role === "hotel_owner") {
      ownerProfile = await OwnerProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt");
    }

    // Attempt to fetch admin profile if admin
    let adminProfile = null;
    if (user.role === "admin") {
      adminProfile = await AdminProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt");
    }

    // Merge data to maintain frontend compatibility
    // Priority: Profile data overrides User data (though User data is now minimal)
    const combinedUser = {
      ...user.toObject(),
      ...(userProfile ? userProfile.toObject() : {}),
      ...(ownerProfile ? ownerProfile.toObject() : {}),
      ...(adminProfile ? adminProfile.toObject() : {}),
    };

    res.json(combinedUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.post(
  "/register",
  [
    check("firstName", "First Name is required").isString(),
    check("lastName", "Last Name is required").isString(),
    check("email", "Email is required").isEmail(),
    check("password", "Password with 6 or more characters required").isLength({
      min: 6,
    }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    try {
      let user = await User.findOne({
        email: req.body.email,
      });

      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }

      // 1. Create User (Auth)
      user = new User({
        email: req.body.email,
        password: req.body.password,
        role: req.body.role || "user"
      });

      await user.save();

      // 2. Create UserProfile (Basic Info)
      const userProfile = new UserProfile({
        userId: user._id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      });
      await userProfile.save();

      // 3. Create OwnerProfile if needed
      if (user.role === "hotel_owner") {
        const ownerProfile = new OwnerProfile({
          userId: user._id,
          // Initialize with empty or default values if needed
        });
        await ownerProfile.save();
      }

      // 4. Create AdminProfile if needed (though unlikely via public register)
      if (user.role === "admin") {
        const adminProfile = new AdminProfile({
          userId: user._id
        });
        await adminProfile.save();
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET_KEY as string,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 86400000,
        path: "/",
      });
      return res.status(200).send({ message: "User registered OK" });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "Something went wrong" });
    }
  }
);

export default router;
