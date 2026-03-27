import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import { getImageUrl } from "../../utils/formatters";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      setError("Error fetching product");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = () => {
    // Implement cart functionality
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item.product._id === product._id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          image: product.images[0],
        },
        quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    navigate("/cart");
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <img
            src={getImageUrl(product.images[0])}
            alt={product.name}
            className="w-full h-96 object-cover rounded-lg"
          />
          <div className="grid grid-cols-4 gap-2">
            {product.images.slice(1).map((image, index) => (
              <img
                key={index}
                src={getImageUrl(image)}
                alt={`${product.name} ${index + 2}`}
                className="w-full h-24 object-cover rounded-lg cursor-pointer"
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-gray-600">{product.description}</p>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold">${product.price}</span>
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="ml-1">{product.averageRating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-1 border rounded"
            >
              -
            </button>
            <span>{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="px-3 py-1 border rounded"
            >
              +
            </button>
          </div>

          <button
            onClick={addToCart}
            disabled={!product.stock}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {product.stock ? "Add to Cart" : "Out of Stock"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
