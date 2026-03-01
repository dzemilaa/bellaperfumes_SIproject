import React, { useState, useEffect } from 'react';
import { reviewClient, productsClient } from '../Apolloclient';
import { loginClient } from '../Apolloclient';
import { gql } from '@apollo/client';

const GET_ALL_REVIEWS = gql`
  query {
    allReviews {
      reviewId
      userId
      productId
      reviewText
      createdAt
    }
  }
`;

const GET_PRODUCT_INFO = gql`
  query GetProductInfo($ids: [UUID!]!) {
    products(where: { id: { in: $ids } }) {
      nodes {
        id
        name
      }
    }
  }
`;


const GET_ALL_USERS = gql`
  query GetAllUsers {
    getAllUsers {
      id
      username
      email
    }
  }
`;

const DELETE_REVIEW = gql`
  mutation DeleteReview($reviewId: String!) {
    deleteReview(reviewId: $reviewId) {
      success
      message
    }
  }
`;

const Reviews = () => {
  const [productsMap, setProductsMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [reviews, setReviews] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const [reviewsRes, usersRes] = await Promise.all([//idu istovremeno 
        reviewClient.query({ query: GET_ALL_REVIEWS, fetchPolicy: 'network-only' }),
        loginClient.query({ query: GET_ALL_USERS, fetchPolicy: 'network-only' })
      ]);

      const allProductIds = reviewsRes.data.allReviews.map(r => r.productId).filter(Boolean);

      const { data: productData } = await productsClient.query({
        query: GET_PRODUCT_INFO,
        variables: { ids: allProductIds },
        fetchPolicy: 'network-only',
      });

      const productMap = {};
      productData.products.nodes.forEach(p => {
        productMap[p.id] = p.name;
      });
      setProductsMap(productMap);

      const map = {};
      usersRes.data.getAllUsers.forEach(u => {
        if (u.id) map[u.id.toLowerCase()] = u.username;
        if (u.email) map[u.email.toLowerCase()] = u.username;
      });
      setUsersMap(map);
      setReviews(reviewsRes.data.allReviews);
    } catch (error) {
      alert('Failed to fetch reviews.');
    }
    setLoading(false);
  };

  const removeReview = async (reviewId) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      const { data } = await reviewClient.mutate({
        mutation: DELETE_REVIEW,
        variables: { reviewId }
      });
      if (data.deleteReview.success) {
        setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
        alert('Review deleted successfully.');
      } else {
        alert(data.deleteReview.message);
      }
    } catch (error) {
      alert('Failed to delete review.');
    }
  };

  const filteredReviews = reviews.filter((r) =>
    r.reviewText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    usersMap[r.userId?.toLowerCase()]?.toLowerCase().startsWith(searchQuery.toLowerCase())
  );



  useEffect(() => {
    fetchReviews();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <svg className="animate-spin h-8 w-8 text-pink-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">All Reviews</h2>

      <input
        type="text"
        placeholder="Search by username or review text..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-xl text-sm mb-6 focus:outline-none focus:ring-2 focus:ring-pink-400"
      />

      <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_2fr_1fr_80px] gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 uppercase mb-2">
        <span>Review ID</span>
        <span>Username</span>
        <span>Product Name</span>
        <span>Review Text</span>
        <span>Created At</span>
        <span>Action</span>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No reviews found.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredReviews.map((review, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl hover:bg-gray-50 transition overflow-hidden"
            >
              <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_2fr_1fr_80px] gap-3 px-4 py-3 items-center text-sm text-gray-700">
                <p className="font-mono text-xs text-gray-400 truncate">{review.reviewId}</p>
                <p className="font-mono text-xs text-gray-400 truncate">{usersMap[review.userId?.toLowerCase()] || review.userId}</p>
                <p className="font-mono text-xs text-gray-400 truncate"> {productsMap[review.productId] || review.productId}</p>
                <p className="text-gray-600 text-sm line-clamp-2">{review.reviewText}</p>
                <p className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </p>
                <button
                  onClick={() => removeReview(review.reviewId)}
                  className="px-3 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-100 transition"
                >
                  Delete
                </button>
              </div>

              <div className="md:hidden p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-gray-700">
                      {usersMap[review.userId?.toLowerCase()] || review.userId}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => removeReview(review.reviewId)}
                    className="px-3 py-1 text-xs bg-red-50 text-red-500 border border-red-200 rounded-lg hover:bg-red-100 transition shrink-0"
                  >
                    Delete
                  </button>
                </div>

                <p className="text-sm text-gray-600">{review.reviewText}</p>

                <div className="flex flex-col gap-0.5 pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    <span className="font-medium text-gray-500">Review ID: </span>
                    <span className="font-mono">{review.reviewId}</span>
                  </span>
                  <span className="text-xs text-gray-400">
                    <span className="font-medium text-gray-500">Product Name: </span>
                    <span className="font-mono">{productsMap[review.productId] || review.productId}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;