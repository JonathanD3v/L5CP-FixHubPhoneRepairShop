import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const POSInterface = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product._id === product._id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1, price: product.price }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.product._id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    try {
      const orderData = {
        items: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMethod: 'cash' // This should be selected by user
      };

      await api.post('/orders', orderData);
      setCart([]);
      // Show success message
    } catch (error) {
      console.error('Error creating order:', error);
      // Show error message
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex h-screen">
      {/* Product Grid */}
      <div className="w-2/3 p-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-4">
          {products.map(product => (
            <div
              key={product._id}
              className="p-4 border rounded cursor-pointer hover:bg-gray-50"
              onClick={() => addToCart(product)}
            >
              <h3 className="font-bold">{product.name}</h3>
              <p className="text-gray-600">${product.price}</p>
              <p className="text-sm text-gray-500">Stock: {product.stock}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="w-1/3 p-4 border-l">
        <h2 className="text-xl font-bold mb-4">Current Order</h2>
        {cart.map(item => (
          <div key={item.product._id} className="flex justify-between items-center mb-2">
            <div>
              <h3 className="font-bold">{item.product.name}</h3>
              <p className="text-gray-600">${item.price}</p>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                className="px-2 py-1 border rounded"
              >
                -
              </button>
              <span className="mx-2">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                className="px-2 py-1 border rounded"
              >
                +
              </button>
              <button
                onClick={() => removeFromCart(item.product._id)}
                className="ml-2 text-red-500"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <div className="mt-4 border-t pt-4">
          <div className="flex justify-between font-bold">
            <span>Total:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full mt-4 bg-blue-500 text-white py-2 rounded disabled:bg-gray-300"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSInterface;
