import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        search: '',
        sort: 'newest',
        page: 1
    });

    useEffect(() => {
        fetchProducts();
    }, [filters]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/products', { params: filters });
            // Handle both possible response structures
            const productsData = response.data.data || response.data;
            setProducts(Array.isArray(productsData) ? productsData : []);
            setError(null);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err.response?.data?.message || 'Error fetching products');
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 p-4">
                {error}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="text-center text-gray-500 p-4">
                No products found
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(product => (
                    <Link 
                        key={product._id} 
                        to={`/products/${product._id}`}
                        className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        <div className="relative h-48">
                            <img 
                                src={product.images?.[0] || '/placeholder.png'} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/placeholder.png';
                                }}
                            />
                            {product.discount > 0 && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded">
                                    {product.discount}% OFF
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="text-lg font-semibold line-clamp-2">{product.name}</h3>
                            <div className="mt-2 flex items-center justify-between">
                                <div>
                                    {product.discount > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-red-500 font-semibold">
                                                ${(product.price * (1 - product.discount / 100)).toFixed(2)}
                                            </span>
                                            <span className="text-gray-400 line-through text-sm">
                                                ${product.price.toFixed(2)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="font-semibold">${product.price.toFixed(2)}</span>
                                    )}
                                </div>
                                {product.ratings?.average > 0 && (
                                    <div className="flex items-center">
                                        <span className="text-yellow-400">★</span>
                                        <span className="ml-1 text-sm text-gray-600">
                                            {product.ratings.average.toFixed(1)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                                {product.stock > 0 ? (
                                    <span className="text-green-500">In Stock</span>
                                ) : (
                                    <span className="text-red-500">Out of Stock</span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default ProductList; 