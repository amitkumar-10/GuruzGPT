import "dotenv/config";
import express from "express";
import getGeminiAPIResponse from "../utils/gemini.js";
import ThreadModel from "../models/Thread.js";
import jwt from "jsonwebtoken";
import { z } from "zod";
import bcrypt from "bcrypt";
import UserModel from "../models/User.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { v4 as uuidv4 } from "uuid"; 


// Validate environment variables
if (!process.env.JWT_SECRET) {
  console.error("Fatal: JWT_SECRET environment variable is not defined");
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("Fatal: GEMINI_API_KEY environment variable is not defined");
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

// Validation schema for /chat endpoint
const chatSchema = z.object({
  message: z.string().min(1, { message: "Message is required" }).max(1000, { message: "Message too long" }),
  threadId: z.string().uuid({ message: "Invalid threadId format" }).optional(),
});

// Validation schema for signup/login
const userSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(50),
  name: z.string().min(3, { message: "Name must be at least 3 characters" }).max(50).optional(),
});

// Test endpoint
router.post("/test", authMiddleware, async (req, res) => {
  try {
    const thread = new ThreadModel({
      threadId: uuidv4(),
      userId: req.user.id,
      title: "Testing New Thread",
    });
    const response = await thread.save();
    res.json(response);
  } catch (err) {
    console.error("Test endpoint error:", err.message, err.stack);
    res.status(500).json({ error: "Failed to save in DB", details: err.message });
  }
});

router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id).select("email"); // Assuming JWT payload has user ID
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ email: user.email });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all threads
router.get("/thread", authMiddleware, async (req, res) => {
  try {
    const threads = await ThreadModel.find({ userId: req.user.id }).select("threadId title messages");
    
    res.json(threads);
  } catch (err) {
    console.error("Error fetching threads:", err.message, err.stack);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// Get thread messages
router.get("/thread/:threadId", authMiddleware, async (req, res) => {
  try {
      const thread = await ThreadModel.findOne({
      threadId: req.params.threadId,
      userId: req.user.id,
    }).select("messages");
    if (!thread) {
      console.log("Thread not found:", req.params.threadId);
      return res.status(404).json({ error: "Thread not found" });
    }
 
    res.json(thread.messages || []);
  } catch (err) {
    console.error("Error fetching thread:", err.message, err.stack);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// Chat endpoint with Gemini API integration
router.post("/chat", authMiddleware, async (req, res) => {
  try {
    // Validate input
    const result = chatSchema.safeParse(req.body);
    if (!result.success) {
      console.error("Validation error:", result.error.format());
      return res.status(400).json({ error: "Invalid input", errors: result.error.format() });
    }

    const { message, threadId = uuidv4() } = result.data;
   
    // Fetch response from Gemini API
    const assistantReply = await getGeminiAPIResponse(message);
    if (assistantReply.startsWith("Gemini API Error") || assistantReply.startsWith("Failed to connect")) {
      console.error("Gemini API failed:", assistantReply);
      return res.status(500).json({ error: "Failed to get response from AI", details: assistantReply });
    }

    // Find or create thread
    let thread = await ThreadModel.findOne({
      threadId,
      userId: req.user.id,
    });

    if (!thread) {
      
      thread = await ThreadModel.create({
        userId: req.user.id,
        threadId,
        title: message.slice(0, 50),
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: assistantReply },
        ],
      });
    } else {
      
      thread.messages.push(
        { role: "user", content: message },
        { role: "assistant", content: assistantReply }
      );
      await thread.save();
    }

    console.log("Thread saved:", thread);
    res.json({ reply: assistantReply });
  } catch (err) {
    console.error("Error saving chat:", err.message, err.stack);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// Delete thread
router.delete("/thread/:threadId", authMiddleware, async (req, res) => {
  try {
      const result = await ThreadModel.deleteOne({
      threadId: req.params.threadId,
      userId: req.user.id,
    });
    if (result.deletedCount === 0) {
      console.log("Thread not found:", req.params.threadId);
      return res.status(404).json({ error: "Thread not found" });
    }
    
    res.status(200).json({ message: "Thread deleted successfully" });
  } catch (err) {
    console.error("Error deleting thread:", err.message, err.stack);
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});

// Signup
router.post("/signup", async (req, res) => {
  const schema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z.string().min(3, { message: "Password must be at least 3 characters" }).max(50),
    name: z.string().min(3, { message: "Name must be at least 3 characters" }).max(50),
  });

  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
     
      return res.status(400).json({ message: "Invalid input", errors: result.error.format() });
    }

    const { email, password, name } = req.body;

    const userExists = await UserModel.findOne({ email });
    if (userExists) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Creating new user with email:", email);
    const newUser = await UserModel.create({ email, password: hashedPassword, name });
    
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is undefined in signup route");
      throw new Error("JWT_SECRET is not defined");
    }

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "2h" });
    
    res.status(201).json({
      message: "Signup successful",
      token,
      user: { id: newUser._id, email: newUser.email, name: newUser.name },
    });
  } catch (err) {
    console.error("Signup error:", err.message, err.stack);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});
// Login
router.post("/login", async (req, res) => {
  const schema = z.object({
    email: z.string().email({ message: "Invalid email format" }),
    password: z.string().min(3, { message: "Password must be at least 3 characters" }).max(50),
  });

  // console.log("Login request body:", req.body);
  // console.log("JWT_SECRET in login route:", process.env.JWT_SECRET);

  try {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      console.error("Validation error:", result.error.format());
      return res.status(400).json({ message: "Invalid input", errors: result.error.format() });
    }

    const { email, password } = req.body;

    // console.log("Checking for user with email:", email);
    const user = await UserModel.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // console.log("Comparing password for:", email);
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password for:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is undefined in login route");
      throw new Error("JWT_SECRET is not defined");
    }
    // console.log("Generating JWT for user:", user._id);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
    // console.log("JWT generated:", token);

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Login error:", err.message, err.stack);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
});

router.post("/auth/logout", (req, res) => {
  console.log("Logout request received");
  // For JWT, no server-side session to invalidate
  res.status(200).json({ message: "Logout successful" });
});




export default router;




