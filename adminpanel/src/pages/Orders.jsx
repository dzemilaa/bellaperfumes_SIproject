import React, { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { orderClient, productsClient } from '../Apolloclient';

const GET_ALL_ORDERS = gql`
  query GetAllOrders {
    getAllOrders {
      id
      userId
      orderDate
      status
      totalAmount
      firstName
      lastName
      phone
      address
      orderItems {
        productId
        price
        quantity
        image
      }
    }
  }
`;

const GET_PRODUCT_INFO = gql`
  query GetProductInfo($ids: [UUID!]!) {
    products(where: { id: { in: $ids } }) {
      nodes {
        id
        name
        discount
      }
    }
  }
`;

const UPDATE_ORDER_STATUS = gql`
  mutation UpdateOrderStatus($orderId: String!, $newStatus: String!) {
    updateOrderStatus(orderId: $orderId, newStatus: $newStatus) {
      success
      message
    }
  }
`;

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Out for delivery': 'bg-blue-100 text-blue-700 border-blue-200',
  Delivered: 'bg-green-100 text-green-700 border-green-200',
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [productMap, setProductMap] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const { data } = await orderClient.query({
        query: GET_ALL_ORDERS,
        fetchPolicy: 'network-only',
      });

      const ordersData = data.getAllOrders || [];

      const allProductIds = [
        ...new Set(ordersData.flatMap((o) => o.orderItems.map((i) => i.productId))),
      ];

      const { data: productData } = await productsClient.query({
        query: GET_PRODUCT_INFO,
        variables: { ids: allProductIds },
        fetchPolicy: 'network-only',
      });

      const pMap = {};
      productData.products.nodes.forEach((p) => {
        pMap[p.id] = { name: p.name, discount: p.discount || 0 };
      });
      setProductMap(pMap);

      const ordersWithNames = ordersData.map((order) => ({
        ...order,
        orderItems: order.orderItems.map((item) => ({
          ...item,
          name: pMap[item.productId]?.name || 'Unknown',
          discount: pMap[item.productId]?.discount || 0,
        })),
      }));

      setOrders(ordersWithNames);
    } catch (error) {
      console.error(error);
      alert('Error fetching orders.');
    }
    setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { data } = await orderClient.mutate({
        mutation: UPDATE_ORDER_STATUS,
        variables: { orderId, newStatus },
      });
      if (data.updateOrderStatus.success) {
        setOrders((prev) =>
          prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
        );
      } else {
        alert(data.updateOrderStatus.message);
      }
    } catch (error) {
      console.error(error);
      alert('Error updating status.');
    }
  };

  const getDiscountedPrice = (price, discount) =>
    discount > 0 ? price * (1 - discount / 100) : price;

  const calcOrderTotal = (orderItems) => {
    const subtotal = orderItems.reduce((acc, item) => {
      return acc + getDiscountedPrice(item.price, item.discount) * item.quantity;
    }, 0);
    return subtotal + 2; // delivery fee
  };

  useEffect(() => {
    fetchAllOrders();
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
    <div className="p-8 w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">All Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No orders found.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const calculatedTotal = calcOrderTotal(order.orderItems);
            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-6">

                  <div className="w-12 h-12 bg-pink-50 rounded-xl flex items-center justify-center text-2xl shrink-0">
                    📦
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-400 font-mono">#{order.id}</p>
                      <span className={`text-xs px-3 py-1 rounded-full border font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 mb-2">
                      {order.orderItems?.map((item, idx) => {
                        const hasDiscount = item.discount > 0;
                        const discountedPrice = getDiscountedPrice(item.price, item.discount);
                        return (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="font-medium">{item.name} x {item.quantity}</span>
                            {hasDiscount ? (
                              <span className="flex items-center gap-1">
                                <span className="line-through text-gray-400">${item.price.toFixed(2)}</span>
                                <span className="text-pink-600 font-semibold">${discountedPrice.toFixed(2)}</span>
                                <span className="text-xs bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full">-{item.discount}%</span>
                              </span>
                            ) : (
                              <span>${item.price.toFixed(2)}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 mt-2 text-sm text-gray-600">
                      <p><span className="font-medium">Name:</span> {order.firstName} {order.lastName}</p>
                      <p><span className="font-medium">Phone:</span> {order.phone}</p>
                      <p><span className="font-medium">Address:</span> {order.address}</p>
                      <p><span className="font-medium">Date:</span> {new Date(order.orderDate).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div>
                        <p className="text-xs text-gray-400">Total (with discounts + delivery)</p>
                        <p className="text-lg font-bold text-pink-600">${calculatedTotal.toFixed(2)}</p>
                      </div>
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Out for delivery">Out for delivery</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;