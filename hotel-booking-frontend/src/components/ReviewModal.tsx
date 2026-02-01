import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "react-query";
import { Star, X, Loader2, CheckCircle2 } from "lucide-react";
import * as apiClient from "../api-client";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import useAppContext from "../hooks/useAppContext";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    hotelId: string;
    hotelName: string;
}

interface ReviewFormData {
    rating: number;
    comment: string;
    categories: {
        cleanliness: number;
        service: number;
        location: number;
        value: number;
        amenities: number;
    };
}

const CATEGORIES = [
    { id: "cleanliness", label: "Cleanliness" },
    { id: "service", label: "Service" },
    { id: "location", label: "Location" },
    { id: "value", label: "Value" },
    { id: "amenities", label: "Amenities" },
] as const;

const ReviewModal = ({ isOpen, onClose, bookingId, hotelId, hotelName }: ReviewModalProps) => {
    const { showToast } = useAppContext();
    const queryClient = useQueryClient();
    const [categoryRatings, setCategoryRatings] = useState({
        cleanliness: 5,
        service: 5,
        location: 5,
        value: 5,
        amenities: 5,
    });

    // Calculate overall rating automatically
    const overallRating = Math.round(
        Object.values(categoryRatings).reduce((sum, val) => sum + val, 0) / CATEGORIES.length
    );

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ReviewFormData>();

    const mutation = useMutation(apiClient.submitReview, {
        onSuccess: () => {
            showToast({ title: "Review submitted successfully! Thank you for your feedback.", type: "SUCCESS" });
            queryClient.invalidateQueries("fetchMyBookings");
            reset();
            onClose();
        },
        onError: (error: any) => {
            showToast({ title: error.response?.data?.message || "Failed to submit review", type: "ERROR" });
        },
    });

    const onSubmit = (data: ReviewFormData) => {
        mutation.mutate({
            ...data,
            bookingId,
            hotelId,
            rating: overallRating,
            categories: categoryRatings,
        });
    };

    const StarRating = ({ value, onChange, label, readOnly }: { value: number, onChange: (v: number) => void, label?: string, readOnly?: boolean }) => (
        <div className="flex flex-col gap-1">
            {label && <Label className="text-sm font-medium text-gray-700">{label}</Label>}
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => !readOnly && onChange(star)}
                        className={`focus:outline-none transition-transform ${!readOnly ? "hover:scale-110" : "cursor-default"}`}
                    >
                        <Star
                            className={`w-6 h-6 ${star <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                        />
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden text-white">
                <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 p-5 relative border-b border-white/5">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                            Rate Your Stay
                        </DialogTitle>
                        <DialogDescription className="text-white/60 text-sm mt-1">
                            {hotelName}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
                            <StarRating
                                label="Overall Experience"
                                value={overallRating}
                                onChange={() => { }}
                                readOnly
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 px-1">
                            {CATEGORIES.map((cat) => (
                                <div key={cat.id} className="flex flex-col gap-1.5">
                                    <Label className="text-[11px] font-bold text-white/40 uppercase tracking-wider">{cat.label}</Label>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setCategoryRatings(prev => ({ ...prev, [cat.id]: star }))}
                                                className="focus:outline-none transition-transform hover:scale-110"
                                            >
                                                <Star
                                                    className={`w-4 h-4 ${star <= categoryRatings[cat.id as keyof typeof categoryRatings]
                                                        ? "fill-indigo-400 text-indigo-400"
                                                        : "text-white/10"
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="comment" className="text-xs font-medium text-white/50">
                                Detailed Feedback
                            </Label>
                            <textarea
                                id="comment"
                                {...register("comment", { required: "Please share your experience" })}
                                className="w-full min-h-[80px] p-3 rounded-2xl bg-white/5 border border-white/5 focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all resize-none text-sm text-white placeholder:text-white/20"
                                placeholder="What did you like? What could be improved?"
                            />
                            {errors.comment && (
                                <span className="text-[10px] text-rose-400 font-medium">{errors.comment.message}</span>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 py-5 rounded-2xl border-white/10 hover:bg-white/5 text-white/70 font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isLoading}
                            className="flex-1 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                        >
                            {mutation.isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                "Submit Review"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ReviewModal;
