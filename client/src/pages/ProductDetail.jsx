import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { getImageUrl } from "../utils/formatters";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [shippingInfo, setShippingInfo] = useState({
    name: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    country: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentDetails, setPaymentDetails] = useState({
    cardHolder: "",
    cardNumber: "",
    expirationDate: "",
    cvv: "",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Error fetching product details");
        setLoading(false);
      }
    };

    const fetchUser = async () => {
      try {
        const response = await api.get("/auth/profile");
        setUser(response.data);
        if (response.data) {
          setShippingInfo({
            name: response.data.name || "",
            email: response.data.email || "",
            phone: response.data.phone || "",
            street: response.data.address?.street || "",
            city: response.data.address?.city || "",
            state: response.data.address?.state || "",
            country: response.data.address?.country || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        if (err.response?.status !== 401) {
          setError("Error fetching user details");
        }
      }
    };

    fetchProduct();
    fetchUser();
  }, [id]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= product.stock) {
      setQuantity(value);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePaymentMethodChange = (e) => {
    setPaymentMethod(e.target.value);
  };

  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const requiredFields = ["name", "email", "phone", "street", "city"];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!shippingInfo[field] || shippingInfo[field].trim() === "") {
        missingFields.push(field);
      }
    }

    if (paymentMethod === "card") {
      const requiredCardFields = [
        "cardHolder",
        "cardNumber",
        "expirationDate",
        "cvv",
      ];
      for (const field of requiredCardFields) {
        if (!paymentDetails[field] || paymentDetails[field].trim() === "") {
          missingFields.push(field);
        }
      }
    }

    if (missingFields.length > 0) {
      setError(
        `Please fill in the following required fields: ${missingFields.join(", ")}`,
      );
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    setShowModal(true);
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const orderData = {
        items: [
          {
            product: product._id,
            quantity: quantity,
            price: product.price,
          },
        ],
        shippingAddress: {
          ...shippingInfo,
          name: shippingInfo.name,
          email: shippingInfo.email,
          phone: shippingInfo.phone,
        },
        paymentMethod: paymentMethod === "credit_card" ? "card" : paymentMethod,
        paymentDetails: paymentMethod === "card" ? paymentDetails : undefined,
        subtotal: product.price * quantity,
        shippingCost: 0,
        tax: 0,
      };

      const response = await api.post("/orders", orderData);

      if (response.data && response.data._id) {
        navigate(`/orders/${response.data._id}`);
      } else if (
        response.data &&
        response.data.data &&
        response.data.data._id
      ) {
        navigate(`/orders/${response.data.data._id}`);
      } else {
        console.error("Invalid response format:", response.data);
        setError("Error creating order: Invalid response format");
      }
    } catch (err) {
      console.error("Error creating order:", err);
      setError(
        err.response?.data?.error || err.message || "Error creating order",
      );
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

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Product not found</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative pb-[100%] rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`relative pb-[100%] rounded-lg overflow-hidden border-2 
                                                ${selectedImage === index ? "border-blue-500" : "border-transparent"}`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${product.name} - ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.name}
                </h1>
                <p className="text-gray-500 mt-2">{product.category?.name}</p>
              </div>

              <div className="space-y-2">
                <p className="text-2xl font-bold text-blue-600">
                  ${product.price.toFixed(2)}
                </p>
                {product.discount > 0 && (
                  <p className="text-sm text-gray-500">
                    {product.discount}% off
                  </p>
                )}
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-600">{product.description}</p>
              </div>

              {/* Specifications */}
              {product.specifications &&
                Object.keys(product.specifications).length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-2">
                      Specifications
                    </h3>
                    <dl className="grid grid-cols-2 gap-2">
                      {Object.entries(product.specifications).map(
                        ([key, value]) => (
                          <div key={key}>
                            <dt className="text-sm text-gray-500">{key}</dt>
                            <dd className="text-sm font-medium">{value}</dd>
                          </div>
                        ),
                      )}
                    </dl>
                  </div>
                )}

              {/* Quantity and Order Button */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">
                    {product.stock} in stock
                  </span>
                  <div className="flex items-center space-x-2">
                    <label htmlFor="quantity" className="text-sm text-gray-500">
                      Quantity:
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      max={product.stock}
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="w-20 px-2 py-1 border rounded"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className={`w-full py-3 px-6 rounded-lg font-medium text-white
                                        ${
                                          product.stock === 0
                                            ? "bg-gray-400 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700"
                                        }`}
                >
                  {product.stock === 0 ? "Out of Stock" : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Complete Your Order
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Shipping Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Shipping Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={shippingInfo.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={shippingInfo.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={shippingInfo.street}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === "cash"}
                        onChange={handlePaymentMethodChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">
                          Cash on Delivery
                        </span>
                        <span className="block text-sm text-gray-500">
                          Pay when you receive your order
                        </span>
                      </div>
                    </label>
                    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === "card"}
                        onChange={handlePaymentMethodChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <span className="block text-sm font-medium text-gray-900">
                          Credit/Debit Card
                        </span>
                        <span className="block text-sm text-gray-500">
                          Pay securely with your card
                        </span>
                      </div>
                    </label>
                    {paymentMethod === "card" && (
                      <div className="mt-4 space-y-3">
                        <input
                          type="text"
                          name="cardHolder"
                          placeholder="Cardholder Name"
                          value={paymentDetails.cardHolder}
                          onChange={handlePaymentDetailsChange}
                          className="w-full px-4 py-2 border rounded"
                          required
                        />
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="Card Number"
                          value={paymentDetails.cardNumber}
                          onChange={handlePaymentDetailsChange}
                          className="w-full px-4 py-2 border rounded"
                          required
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <input
                            type="text"
                            name="expirationDate"
                            placeholder="MM/YY"
                            value={paymentDetails.expirationDate}
                            onChange={handlePaymentDetailsChange}
                            className="w-full px-4 py-2 border rounded"
                            required
                          />
                          <input
                            type="text"
                            name="cvv"
                            placeholder="CVV"
                            value={paymentDetails.cvv}
                            onChange={handlePaymentDetailsChange}
                            className="w-full px-4 py-2 border rounded"
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        ${(product.price * quantity).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">Free</span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">Total</span>
                        <span className="text-lg font-semibold text-blue-600">
                          ${(product.price * quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  className="w-full py-3 px-6 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Confirm Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
