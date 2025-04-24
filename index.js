const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const MONGODB_URI = "mongodb://127.0.0.1:27017/FitnessClub";

// Setup
const app = express();
const PORT = 6000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.log("❌ MongoDB connection error:", err));

// User Schema & Model
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", UserSchema);

// Payment Schema & Model
const PaymentSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  number: String,
  plan: String,
  amount: Number,
  date: {
    type: String,
    default: () => new Date().toLocaleDateString("en-GB"),
  },
  time: {
    type: String,
    default: () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
  },
});

const PaymentModel = mongoose.model("Payment", PaymentSchema);

const contactSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  number: String,
  date: {
    type: String,
    default: () => new Date().toLocaleDateString("en-GB"), // e.g., "16/04/2025"
  },
  time: {
    type: String,
    default: () =>
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }), // e.g., "08:15 PM"
  },
});

const Contact = mongoose.model("Contact", contactSchema);

app.get("/popup", async (req, res) => {
  res.status(200).json({ msg: "hello this my frist api" });
});
// 🔐 Signup Route
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const newUser = new User({
      name,
      email,
      password,
    });

    await newUser.save();
    res.status(201).json({ message: "Signup successful!" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// 🔑 Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password }).select("-password"); // Exclude password from response
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ message: "Login successful!", user });
    console.log(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 💳 Payment Route (with update logic)
app.post("/api/payment", async (req, res) => {
  const { firstName, lastName, email, number, plan, amount, userId } = req.body;

  try {
    // Check if user already has a plan
    const existingUser = await PaymentModel.findById(userId);

    if (existingUser) {
      // Update existing payment
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.email = email;
      existingUser.number = number;
      existingUser.plan = plan;
      existingUser.amount = amount;

      await existingUser.save();

      res.status(200).json({ message: "Payment updated successfully!" });
    } else {
      // Create a new payment record
      const newPayment = new PaymentModel({
        _id: userId,
        firstName,
        lastName,
        email,
        number,
        plan,
        amount,
      });

      await newPayment.save();
      res.status(201).json({ message: "Payment successful!" });
    }
  } catch (error) {
    console.error("Payment save error:", error);
    res.status(500).json({ message: "Error saving data" });
  }
});

// 👮 Admin login
app.post("/api/admin-login", (req, res) => {
  const { username, password } = req.body;

  // 🔒 Static admin credentials (can also be fetched from DB)
  const adminUsername = "admin";
  const adminPassword = "admin123";

  if (username === adminUsername && password === adminPassword) {
    res.status(200).json({ message: "Admin logged in successfully!" });
  } else {
    res.status(401).json({ message: "Invalid admin credentials" });
  }
});

// 🧾 Get All Payments (Admin)
app.get("/api/payment", async (req, res) => {
  try {
    const payments = await PaymentModel.find();
    res.status(200).json(payments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching payments" });
  }
});

app.post("/api/contact", async (req, res) => {
  const { firstName, lastName, email, number } = req.body;

  try {
    const newContact = new Contact({ firstName, lastName, email, number });
    await newContact.save();
    res.status(201).json({ message: "Contact form submitted successfully!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/contact", async (req, res) => {
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (err) {
    console.error("Error fetching contact submissions:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/userPlan/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const plan = await PaymentModel.findById(userId); // ✅ this works with _id

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
