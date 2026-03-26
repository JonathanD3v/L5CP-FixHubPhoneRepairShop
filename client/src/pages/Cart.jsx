import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Cart = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCart();
    }, []);

    const fetchCart = async () => {
        try {
            const response = await api.get('/cart');
            setCartItems(response.data.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching cart:', err);
            setError('Error loading cart');
            setLoading(false);
        }
    };

    const updateQuantity = async (productId, newQuantity) => {
        try {
            await api.put(`/cart/${productId}`, { quantity: newQuantity });
            fetchCart();
        } catch (err) {
            console.error('Error updating quantity:', err);
            setError('Error updating quantity');
        }
    };

    const removeItem = async (productId) => {
        try {
            await api.delete(`/cart/${productId}`);
            fetchCart();
        } catch (err) {
            console.error('Error removing item:', err);
            setError('Error removing item');
        }
    };

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);
    };

    const handleCheckout = async () => {
        try {
            const response = await api.post('/orders', {
                items: cartItems.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity
                }))
            });
            navigate(`/orders/${response.data.data._id}`);
        } catch (err) {
            console.error('Error creating order:', err);
            setError('Error creating order');
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

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

                {cartItems.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <p className="text-gray-500 mb-4">Your cart is empty</p>
                        <Link
                            to="/"
                            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-2 space-y-4">
                            {cartItems.map((item) => (
                                <div
                                    key={item._id}
                                    className="bg-white rounded-xl shadow-sm p-6 flex items-center"
                                >
                                    <img
                                        src={item.product.images[0] || '/placeholder-image.jpg'}
                                        alt={item.product.name}
                                        className="w-24 h-24 object-cover rounded-lg"
                                    />
                                    <div className="ml-6 flex-grow">
                                        <Link
                                            to={`/products/${item.product._id}`}
                                            className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                                        >
                                            {item.product.name}
                                        </Link>
                                        <p className="text-gray-500 text-sm mt-1">
                                            ${item.product.price.toFixed(2)}
                                        </p>
                                        <div className="flex items-center mt-4">
                                            <button
                                                onClick={() => updateQuantity(item.product._id, Math.max(1, item.quantity - 1))}
                                                className="px-2 py-1 border rounded-l"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value);
                                                    if (value > 0 && value <= item.product.stock) {
                                                        updateQuantity(item.product._id, value);
                                                    }
                                                }}
                                                className="w-16 text-center border-t border-b"
                                                min="1"
                                                max={item.product.stock}
                                            />
                                            <button
                                                onClick={() => updateQuantity(item.product._id, Math.min(item.product.stock, item.quantity + 1))}
                                                className="px-2 py-1 border rounded-r"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.product._id)}
                                                className="ml-4 text-red-500 hover:text-red-700"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    <div className="ml-6 text-right">
                                        <p className="text-lg font-semibold text-gray-900">
                                            ${(item.product.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                    Order Summary
                                </h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Subtotal</span>
                                        <span className="font-semibold">
                                            ${calculateSubtotal().toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Shipping</span>
                                        <span className="font-semibold">Free</span>
                                    </div>
                                    <div className="border-t pt-4">
                                        <div className="flex justify-between">
                                            <span className="text-lg font-semibold">Total</span>
                                            <span className="text-lg font-semibold text-blue-600">
                                                ${calculateSubtotal().toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Proceed to Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart; 