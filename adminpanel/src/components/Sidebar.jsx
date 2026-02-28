import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/add', label: 'Add Product', icon: '➕' },
  { to: '/list', label: 'Products', icon: '📦' },
  { to: '/orders', label: 'Orders', icon: '🛒' },
  { to: '/users', label: 'Users', icon: '👥' },
  { to: '/reviews', label: 'Reviews', icon: '⭐' },
];

const Sidebar = () => {
  return (
    <>
      <div className="hidden sm:flex min-h-screen w-52 bg-white border-r border-gray-200 shadow-sm flex-col pt-8">
        <div className="flex flex-col gap-2 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-pink-50 text-pink-700 border border-pink-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-pink-600'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-xs font-medium transition-all
                ${isActive ? 'text-pink-600' : 'text-gray-400'}`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;