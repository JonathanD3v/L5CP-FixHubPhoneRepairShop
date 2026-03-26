import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-16"> {/* Add padding-top to account for fixed navbar */}
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout; 