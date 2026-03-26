import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import {
  FiEdit2,
  FiUser,
  FiShoppingBag,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCamera,
  FiUser as FiName,
  FiGlobe,
  FiHome,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      city: "",
      state: "",
      country: "",
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          country: user.address?.country || "",
        },
      });
      setPreviewUrl(
        user.profileImage
          ? `${import.meta.env.VITE_SERVER_URL || ""}${user.profileImage}`
          : "",
      );
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/orders");
      const ordersData = response.data.data || response.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.response?.data?.message || "Error fetching orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("profileImage", file);

      const response = await api.put("/auth/profile/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        const userData = response.data.data;
        updateUser(userData);
        setPreviewUrl(
          `${import.meta.env.VITE_SERVER_URL || ""}${userData.profileImage}`,
        );
        setError(null);
        toast.success("Profile image updated successfully!");
      } else {
        throw new Error(response.data.message || "Error uploading image");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(err.response?.data?.message || "Error uploading image");
      toast.error(err.response?.data?.message || "Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put("/auth/profile", formData);

      if (response.data.status === "success") {
        updateUser(response.data.data);
        setError(null);
        toast.success("Profile updated successfully!");
      } else {
        throw new Error(response.data.message || "Error updating profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Error updating profile");
      toast.error(err.response?.data?.message || "Error updating profile");
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Please login to view your profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
              <div className="relative group">
                <div
                  className="w-32 h-32 rounded-full overflow-hidden cursor-pointer bg-gradient-to-br from-blue-100 to-purple-100"
                  onClick={handleImageClick}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder.png";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiUser className="w-16 h-16 text-blue-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FiCamera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
                {uploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold text-gray-900">
                  {user.name}
                </h1>
                <div className="mt-2 space-y-1">
                  <p className="text-gray-600 flex items-center justify-center md:justify-start">
                    <FiMail className="mr-2" /> {user.email}
                  </p>
                  <p className="text-gray-600 flex items-center justify-center md:justify-start">
                    <FiPhone className="mr-2" /> {user.phone}
                  </p>
                  <p className="text-gray-600 flex items-center justify-center md:justify-start">
                    <FiMapPin className="mr-2" /> {user.address?.city},{" "}
                    {user.address?.country}
                  </p>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Member since {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm mb-8">
            <div className="border-b">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-8 py-4 text-sm font-medium flex items-center ${
                    activeTab === "profile"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiUser className="mr-2" /> Profile
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-8 py-4 text-sm font-medium flex items-center ${
                    activeTab === "orders"
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <FiShoppingBag className="mr-2" /> Orders
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {activeTab === "profile" && (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal Information Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-red-500 to-purple-600 px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <FiUser className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">
                            Personal Information
                          </h3>
                        </div>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Full Name
                            </label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiName className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              </div>
                              <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white"
                                placeholder="Enter your full name"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email Address
                            </label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiMail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              </div>
                              <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white"
                                placeholder="Enter your email"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone Number
                            </label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiPhone className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                              </div>
                              <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white"
                                placeholder="Enter your phone number"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Address Information Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-600 to-red-600 px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-white/20 p-2 rounded-lg">
                            <FiMapPin className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-white">
                            Address Information
                          </h3>
                        </div>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Street Address
                            </label>
                            <div className="relative group">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiHome className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                              </div>
                              <input
                                type="text"
                                name="address.street"
                                value={formData.address.street}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white"
                                placeholder="Enter your street address"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                City
                              </label>
                              <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiMapPin className="h-5 w-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                                </div>
                                <input
                                  type="text"
                                  name="address.city"
                                  value={formData.address.city}
                                  onChange={handleInputChange}
                                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-gray-50/50 hover:bg-white focus:bg-white"
                                  placeholder="Enter city"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md"
                    >
                      <FiEdit2 className="w-5 h-5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              )}

              {activeTab === "orders" && (
                <div className="space-y-6">
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : error ? (
                    <div className="text-red-500">{error}</div>
                  ) : orders.length === 0 ? (
                    <div className="text-center text-gray-500">
                      No orders found
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order._id}
                          className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-lg">
                                Order #{order._id.slice(-6).toUpperCase()}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                                order.status,
                              )}`}
                            >
                              {order.status}
                            </span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Total</p>
                              <p className="font-medium">
                                ${order.total.toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Items</p>
                              <p className="font-medium">
                                {order.items.length} items
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
