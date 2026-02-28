import React, { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { productsClient } from '../Apolloclient';

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      nodes {
        id
        name
        description
        price
        size
        stock
        discount
        imageUrl
        brandId
        categoryId
        genderId
      }
    }
  }
`;

const GET_BRANDS = gql`
  query GetBrands {
    brands {
      id
      name
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct(
    $id: String!
    $name: String
    $description: String
    $price: Decimal
    $discount: Int
    $stock: Int
    $size: Int
    $brandId: Int
    $genderId: Int
  ) {
    updateProduct(
      id: $id
      name: $name
      description: $description
      price: $price
      discount: $discount
      stock: $stock
      size: $size
      brandId: $brandId
      genderId: $genderId
    ) {
      success
      message
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id) {
      success
      message
    }
  }
`;

const List = () => {
  const [filteredList, setFilteredList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [updatedProduct, setUpdatedProduct] = useState({
    id: '', name: '', description: '', price: '',
    size: '', stock: '', discount: '', brandId: '', genderId: '',
  });

  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS, { client: productsClient });
  const { data: brandsData } = useQuery(GET_BRANDS, { client: productsClient });
  const [updateProduct] = useMutation(UPDATE_PRODUCT, { client: productsClient });
  const [deleteProduct] = useMutation(DELETE_PRODUCT, { client: productsClient });

  useEffect(() => {
    if (data?.products?.nodes) {
      setFilteredList(data.products.nodes);
    }
  }, [data]);

  const removeProduct = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await deleteProduct({ variables: { id: productId } });
      if (res.data.deleteProduct.success) {
        refetch();
      } else {
        alert(res.data.deleteProduct.message);
      }
    } catch (error) {
      alert('Failed to delete product.');
    }
  };

  const handleEditClick = (item) => {
    if (selectedProduct?.id === item.id) {
      setSelectedProduct(null);
    } else {
      setSelectedProduct(item);
      setUpdatedProduct({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        size: item.size,
        stock: item.stock,
        discount: item.discount,
        brandId: item.brandId,
        genderId: item.genderId,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProduct = async () => {
    try {
      const res = await updateProduct({
        variables: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          description: updatedProduct.description,
          price: parseFloat(updatedProduct.price),
          discount: parseInt(updatedProduct.discount),
          stock: parseInt(updatedProduct.stock),
          size: parseInt(updatedProduct.size),
          brandId: parseInt(updatedProduct.brandId),
          genderId: parseInt(updatedProduct.genderId),
        },
      });
      if (res.data.updateProduct.success) {
        setSelectedProduct(null);
        refetch();
      } else {
        alert(res.data.updateProduct.message);
      }
    } catch (error) {
      alert('Failed to update product.');
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const all = data?.products?.nodes ?? [];
    setFilteredList(term ? all.filter((item) => item.name?.toLowerCase().startsWith(term)) : all);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <svg className="animate-spin h-8 w-8 text-pink-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );

  if (error) return <div className="p-8 text-red-500">Error: {error.message}</div>;

  return (
    <div className="p-4 sm:p-8 w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">All Products</h2>

      <input
        type="text" value={searchTerm} onChange={handleSearch}
        placeholder="Search by name..."
        className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-pink-400"
      />

      {/* Desktop table header */}
      <div className="hidden md:grid grid-cols-[60px_1fr_80px_80px_80px_80px_100px] gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 uppercase mb-2">
        <span>Image</span>
        <span>Name</span>
        <span>Price</span>
        <span>Size</span>
        <span>Stock</span>
        <span>Discount</span>
        <span>Actions</span>
      </div>

      {filteredList.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No products found.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredList.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">

              {/* Desktop row */}
              <div className="hidden md:grid grid-cols-[60px_1fr_80px_80px_80px_80px_100px] gap-3 px-4 py-3 items-center text-sm text-gray-700">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
                <span className="font-medium">{item.name}</span>
                <span>${item.price}</span>
                <span>{item.size}ml</span>
                <span>{item.stock}</span>
                <span>{item.discount}%</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="px-3 py-1 text-xs bg-pink-50 text-pink-600 border border-pink-200 rounded-lg hover:bg-pink-100 transition"
                  >
                    {selectedProduct?.id === item.id ? 'Close' : 'Edit'}
                  </button>
                  <button
                    onClick={() => removeProduct(item.id)}
                    className="px-3 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-100 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Mobile card */}
              <div className="md:hidden p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                    <p className="text-pink-600 font-bold text-sm">${item.price}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500">{item.size}ml</span>
                      <span className="text-xs text-gray-500">Stock: {item.stock}</span>
                      {item.discount > 0 && (
                        <span className="text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full">-{item.discount}%</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="px-3 py-1 text-xs bg-pink-50 text-pink-600 border border-pink-200 rounded-lg hover:bg-pink-100 transition"
                    >
                      {selectedProduct?.id === item.id ? 'Close' : 'Edit'}
                    </button>
                    <button
                      onClick={() => removeProduct(item.id)}
                      className="px-3 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Edit form - shared for both mobile and desktop */}
              {selectedProduct?.id === item.id && (
                <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Edit Product</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Name</label>
                      <input type="text" name="name" value={updatedProduct.name} onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Price ($)</label>
                      <input type="number" name="price" value={updatedProduct.price} onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Size (ml)</label>
                      <input type="number" name="size" value={updatedProduct.size} onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Stock</label>
                      <input type="number" name="stock" value={updatedProduct.stock} onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Discount (%)</label>
                      <input type="number" name="discount" value={updatedProduct.discount} onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Brand</label>
                      <select name="brandId" value={updatedProduct.brandId} onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white">
                        <option value="">Select brand</option>
                        {brandsData?.brands?.map((brand) => (
                          <option key={brand.id} value={brand.id}>{brand.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-500">Gender</label>
                      <select name="genderId" value={updatedProduct.genderId} onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white">
                        <option value="">Select</option>
                        <option value="1">Female</option>
                        <option value="2">Male</option>
                        <option value="3">Unisex</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 sm:col-span-2">
                      <label className="text-xs text-gray-500">Description</label>
                      <textarea name="description" value={updatedProduct.description} onChange={handleInputChange}
                        rows={3}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none" />
                    </div>
                  </div>
                  <button
                    onClick={handleUpdateProduct}
                    className="mt-4 w-full bg-pink-600 text-white py-2 rounded-xl hover:bg-pink-700 transition text-sm font-medium"
                  >
                    Update Product
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default List;