
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { FiHeart, FiMenu, FiSearch, FiShoppingCart, FiUser, FiX } from 'react-icons/fi';
import { useQuery, useLazyQuery, gql } from "@apollo/client";
import LoginPopup from './LoginPopup';
import { productsClient, shopClient } from "../apolloClient";
import { HashLink } from "react-router-hash-link";

const GET_CART = gql`
  query GetCart($userId: String!) {
    cart(userId: $userId) {
      productId
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

const GET_PRODUCTS = gql`
  query GetProducts($name: String, $brandName: String, $size: Int) {
    products(name: $name, brandName: $brandName, size: $size) {
      nodes {
        id
        name
        size
        price
        brandId
        brands {
          id
          name
        }
      }
    }
  }
`;

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBy, setFilterBy] = useState("name");
  const navigate = useNavigate();
  const debounceTimeout = useRef(null);
  const inputRef = useRef(null);

  const [fetchProducts, { data, loading }] = useLazyQuery(GET_PRODUCTS, {
    client: productsClient,
  });

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (!value.trim()) {
      setShowDropdown(false);
      return;
    }

    debounceTimeout.current = setTimeout(() => {
      fetchProducts({
        variables: {
          name: filterBy === "name" ? value : null,
          brandName: filterBy === "brand" ? value : null,
          size: filterBy === "size" ? (parseInt(value) || null) : null,
        }
      });
      setShowDropdown(true);
    }, 300);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const user = sessionStorage.getItem("user");
    if (user) setIsLoggedIn(true);
  }, []);

  const navItems = [
    { id: 1, name: 'Home', link: '/' },
    { id: 2, name: 'Products', link: '/#products' },
    { id: 3, name: 'Categories', link: '/#categories' },
    { id: 5, name: 'Contact', link: '#contact' },
  ];

  const user = JSON.parse(sessionStorage.getItem("user"));
  const userId = user?.userId?.toString();

  const { data: cartData, refetch: refetchCart } = useQuery(GET_CART, {
    client: shopClient,
    variables: { userId },
    skip: !userId,
  });

  useEffect(() => {
    const handler = () => { if (userId) refetchCart(); };
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, [userId]);

  const { data: favoriteData } = useQuery(GET_FAVORITE, {
    client: shopClient,
    variables: { userId },
    skip: !userId,
  });

  const cartCount = cartData?.cart ? new Set(cartData.cart.map(i => i.productId)).size : 0;
  const favoriteCount = favoriteData?.favorite ? favoriteData.favorite.length : 0;

  const results = data?.products?.nodes ?? [];

  return (
    <header className="sticky top-0 z-50 transition-all duration-300">
      <div className={`w-full py-3 ${isScrolled ? 'bg-gray-100/95 backdrop-blur shadow-md ' : 'bg-gray-100 '}`}>
        <div className=" mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">

          <div className="flex justify-between items-center w-full md:w-auto">
            <img src="/logop.png" alt="Logo" className="w-15 h-16" />
            <a href="/" className="text-xl font-bold text-black">Bella Perfumes</a>
            <button className="md:hidden text-gray-700 hover:text-indigo-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <FiMenu size={24} />
            </button>
          </div>

          <div className="w-full max-w-2xl md:flex-1 relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                <input
                  ref={inputRef}
                  type={filterBy === "size" ? "number" : "text"}
                  placeholder={`Search by ${filterBy}...`}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => { if (searchQuery.trim() && results.length > 0) setShowDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition shadow-sm"
                />
                {searchQuery && (
                  <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <FiX size={15} />
                  </button>
                )}
              </div>

              <select
                value={filterBy}
                onChange={(e) => { setFilterBy(e.target.value); setSearchQuery(""); setShowDropdown(false); }}
                className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white shadow-sm cursor-pointer"
              >
                <option value="name">Name</option>
                <option value="brand">Brand</option>
                <option value="size">Size</option>
              </select>
            </div>

            {showDropdown && (
              <div className="absolute z-50 max-w-xl w-full  left-0 right-12 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                {loading && (
                  <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-pink-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Searching...
                  </div>
                )}

                {!loading && results.length > 0 && (
                  <ul className="max-h-64  overflow-y-auto divide-y divide-gray-50">
                    {results.map(product => (
                      <li
                        key={product.id}
                        onMouseDown={() => navigate(`/page/${product.id}`)}
                        className="px-4 py-2.5 hover:bg-pink-50 cursor-pointer transition-colors flex justify-between items-center group"
                      >
                        <div>
                          <span className="font-semibold text-sm text-gray-800 group-hover:text-pink-700">{product.name}</span>
                          <span className="block text-xs text-gray-400">{product.brands?.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400">{product.size}ml</span>
                          <span className="block text-xs font-semibold text-pink-600">${product.price}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {!loading && results.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-400 text-center">
                    No results found for "<span className="text-gray-600 font-medium">{searchQuery}</span>"
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end flex-wrap gap-2 w-full md:w-auto">
            <button className="relative p-2 text-gray-700 hover:text-pink-600 transition-colors" onClick={() => navigate("/favorite")}>
              <FiHeart size={20} />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{favoriteCount}</span>
              )}
            </button>

            <button className="relative p-2 text-gray-700 hover:text-pink-600 transition-colors" onClick={() => navigate("/cart")}>
              <FiShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">{cartCount}</span>
              )}
            </button>

            {!isLoggedIn ? (
              <button
                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-full hover:bg-pink-700 transition"
                onClick={() => setShowLogin(true)}
              >
                Sign in
              </button>
            ) : (
              <div className="relative">
                <button className="p-2 text-gray-700 hover:text-pink-600" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                  <FiUser size={20} />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border text-sm z-50">
                    <a href="/account" className="block px-4 py-2 hover:bg-gray-100">My account</a>
                    <a href="/orders" className="block px-4 py-2 hover:bg-gray-100">Orders</a>
                    <button
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                      onClick={() => { sessionStorage.removeItem("user"); window.location.reload(); }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-pink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="hidden md:flex justify-center py-3">
            <ul className="flex flex-wrap gap-x-6 text-sm font-medium text-white">
              {navItems.map(item => (
                <li key={item.id}>
                  <HashLink smooth to={item.link} className="hover:text-pink-300 transition-colors">{item.name}</HashLink>
                </li>
              ))}
            </ul>
          </nav>
          {isMobileMenuOpen && (
            <div className="md:hidden mt-2 bg-white rounded-lg shadow-md p-4 space-y-3 text-amber-950 text-center">
              {navItems.map(item => (
                <a key={item.id} href={item.link} className="block hover:text-amber-600 text-sm font-medium">{item.name}</a>
              ))}
            </div>
          )}
        </div>
      </div>

      {showLogin && <LoginPopup setShowLogin={setShowLogin} />}
    </header>
  );
};

export default Header;
