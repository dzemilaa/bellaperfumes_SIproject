import { useState, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { productsClient, shopClient } from "../apolloClient";
import { FiHeart, FiShoppingCart } from "react-icons/fi";
import { menu_list } from "./Menu_List";
import { FaHeart } from "react-icons/fa";

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      nodes {
        id
        name
        description
        price
        discount
        stock
        genderId
        imageUrl
        size
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

const genderMap = { female: 1, male: 2, unisex: 3 };

const ProductsPage = () => {
  const [category, setCategory] = useState("All");
  const [favoriteSet, setFavoriteSet] = useState(new Set());
  const navigate = useNavigate();

  const user = JSON.parse(sessionStorage.getItem("user"));
  const userId = user?.userId?.toString();

  const { loading, error, data: productsData } = useQuery(GET_PRODUCTS, {
    client: productsClient,
  });

  const { data: favData, refetch: refetchFavorites } = useQuery(GET_FAVORITE, {
    client: shopClient,
    variables: { userId },
    skip: !userId,
  });

  const [addToFavorite] = useMutation(ADD_TO_FAVORITE, { client: shopClient });
  const [removeFromFavorite] = useMutation(REMOVE_FROM_FAVORITE, { client: shopClient });
  const [addToCart] = useMutation(ADD_TO_CART, { client: shopClient });

  useEffect(() => {
    if (favData?.favorite) {
      setFavoriteSet(new Set(favData.favorite.map((f) => f.productId)));
    }
  }, [favData]);

  const handleAddToCart = async (productId) => {
    if (!userId) return alert("You must be logged in to add to cart!");
    try {
      const res = await addToCart({ variables: { userId, productId, quantity: 1 } });
      alert(res.data.addToCart.message || "Product added to cart!");
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      console.error(err);
      alert("Failed to add product to cart");
    }
  };

  const handleToggleFavorite = async (productId) => {
    if (!userId) return alert("You must be logged in to use favorites!");
    try {
      if (favoriteSet.has(productId)) {
        await removeFromFavorite({ variables: { userId, productId } });
        favoriteSet.delete(productId);
      } else {
        await addToFavorite({ variables: { userId, productId } });
        favoriteSet.add(productId);
      }
      setFavoriteSet(new Set(favoriteSet));
      refetchFavorites();
    } catch (err) {
      console.error(err);
      alert("Failed to update favorite");
    }
  };

  if (loading) return <p className="text-center mt-10">Učitavanje...</p>;
  if (error) return <p className="text-center mt-10">Greška: {error.message}</p>;

  const filteredProducts =
    category === "All"
      ? productsData.products.nodes
      : productsData.products.nodes.filter((p) => p.genderId === genderMap[category]);

  return (
    <div className="px-4" id="categories">
      <section className="px-4">
        <h1 className="text-center text-4xl sm:text-5xl font-extrabold mb-10">
          Our Perfume Collection
        </h1>

        <div className="flex justify-center mb-8">
          <div className="relative w-2/3 h-1 rounded-full overflow-hidden">
            <div className="absolute inset-0 h-0.5 bg-black"></div>
          </div>
        </div>

        <div className="flex justify-center gap-6 sm:gap-10 overflow-x-auto py-2 scrollbar-hide">
          {menu_list.map((item, index) => {
            const isActive = category === item.menu_name;
            return (
              <div
                key={index}
                onClick={() =>
                  setCategory((prev) => (prev === item.menu_name ? "All" : item.menu_name))
                }
                className="flex flex-col items-center gap-3 cursor-pointer transition-transform duration-300 hover:scale-105"
              >
                <div
                  className={`relative h-20 w-20 sm:h-28 sm:w-28 rounded-full overflow-hidden transition-all duration-300
                    ${isActive ? "ring-4 ring-pink-900 scale-105" : "ring-2 ring-transparent hover:ring-pink-600"}`}
                >
                  <img
                    src={item.menu_image}
                    alt={item.menu_name}
                    className="h-full w-full object-cover rounded-full"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm sm:text-base">
                      {item.menu_name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mt-10" id="products">
        {filteredProducts.map((product) => {
          const hasDiscount = product.discount > 0;
          const discountedPrice = hasDiscount
            ? (product.price * (1 - product.discount / 100)).toFixed(2)
            : null;

          return (
            <div
              key={product.id}
              onClick={() => navigate(`/page/${product.id}`)}
              className="relative rounded p-4 shadow-md bg-white hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              {hasDiscount && (
                <div className="absolute top-3 right-3 z-10 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{product.discount}%
                </div>
              )}

              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-64 object-contain rounded-2xl mb-4"
              />

              <button
                className="absolute top-3 left-3 z-10 p-2 bg-white rounded-full shadow-md hover:bg-pink-100"
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(product.id); }}
              >
                {favoriteSet.has(product.id) ? (
                  <FaHeart size={22} color="red" />
                ) : (
                  <FiHeart size={22} color="gray" />
                )}
              </button>

              <h2 className="font-bold text-lg">{product.name}</h2>
              <p className="text-gray-600 text-sm">
                {product.description
                  ? product.description.split('. ').slice(0, 2).join('. ') + (product.description.split('. ').length > 2 ? '...' : '')
                  : ''}
              </p>
              <p className="text-gray-600 text-sm">{product.size}ml</p>

              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  {hasDiscount ? (
                    <>
                      <span className="text-gray-400 line-through text-sm">${product.price}</span>
                      <span className="font-bold text-pink-600">${discountedPrice}</span>
                    </>
                  ) : (
                    <span className="font-bold">${product.price}</span>
                  )}
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleAddToCart(product.id); }}
                  className="p-2 bg-pink-950 rounded-full text-white hover:bg-pink-700 transition-colors"
                >
                  <FiShoppingCart size={22} />
                </button>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default ProductsPage;