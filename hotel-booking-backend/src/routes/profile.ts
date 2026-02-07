import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import User from "../models/user";
import multer from "multer";
import cloudinary from "cloudinary";

const router = express.Router();

// Configuration for Multer
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

// Helper function to upload to Cloudinary
async function uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
                folder: "user_profiles",
                resource_type: "image",
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result!.secure_url);
            }
        );
        uploadStream.end(file.buffer);
    });
}

import UserProfile from "../models/userProfile";
import OwnerProfile from "../models/ownerProfile";
import AdminProfile from "../models/adminProfile";

// GET /api/users/profile - Get current user profile
router.get("/", verifyToken, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId).select("-password -__v");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userProfile = await UserProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt");

        let ownerProfile = null;
        if (user.role === "hotel_owner") {
            ownerProfile = await OwnerProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt");
        }

        // Merge data
        const combinedUser = {
            ...user.toObject(),
            ...(userProfile ? userProfile.toObject() : {}),
            ...(ownerProfile ? ownerProfile.toObject() : {}),
        };

        res.json(combinedUser);
    } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
});

// PUT /api/users/profile - Update user profile
router.put(
    "/",
    verifyToken,
    upload.single("profileImage"),
    async (req: Request, res: Response) => {
        try {
            const {
                firstName,
                lastName,
                phone,
                street,
                city,
                state,
                country,
                zipCode,
                companyName,
                taxId,
                businessAddress,
            } = req.body;

            const userId = req.userId;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // 1. Update UserProfile (or create if missing - handling legacy data migration dynamically)
            let userProfile = await UserProfile.findOne({ userId });
            if (!userProfile) {
                userProfile = new UserProfile({ userId, firstName: "", lastName: "" }); // Fallback if missing
            }

            if (firstName) userProfile.firstName = firstName;
            if (lastName) userProfile.lastName = lastName;
            if (phone) userProfile.phone = phone;

            if (street || city || state || country || zipCode) {
                if (!userProfile.address) userProfile.address = {};
                if (street) userProfile.address.street = street;
                if (city) userProfile.address.city = city;
                if (state) userProfile.address.state = state;
                if (country) userProfile.address.country = country;
                if (zipCode) userProfile.address.zipCode = zipCode;
            }

            // Handle Profile Image Upload
            if (req.file) {
                const imageUrl = await uploadToCloudinary(req.file);
                userProfile.profileImage = imageUrl;
            }

            await userProfile.save();

            // 2. Update OwnerProfile (if applicable)
            if (user.role === "hotel_owner") {
                let ownerProfile = await OwnerProfile.findOne({ userId });
                if (!ownerProfile) {
                    ownerProfile = new OwnerProfile({ userId });
                }

                if (!ownerProfile.businessInfo) ownerProfile.businessInfo = {};
                if (companyName) ownerProfile.businessInfo.companyName = companyName;
                if (taxId) ownerProfile.businessInfo.taxId = taxId;
                if (businessAddress) ownerProfile.businessInfo.businessAddress = businessAddress;

                await ownerProfile.save();
            }

            // Return updated combined user
            // Re-fetch to ensure clean state
            const updatedUser = await User.findById(userId).select("-password -__v");
            const updatedUserProfile = await UserProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt");
            let updatedOwnerProfile = null;
            if (user.role === "hotel_owner") {
                updatedOwnerProfile = await OwnerProfile.findOne({ userId }).select("-_id -userId -__v -createdAt -updatedAt");
            }

            const combinedUser = {
                ...updatedUser!.toObject(),
                ...(updatedUserProfile ? updatedUserProfile.toObject() : {}),
                ...(updatedOwnerProfile ? updatedOwnerProfile.toObject() : {}),
            };

            res.json(combinedUser);
        } catch (error) {
            console.error("Error updating profile:", error);
            res.status(500).json({ message: "Something went wrong" });
        }
    }
);

export default router;
