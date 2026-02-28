import { gql, useQuery, useMutation } from "@apollo/client";
import React, { useEffect, useState } from "react";
import { shopClient, productsClient } from "../apolloClient";
import { useNavigate } from "react-router-dom";

const GET_CART = gql`
  query GetCart($userId: String!) {
    cart(userId: $userId) {
      productId
      name
      price
      quantity
      image
    }
  }
`;

const GET_PRODUCTS_BY_IDS = gql`
  query GetProductsByIds($ids: [UUID!]!) {
    products(where: { id: { in: $ids } }) {
      nodes {
        id
        discount
      }
    }
  }
`;

const REMOVE_FROM_CART = gql`
  mutation RemoveFromCart($userId: String!, $productId: String!) {
    removeFromCart(userId: $userId, productId: $productId) {
      success
      message
    }
  }
`;

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [discountMap, setDiscountMap] = useState({});

  const user = JSON.parse(sessionStorage.getItem("user"));
  const userId = user?.userId;

  const { data, loading, error, refetch } = useQuery(GET_CART, {
    client: shopClient,
    variables: { userId },
    skip: !userId,
  });

  const productIds = cartItems.map((item) => item.productId);

  const { data: productsData } = useQuery(GET_PRODUCTS_BY_IDS, {
    client: productsClient,
    variables: { ids: productIds },
    skip: productIds.length === 0,
  });

  const [removeFromCart] = useMutation(REMOVE_FROM_CART, { client: shopClient });

  useEffect(() => {
    if (data?.cart) setCartItems(data.cart);
    else setCartItems([]);
  }, [data]);

  useEffect(() => {
    if (productsData?.products?.nodes) {
      const map = {};
      productsData.products.nodes.forEach((p) => {
        map[p.id] = p.discount;
      });
      setDiscountMap(map);
    }
  }, [productsData]);

  const handleRemove = async (productId) => {
    if (!userId) return alert("You must be logged in");
    try {
      await removeFromCart({ variables: { userId, productId } });
      refetch();
    } catch (err) {
      console.error("Remove failed:", err);
    }
  };

  const getDiscountedPrice = (price, productId) => {
    const discount = discountMap[productId] || 0;
    return discount > 0 ? price * (1 - discount / 100) : price;
  };

  const getTotalAmount = () =>
    cartItems.reduce((acc, item) => acc + getDiscountedPrice(item.price, item.productId) * item.quantity, 0);

  const getOriginalTotal = () =>
    cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const getTotalDiscount = () => getOriginalTotal() - getTotalAmount();

  if (!userId) return <p className="text-center mt-10">You must log in to see your cart.</p>;
  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (error) return <p className="text-center mt-10">Error: {error.message}</p>;

  return (
    <div className="max-w-6xl mx-auto mt-20 p-4">
      <h1 className="text-3xl font-extrabold mb-6 text-center">Your Cart</h1>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="hidden sm:grid grid-cols-7 gap-2 px-4 py-3 bg-gray-100 text-gray-600 font-semibold">
          <p>Image</p>
          <p>Title</p>
          <p>Original</p>
          <p>Discount</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Remove</p>
        </div>

        {cartItems.length > 0 ? (
          cartItems.map((item) => {
            const discount = discountMap[item.productId] || 0;
            const hasDiscount = discount > 0;
            const discountedPrice = getDiscountedPrice(item.price, item.productId);

            return (
              <div
                key={item.productId}
                className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-center px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition"
              >
                <div className="flex justify-start">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-contain rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <p className="text-gray-600 sm:hidden font-semibold">Title</p>
                  <p className="text-gray-800 font-medium">{item.name || "Unknown"}</p>
                </div>

                <div>
                  <p className="text-gray-600 sm:hidden font-semibold">Original</p>
                  {hasDiscount ? (
                    <p className="text-gray-400 line-through">${item.price.toFixed(2)}</p>
                  ) : (
                    <p className="text-gray-700">${item.price.toFixed(2)}</p>
                  )}
                </div>

                <div>
                  <p className="text-gray-600 sm:hidden font-semibold">Discount</p>
                  {hasDiscount ? (
                    <span className="bg-pink-100 text-pink-600 text-xs font-bold px-2 py-1 rounded-full">
                      -{discount}%
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </div>

                <div>
                  <p className="text-gray-600 sm:hidden font-semibold">Price</p>
                  <p className={`font-semibold ${hasDiscount ? "text-pink-600" : "text-gray-700"}`}>
                    ${discountedPrice.toFixed(2)}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600 sm:hidden font-semibold">Quantity</p>
                  <p className="text-gray-700">{item.quantity}</p>
                </div>

                <div
                  onClick={() => handleRemove(item.productId)}
                  className="cursor-pointer text-red-500 font-bold text-center"
                >
                  ✕
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 py-4">Your cart is empty</p>
        )}
      </div>

      <div className="mt-8 flex justify-end">
        <div className="bg-white shadow-md rounded-lg p-6 w-full sm:w-1/3">
          <h2 className="text-xl font-bold mb-4">Totals</h2>
          <div className="flex justify-between text-gray-700 mb-2">
            <p>Subtotal</p>
            <p>${getOriginalTotal().toFixed(2)}</p>
          </div>
          {getTotalDiscount() > 0 && (
            <div className="flex justify-between text-pink-600 mb-2">
              <p>Discount</p>
              <p>-${getTotalDiscount().toFixed(2)}</p>
            </div>
          )}
          <div className="flex justify-between text-gray-700 mb-2">
            <p>Delivery Fee</p>
            <p>${getTotalAmount() === 0 ? 0 : 2}</p>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-bold text-gray-800 mb-4">
            <p>Total</p>
            <p>${getTotalAmount() === 0 ? 0 : (getTotalAmount() + 2).toFixed(2)}</p>
          </div>
          <button
            onClick={() => navigate("/order")}
            className="w-full bg-pink-600 text-white py-3 rounded-lg hover:bg-pink-700 transition"
          >
            PROCEED TO CHECKOUT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;