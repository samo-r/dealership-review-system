import React, { useState, useEffect } from "react";
import "./Dealers.css";
import "../assets/style.css";
import DealershipCard from "../common/DealershipCard";
import ActionButton from "../common/ActionButton";
import { useAuth } from "../../context/AuthContext";

const Dealers = () => {
  const [dealersList, setDealersList] = useState([]);
  const [allDealers, setAllDealers] = useState([]);
  const [states, setStates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [loading, setLoading] = useState(true);

  const { user, role } = useAuth();
  const canReview = !!user && role !== "DEALER_ADMIN";

  // Fetch all dealers on mount
  useEffect(() => {
    const fetchDealers = async () => {
      try {
        const res = await fetch("/djangoapp/get_dealers");
        const data = await res.json();
        if (data.status === 200) {
          const dealers = Array.from(data.dealers);
          setAllDealers(dealers);
          setDealersList(dealers);

          // Extract unique states
          const uniqueStates = Array.from(new Set(dealers.map((d) => d.state)));
          setStates(uniqueStates);
        }
      } catch (err) {
        console.error("Error fetching dealers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDealers();
  }, []);

  // Filter dealers by search term and state
  useEffect(() => {
    let filtered = allDealers;

    // Filter by state
    if (selectedState && selectedState !== "All") {
      filtered = filtered.filter((d) => d.state === selectedState);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setDealersList(filtered);
  }, [searchTerm, selectedState, allDealers]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Find a Dealership
          </h1>
          <p className="text-gray-600">
            Browse and compare dealerships in your area.
          </p>
        </div>
      </section>

      {/* Search and Filter Bar */}
      <section className="bg-white border-b border-gray-200 py-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Search input */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by name or city
              </label>
              <input
                type="text"
                placeholder="e.g., Toyota Dealership, New York"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            {/* State filter */}
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by state
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Dealers Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading dealerships...</p>
            </div>
          ) : dealersList.length > 0 ? (
            <>
              <p className="text-gray-600 mb-6">
                Showing <strong>{dealersList.length}</strong> dealership
                {dealersList.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dealersList.map((dealer) => (
                  <div key={dealer.id} className="flex flex-col">
                    <DealershipCard dealer={dealer} />
                    {canReview && (
                      <div className="mt-3 text-center">
                        <ActionButton
                          dealerId={dealer.id}
                          label="Add Review"
                          className="w-full bg-brand-primary text-white hover:bg-brand-dark"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600 text-lg">
                No dealerships found matching your search.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedState("");
                }}
                className="mt-4 text-brand-primary hover:underline font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p>&copy; 2026 Dealership Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Dealers;
