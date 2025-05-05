import { Telegraf, Scenes, session } from "telegraf";
import { message } from "telegraf/filters";
import NodeCache from "node-cache";
import QRCode from "qrcode";
import dotenv from "dotenv";
import { VercelRequest, VercelResponse } from "@vercel/node";
import * as fs from "fs";
import { apiClient } from "../lib/api-client";
import { Route, Bus, Booking } from "../index";

// Define LoginFormData type
type LoginFormData = {
  username: string;
  password: string;
};

dotenv.config();

// Initialize bot
const bot = new Telegraf<Scenes.SceneContext>(process.env.BOT_TOKEN!);
const WEBHOOK_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/webhook`
  : "https://your-dev-url.vercel.app/api/webhook";

// Initialize cache for user sessions
const userCache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL

// Helper to create seat layout
const createSeatLayout = (bus: Bus) => {
  let layout = "🚌 Bus Seating Layout:\n\n";
  const totalRows = Math.ceil(bus.capacity / 4);

  for (let row = 0; row < totalRows; row++) {
    for (let col = 0; col < 4; col++) {
      const seatNum = row * 4 + col + 1;
      if (seatNum <= bus.capacity) {
        const isTaken = bus.bookedSeats.includes(seatNum);
        layout += isTaken ? "❌" : "✅";
      }
      if (col === 1) layout += "  "; // Aisle
    }
    layout += "\n";
  }

  return layout;
};

// Start command
bot.command("start", async (ctx) => {
  const welcomeMessage = `
Welcome to BookAM Bus Booking! 🚌

Please choose an option:
/login - Login to your account
/register - Create new account
/about - Learn about us
/help - Get help with commands
`;
  await ctx.reply(welcomeMessage);
});

// Login command
bot.command("login", async (ctx) => {
  await ctx.reply("Please enter your username:");
  userCache.set(`${ctx.from.id}_state`, "awaiting_username_login");
});

// Register command
bot.command("register", async (ctx) => {
  await ctx.reply("Please enter your desired username:");
  userCache.set(`${ctx.from.id}_state`, "awaiting_username_register");
});

// Handle user input for login/register
bot.on(message("text"), async (ctx) => {
  const state = userCache.get(`${ctx.from.id}_state`);
  const userId = ctx.from.id;

  switch (state) {
    case "awaiting_username_login":
      userCache.set(`${userId}_username`, ctx.message.text);
      userCache.set(`${userId}_state`, "awaiting_password_login");
      await ctx.reply("Please enter your password:");
      break;

    case "awaiting_password_login":
      try {
        const username = userCache.get(`${userId}_username`);
        const loginData: LoginFormData = {
          username: username as string,
          password: ctx.message.text,
        };

        const response = await apiClient.account.login(loginData);
        if (response.success) {
          userCache.set(`${userId}_token`, response.data.token);
          await ctx.reply(`Welcome back ${username}! 
          
Available commands:
/search - Search for routes
/bookings - View your bookings
/about - Learn about us
/review - Leave a review`);
        } else {
          await ctx.reply("Login failed. Please try again.");
        }
        userCache.del(`${userId}_state`);
      } catch (error) {
        await ctx.reply("An error occurred. Please try again.");
      }
      break;

    // Add more cases for registration flow...
  }
});

// Search routes command
bot.command("search", async (ctx) => {
  await ctx.reply("Enter origin city:");
  userCache.set(`${ctx.from.id}_state`, "awaiting_origin");
});

// Handle route search
bot.on(message("text"), async (ctx) => {
  const state = userCache.get(`${ctx.from.id}_state`);
  const userId = ctx.from.id;

  if (state === "awaiting_origin") {
    userCache.set(`${userId}_origin`, ctx.message.text);
    userCache.set(`${userId}_state`, "awaiting_destination");
    await ctx.reply("Enter destination city:");
  } else if (state === "awaiting_destination") {
    const origin = userCache.get(`${userId}_origin`);
    const destination = ctx.message.text;

    try {
      const token = userCache.get(`${userId}_token`);
      const routes = await apiClient.route.search(
        {
          origin: origin as string,
          destination,
        },
        token as string
      );

      if (routes.data.length === 0) {
        await ctx.reply("No routes found for your search.");
        return;
      }

      let routeList = "Available Routes:\n\n";
      routes.data.forEach((route: Route, index: number) => {
        routeList += `${index + 1}. ${route.origin} to ${route.destination}
🕒 Duration: ${route.duration}
💰 Price: ₦${route.price}
🚌 Available Buses: ${route.buses.length}

To select this route, send: /select_route_${route.routeId}\n\n`;
      });

      await ctx.reply(routeList);
    } catch (error) {
      await ctx.reply("Error searching routes. Please try again.");
    }
  }
});

// Handle route selection
bot.command(/select_route_(.+)/, async (ctx) => {
  const routeId = ctx.match[1];
  try {
    const token = userCache.get(`${ctx.from.id}_token`);
    const route = await apiClient.route.getById(routeId, token as string);

    let busList = "Available Buses:\n\n";
    route.data.buses.forEach((bus: Bus, index: number) => {
      busList += `${index + 1}. ${bus.busModel}
🔢 Bus Number: ${bus.busNumber}
💺 Available Seats: ${bus.seatsRemaining}
🕒 Departure: ${bus.departureTime}

To select this bus, send: /select_bus_${bus.busId}\n\n`;
    });

    await ctx.reply(busList);
  } catch (error) {
    await ctx.reply("Error fetching buses. Please try again.");
  }
});

// Handle bus selection and seat display
bot.command(/select_bus_(.+)/, async (ctx) => {
  const busId = ctx.match[1];
  try {
    const token = userCache.get(`${ctx.from.id}_token`);
    const bus = await apiClient.bus.getById(busId, token as string);

    const seatLayout = createSeatLayout(bus.data);
    await ctx.reply(seatLayout);
    await ctx.reply("To select a seat, send: /select_seat_{number}");

    userCache.set(`${ctx.from.id}_selected_bus`, busId);
  } catch (error) {
    await ctx.reply("Error displaying seats. Please try again.");
  }
});

// Handle seat selection and payment
bot.command(/select_seat_(\d+)/, async (ctx) => {
  const seatNumber = parseInt(ctx.match[1]);
  const busId = userCache.get(`${ctx.from.id}_selected_bus`);

  try {
    const token = userCache.get(`${ctx.from.id}_token`);
    const bus = await apiClient.bus.getById(busId as string, token as string);

    if (bus.data.bookedSeats.includes(seatNumber)) {
      await ctx.reply(
        "This seat is already taken. Please select another seat."
      );
      return;
    }

    // Create booking
    const bookingData = {
      busId,
      seatNumber,
      userId: ctx.from.id,
    };

    const booking = await apiClient.booking.create(
      bookingData as any,
      token as string
    );

    // Send payment instructions
    await ctx.reply(`Please complete your payment:

Amount: ₦${bus.data.price}

Payment Options:
1. Bank Transfer
Account Number: 0123456789
Bank: Your Bank Name
Account Name: BookAM Transport

2. Paystack
/pay_${booking.data.bookingId}

After payment, send /confirm_payment_${booking.data.bookingId}`);
  } catch (error) {
    await ctx.reply("Error processing seat selection. Please try again.");
  }
});

// Handle payment confirmation and ticket generation
bot.command(/confirm_payment_(.+)/, async (ctx) => {
  const bookingId = ctx.match[1];

  try {
    const token = userCache.get(`${ctx.from.id}_token`);
    const booking = await apiClient.booking.getById(bookingId, token as string);

    // Generate QR code
    const qrData = JSON.stringify({
      bookingId,
      userId: ctx.from.id,
      timestamp: Date.now(),
    });

    const qrCodeBuffer = await QRCode.toBuffer(qrData);
    const ticketMessage = `🎫 Your Ticket

Booking ID: ${booking.data.bookingId}
Route: ${booking.data.routes[0].origin} to ${booking.data.routes[0].destination}
Bus Number: ${booking.data.bus[0].busNumber}
Seat Number: ${booking.data.seatNumber}
Date: ${new Date().toLocaleDateString()}

Please show this ticket when boarding.`;

    // Send ticket
    await ctx.replyWithPhoto(
      { source: qrCodeBuffer },
      { caption: ticketMessage }
    );

    // Clean up
    // No file to delete since QR code is generated in memory
  } catch (error) {
    await ctx.reply("Error generating ticket. Please contact support.");
  }
});

// View bookings command
bot.command("bookings", async (ctx) => {
  try {
    const token = userCache.get(`${ctx.from.id}_token`);
    const bookings = await apiClient.booking.getUserBookings(
      ctx.from.id,
      token as string
    );

    if (bookings.data.length === 0) {
      await ctx.reply("You have no bookings.");
      return;
    }

    let bookingList = "Your Bookings:\n\n";
    (bookings.data as unknown as Booking[]).forEach((booking) => {
      const bus = booking.bus && booking.bus[0];
      const route = booking.routes && booking.routes[0];
      bookingList += `🎫 Booking ID: ${booking.bookingId}
  🚌 Bus: ${bus ? `${bus.busModel} (${bus.busNumber})` : "N/A"}
  🔢 Seat: ${booking.seatNumber}
  📍 Route: ${route ? `${route.origin} to ${route.destination}` : "N/A"}
  📅 Date: ${
    booking.bookingDate
      ? new Date(booking.bookingDate).toLocaleDateString()
      : "N/A"
  }
  💳 Payment: ${booking.paymentStatus === "completed" ? "Paid" : "Pending"}
  ✅ Status: ${booking.completed ? "Completed" : "Active"}

  `;
    });

    await ctx.reply(bookingList);
  } catch (error) {
    await ctx.reply("Error fetching bookings. Please try again.");
  }
});

// About command
bot.command("about", async (ctx) => {
  const aboutText = `About BookAM Transport 🚌

We are Nigeria's leading interstate transport company, providing safe and comfortable bus services across the country.

🌟 Our Services:
- Modern air-conditioned buses
- Professional drivers
- Real-time booking system
- Multiple routes daily
- 24/7 customer support

📞 Contact Us:
Phone: +234 XXX XXX XXXX
Email: support@bookam.com
Website: www.bookam.com

To book a trip, use /search`;

  await ctx.reply(aboutText);
});

// Review command
bot.command("review", async (ctx) => {
  await ctx.reply("Please share your experience with us:");
  userCache.set(`${ctx.from.id}_state`, "awaiting_review");
});

// Handle review submission
bot.on(message("text"), async (ctx) => {
  const state = userCache.get(`${ctx.from.id}_state`);

  if (state === "awaiting_review") {
    try {
      // Forward review to admin
      await bot.telegram.sendMessage(
        process.env.ADMIN_CHAT_ID!,
        `New Review:
From: @${ctx.from.username || "Anonymous"}
Date: ${new Date().toLocaleDateString()}

${ctx.message.text}`
      );

      await ctx.reply("Thank you for your review! We value your feedback.");
      userCache.del(`${ctx.from.id}_state`);
    } catch (error) {
      await ctx.reply("Error submitting review. Please try again.");
    }
  }
});

// Help command
bot.command("help", async (ctx) => {
  const helpText = `Available Commands:

/start - Start the bot
/login - Login to your account
/register - Create new account
/search - Search for routes
/bookings - View your bookings
/about - Learn about us
/review - Leave a review
/help - Show this help message

Need assistance? Contact support@bookam.com`;

  await ctx.reply(helpText);
});

// Error handling
bot.catch((err: any) => {
  console.error("Bot error:", err);
});

// // Start bot
// bot.launch();

// // Enable graceful stop
// process.once("SIGINT", () => bot.stop("SIGINT"));
// process.once("SIGTERM", () => bot.stop("SIGTERM"));
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  try {
    if (request.method === "POST") {
      await bot.handleUpdate(request.body);
      response.status(200).json({ ok: true });
    } else if (request.method === "GET") {
      // For verifying webhook
      await bot.telegram.setWebhook(WEBHOOK_URL);
      response.status(200).json({
        ok: true,
        message: "Webhook set",
        webhook_url: WEBHOOK_URL,
      });
    } else {
      response.status(405).json({ ok: false, message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    response.status(500).json({ ok: false, error: String(error) });
  }
}