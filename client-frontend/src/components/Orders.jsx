import React, { useEffect, useState } from "react";
import { gql } from "@apollo/client";
import { orderClient, productsClient, reviewClient } from "../apolloClient";

const GET_ORDERS = gql`
  query GetOrders($userId: String!) {
    getOrders(userId: $userId) {
      id
      orderDate
      status
      totalAmount
      promoCode
      orderItems {
        productId
        price
        quantity
        image
      }
    }
  }
`;

const GET_PRODUCT_NAMES = gql`
  query GetProductNames($ids: [UUID!]!) {
    products(where: { id: { in: $ids } }) {
      nodes {
        id
        name
        discount
      }
    }
  }
`;

const GET_ORDER_BY_ID = gql`
  query GetOrderById($orderId: UUID!) {
    getOrderById(orderId: $orderId) {
      id
      status
    }
  }
`;

const ADD_REVIEW = gql`
  mutation AddReview($userId: String!, $orderId: String!, $productId: String!, $reviewText: String!) {
    addReview(userId: $userId, orderId: $orderId, productId: $productId, reviewText: $reviewText) {
      success
      message
    }
  }
`;

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [discountMap, setDiscountMap] = useState({});
  const [reviewForms, setReviewForms] = useState({});

  const user = JSON.parse(sessionStorage.getItem("user"));
  const userId = user?.userId;

  const fetchOrders = async () => {
    if (!userId) {
      setError(new Error("You must be logged in to see your orders."));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data } = await orderClient.query({
        query: GET_ORDERS,
        variables: { userId },
        fetchPolicy: "network-only",
      });

      const ordersData = data.getOrders;

      const allProductIds = [
        ...new Set(ordersData.flatMap((order) => order.orderItems.map((item) => item.productId))),
      ];

      const { data: productData } = await productsClient.query({
        query: GET_PRODUCT_NAMES,
        variables: { ids: allProductIds },
        fetchPolicy: "network-only",
      });

      const productMap = {};
      const dMap = {};
      productData.products.nodes.forEach((p) => {
        productMap[p.id] = p.name;
        dMap[p.id] = p.discount || 0;
      });

      setDiscountMap(dMap);

      const ordersWithNames = ordersData.map((order) => ({
        ...order,
        orderItems: order.orderItems.map((item) => ({
          ...item,
          name: productMap[item.productId] || "Unknown",
        })),
      }));

      setOrders(ordersWithNames);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err);
    }
    setLoading(false);
  };

  const refreshOrderStatus = async (orderId) => {
    try {
      const { data } = await orderClient.query({
        query: GET_ORDER_BY_ID,
        variables: { orderId },
        fetchPolicy: "network-only",
      });
      setOrders((prev) =>
        prev.map((o) => o.id === orderId ? { ...o, status: data.getOrderById.status } : o)
      );
    } catch (err) {
      console.error("Failed to refresh order status:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getDiscountedPrice = (price, productId) => {
    const discount = discountMap[productId] || 0;
    return discount > 0 ? price * (1 - discount / 100) : price;
  };

  const getFormKey = (orderId, productId) => `${orderId}_${productId}`;

  const toggleReviewForm = (orderId, productId) => {
    const key = getFormKey(orderId, productId);
    setReviewForms((prev) => ({
      ...prev,
      [key]: {
        open: !prev[key]?.open,
        text: prev[key]?.text || "",
        submitted: prev[key]?.submitted || false,
      },
    }));
  };

  const handleReviewTextChange = (orderId, productId, value) => {
    const key = getFormKey(orderId, productId);
    setReviewForms((prev) => ({ ...prev, [key]: { ...prev[key], text: value } }));
  };

  const handleSubmitReview = async (orderId, productId) => {
    const key = getFormKey(orderId, productId);
    const reviewText = reviewForms[key]?.text?.trim();
    if (!reviewText) return alert("Please write your review!");
    try {
      const res = await reviewClient.mutate({
        mutation: ADD_REVIEW,
        variables: {
          userId: userId.toString(),
          orderId: orderId.toString(),
          productId: productId.toString(),
          reviewText,
        },
      });
      if (res.data.addReview.success) {
        setReviewForms((prev) => ({ ...prev, [key]: { open: false, text: "", submitted: true } }));
      } else {
        alert(res.data.addReview.message);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit review.");
    }
  };

  if (!userId) return <p className="text-center mt-10">You must be logged in to see your orders.</p>;
  if (loading) return <p className="text-center mt-10">Loading orders...</p>;
  if (error) return <p className="text-center mt-10">Error: {error.message}</p>;

  return (
    <div className="p-4 max-w-4xl mx-auto mt-10 min-h-[50vh]">
      <h2 className="text-xl font-bold mb-4">My Orders</h2>

      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        orders.map((order) => {
          const promoCodeUsed = order.promoCode;
          const subtotal = order.orderItems.reduce(
            (acc, item) => acc + getDiscountedPrice(item.price, item.productId) * item.quantity, 0
          );
          const discountAmount = promoCodeUsed === "DISCOUNT10" ? subtotal * 0.1 : 0;
          const calculatedTotal = subtotal + 2 - discountAmount;

          return (
            <div key={order.id} className="border p-4 mb-4 rounded shadow">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <p><strong>Order ID:</strong> {order.id}</p>
                <button
                  onClick={() => refreshOrderStatus(order.id)}
                  className="ml-4 bg-pink-600 text-white px-2 py-1 rounded hover:bg-pink-700 transition"
                >
                  Refresh Status
                </button>
              </div>

              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Date:</strong> {new Date(order.orderDate).toLocaleString()}</p>

              <div className="mt-2 border-t pt-2">
                <p><strong>Delivery Fee:</strong> $2.00</p>
                {promoCodeUsed === "DISCOUNT10" && (
                  <p className="text-sm text-green-600 font-medium">
                    <strong>Promo Code:</strong> DISCOUNT10 (-10%)
                    <span className="ml-2">-${discountAmount.toFixed(2)}</span>
                  </p>
                )}
                <p className="font-bold text-lg"><strong>Total:</strong> ${calculatedTotal.toFixed(2)}</p>
              </div>

              <div className="mt-2">
                <strong>Items:</strong>
                <ul className="pl-2 mt-2 flex flex-col gap-3">
                  {order.orderItems.map((item, idx) => {
                    const key = getFormKey(order.id, item.productId);
                    const form = reviewForms[key];
                    const productDiscount = discountMap[item.productId] || 0;
                    const hasDiscount = productDiscount > 0;
                    const discountedPrice = getDiscountedPrice(item.price, item.productId);

                    return (
                      <li key={idx} className="border rounded-xl p-3 bg-gray-50">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-500 text-sm"> — {item.quantity} x </span>
                            {hasDiscount ? (
                              <span>
                                <span className="text-gray-400 line-through text-sm">${item.price.toFixed(2)}</span>
                                <span className="text-pink-600 font-semibold ml-1">${discountedPrice.toFixed(2)}</span>
                                <span className="ml-1 text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full">-{productDiscount}%</span>
                              </span>
                            ) : (
                              <span className="font-semibold">${item.price.toFixed(2)}</span>
                            )}
                          </div>
                          {form?.submitted ? (
                            <span className="text-green-600 text-sm font-medium">✓ Review submitted</span>
                          ) : (
                            <button
                              onClick={() => toggleReviewForm(order.id, item.productId)}
                              className="text-sm text-pink-600 border border-pink-300 px-3 py-1 rounded-lg hover:bg-pink-50 transition"
                            >
                              {form?.open ? "Cancel" : "Leave a Review"}
                            </button>
                          )}
                        </div>

                        {form?.open && !form?.submitted && (
                          <div className="mt-3">
                            <textarea
                              rows={3}
                              placeholder="Write your review here..."
                              value={form.text}
                              onChange={(e) => handleReviewTextChange(order.id, item.productId, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 resize-none"
                            />
                            <button
                              onClick={() => handleSubmitReview(order.id, item.productId)}
                              className="mt-2 w-full bg-pink-600 text-white py-2 rounded-xl hover:bg-pink-700 transition text-sm font-medium"
                            >
                              Submit Review
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}