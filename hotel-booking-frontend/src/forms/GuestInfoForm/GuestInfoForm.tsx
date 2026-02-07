import { useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useSearchContext from "../../hooks/useSearchContext";
import useAppContext from "../../hooks/useAppContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Calendar,
  User,
  Baby,
  CreditCard,
  Loader2,
  Clock,
  Zap,
  Moon,
  Info,
  Check,
  ShieldCheck
} from "lucide-react";
import { useQuery } from "react-query";
import * as apiClient from "../../api-client";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";

type Props = {
  hotelId: string;
  pricePerNight: number;
  pricePerHour: number;
};

type GuestInfoFormData = {
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
  bookingType: "nightly" | "hourly";
};

const GuestInfoForm = ({ hotelId, pricePerNight, pricePerHour }: Props) => {
  const search = useSearchContext();
  const { isLoggedIn } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [bookingType, setBookingType] = useState<"nightly" | "hourly">("nightly");

  // Fetch real-time availability
  const { data: bookedRanges, isLoading: isAvailabilityLoading } = useQuery(
    ["fetchHotelAvailability", hotelId],
    () => apiClient.fetchHotelAvailability(hotelId),
    {
      refetchInterval: 30000,
    }
  );

  const {
    watch,
    register,
    handleSubmit,
    setValue,
  } = useForm<GuestInfoFormData>({
    defaultValues: {
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adultCount: search.adultCount,
      childCount: search.childCount,
      bookingType: "nightly",
    },
  });

  const checkIn = watch("checkIn");
  const checkOut = watch("checkOut");

  // Sync internal state with RHF
  useEffect(() => {
    setValue("bookingType", bookingType);
    if (bookingType === "hourly") {
      // Set default hourly range (e.g., 2 hours from now)
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const start = new Date(now.getTime() + 60 * 60 * 1000);
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
      setValue("checkIn", start);
      setValue("checkOut", end);
    } else {
      setValue("checkIn", search.checkIn);
      setValue("checkOut", search.checkOut);
    }
  }, [bookingType, setValue, search.checkIn, search.checkOut]);

  // Helper to check if a specific time/date is booked
  const isSlotBooked = (start: Date, end: Date) => {
    if (!bookedRanges) return false;
    return bookedRanges.some((range: any) => {
      const bStart = new Date(range.checkIn);
      const bEnd = new Date(range.checkOut);
      return (start < bEnd) && (end > bStart);
    });
  };

  // Helper to check if a specific time is booked on a specific date
  const isTimeBooked = (time: Date) => {
    if (!bookedRanges) return false;
    return bookedRanges.some((range: any) => {
      const bStart = new Date(range.checkIn);
      const bEnd = new Date(range.checkOut);
      return (time >= bStart && time < bEnd);
    });
  };

  const isDatePartiallyBooked = (date: Date) => {
    if (!bookedRanges) return false;
    return bookedRanges.some((range: any) => {
      const s = new Date(range.checkIn);
      const e = new Date(range.checkOut);
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const rs = new Date(s);
      rs.setHours(0, 0, 0, 0);
      const re = new Date(e);
      re.setHours(0, 0, 0, 0);
      return d >= rs && d <= re;
    });
  };

  const isDateFullyBooked = (date: Date) => {
    if (!bookedRanges) return false;
    return bookedRanges.some((range: any) => {
      if (range.bookingType === "nightly") {
        const s = new Date(range.checkIn);
        const e = new Date(range.checkOut);
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const rs = new Date(s);
        rs.setHours(0, 0, 0, 0);
        const re = new Date(e);
        re.setHours(0, 0, 0, 0);
        return d >= rs && d < re;
      }
      return false;
    });
  };

  const getDayClass = (date: Date) => {
    if (isDateFullyBooked(date)) return "booked-date";
    if (isDatePartiallyBooked(date)) return "partially-booked-date";
    return "available-date";
  };

  // Pricing Calculation
  let units = 1;
  let totalPrice = 0;

  if (checkIn && checkOut) {
    if (bookingType === "nightly") {
      const diff = checkOut.getTime() - checkIn.getTime();
      units = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      totalPrice = pricePerNight * units;
    } else {
      const diff = checkOut.getTime() - checkIn.getTime();
      units = Math.max(1, Math.ceil(diff / (1000 * 60 * 60)));
      totalPrice = pricePerHour * units;
    }
  }

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);

  // Fetch verification status
  const { data: verificationStatus } = useQuery(
    "verificationStatus",
    apiClient.fetchVerificationStatus,
    {
      enabled: isLoggedIn,
    }
  );

  const isVerified = verificationStatus?.status === "VERIFIED";

  const onSignInClick = (data: GuestInfoFormData) => {
    search.saveSearchValues("", data.checkIn, data.checkOut, data.adultCount, data.childCount);
    navigate("/sign-in", { state: { from: location } });
  };

  const onVerifyClick = (data: GuestInfoFormData) => {
    search.saveSearchValues("", data.checkIn, data.checkOut, data.adultCount, data.childCount);
    navigate("/verify-identity");
  };

  const onSubmit = (data: GuestInfoFormData) => {
    // Check for minimum 1-hour duration for hourly bookings
    if (bookingType === "hourly") {
      const durationInMs = data.checkOut.getTime() - data.checkIn.getTime();
      const durationInHours = durationInMs / (1000 * 60 * 60);

      if (durationInHours < 1) {
        alert("The minimum booking duration is 1 hour. Please adjust your check-out time.");
        return;
      }
    }

    if (isSlotBooked(data.checkIn, data.checkOut)) {
      alert("The selected time slot is already booked. Please choose another.");
      return;
    }

    search.saveSearchValues("", data.checkIn, data.checkOut, data.adultCount, data.childCount);
    navigate(`/hotel/${hotelId}/booking`, { state: { bookingType: data.bookingType } });
  };

  return (
    <>
      <style>
        {`
          .react-datepicker {
            background-color: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(8px) !important;
            border: 1px solid rgba(255, 255, 255, 0.3) !important;
            border-radius: 20px !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
            padding: 10px !important;
          }
          .react-datepicker__header {
            background: transparent !important;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05) !important;
          }
          .react-datepicker__day {
            border-radius: 12px !important;
            transition: all 0.2s !important;
          }
          .booked-date {
            background-color: #fee2e2 !important;
            color: #ef4444 !important;
            text-decoration: line-through !important;
            cursor: not-allowed !important;
          }
          .partially-booked-date {
            background-color: #fef3c7 !important; /* light yellow/amber */
            color: #d97706 !important;
            border-bottom: 3px solid #f59e0b !important;
          }
          .available-date:hover {
            background-color: #e0e7ff !important;
          }
          .react-datepicker__day--selected {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
            color: white !important;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3) !important;
          }
          .react-datepicker__time-container {
            border-left: 1px solid rgba(0, 0, 0, 0.05) !important;
            width: 100px !important;
          }
        `}
      </style>

      <Card className="w-full border-0 shadow-2xl overflow-hidden rounded-[2.5rem] bg-white/40 backdrop-blur-2xl ring-1 ring-white/20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5 -z-10" />

        <CardHeader className="pb-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-black text-gray-900 tracking-tight">Reserve Now</CardTitle>
                <p className="text-xs text-gray-500 font-medium lowercase tracking-tighter italic">Instant confirmation guaranteed</p>
              </div>
            </div>
            {isAvailabilityLoading && <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />}
          </div>

          <div className="flex p-1.5 bg-gray-200/50 backdrop-blur-md rounded-[1.5rem] border border-gray-100 shadow-inner">
            <button
              type="button"
              onClick={() => setBookingType("nightly")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300",
                bookingType === "nightly"
                  ? "bg-white text-indigo-600 shadow-md translate-y-[-1px]"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Moon className="h-4 w-4" />
              Nightly
            </button>
            {pricePerHour > 0 && (
              <button
                type="button"
                onClick={() => setBookingType("hourly")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300",
                  bookingType === "hourly"
                    ? "bg-white text-indigo-600 shadow-md translate-y-[-1px]"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <Clock className="h-4 w-4" />
                Hourly
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200" />
            <div className="relative flex justify-between items-center p-5 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Pricing</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">₹{bookingType === 'nightly' ? pricePerNight : pricePerHour}</span>
                  <span className="text-sm font-bold text-gray-400">/{bookingType === 'nightly' ? 'night' : 'hour'}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estimated Total</span>
                <div className="text-3xl font-black text-indigo-600">₹{totalPrice}</div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-5 rotate-12">
                <CreditCard className="h-24 w-24 text-indigo-900" />
              </div>
            </div>
          </div>

          <form
            onSubmit={
              !isLoggedIn
                ? handleSubmit(onSignInClick)
                : !isVerified
                  ? handleSubmit(onVerifyClick)
                  : handleSubmit(onSubmit)
            }
            className="space-y-5"
          >
            <div className="space-y-4 bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100/50">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-indigo-500" />
                <Label className="text-sm font-extrabold text-gray-700">Schedule Your Stay</Label>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Check-In</span>
                  <DatePicker
                    selected={checkIn}
                    onChange={(date) => setValue("checkIn", date as Date)}
                    showTimeSelect={bookingType === "hourly"}
                    filterTime={(time) => !isTimeBooked(time)}
                    dateFormat={bookingType === "hourly" ? "MMM d, h:mm aa" : "MMMM d, yyyy"}
                    minDate={minDate}
                    maxDate={maxDate}
                    dayClassName={getDayClass}
                    className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-700 shadow-sm"
                    wrapperClassName="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Check-Out</span>
                  <DatePicker
                    selected={checkOut}
                    onChange={(date) => setValue("checkOut", date as Date)}
                    showTimeSelect={bookingType === "hourly"}
                    filterTime={(time) => !isTimeBooked(time)}
                    dateFormat={bookingType === "hourly" ? "MMM d, h:mm aa" : "MMMM d, yyyy"}
                    minDate={checkIn || minDate}
                    maxDate={maxDate}
                    dayClassName={getDayClass}
                    className="w-full bg-white border-0 ring-1 ring-gray-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-gray-700 shadow-sm"
                    wrapperClassName="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 group">
                <div className="flex items-center gap-2 ml-1">
                  <User className="h-3 w-3 text-gray-400" />
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Adults</Label>
                </div>
                <Input
                  type="number"
                  {...register("adultCount", { required: true, min: 1, valueAsNumber: true })}
                  className="bg-white border-0 ring-1 ring-gray-200 rounded-2xl py-6 text-center font-black text-lg focus:ring-indigo-500 shadow-sm"
                />
              </div>
              <div className="space-y-2 group">
                <div className="flex items-center gap-2 ml-1">
                  <Baby className="h-3 w-3 text-gray-400" />
                  <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Children</Label>
                </div>
                <Input
                  type="number"
                  {...register("childCount", { required: true, min: 0, valueAsNumber: true })}
                  className="bg-white border-0 ring-1 ring-gray-200 rounded-2xl py-6 text-center font-black text-lg focus:ring-indigo-500 shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAvailabilityLoading}
              className={cn(
                "group relative w-full h-16 rounded-[1.5rem] overflow-hidden shadow-xl transition-all duration-300 active:scale-95 disabled:opacity-50",
                !isLoggedIn ? "bg-gray-800" : !isVerified ? "bg-amber-600 shadow-amber-200" : "bg-indigo-600 shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300"
              )}
            >
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                !isLoggedIn ? "bg-gray-700" : !isVerified ? "bg-amber-500" : "bg-gradient-to-r from-indigo-500 to-purple-600"
              )} />
              <div className="relative flex items-center justify-center gap-3 text-white font-black text-lg tracking-tight">
                {!isLoggedIn ? (
                  <>
                    <User className="h-5 w-5" />
                    Sign in to Continue
                  </>
                ) : !isVerified ? (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    Verify Identity to Book
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Book {units} {bookingType === 'nightly' ? (units === 1 ? 'Night' : 'Nights') : (units === 1 ? 'Hour' : 'Hours')}
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-xl">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">High Demand: 4 people looking now</span>
            </div>
            <div className="flex justify-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
              <div className="flex items-center gap-1"><Info className="h-3 w-3" /> Secure Pay</div>
              <div className="flex items-center gap-1"><Info className="h-3 w-3" /> No Hidden Fees</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default GuestInfoForm;
