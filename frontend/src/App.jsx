import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Premium from './components/Premium';
import Checkout from './components/Checkout';
import Dashboard from './components/Dashboard';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Handle e2b sandbox preview URLs (e.g. 3000-sandbox-id.e2b.local)
  if (hostname.startsWith('3000-')) {
    return `${protocol}//${hostname.replace('3000-', '3001-')}/api`;
  }
  
  // Default for local development or same-host deployment
  return `${protocol}//${hostname}:3001/api`;
};

const API_BASE = getApiBase();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE}/auth/me`, {
          headers: { 'x-auth-token': token }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background text-dark font-sans text-base">
        <header className="bg-primary text-white p-4 shadow-md">
          <div className="max-w-container mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="ScamWatch Logo" className="h-10 w-10 object-contain bg-white rounded-full p-1" />
              <h1 className="text-heading font-bold">ScamWatch</h1>
            </Link>
            <nav className="hidden md:block">
              <ul className="flex gap-6 font-semibold text-sm uppercase tracking-wider items-center">
                <li><Link to="/" className="hover:text-warning transition-colors">Feed</Link></li>
                <li><Link to="/premium" className="hover:text-warning transition-colors">Premium</Link></li>
                {user ? (
                  <>
                    <li className="bg-white/10 px-3 py-1 rounded-md text-xs normal-case font-medium">
                      <Link to="/dashboard">Hello, {user.fullName || 'User'}</Link>
                    </li>
                    <li>
                      <button onClick={handleLogout} className="hover:text-warning transition-colors uppercase">
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login" className="hover:text-warning transition-colors">Login</Link></li>
                    <li>
                      <Link to="/signup" className="bg-warning text-dark px-4 py-2 rounded-md hover:bg-yellow-400 transition-colors">
                        Sign Up
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/checkout" element={<Checkout user={user} setUser={setUser} />} />
          <Route path="/dashboard" element={<Dashboard user={user} setUser={setUser} />} />
        </Routes>

        <footer className="bg-dark text-gray-400 py-12 mt-20 px-6">
          <div className="max-w-container mx-auto grid md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-6 text-white">
                <img src="/logo.png" alt="ScamWatch Logo" className="h-8 w-8 object-contain bg-white rounded-full p-1" />
                <span className="text-xl font-bold">ScamWatch</span>
              </div>
              <p className="text-sm leading-relaxed">
                Our automated system detects new scams as they emerge, providing real-time data to help keep consumers safe from fraud and deception.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Quick Links</h4>
              <ul className="grid gap-3 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Browse Scam Feed</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Safety Tips</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Premium Subscription</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API for Developers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-sm">Legal</h4>
              <ul className="grid gap-3 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="max-w-container mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-xs">
            © 2026 ScamWatch. All rights reserved. Built with trust for a safer internet.
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
