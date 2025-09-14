import React, { useState, useContext } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "./UserContext.jsx";

const Signup = () => {
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log("Sending signup request with formData:", formData);
      const response = await axios.post(
        "https://guruzgpt.onrender.com/api/signup",
        formData,
        { withCredentials: true }
      );
      console.log("Signup response:", response.data);
      localStorage.setItem("token", response.data.token);
     
      setUser(response.data.user);
      toast.success(response.data.message || "Signup successful");
      setTimeout(() => {
        navigate("/"); // Navigate to home page
      }, 2000);
    } catch (error) {
      const msg = error?.response?.data?.error || error?.response?.data?.message || "Signup failed. Please try again.";
      console.error("Signup error:", error.message, error.response?.data);
      toast.error(msg);
      // Optionally navigate to login if signup fails
      setTimeout(() => {
        console.log("Navigating to login after signup failure");
        navigate("/login");
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-6">Create Account</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-black font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>

      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};


export default Signup;
