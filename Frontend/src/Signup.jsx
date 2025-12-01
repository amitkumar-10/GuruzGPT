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
  const [loading, setLoading] = useState(false); 

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 
    try {
      console.log("Sending signup request with formData:", formData);
      const response = await axios.post(
       "http://localhost:8080/api/signup",
        //"https://guruzgpt.onrender.com/api/signup",
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
      const msg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Signup failed. Please try again.";
      console.error("Signup error:", error.message, error.response?.data);
      toast.error(msg);

      setTimeout(() => {
        setLoading(false); // stop loading on failure
        navigate("/login"); // Optional redirect
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300 px-4">
      {/* Title outside the card */}
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 font-syne">
        Welcome to GuruzGPT
      </h2>

      {/* Sign Up Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <h3 className="text-xl sm:text-2xl font-semibold text-center mb-6">
          Create Account
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3 sm:px-4 py-2 border rounded-lg text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg transition text-sm sm:text-base ${
              loading
                ? "bg-gray-600 text-white cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-800"
            }`}
          >
            {loading ? "Sign Up..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-5 sm:mt-6 text-xs sm:text-sm text-gray-500">
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
