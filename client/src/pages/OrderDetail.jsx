import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/formatters";

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!user) {
        setError("Please login to view order details");
        setLoading(false);
        return;
      }

      try {
        // Validate order ID format
        if (!id || id.length !== 24) {
          setError("Invalid order ID format");
          setLoading(false);
          return;
        }

        const response = await api.get(`/orders/${id}`);

        if (response.data) {
          setOrder(response.data);
        } else {
          setError("Invalid order data received");
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.error || "Error loading order details");
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, user]);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Order not found</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <Link
            to="/orders"
            className="text-blue-600 hover:text-blue-700 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Orders
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Order Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{order._id.slice(-6).toUpperCase()}
                </h1>
                <p className="text-gray-500 mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  order.status || order.orderStatus,
                )}`}
              >
                {order.status || order.orderStatus}
              </span>
            </div>
          </div>

          {/* Order Items */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center py-4 border-b last:border-b-0"
                >
                  <img
                    src={getImageUrl(item.product.images[0])}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="ml-6 flex-grow">
                    <Link
                      to={`/products/${item.product._id}`}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-gray-500 text-sm mt-1">
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${item.product.price.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Summary
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">
                  $
                  {(
                    order.subtotal ||
                    order.total ||
                    order.totalAmount ||
                    0
                  ).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium">Free</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-semibold text-blue-600">
                    ${(order.total || order.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="p-6 border-t">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Shipping Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Shipping Address
                </h3>
                <p className="mt-2 text-gray-900">
                  {(order.shippingAddress || order.customerAddress || {})
                    .street || "N/A"}
                  <br />
                  {(order.shippingAddress || order.customerAddress || {})
                    .city || ""}
                  <br />
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Contact Information
                </h3>
                <p className="mt-2 text-gray-900">
                  {order.customerName ||
                    (order.shippingAddress || {}).name ||
                    ""}
                  <br />
                  {order.customerEmail ||
                    (order.shippingAddress || {}).email ||
                    ""}
                  <br />
                  {order.customerPhone ||
                    (order.shippingAddress || {}).phone ||
                    ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
