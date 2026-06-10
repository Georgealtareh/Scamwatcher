import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Shield, AlertTriangle, ExternalLink, Calendar, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const API_BASE = 'http://' + window.location.hostname + ':3001/api';

function Home({ user }) {
  const [scams, setScams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScams = async () => {
      try {
        const response = await axios.get(`${API_BASE}/scams`);
        setScams(response.data);
      } catch (error) {
        console.error('Error fetching scams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScams();
  }, []);

  return (
    <>
      <section className="relative bg-primary text-white py-12 px-6 overflow-hidden">
        <div className="max-w-container mx-auto flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-hero font-extrabold leading-tight mb-4 text-white">
              Stay Ahead of Emerging Scams
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-xl mx-auto md:mx-0">
              Real-time, automated detection of active scams. We monitor the web so you don't have to. 
              Protect yourself and your loved ones with instant alerts.
            </p>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {!user ? (
                <Link to="/signup" className="bg-warning text-dark font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-yellow-400 transition-transform hover:scale-105 inline-block">
                  Sign Up for Alerts
                </Link>
              ) : (
                <button className="bg-warning text-dark font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-yellow-400 transition-transform hover:scale-105">
                  Manage My Alerts
                </button>
              )}
              <button className="bg-white text-primary font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-gray-100 transition-transform hover:scale-105">
                Learn More
              </button>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <img 
              src="/hero-scamwatch.png" 
              alt="Protecting you from scams" 
              className="max-h-64 md:max-h-80 object-contain drop-shadow-2xl rounded-2xl border-4 border-white/20" 
            />
          </div>
        </div>
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl -ml-48 -mb-48"></div>
      </section>

      <main className="max-w-container mx-auto p-6">
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4">
          <h2 className="text-heading font-bold flex items-center gap-3">
            <AlertTriangle className="text-alert" size={28} />
            Latest Active Scams
          </h2>
          <div className="text-sm font-semibold text-secondary flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
            <Info size={16} />
            Continuously Updated
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-secondary font-medium italic">Scanning for new threats...</p>
          </div>
        ) : scams.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <Shield size={64} className="mx-auto text-safety opacity-20 mb-4" />
            <p className="text-secondary text-lg font-medium">No scams reported yet. We're monitoring!</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {scams.map((scam) => (
              <article 
                key={scam.id} 
                className="bg-white rounded-xl shadow-sm border-l-8 border-gray-200 hover:shadow-xl transition-all overflow-hidden group"
                style={{ borderLeftColor: scam.risk_level?.toLowerCase() === 'high' ? '#dc3545' : scam.risk_level?.toLowerCase() === 'medium' ? '#ffc107' : '#28a745' }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-gray-100 text-secondary text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                          {scam.category || 'Uncategorized'}
                        </span>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          scam.risk_level?.toLowerCase() === 'high' ? 'bg-red-100 text-alert' :
                          scam.risk_level?.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-safety'
                        }`}>
                          {scam.risk_level || 'low'} Risk
                        </span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-dark group-hover:text-primary transition-colors leading-tight">
                        {scam.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-secondary font-bold text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <Calendar size={16} />
                      {scam.date_detected ? format(new Date(scam.date_detected), 'MMM d, yyyy') : 'Unknown'}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-8 leading-relaxed text-lg max-w-3xl">
                    {scam.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                      <span className="bg-primary/10 text-primary p-1.5 rounded-md">
                        <Shield size={18} />
                      </span>
                      Source: <span className="text-dark">{scam.source || 'Automated Monitor'}</span>
                    </div>
                    {scam.url && (
                      <a 
                        href={scam.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-6 rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                      >
                        <ExternalLink size={18} />
                        View Full Report
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default Home;
