import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Slideshow from "../components/shop/Slideshow";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        // Handle nested data structure from API
        const productData =
          response.data?.data?.products || response.data?.data || [];
        setProducts(Array.isArray(productData) ? productData : []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Error fetching products");
        setProducts([]);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = [
    "all",
    "Phone Cases",
    "Chargers",
    "Screen Protectors",
    "Power Banks",
    "Laptop Accessories",
    "Batteries",
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter(
          (product) =>
            product?.category?.name?.toLowerCase() ===
            selectedCategory.toLowerCase(),
        );

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
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section with Slideshow */}
      <Slideshow />

      {/* Categories */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors
                                ${
                                  selectedCategory === category
                                    ? "bg-blue-600 text-white"
                                    : "bg-white text-gray-700 hover:bg-gray-100"
                                }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts && filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Link
                to={`/products/${product._id}`}
                key={product._id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
              >
                <div className="relative pb-[100%]">
                  <img
                    src={product.images?.[0] || "/placeholder-image.jpg"}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {/* Discount Badge */}
                  {product.discount > 0 && (
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                        {product.discount}% OFF
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    {product.name}
                  </h2>
                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {product.discount > 0 ? (
                        <>
                          <span className="text-xl font-bold text-blue-600">
                            $
                            {(
                              product.price *
                              (1 - product.discount / 100)
                            ).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-500 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-blue-600">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500">
                      {product.stock} in stock
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-4">No products found</p>
                <p className="text-gray-400">
                  {selectedCategory !== "all"
                    ? `No products available in ${selectedCategory} category`
                    : "Try adjusting your filters"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
