import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Cart = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
        setCart(savedCart);
        setLoading(false);
    }, []);

    const updateQuantity = (productId, newQuantity) => {
        const updatedCart = cart.map(item => 
            item.product._id === productId 
                ? { ...item, quantity: newQuantity }
                : item
        );
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    const removeItem = (productId) => {
        const updatedCart = cart.filter(item => item.product._id !== productId);
        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => 
            total + (item.product.price * item.quantity), 0
        );
    };

    const proceedToCheckout = () => {
        if (!user) {
            navigate('/login');
            return;
        }
        navigate('/checkout');
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
            
            {cart.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">Your cart is empty</p>
                    <button 
                        onClick={() => navigate('/products')}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Continue Shopping
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        {cart.map(item => (
                            <div key={item.product._id} className="flex items-center space-x-4 py-4 border-b">
                                <img 
                                    src={item.product.image} 
                                    alt={item.product.name}
                                    className="w-24 h-24 object-cover rounded"
                                />
                                <div className="flex-1">
                                    <h3 className="font-semibold">{item.product.name}</h3>
                                    <p className="text-gray-600">${item.product.price}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button 
                                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                        className="px-2 py-1 border rounded"
                                    >
                                        -
                                    </button>
                                    <span>{item.quantity}</span>
                                    <button 
                                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                                        className="px-2 py-1 border rounded"
                                    >
                                        +
                                    </button>
                                </div>
                                <button 
                                    onClick={() => removeItem(item.product._id)}
                                    className="text-red-500"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${calculateTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>$10.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax</span>
                                <span>${(calculateTotal() * 0.1).toFixed(2)}</span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span>
                                        ${(calculateTotal() + 10 + calculateTotal() * 0.1).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <button
                            onClick={proceedToCheckout}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cart; 