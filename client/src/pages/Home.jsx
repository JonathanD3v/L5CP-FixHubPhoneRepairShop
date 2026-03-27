import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Slideshow from "../components/shop/Slideshow";
import { getImageUrl } from "../utils/formatters";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        // Handle nested data structure from API
        const productData =
          response.data?.data?.products || response.data?.data || [];
        setProducts(Array.isArray(productData) ? productData : []);

        const categoryRes = await api.get("/categories");
        const categoryData =
          categoryRes.data?.data?.categories || categoryRes.data?.data || [];

        setCategories(Array.isArray(categoryData) ? categoryData : []);

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

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter(
          (product) => product?.category?._id === selectedCategory,
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
          {/* ALL BUTTON */}
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition
      ${
        selectedCategory === "all"
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-700 hover:bg-gray-100"
      }`}
          >
            All
          </button>

          {/* DYNAMIC CATEGORIES */}
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat._id)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition
        ${
          selectedCategory === cat._id
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
            >
              {cat.name}
            </button>
          ))}
          <div
            to="/services"
            className="px-6 py-2 rounded-full text-sm font-medium transition bg-white text-gray-700  hover:bg-gray-100"
          >
            Services
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts && filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <Link
                to={`/products/${product._id}`}
                key={product._id}
                className="group bg-white/80 backdrop-blur-md border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative pb-[100%] bg-gradient-to-br from-gray-100 to-gray-200">
                  <img
                    src={getImageUrl(product.images?.[0])}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Discount Badge */}
                  {product.discount > 0 && (
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-pink-500 text-white shadow">
                        {product.discount}% OFF
                      </span>
                    </div>
                  )}

                  {/* Stock Badge */}
                  {product.stock < 5 && (
                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-1 rounded-md text-xs bg-yellow-400 text-black font-medium">
                        Low Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Category */}
                  <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">
                    {product.category?.name}
                  </p>

                  {/* Name */}
                  <h2 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition mb-1">
                    {product.name}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                    {product.shortDescription || product.description}
                  </p>

                  {/* Price */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {product.discount > 0 ? (
                        <>
                          <span className="text-lg font-bold text-blue-600">
                            $
                            {(
                              product.price *
                              (1 - product.discount / 100)
                            ).toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-400 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <span className="text-lg font-bold text-blue-600">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock */}
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {product.stock} left
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-4">No products found</p>
                {/* <p className="text-gray-400">
                  {selectedCategory !== "all"
                    ? `No products available!`
                    : "Try adjusting your filters"}
                </p> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
