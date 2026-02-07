import mongoose from "mongoose";

const userProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    address: {
        street: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String },
        zipCode: { type: String },
    },
    profileImage: { type: String },
    preferences: {
        preferredDestinations: [String],
        preferredHotelTypes: [String],
        budgetRange: {
            min: Number,
            max: Number,
        },
    },
    verification: {
        status: {
            type: String,
            enum: ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED"],
            default: "PENDING",
        },
        documents: [
            {
                url: String,
                documentType: String,
                name: String,
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
        rejectionReason: String,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

userProfileSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const UserProfile = mongoose.model("UserProfile", userProfileSchema);
export default UserProfile;
