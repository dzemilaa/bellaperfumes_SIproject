import React, { useEffect, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import { shopClient, productsClient } from "../apolloClient";

export const GET_FAVORITE = gql`
  query GetFavorite($userId: String!) {
    favorite(userId: $userId) {
      productId
      name
      price
      image
    }
  }
`;

const GET_PRODUCTS_DISCOUNTS = gql`
  query GetProductsDiscounts($ids: [UUID!]!) {
    products(where: { id: { in: $ids } }) {
      nodes {
        id
        discount
      }
    }
  }
`;

export const ADD_TO_FAVORITE = gql`
  mutation AddToFavorite($userId: String!, $productId: String!) {
    addToFavorite(userId: $userId, productId: $productId) {
      success
      message
    }
  }
`;

export const REMOVE_FROM_FAVORITE = gql`
  mutation RemoveFromFavorite($userId: String!, $productId: String!) {
    removeFromFavorite(userId: $userId, productId: $productId) {
      success
      message
    }
  }
`;

const Favorite = () => {
  const [items, setItems] = useState([]);
  const [favoriteSet, setFavoriteSet] = useState(new Set());
  const [discountMap, setDiscountMap] = useState({});

  const user = JSON.parse(sessionStorage.getItem("user"));
  const userId = user?.userId?.toString();

  const { data, loading, error, refetch } = useQuery(GET_FAVORITE, {
    client: shopClient,
    variables: { userId },
    skip: !userId,
  });

  const [addToFavorite] = useMutation(ADD_TO_FAVORITE, { client: shopClient });
  const [removeFromFavorite] = useMutation(REMOVE_FROM_FAVORITE, { client: shopClient });

  useEffect(() => {
    if (data?.favorite) {
      setItems(data.favorite);
      setFavoriteSet(new Set(data.favorite.map((item) => item.productId)));
      fetchDiscounts(data.favorite);
    }
  }, [data]);

  const fetchDiscounts = async (favoriteItems) => {
    if (!favoriteItems.length) return;
    try {
      const ids = favoriteItems.map((i) => i.productId);
      const { data: productData } = await productsClient.query({
        query: GET_PRODUCTS_DISCOUNTS,
        variables: { ids },
      });
      const map = {};
      productData.products.nodes.forEach((p) => { map[p.id] = p.discount || 0; });
      setDiscountMap(map);
    } catch (err) {
      console.error("Failed to fetch discounts", err);
    }
  };

  const getDiscountedPrice = (price, productId) => {
    const discount = discountMap[productId] || 0;
    return discount > 0 ? price * (1 - discount / 100) : price;
  };

  const toggleFavorite = async (productId) => {
    if (!userId) return alert("You must log in");
    try {
      if (favoriteSet.has(productId)) {
        await removeFromFavorite({ variables: { userId, productId } });
        favoriteSet.delete(productId);
      } else {
        await addToFavorite({ variables: { userId, productId } });
        favoriteSet.add(productId);
      }
      setFavoriteSet(new Set(favoriteSet));
      refetch();
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      alert("Failed to update favorite");
    }
  };

  if (!userId) return <p className="text-center mt-10">You must log in to see your favorites.</p>;
  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10">Error: {error.message}</p>;

  return (
    <div className="max-w-6xl mx-auto mt-20 p-4">
      <h1 className="text-3xl font-extrabold mb-6 text-center">Your Favorite List</h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Desktop header - hidden on mobile */}
        <div className="hidden sm:grid sm:grid-cols-5 gap-2 px-4 py-3 bg-gray-100 text-gray-600 font-semibold">
          <p>Image</p>
          <p>Title</p>
          <p>Original</p>
          <p>Price</p>
          <p className="text-center">Remove</p>
        </div>

        {items.length > 0 ? (
          items.map((item) => {
            const discount = discountMap[item.productId] || 0;
            const hasDiscount = discount > 0;
            const discountedPrice = getDiscountedPrice(item.price, item.productId);

            return (
              <div key={item.productId} className="border-b border-gray-200 hover:bg-gray-50 transition">
                {/* Mobile card layout */}
                <div className="flex sm:hidden items-center gap-3 px-4 py-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-contain rounded-lg bg-gray-50 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 font-medium text-sm truncate">{item.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {hasDiscount ? (
                        <>
                          <span className="text-gray-400 line-through text-xs">${item.price.toFixed(2)}</span>
                          <span className="text-pink-600 font-semibold text-sm">${discountedPrice.toFixed(2)}</span>
                          <span className="text-xs bg-pink-100 text-pink-600 px-1 py-0.5 rounded-full">-{discount}%</span>
                        </>
                      ) : (
                        <span className="text-gray-700 text-sm">${item.price.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <p
                    className={`cursor-pointer text-xl flex-shrink-0 ${favoriteSet.has(item.productId) ? "text-red-500" : "text-gray-400"}`}
                    onClick={() => toggleFavorite(item.productId)}
                  >
                    {favoriteSet.has(item.productId) ? "❤️" : "🤍"}
                  </p>
                </div>

                {/* Desktop row layout */}
                <div className="hidden sm:grid sm:grid-cols-5 gap-2 items-center px-4 py-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 object-contain rounded-lg bg-gray-50"
                  />
                  <p className="text-gray-800 font-medium">{item.name}</p>
                  <div>
                    {hasDiscount ? (
                      <p className="text-gray-400 line-through text-sm">${item.price.toFixed(2)}</p>
                    ) : (
                      <p className="text-gray-700">${item.price.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {hasDiscount ? (
                      <>
                        <span className="text-pink-600 font-semibold">${discountedPrice.toFixed(2)}</span>
                        <span className="text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full">-{discount}%</span>
                      </>
                    ) : (
                      <span className="text-gray-700">${item.price.toFixed(2)}</span>
                    )}
                  </div>
                  <p
                    className={`cursor-pointer text-center text-xl ${favoriteSet.has(item.productId) ? "text-red-500" : "text-gray-400"}`}
                    onClick={() => toggleFavorite(item.productId)}
                  >
                    {favoriteSet.has(item.productId) ? "❤️" : "🤍"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 py-4">Your favorite list is empty</p>
        )}
      </div>
    </div>
  );
};

export default Favorite;