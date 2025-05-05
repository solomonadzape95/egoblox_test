export function renderSeats(totalSeats: number, bookedSeats: number[]) {
  const seatsPerRow = 4;
  const rows = Math.ceil(totalSeats / seatsPerRow);
  let output = "🚌 Bus Seating Layout\n\n";

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < seatsPerRow; col++) {
      const seatNumber = row * seatsPerRow + col + 1;
      if (seatNumber <= totalSeats) {
        const isBooked = bookedSeats.includes(seatNumber);
        output += isBooked
          ? "❌"
          : `${seatNumber.toString().padStart(2, "0")} `;
      }
      if (col === 1) output += "| "; // Aisle
    }
    output += "\n";
  }

  output += "\n❌ = Booked | ## = Available";
  return output;
}
