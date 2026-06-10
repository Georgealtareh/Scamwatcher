import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://' + window.location.hostname + ':3001/api';

function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [alertFrequency, setAlertFrequency] = useState(user?.alertFrequency || 'immediate');
  const [selectedSubs, setSelectedSubs] = useState(user?.subscriptions || []);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const categories = [
    'Phishing', 'Investment', 'Impersonation', 'Tech Support', 'Romance', 'Healthcare', 'Refund Scam', 'Ransomware', 'Other'
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchAlerts = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/user/alerts`, {
          headers: { 'x-auth-token': token }
        });
        setAlerts(response.data);
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      }
    };

    fetchAlerts();
  }, [user, navigate]);

  const handleUpdatePreferences = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/user/preferences`, {
        fullName,
        phone,
        alertFrequency,
        subscriptions: selectedSubs
      }, {
        headers: { 'x-auth-token': token }
      });

      // Refresh user data
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { 'x-auth-token': token }
      });
      setUser(response.data);
      setMessage('Preferences updated successfully!');
    } catch (err) {
      setMessage('Error updating preferences.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSub = (cat) => {
    if (selectedSubs.includes(cat)) {
      setSelectedSubs(selectedSubs.filter(s => s !== cat));
    } else {
      setSelectedSubs([...selectedSubs, cat]);
    }
  };

  if (!user) return null;

  return (
    <main className="max-w-container mx-auto px-6 py-12">
      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-4">
              {user.fullName?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
            </div>
            <h3 className="text-xl font-bold">{user.fullName || 'User'}</h3>
            <p className="text-gray-500 text-sm mb-8">{user.email}</p>
            
            <nav className="text-left space-y-2">
              <button className="w-full text-left p-3 rounded-lg bg-blue-50 text-primary font-bold">Dashboard</button>
              <button className="w-full text-left p-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Alert History</button>
              <button className="w-full text-left p-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">Account Settings</button>
            </nav>
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-8">
          {/* Subscription Status */}
          <section className="bg-white rounded-2xl p-8 shadow-lg border-l-8 border-safety">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Plan</h4>
                <h2 className="text-2xl font-bold">{user.is_premium ? 'Premium Protection' : 'Free Plan'}</h2>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${user.is_premium ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {user.is_premium ? 'Active' : 'Basic'}
                </span>
                {user.is_premium ? (
                  <p className="text-sm text-gray-500 mt-2">Renews on {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString()}</p>
                ) : (
                  <button onClick={() => navigate('/premium')} className="block mt-2 text-primary font-bold hover:underline">Upgrade to Premium</button>
                )}
              </div>
            </div>
          </section>

          {/* Alert Preferences */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-6">Notification Preferences</h3>
            <form onSubmit={handleUpdatePreferences}>
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Phone Number (for SMS Alerts)</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none" 
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Alert Frequency</label>
                <select 
                  value={alertFrequency}
                  onChange={(e) => setAlertFrequency(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="immediate">Immediate (Real-time)</option>
                  <option value="daily">Daily Summary</option>
                  <option value="weekly">Weekly Digest</option>
                </select>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold mb-3">Scam Categories (Select categories to track)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleSub(cat)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedSubs.includes(cat)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedSubs([])}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedSubs.length === 0
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All Categories
                  </button>
                </div>
              </div>

              {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {message}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Update Preferences'}
              </button>
            </form>
          </section>

          {/* Recent Alerts */}
          <section className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-6">Recent Security Alerts</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    <th className="text-left py-4 px-2 text-sm text-gray-500 uppercase tracking-widest">Date</th>
                    <th className="text-left py-4 px-2 text-sm text-gray-500 uppercase tracking-widest">Threat</th>
                    <th className="text-left py-4 px-2 text-sm text-gray-500 uppercase tracking-widest">Risk</th>
                    <th className="text-left py-4 px-2 text-sm text-gray-500 uppercase tracking-widest">Channel</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.length > 0 ? alerts.map((alert) => (
                    <tr key={alert.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-2 text-sm">{new Date(alert.sent_at).toLocaleDateString()}</td>
                      <td className="py-4 px-2 font-medium">{alert.scamTitle}</td>
                      <td className="py-4 px-2">
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                          alert.riskLevel === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {alert.riskLevel}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-sm text-gray-500 uppercase">{alert.channel}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-gray-400 italic">No alerts sent yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
