import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gql } from "@apollo/client";
import { orderClient, shopClient, productsClient } from "../apolloClient";

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

const CREATE_ORDER = gql`
  mutation CreateOrder(
    $userId: String!
    $firstName: String!
    $lastName: String!
    $email: String!
    $phone: String!
    $address: String!
    $promoCode: String
  ) {
    createOrder(
      userId: $userId
      firstName: $firstName
      lastName: $lastName
      email: $email
      phone: $phone
      address: $address
      promoCode: $promoCode
    ) {
      success
      message
      order {
        id
        totalAmount
        status
        promoCode
        orderItems {
          productId
          price
          quantity
        }
      }
    }
  }
`;

export default function PlaceOrderPage() {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem("user"));
  const userId = user?.userId;

  const [cartItems, setCartItems] = useState([]);
  const [discountMap, setDiscountMap] = useState({});
  const [loadingCart, setLoadingCart] = useState(true);
  const [errorCart, setErrorCart] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "",
    phone: "", address: "", promoCode: "",
  });

  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoMessage, setPromoMessage] = useState("");

  const fetchCart = async () => {
    if (!userId) return;
    setLoadingCart(true);
    try {
      const { data } = await shopClient.query({
        query: GET_CART,
        variables: { userId },
        fetchPolicy: "network-only",
      });
      setCartItems(data.cart || []);
      setErrorCart(null);
    } catch (err) {
      setErrorCart(err);
    }
    setLoadingCart(false);
  };

  const fetchDiscounts = async (items) => {
    if (items.length === 0) return;
    try {
      const ids = items.map((i) => i.productId);
      const { data } = await productsClient.query({
        query: GET_PRODUCTS_BY_IDS,
        variables: { ids },
      });
      const map = {};
      data.products.nodes.forEach((p) => { map[p.id] = p.discount; });
      setDiscountMap(map);
    } catch (err) {
      console.error("Failed to fetch discounts", err);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) fetchDiscounts(cartItems);
  }, [cartItems]);

  const getDiscountedPrice = (price, productId) => {
    const discount = discountMap[productId] || 0;
    return discount > 0 ? price * (1 - discount / 100) : price;
  };

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "promoCode") {
      setPromoApplied(false);
      setPromoDiscount(0);
      setPromoMessage("");
    }
  };

  const applyPromoCode = () => {
    const subtotalAfterProductDiscounts = cartItems.reduce(
      (sum, item) => sum + getDiscountedPrice(item.price, item.productId) * item.quantity, 0
    );
    if (formData.promoCode === "DISCOUNT10") {
      setPromoDiscount(subtotalAfterProductDiscounts * 0.1);
      setPromoApplied(true);
      setPromoMessage("Promo code applied! 10% discount.");
    } else {
      setPromoDiscount(0);
      setPromoApplied(false);
      setPromoMessage("Invalid promo code.");
    }
  };

  const handlePlaceOrder = async () => {
    if (!userId) return alert("You must be logged in!");
    if (cartItems.length === 0) return alert("Your cart is empty!");

    setPlacing(true);
    try {
      const { data } = await orderClient.mutate({
        mutation: CREATE_ORDER,
        variables: {
          userId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          promoCode: promoApplied ? formData.promoCode : null,
        },
      });

      if (data.createOrder.success) {
        alert(`Order placed successfully! Total: $${total.toFixed(2)}`);
        navigate("/orders");
      } else {
        alert(`Failed to place order: ${data.createOrder.message}`);
      }
    } catch (err) {
      console.error(err);
      setPlaceError(err);
    }
    setPlacing(false);
  };

  const originalSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + getDiscountedPrice(item.price, item.productId) * item.quantity, 0);
  const productDiscountTotal = originalSubtotal - subtotal;
  const deliveryFee = subtotal > 0 ? 2 : 0;
  const total = subtotal + deliveryFee - promoDiscount;

  if (loadingCart) return <p>Loading cart...</p>;
  if (errorCart) return <p>Error loading cart: {errorCart.message}</p>;

  return (
    <div className="p-3 sm:p-6 max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
      <div className="flex-1 bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-2xl font-bold mb-4">Delivery Information</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input required name="firstName" placeholder="First Name" value={formData.firstName}
            onChange={onChangeHandler} className="flex-1 border p-2 rounded" />
          <input required name="lastName" placeholder="Last Name" value={formData.lastName}
            onChange={onChangeHandler} className="flex-1 border p-2 rounded" />
        </div>
        <input required name="email" type="email" placeholder="Email" value={formData.email}
          onChange={onChangeHandler} className="w-full border p-2 rounded" />
        <input required name="address" placeholder="Address - Street/City" value={formData.address}
          onChange={onChangeHandler} className="w-full border p-2 rounded" />
        <input required name="phone" placeholder="Phone" value={formData.phone}
          onChange={onChangeHandler} className="w-full border p-2 rounded" />
        <div className="flex gap-2 mt-2">
          <input name="promoCode" placeholder="Promo Code" value={formData.promoCode}
            onChange={onChangeHandler} className="flex-1 border p-2 rounded" />
          <button type="button" onClick={applyPromoCode}
            className="bg-pink-600 text-white px-4 rounded hover:bg-pink-700">
            Apply Code
          </button>
        </div>
        {promoMessage && (
          <p className={`mt-1 ${promoApplied ? "text-green-600" : "text-red-600"}`}>{promoMessage}</p>
        )}
      </div>

      <div className="w-full md:w-1/3 bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-2xl font-bold">Order Summary</h2>
        <div className="space-y-2">
          {cartItems.map((item) => {
            const discount = discountMap[item.productId] || 0;
            const discountedPrice = getDiscountedPrice(item.price, item.productId);
            const hasDiscount = discount > 0;
            return (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>{item.name} x {item.quantity}</span>
                <div className="text-right">
                  {hasDiscount && (
                    <p className="text-gray-400 line-through text-xs">${(item.price * item.quantity).toFixed(2)}</p>
                  )}
                  <p className={hasDiscount ? "text-pink-600 font-semibold" : ""}>
                    ${(discountedPrice * item.quantity).toFixed(2)}
                    {hasDiscount && <span className="ml-1 text-xs">(-{discount}%)</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <hr />
        <div className="flex justify-between text-gray-700">
          <span>Subtotal</span>
          <span>${originalSubtotal.toFixed(2)}</span>
        </div>
        {productDiscountTotal > 0 && (
          <div className="flex justify-between text-pink-600">
            <span>Product Discounts</span>
            <span>-${productDiscountTotal.toFixed(2)}</span>
          </div>
        )}
        {promoDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Promo Code (DISCOUNT10)</span>
            <span>-${promoDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-700">
          <span>Delivery Fee</span>
          <span>${deliveryFee.toFixed(2)}</span>
        </div>
        <hr />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <button onClick={handlePlaceOrder} disabled={placing}
          className="w-full bg-pink-600 text-white py-2 rounded hover:bg-pink-700 disabled:opacity-50 mt-4">
          {placing ? "Placing Order..." : "Place Order"}
        </button>

        {placeError && <p className="text-red-500 mt-2">Error placing order</p>}
      </div>
    </div>
  );
}