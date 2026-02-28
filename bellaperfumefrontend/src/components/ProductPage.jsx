import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import { productsClient, shopClient, reviewClient, authClient } from '../apolloClient';
import { FaHeart } from 'react-icons/fa';
import { FiHeart } from 'react-icons/fi';

const GET_PRODUCT = gql`
  query GetProduct($id: UUID!) {
    products(where: { id: { eq: $id } }) {
      nodes {
        id
        name
        size
        price
        imageUrl
        description
        brands {
          id
          name
        }
      }
    }
  }
`;

const GET_FAVORITE = gql`
  query GetFavorite($userId: String!) {
    favorite(userId: $userId) {
      productId
    }
  }
`;

const ADD_TO_FAVORITE = gql`
  mutation AddToFavorite($userId: String!, $productId: String!) {
    addToFavorite(userId: $userId, productId: $productId) {
      success
      message
    }
  }
`;

const REMOVE_FROM_FAVORITE = gql`
  mutation RemoveFromFavorite($userId: String!, $productId: String!) {
    removeFromFavorite(userId: $userId, productId: $productId) {
      success
      message
    }
  }
`;

const ADD_TO_CART = gql`
  mutation AddToCart($userId: String!, $productId: String!, $quantity: Int!) {
    addToCart(userId: $userId, productId: $productId, quantity: $quantity) {
      success
      message
    }
  }
`;

const GET_REVIEWS = gql`
  query reviewsByProduct($productId: String!) {
    reviewsByProduct(productId: $productId) {
      reviewId
      reviewText
      createdAt
      userId
    }
  }
`;

const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      id
      username
    }
  }
`;

const ProductPage = () => {
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user"));
  const userId = user?.userId?.toString();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data, loading, error } = useQuery(GET_PRODUCT, {
    client: productsClient,
    variables: { id },
  });

  const { data: favData, refetch: refetchFavorites } = useQuery(GET_FAVORITE, {
    client: shopClient,
    variables: { userId },
    skip: !userId,
    fetchPolicy: "network-only",
  });

  const { data: reviewsData } = useQuery(GET_REVIEWS, {
    client: reviewClient,
    variables: { productId: id },
  });

  const { data: usersData } = useQuery(GET_ALL_USERS, {
    client: authClient,
  });

  const usersMap = {};
  usersData?.getAllUsers?.forEach(u => {
    usersMap[u.id] = u.username;
  });

  const [addToFavorite] = useMutation(ADD_TO_FAVORITE, { client: shopClient });
  const [removeFromFavorite] = useMutation(REMOVE_FROM_FAVORITE, { client: shopClient });
  const [addToCart] = useMutation(ADD_TO_CART, { client: shopClient });

  useEffect(() => {
    if (favData?.favorite && id) {
      const isFav = favData.favorite.some((f) => f.productId === id);
      setIsFavorite(isFav);
    }
  }, [favData, id]);

  const handleAddToCart = async () => {
    if (!userId) return alert("You must be logged in to add to cart!");
    try {
      const res = await addToCart({
        variables: { userId, productId: id, quantity: 1 },
      });
      alert(res.data.addToCart.message || "Product added to cart!");
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      console.error(err);
      alert("Failed to add product to cart");
    }
  };

  const handleToggleFavorite = async () => {
    if (!userId) return alert("You must be logged in to use favorites!");
    try {
      if (isFavorite) {
        await removeFromFavorite({ variables: { userId, productId: id } });
        setIsFavorite(false);
      } else {
        await addToFavorite({ variables: { userId, productId: id } });
        setIsFavorite(true);
      }
      refetchFavorites();
    } catch (err) {
      console.error(err);
      alert("Failed to update favorite");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <svg className="animate-spin h-8 w-8 text-pink-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );

  if (error || !data?.products?.nodes?.length) return (
    <div className="flex justify-center items-center h-screen text-gray-500">Product not found.</div>
  );

  const product = data.products.nodes[0];
  const reviews = reviewsData?.reviewsByProduct ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row gap-8 p-8">

        <div className="flex-1 flex justify-center items-center bg-gray-50 rounded-xl p-6">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-h-80 object-contain"
          />
        </div>
        <div className="flex-1 flex flex-col justify-between gap-4">
          <div>
            <p className="text-sm text-pink-500 font-medium uppercase tracking-widest">{product.brands?.name}</p>
            <h1 className="text-3xl font-bold text-gray-800 mt-1">{product.name}</h1>
            <p className="text-gray-500 mt-1">{product.size}ml</p>
            <p className="text-gray-600 mt-4 text-sm leading-relaxed">{product.description}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-pink-600 mb-4">$ {product.price}</p>
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-pink-600 text-white py-3 rounded-xl hover:bg-pink-700 transition font-medium"
              >
                Add to cart
              </button>
              <button
                onClick={handleToggleFavorite}
                className="px-4 py-3 border border-pink-300 rounded-xl hover:bg-pink-50 transition text-pink-600 flex items-center justify-center"
              >
                {isFavorite ? (
                  <FaHeart size={20} color="red" />
                ) : (
                  <FiHeart size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>

        {reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            No reviews yet for this product.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((review) => (
              <div key={review.reviewId} className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm uppercase">
                      {usersMap[review.userId]?.charAt(0) || 'U'}
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {usersMap[review.userId] || 'Customer'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{review.reviewText}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;