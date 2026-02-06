import { HotelType } from "../../../shared/types";

type Props = {
  checkIn: Date;
  checkOut: Date;
  adultCount: number;
  childCount: number;
  numberOfNights: number;
  hotel: HotelType;
  bookingType?: "nightly" | "hourly";
};

const BookingDetailsSummary = ({
  checkIn,
  checkOut,
  adultCount,
  childCount,
  numberOfNights,
  hotel,
  bookingType = "nightly",
}: Props) => {
  return (
    <div className="grid gap-4 rounded-lg border border-slate-300 p-5 h-fit shadow-sm bg-white">
      <h2 className="text-xl font-bold text-gray-800">Your Booking Details</h2>
      <div className="border-b py-2">
        <span className="text-gray-500 text-sm italic">Location:</span>
        <div className="font-bold text-indigo-700">{`${hotel.name}, ${hotel.city}, ${hotel.country}`}</div>
      </div>
      <div className="flex justify-between gap-4">
        <div>
          <span className="text-gray-500 text-sm italic">Check-in</span>
          <div className="font-bold text-gray-800">
            {checkIn.toDateString()}
            {bookingType === "hourly" && ` at ${checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </div>
        </div>
        <div>
          <span className="text-gray-500 text-sm italic">Check-out</span>
          <div className="font-bold text-gray-800">
            {checkOut.toDateString()}
            {bookingType === "hourly" && ` at ${checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </div>
        </div>
      </div>
      <div className="border-t border-b py-2">
        <span className="text-gray-500 text-sm italic">Total length of stay:</span>
        <div className="font-bold text-indigo-600">
          {bookingType === "nightly" ? `${numberOfNights} nights` : `${numberOfNights} hours`}
        </div>
      </div>

      <div>
        <span className="text-gray-500 text-sm italic">Guests</span>
        <div className="font-bold text-gray-800">
          {adultCount} adults & {childCount} children
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsSummary;
