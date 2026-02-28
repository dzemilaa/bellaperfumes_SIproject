import React, { useState, useRef } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { productsClient } from '../Apolloclient';

const GET_BRANDS = gql`
  query GetBrands {
    brands {
      id
      name
    }
  }
`;

const ADD_BRAND = gql`
  mutation AddBrand($name: String!) {
    addBrand(name: $name) {
      success
      message
      brand {
        id
        name
      }
    }
  }
`;

const ADD_PRODUCT = gql`
  mutation AddProduct(
    $name: String!
    $description: String
    $price: Decimal!
    $discount: Int!
    $stock: Int!
    $brandId: Int!
    $genderId: Int!
    $size: Int!
    $imageUrl: String
  ) {
    addProduct(
      name: $name
      description: $description
      price: $price
      discount: $discount
      stock: $stock
      brandId: $brandId
      genderId: $genderId
      size: $size
      imageUrl: $imageUrl
    ) {
      success
      message
      product { id name }
    }
  }
`;

const PRODUCT_SERVICE_URL = "https://productservice-production-c2fd.up.railway.app";

const Add = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [showNewBrand, setShowNewBrand] = useState(false);
  const formRef = useRef();
  const [data, setData] = useState({
    name: "", description: "", price: "", size: "",
    brandId: "", genderId: "", discount: "", stock: "",
  });

  const { data: brandsData, refetch: refetchBrands } = useQuery(GET_BRANDS, { client: productsClient });
  const [addBrand] = useMutation(ADD_BRAND, { client: productsClient });
  const [addProduct] = useMutation(ADD_PRODUCT, { client: productsClient });

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return alert("Brand name is required.");
    try {
      const res = await addBrand({ variables: { name: newBrandName.trim() } });
      if (res.data.addBrand.success) {
        await refetchBrands();
        setData((prev) => ({ ...prev, brandId: String(res.data.addBrand.brand.id) }));
        setNewBrandName("");
        setShowNewBrand(false);
      } else {
        alert(res.data.addBrand.message);
      }
    } catch (err) {
      alert("Failed to add brand.");
    }
  };

  const uploadImage = async (imageFile) => {
    const formData = new FormData();
    formData.append("file", imageFile);
    const response = await fetch(`${PRODUCT_SERVICE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Image upload failed.");
    const result = await response.json();
    return result.imageUrl;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!data.name.trim()) return alert("Product name is required.");
    if (!data.price || isNaN(data.price)) return alert("Valid price is required.");
    if (!data.brandId) return alert("Brand is required.");
    if (!data.genderId) return alert("Gender is required.");
    if (!image) return alert("Please upload an image.");
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(image.type)) return alert("Image must be JPG or PNG.");

    setLoading(true);
    try {
      const imageUrl = await uploadImage(image);
      const res = await addProduct({
        variables: {
          name: data.name,
          description: data.description,
          price: parseFloat(data.price),
          discount: parseInt(data.discount) || 0,
          stock: parseInt(data.stock) || 0,
          brandId: parseInt(data.brandId),
          genderId: parseInt(data.genderId),
          size: parseInt(data.size) || 0,
          imageUrl,
        },
      });
      if (res.data.addProduct.success) {
        alert("Product added successfully!");
        setData({ name: "", description: "", price: "", size: "", brandId: "", genderId: "", discount: "", stock: "" });
        setImage(null);
        if (formRef.current) formRef.current.reset();
      } else {
        alert(res.data.addProduct.message);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="p-4 sm:p-8 w-full max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Product</h2>

      <form ref={formRef} onSubmit={onSubmitHandler} className="flex flex-col gap-5">

        {/* Image upload */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">Product Image</label>
          <label htmlFor="image" className="cursor-pointer w-fit">
            <div className="w-28 h-28 sm:w-32 sm:h-32 border-2 border-dashed border-pink-300 rounded-xl flex items-center justify-center bg-pink-50 hover:bg-pink-100 transition overflow-hidden">
              {image ? (
                <img src={URL.createObjectURL(image)} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span className="text-4xl text-pink-300">+</span>
              )}
            </div>
          </label>
          <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Product Name</label>
          <input
            onChange={onChangeHandler} value={data.name} type="text" name="name"
            placeholder="e.g. Miss Dior Blooming Bouquet"
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-600">Description</label>
          <textarea
            onChange={onChangeHandler} value={data.description} name="description" rows={4}
            placeholder="Product description..."
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
          />
        </div>

        {/* Price, Size, Stock, Discount — 1 col on mobile, 2 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: "Price ($)", name: "price", placeholder: "e.g. 89.99" },
            { label: "Size (ml)", name: "size", placeholder: "e.g. 50" },
            { label: "Stock", name: "stock", placeholder: "e.g. 100" },
            { label: "Discount (%)", name: "discount", placeholder: "e.g. 10" },
          ].map((field) => (
            <div key={field.name} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-600">{field.label}</label>
              <input
                onChange={onChangeHandler} value={data[field.name]} type="number"
                name={field.name} placeholder={field.placeholder}
                className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
              />
            </div>
          ))}
        </div>

        {/* Brand, Gender — stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">

          {/* Brand */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Brand</label>
            <select
              onChange={onChangeHandler} value={data.brandId} name="brandId"
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
            >
              <option value="">Select brand</option>
              {brandsData?.brands?.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewBrand(!showNewBrand)}
              className="text-xs text-pink-600 hover:underline text-left mt-1"
            >
              {showNewBrand ? "Cancel" : "+ Add new brand"}
            </button>
            {showNewBrand && (
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Brand name"
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <button
                  type="button"
                  onClick={handleAddBrand}
                  className="px-3 py-1.5 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 transition"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Gender */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-600">Gender</label>
            <select
              onChange={onChangeHandler} value={data.genderId} name="genderId"
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
            >
              <option value="">Select</option>
              <option value="1">Female</option>
              <option value="2">Male</option>
              <option value="3">Unisex</option>
            </select>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="mt-2 bg-pink-600 text-white py-3 rounded-xl hover:bg-pink-700 transition font-medium disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Product'}
        </button>
      </form>
    </div>
  );
};

export default Add;