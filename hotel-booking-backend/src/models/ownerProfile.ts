import mongoose from "mongoose";

const ownerProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    businessInfo: {
        companyName: { type: String },
        taxId: { type: String },
        businessAddress: { type: String },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

ownerProfileSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const OwnerProfile = mongoose.model("OwnerProfile", ownerProfileSchema);
export default OwnerProfile;
