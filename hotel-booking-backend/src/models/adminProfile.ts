import mongoose from "mongoose";

const adminProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    permissions: {
        type: [String],
        default: ["manage_users", "manage_hotels", "view_reports"]
    },
    auditLogPreferences: {
        logLevel: { type: String, default: "info" },
        notifyOnCritical: { type: Boolean, default: true }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

adminProfileSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const AdminProfile = mongoose.model("AdminProfile", adminProfileSchema);
export default AdminProfile;
