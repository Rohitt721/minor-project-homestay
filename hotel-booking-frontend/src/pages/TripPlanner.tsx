import { useState } from "react";
import { useQuery, useMutation } from "react-query";
import { useNavigate } from "react-router-dom";
import * as apiClient from "../api-client";
import {
    MapPin,
    Calendar,
    Clock,
    Compass,
    DollarSign,
    Sparkles,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Hotel,
    Star,
    Check,
    AlertCircle,
    Map,
    Utensils,
    Camera,
    RefreshCw,
} from "lucide-react";
import useAppContext from "../hooks/useAppContext";

type TravelStyle = "adventure" | "cultural" | "relaxation" | "food" | "mixed";
type Budget = "budget" | "moderate" | "luxury";

interface FormData {
    destination: string;
    startDate: string;
    duration: number;
    travelStyle: TravelStyle;
    budget: Budget;
    mustVisitPlaces: string;
}

const TRAVEL_STYLE_ICONS: Record<TravelStyle, React.ReactNode> = {
    adventure: <Compass className="w-6 h-6" />,
    cultural: <Camera className="w-6 h-6" />,
    relaxation: <Star className="w-6 h-6" />,
    food: <Utensils className="w-6 h-6" />,
    mixed: <Sparkles className="w-6 h-6" />,
};

const TripPlanner = () => {
    const navigate = useNavigate();
    const { showToast } = useAppContext();
    const [step, setStep] = useState(1);
    const [tripPlan, setTripPlan] = useState<apiClient.TripPlan | null>(null);
    const [selectedDay, setSelectedDay] = useState(1);

    const [formData, setFormData] = useState<FormData>({
        destination: "",
        startDate: "",
        duration: 3,
        travelStyle: "mixed",
        budget: "moderate",
        mustVisitPlaces: "",
    });

    const { data: travelStyles } = useQuery("travelStyles", apiClient.getTravelStyles);
    const { data: budgetOptions } = useQuery("budgetOptions", apiClient.getBudgetOptions);

    const generateMutation = useMutation(apiClient.generateTripPlan, {
        onSuccess: (data) => {
            setTripPlan(data);
            setStep(3);
            showToast({
                title: "Trip Plan Generated!",
                description: `Your ${data.duration}-day itinerary to ${data.destination} is ready.`,
                type: "SUCCESS",
            });
        },
        onError: () => {
            showToast({
                title: "Failed to Generate Plan",
                description: "Please try again or adjust your preferences.",
                type: "ERROR",
            });
        },
    });

    const handleInputChange = (field: keyof FormData, value: string | number) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleGenerate = () => {
        if (!formData.destination || !formData.startDate) {
            showToast({
                title: "Missing Information",
                description: "Please fill in destination and start date.",
                type: "ERROR",
            });
            return;
        }

        generateMutation.mutate({
            destination: formData.destination,
            startDate: formData.startDate,
            duration: formData.duration,
            travelStyle: formData.travelStyle,
            budget: formData.budget,
            mustVisitPlaces: formData.mustVisitPlaces
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
        });
    };

    const handleBookHotel = (hotelId: string) => {
        navigate(`/detail/${hotelId}`);
    };

    const handleRefreshHotels = async (dayNumber: number) => {
        if (!tripPlan) return;

        const day = tripPlan.days.find((d) => d.day === dayNumber);
        if (!day) return;

        try {
            const result = await apiClient.getAlternateHotels(
                tripPlan.destination,
                day.date,
                new Date(new Date(day.date).getTime() + 86400000).toISOString().split("T")[0],
                tripPlan.budget
            );

            if (result.hotels.length > 0) {
                const updatedDays = tripPlan.days.map((d) =>
                    d.day === dayNumber ? { ...d, hotels: result.hotels, fallbackMessage: undefined } : d
                );
                setTripPlan({ ...tripPlan, days: updatedDays });
                showToast({
                    title: "Hotels Updated",
                    description: "Found some alternate options for you.",
                    type: "SUCCESS",
                });
            } else {
                showToast({
                    title: "No alternates found",
                    description: "We couldn't find other hotels matching your criteria nearby.",
                    type: "ERROR",
                });
            }
        } catch (error) {
            showToast({
                title: "Error",
                description: "Failed to fetch alternate hotels.",
                type: "ERROR",
            });
        }
    };

    // Step 1: Destination & Dates
    const renderStep1 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Where do you want to go?</h2>
                <p className="text-gray-500 mt-2">Tell us your destination and travel dates</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        Destination
                    </label>
                    <input
                        type="text"
                        value={formData.destination}
                        onChange={(e) => handleInputChange("destination", e.target.value)}
                        placeholder="e.g., Jaipur, Goa, Kerala..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 text-green-600" />
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => handleInputChange("startDate", e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <Clock className="w-4 h-4 text-purple-600" />
                            Duration (days)
                        </label>
                        <select
                            value={formData.duration}
                            onChange={(e) => handleInputChange("duration", parseInt(e.target.value))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((d) => (
                                <option key={d} value={d}>
                                    {d} {d === 1 ? "day" : "days"}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Map className="w-4 h-4 text-orange-600" />
                        Must-Visit Places (optional)
                    </label>
                    <input
                        type="text"
                        value={formData.mustVisitPlaces}
                        onChange={(e) => handleInputChange("mustVisitPlaces", e.target.value)}
                        placeholder="Taj Mahal, Red Fort, Hawa Mahal..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <p className="text-xs text-gray-400 mt-1">Separate multiple places with commas</p>
                </div>
            </div>
        </div>
    );

    // Step 2: Preferences
    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">What's your travel style?</h2>
                <p className="text-gray-500 mt-2">Help us personalize your itinerary</p>
            </div>

            {/* Travel Style */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Travel Style</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(travelStyles || []).map((style) => (
                        <button
                            key={style.id}
                            type="button"
                            onClick={() => handleInputChange("travelStyle", style.id as TravelStyle)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${formData.travelStyle === style.id
                                ? "border-blue-500 bg-blue-50 shadow-md"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <div className="text-2xl mb-2">{style.icon}</div>
                            <p className="font-medium text-gray-800">{style.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{style.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Budget */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Budget Level</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(budgetOptions || []).map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => handleInputChange("budget", option.id as Budget)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${formData.budget === option.id
                                ? "border-green-500 bg-green-50 shadow-md"
                                : "border-gray-200 hover:border-gray-300"
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-2xl">{option.icon}</span>
                                <span className="text-sm text-gray-500">{option.priceRange}</span>
                            </div>
                            <p className="font-medium text-gray-800 mt-2">{option.name}</p>
                            <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Step 3: Results
    const renderStep3 = () => {
        if (!tripPlan) return null;

        const currentDay = tripPlan.days.find((d) => d.day === selectedDay);

        return (
            <div className="space-y-6">
                {/* Trip Summary */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                    <h2 className="text-2xl font-bold mb-2">
                        {tripPlan.duration}-Day Trip to {tripPlan.destination}
                    </h2>
                    <p className="text-blue-100 mb-4">{tripPlan.summary}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                            📅 {tripPlan.startDate} → {tripPlan.endDate}
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                            {TRAVEL_STYLE_ICONS[formData.travelStyle]} {formData.travelStyle}
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-full">💰 {formData.budget}</span>
                    </div>
                </div>

                {/* Day Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {tripPlan.days.map((day) => (
                        <button
                            key={day.day}
                            onClick={() => setSelectedDay(day.day)}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl font-medium transition-all ${selectedDay === day.day
                                ? "bg-blue-600 text-white shadow-lg"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            Day {day.day}
                        </button>
                    ))}
                </div>

                {/* Day Details */}
                {currentDay && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Activities */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Compass className="w-5 h-5 text-blue-600" />
                                Day {currentDay.day} - {currentDay.areaName}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">{currentDay.date}</p>

                            <div className="space-y-4">
                                {currentDay.activities.map((activity, index) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-3 h-3 bg-blue-600 rounded-full" />
                                            {index < currentDay.activities.length - 1 && (
                                                <div className="w-0.5 h-full bg-gray-200 mt-1" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="text-sm text-gray-500">{activity.time}</p>
                                            <p className="font-medium text-gray-800">{activity.activity}</p>
                                            <p className="text-sm text-gray-600 mt-1">{activity.location}</p>
                                            <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Hotels */}
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Hotel className="w-5 h-5 text-green-600" />
                                    Recommended Stays
                                </h3>
                                <button
                                    onClick={() => handleRefreshHotels(currentDay.day)}
                                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Find Alternates
                                </button>
                            </div>

                            {currentDay.fallbackMessage && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                                    <p className="text-sm text-yellow-700">{currentDay.fallbackMessage}</p>
                                </div>
                            )}

                            <div className="space-y-4">
                                {currentDay.hotels.length > 0 ? (
                                    currentDay.hotels.map((hotel) => (
                                        <div
                                            key={hotel.hotelId}
                                            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all"
                                        >
                                            <div className="flex gap-4">
                                                {hotel.imageUrl && (
                                                    <img
                                                        src={hotel.imageUrl}
                                                        alt={hotel.name}
                                                        className="w-20 h-20 object-cover rounded-lg"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <h4 className="font-medium text-gray-800">{hotel.name}</h4>
                                                            <p className="text-sm text-gray-500">{hotel.city}</p>
                                                        </div>
                                                        <span
                                                            className={`text-xs px-2 py-1 rounded-full ${hotel.availabilityStatus === "available"
                                                                ? "bg-green-100 text-green-700"
                                                                : hotel.availabilityStatus === "limited"
                                                                    ? "bg-yellow-100 text-yellow-700"
                                                                    : "bg-red-100 text-red-700"
                                                                }`}
                                                        >
                                                            {hotel.availabilityStatus === "available" && (
                                                                <Check className="w-3 h-3 inline mr-1" />
                                                            )}
                                                            {hotel.availabilityStatus}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <div className="flex items-center">
                                                            {Array.from({ length: hotel.starRating }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className="w-3 h-3 text-yellow-400 fill-yellow-400"
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-800">
                                                            ₹{hotel.pricePerNight}/night
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleBookHotel(hotel.hotelId)}
                                                        className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                                    >
                                                        View & Book
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Hotel className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No hotels found for this location.</p>
                                        <p className="text-sm">Try adjusting your budget or dates.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                        <Sparkles className="w-5 h-5 text-yellow-400" />
                        <span className="text-white font-medium">AI-Powered Trip Planner</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Plan Your Perfect Trip</h1>
                    <p className="text-blue-200">Get personalized itineraries with hotel recommendations</p>
                </div>

                {/* Progress */}
                {step < 3 && (
                    <div className="flex items-center justify-center gap-4 mb-8">
                        {[1, 2].map((s) => (
                            <div key={s} className="flex items-center gap-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${step >= s ? "bg-blue-500 text-white" : "bg-white/20 text-white/50"
                                        }`}
                                >
                                    {step > s ? <Check className="w-4 h-4" /> : s}
                                </div>
                                {s < 2 && (
                                    <div
                                        className={`w-16 h-1 rounded-full ${step > s ? "bg-blue-500" : "bg-white/20"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                </div>

                {/* Navigation */}
                {step < 3 && (
                    <div className="flex items-center justify-between mt-6">
                        <button
                            type="button"
                            onClick={() => setStep(step - 1)}
                            disabled={step === 1}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${step === 1
                                ? "bg-white/5 text-white/30 cursor-not-allowed"
                                : "bg-white/10 text-white hover:bg-white/20"
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Back
                        </button>

                        {step === 2 ? (
                            <button
                                onClick={handleGenerate}
                                disabled={generateMutation.isLoading}
                                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                            >
                                {generateMutation.isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Generate Trip Plan
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg"
                            >
                                Next
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Reset Button */}
                {step === 3 && (
                    <div className="text-center mt-6">
                        <button
                            onClick={() => {
                                setStep(1);
                                setTripPlan(null);
                            }}
                            className="text-white/70 hover:text-white transition-colors"
                        >
                            Plan Another Trip
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TripPlanner;
