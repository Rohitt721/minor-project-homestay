import mongoose from "mongoose";
import "dotenv/config";
import bcrypt from "bcryptjs";
import User from "./models/user";
import Hotel from "./models/hotel";
import Booking from "./models/booking";
import Subscription from "./models/subscription";

const MONGODB_CONNECTION_STRING = process.env.MONGODB_CONNECTION_STRING as string;

const seedDatabase = async () => {
    try {
        console.log("📡 Connecting to MongoDB...");
        await mongoose.connect(MONGODB_CONNECTION_STRING);
        console.log("✅ Connected to MongoDB");

        // 1. Clear existing data
        console.log("🧹 Deleting previous seeded data...");
        await User.deleteMany({});
        await Hotel.deleteMany({});
        await Booking.deleteMany({});
        await Subscription.deleteMany({});
        console.log("✅ Database cleared");

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash("password123", 8);

        // 3. Create Users (Owners and Regular Users)
        console.log("👤 Creating users with hashed passwords...");
        const owners = await User.insertMany([
            { email: "owner1@test.com", password: hashedPassword, firstName: "Rahul", lastName: "Sharma", role: "hotel_owner", isActive: true },
            { email: "owner2@test.com", password: hashedPassword, firstName: "Anita", lastName: "Desai", role: "hotel_owner", isActive: true },
            { email: "owner3@test.com", password: hashedPassword, firstName: "Vikram", lastName: "Singh", role: "hotel_owner", isActive: true },
            { email: "owner4@test.com", password: hashedPassword, firstName: "Priya", lastName: "Patel", role: "hotel_owner", isActive: true }
        ]);

        const regularUsers = await User.insertMany([
            { email: "user1@test.com", password: hashedPassword, firstName: "Amit", lastName: "Kumar", role: "user", isActive: true },
            { email: "user2@test.com", password: hashedPassword, firstName: "Suneeta", lastName: "Rao", role: "user", isActive: true },
            { email: "user3@test.com", password: hashedPassword, firstName: "Rohan", lastName: "Mehta", role: "user", isActive: true },
            { email: "admin@test.com", password: hashedPassword, firstName: "System", lastName: "Admin", role: "admin", isActive: true }
        ]);
        console.log("✅ Created 8 users (4 owners, 4 others)");

        // 4. Create Hotels
        console.log("🏨 Creating hotels...");
        const hotelsData = [
            { userId: owners[0]._id, name: "Taj Mahal Palace", city: "Mumbai", country: "India", description: "Iconic luxury hotel overlooking the Arabian Sea.", type: ["Luxury"], adultCount: 2, childCount: 1, facilities: ["Pool", "Spa", "Gym", "Restaurant"], pricePerNight: 25000, starRating: 5, imageUrls: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"], lastUpdated: new Date(), status: "PUBLISHED" },
            { userId: owners[1]._id, name: "The Oberoi Grand", city: "Kolkata", country: "India", description: "The Grand Dame of Kolkata, offering colonial charm.", type: ["Boutique"], adultCount: 2, childCount: 0, facilities: ["Pool", "Gym", "Bar"], pricePerNight: 12000, starRating: 5, imageUrls: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"], lastUpdated: new Date(), status: "PUBLISHED" },
            { userId: owners[2]._id, name: "ITC Rajputana", city: "Jaipur", country: "India", description: "Royal Rajasthani hospitality in the Heart of Jaipur.", type: ["Heritage"], adultCount: 3, childCount: 2, facilities: ["Garden", "Pool", "Cultural Shows"], pricePerNight: 15000, starRating: 5, imageUrls: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d"], lastUpdated: new Date(), status: "PUBLISHED" },
            { userId: owners[0]._id, name: "Gateway Resort", city: "Mumbai", country: "India", description: "Mid-range business hotel near the gateway.", type: ["Business"], adultCount: 2, childCount: 0, facilities: ["Meeting Rooms", "WiFi"], pricePerNight: 8000, starRating: 4, imageUrls: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4"], lastUpdated: new Date(), status: "PUBLISHED" },
            { userId: owners[3]._id, name: "Hyatt Regency", city: "Delhi", country: "India", description: "Modern luxury in the capital city.", type: ["Contemporary"], adultCount: 2, childCount: 1, facilities: ["Spa", "Pool", "Multi-cuisine"], pricePerNight: 18000, starRating: 5, imageUrls: ["https://images.unsplash.com/photo-1564501049412-61c2a3083791"], lastUpdated: new Date(), status: "PUBLISHED" },
            { userId: owners[1]._id, name: "Ecorge Homestay", city: "Kolkata", country: "India", description: "Quiet homestay with local experience.", type: ["Homestay"], adultCount: 2, childCount: 2, facilities: ["Home Cooking", "WiFi"], pricePerNight: 3500, starRating: 3, imageUrls: ["https://images.unsplash.com/photo-1551882547-ff43c61f3fa3"], lastUpdated: new Date(), status: "PUBLISHED" }
        ];
        const hotels = await Hotel.insertMany(hotelsData);
        console.log("✅ Created 6 hotels");

        // 5. Create Subscriptions
        console.log("💳 Creating subscriptions...");
        const subscriptionsData = owners.map((owner, index) => ({
            userId: owner._id,
            plan: index % 2 === 0 ? "MONTHLY" : "YEARLY",
            startDate: new Date(),
            endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            status: "ACTIVE"
        }));
        await Subscription.insertMany(subscriptionsData);
        console.log("✅ Created 4 subscriptions");

        // 6. Create Bookings
        console.log("📅 Creating bookings...");
        const bookingsData = [];
        const statuses = ["CONFIRMED", "COMPLETED", "PAYMENT_DONE", "ID_SUBMITTED"];

        for (let i = 0; i < 20; i++) {
            const user = regularUsers[Math.floor(Math.random() * regularUsers.length)];
            const hotel = hotels[Math.floor(Math.random() * hotels.length)];

            // Random dates within last 30 days and next 30 days
            const checkIn = new Date();
            checkIn.setDate(checkIn.getDate() + (Math.floor(Math.random() * 60) - 30));
            const checkOut = new Date(checkIn);
            checkOut.setDate(checkOut.getDate() + Math.floor(Math.random() * 5) + 1);

            bookingsData.push({
                userId: user._id,
                hotelId: hotel._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: "9876543210",
                adultCount: Math.floor(Math.random() * 2) + 1,
                childCount: Math.floor(Math.random() * 2),
                checkIn,
                checkOut,
                totalCost: hotel.pricePerNight * Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)),
                status: statuses[Math.floor(Math.random() * statuses.length)],
                paymentStatus: "paid",
                paymentMethod: "Razorpay"
            });
        }
        await Booking.insertMany(bookingsData);
        console.log("✅ Created 20 bookings");

        // 7. Update Hotel and User Analytics
        console.log("📊 Updating Hotel and User analytics...");

        // Update Hotels
        for (const hotel of hotels) {
            const hotelBookings = bookingsData.filter(b => b.hotelId.toString() === hotel._id.toString());
            const totalBookings = hotelBookings.length;
            const totalRevenue = hotelBookings.reduce((sum, b) => sum + b.totalCost, 0);

            await Hotel.findByIdAndUpdate(hotel._id, {
                totalBookings,
                totalRevenue,
                lastUpdated: new Date()
            });
        }

        // Update Regular Users (Guests)
        for (const user of regularUsers) {
            const userBookings = bookingsData.filter(b => b.userId.toString() === user._id.toString());
            const totalBookings = userBookings.length;
            const totalSpent = userBookings.reduce((sum, b) => sum + b.totalCost, 0);

            await User.findByIdAndUpdate(user._id, {
                totalBookings,
                totalSpent
            });
        }

        console.log("✅ Analytics fields updated for hotels and users");

        console.log("\n🚀 DATABASE RE-SEEDED SUCCESSFULLY!");
        console.log("------------------------------------");
        console.log("Use these credentials to login:");
        console.log("Email: owner1@test.com");
        console.log("Password: password123");
        console.log("------------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
