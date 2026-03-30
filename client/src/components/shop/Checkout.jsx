import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    shippingAddress: {
      street: "",
      city: "",
    },
    paymentMethod: "card",
    paymentDetails: {
      cardHolder: "",
      cardNumber: "",
      expirationDate: "",
      cvv: "",
    },
  });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (savedCart.length === 0) {
      navigate("/cart");
      return;
    }
    setCart(savedCart);
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("shippingAddress.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          [field]: value,
        },
      }));
    } else if (name.startsWith("paymentDetails.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        paymentDetails: {
          ...prev.paymentDetails,
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        items: cart.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        })),
        shippingAddress: {
          street: formData.shippingAddress.street,
          city: formData.shippingAddress.city,
          name: formData.shippingAddress.name || "",
          email: formData.shippingAddress.email || "",
          phone: formData.shippingAddress.phone || "",
        },
        paymentMethod:
          formData.paymentMethod === "credit_card"
            ? "card"
            : formData.paymentMethod,
        paymentDetails:
          formData.paymentMethod === "credit_card" ||
          formData.paymentMethod === "card"
            ? {
                cardHolder: formData.paymentDetails.cardHolder,
                cardNumber: formData.paymentDetails.cardNumber,
                expirationDate: formData.paymentDetails.expirationDate,
                cvv: formData.paymentDetails.cvv,
              }
            : undefined,
      };

      await api.post("/orders", orderData);
      localStorage.removeItem("cart");
      navigate("/orders");
    } catch (err) {
      setError(err.response?.data?.error || "Error creating order");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
    const shipping = 10;
    const tax = subtotal * 0.1;
    return subtotal + shipping + tax;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            <div className="space-y-4">
              <input
                type="text"
                name="shippingAddress.street"
                placeholder="Street Address"
                value={formData.shippingAddress.street}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="shippingAddress.city"
                  placeholder="City"
                  value={formData.shippingAddress.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded"
              required
            >
              <option value="card">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="stripe">Stripe</option>
            </select>
          </div>

          {(formData.paymentMethod === "card" ||
            formData.paymentMethod === "credit_card") && (
            <div className="space-y-4">
              <input
                type="text"
                name="paymentDetails.cardHolder"
                placeholder="Cardholder Name"
                value={formData.paymentDetails.cardHolder}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded"
                required
              />
              <input
                type="text"
                name="paymentDetails.cardNumber"
                placeholder="Card Number"
                value={formData.paymentDetails.cardNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="paymentDetails.expirationDate"
                  placeholder="MM/YY"
                  value={formData.paymentDetails.expirationDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
                <input
                  type="text"
                  name="paymentDetails.cvv"
                  placeholder="CVV"
                  value={formData.paymentDetails.cvv}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded"
                  required
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          {cart.map((item) => (
            <div key={item.product._id} className="flex justify-between py-2">
              <span>
                {item.product.name} x {item.quantity}
              </span>
              <span>${(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Processing..." : "Place Order"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
