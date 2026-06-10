import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://' + window.location.hostname + ':3001/api';

function Checkout({ user, setUser }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/user/premium`, { isPremium: true }, {
        headers: { 'x-auth-token': token }
      });
      
      // Refresh user data
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { 'x-auth-token': token }
      });
      setUser(response.data);
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to activate premium. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <main className="max-w-container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
      <p className="text-gray-600 mb-10">You're one step away from real-time protection.</p>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Payment Information</h2>
            <form onSubmit={handleActivate}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Name on Card</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  placeholder="John Doe" 
                  required 
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Card Number</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  placeholder="0000 0000 0000 0000" 
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-sm font-semibold mb-2">Expiry Date</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                    placeholder="MM/YY" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">CVC</label>
                  <input 
                    type="text" 
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                    placeholder="123" 
                    required 
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-lg font-bold text-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Activate Protection Now'}
              </button>
              
              <p className="text-center mt-6 text-sm text-gray-500">
                🔒 Secure SSL Encrypted Payment
              </p>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <h3 className="text-xl font-bold mb-6">Order Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-gray-700">
                <span>Premium Protection Plan (Monthly)</span>
                <span>$4.99</span>
              </div>
              <div className="flex justify-between text-safety font-medium">
                <span>14-Day Free Trial</span>
                <span>-$4.99</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Sales Tax</span>
                <span>$0.00</span>
              </div>
              <div className="pt-6 border-t flex justify-between font-bold text-xl">
                <span>Total Due Today</span>
                <span>$0.00</span>
              </div>
            </div>
            
            <div className="mt-8 text-sm text-gray-500 leading-relaxed">
              After your 14-day free trial, you will be charged $4.99 per month unless you cancel. Cancel anytime in your account settings.
            </div>

            <div className="mt-8 flex justify-center gap-4 grayscale opacity-50">
              <img src="https://img.icons8.com/color/48/000000/visa.png" alt="Visa" className="h-8" />
              <img src="https://img.icons8.com/color/48/000000/mastercard.png" alt="Mastercard" className="h-8" />
              <img src="https://img.icons8.com/color/48/000000/amex.png" alt="Amex" className="h-8" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Checkout;
