import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Dealer Overview — dashboard landing page for DEALER_ADMIN
 * Shows dealership info, review statistics, and quick navigation
 */
const DealerOverview = () => {
  const { user } = useAuth();
  const dealerId = user?.assignedDealerId;

  const [dealership, setDealership] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!dealerId) {
      setError("No assigned dealership found");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch dealership info
        const dealerRes = await fetch(
          `${window.location.origin}/djangoapp/dealer/${dealerId}`
        );
        const dealerData = await dealerRes.json();
        if (dealerData.status === 200) {
          setDealership(dealerData.dealer);
        } else {
          setError("Failed to load dealership info");
        }

        // Fetch reviews for sentiment breakdown
        const reviewRes = await fetch(
          `${window.location.origin}/djangoapp/reviews/dealer/${dealerId}`
        );
        const reviewData = await reviewRes.json();
        // Accept reviews when provided even if the response shape varies
        if (reviewData && Array.isArray(reviewData.reviews)) {
          setReviews(reviewData.reviews);
        } else if (reviewData && reviewData.status === 200) {
          setReviews(reviewData.reviews || []);
        }
      } catch (err) {
        console.error("Error fetching overview data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dealerId]);

  // Calculate sentiment breakdown
  const sentimentCounts = {
    positive: reviews.filter((r) => r.sentiment === "positive").length,
    neutral: reviews.filter((r) => r.sentiment === "neutral").length,
    negative: reviews.filter((r) => r.sentiment === "negative").length,
  };

  const totalReviews = reviews.length;

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">
          Welcome back, {user?.userName}!.
        </p>
      </div>

      {/* Dealership Info Card */}
      {dealership && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-brand-primary">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {dealership.name || dealership.full_name}
              </h2>
              <p className="text-slate-600 mt-1">{dealership.district || dealership.city}</p>
            </div>
            <Link
              to="/dealer/profile"
              className="px-4 py-2 text-brand-primary hover:text-brand-dark font-medium"
            >
              Edit
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200">
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wide">
                Address
              </p>
              <p className="text-slate-900 font-medium">
                {dealership.physical_address || dealership.address}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wide">
                District
              </p>
              <p className="text-slate-900 font-medium">
                {dealership.district || dealership.city}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-slate-600 text-sm uppercase tracking-wide">
            Total Reviews
          </p>
          <p className="text-4xl font-bold text-brand-primary mt-2">
            {totalReviews}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-slate-600 text-sm uppercase tracking-wide">
            5-Star Reviews
          </p>
          <p className="text-4xl font-bold text-green-600 mt-2">
            {sentimentCounts.positive}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-slate-600 text-sm uppercase tracking-wide">
            Neutral Reviews
          </p>
          <p className="text-4xl font-bold text-yellow-600 mt-2">
            {sentimentCounts.neutral}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-slate-600 text-sm uppercase tracking-wide">
            Negative Reviews
          </p>
          <p className="text-4xl font-bold text-red-600 mt-2">
            {sentimentCounts.negative}
          </p>
        </div>
      </div>

      {/* Sentiment Progress Bar */}
      {totalReviews > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Sentiment Breakdown
          </h3>
          <div className="flex gap-2 h-8 rounded-full overflow-hidden bg-slate-200">
            <div
              className="bg-green-600 flex items-center justify-center text-white text-xs font-bold"
              style={{
                width: `${totalReviews > 0 ? (sentimentCounts.positive / totalReviews) * 100 : 0}%`,
              }}
            >
              {sentimentCounts.positive > 0 && `${sentimentCounts.positive}`}
            </div>
            <div
              className="bg-yellow-600 flex items-center justify-center text-white text-xs font-bold"
              style={{
                width: `${totalReviews > 0 ? (sentimentCounts.neutral / totalReviews) * 100 : 0}%`,
              }}
            >
              {sentimentCounts.neutral > 0 && `${sentimentCounts.neutral}`}
            </div>
            <div
              className="bg-red-600 flex items-center justify-center text-white text-xs font-bold"
              style={{
                width: `${totalReviews > 0 ? (sentimentCounts.negative / totalReviews) * 100 : 0}%`,
              }}
            >
              {sentimentCounts.negative > 0 && `${sentimentCounts.negative}`}
            </div>
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-full" />
              <span className="text-slate-700">
                Positive ({sentimentCounts.positive})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-600 rounded-full" />
              <span className="text-slate-700">
                Neutral ({sentimentCounts.neutral})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full" />
              <span className="text-slate-700">
                Negative ({sentimentCounts.negative})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dealer/inventory"
            className="p-4 border border-slate-200 rounded-lg hover:border-brand-primary hover:bg-brand-primary hover:bg-opacity-5 transition-colors"
          >
            <p className="font-bold text-slate-900">Inventory</p>
            <p className="text-sm text-slate-600">Manage vehicles</p>
          </Link>

          <Link
            to="/dealer/reviews"
            className="p-4 border border-slate-200 rounded-lg hover:border-brand-primary hover:bg-brand-primary hover:bg-opacity-5 transition-colors"
          >
            <p className="font-bold text-slate-900">Reviews</p>
            <p className="text-sm text-slate-600">View customer feedback</p>
          </Link>

          <Link
            to="/dealer/profile"
            className="p-4 border border-slate-200 rounded-lg hover:border-brand-primary hover:bg-brand-primary hover:bg-opacity-5 transition-colors"
          >
            <p className="font-bold text-slate-900">Profile</p>
            <p className="text-sm text-slate-600">Edit dealership info</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Recent Reviews
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {reviews.slice(0, 5).map((review) => (
              <div
                key={review.id}
                className="flex items-start justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{review.name}</p>
                  <p className="text-sm text-slate-600">{review.review}</p>
                </div>
                <div className="text-right ml-4">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                      review.sentiment === "positive"
                        ? "bg-green-100 text-green-800"
                        : review.sentiment === "neutral"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {review.sentiment}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {reviews.length > 5 && (
            <Link
              to="/dealer/reviews"
              className="block mt-4 text-center text-brand-primary hover:underline font-medium"
            >
              View all {reviews.length} reviews
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default DealerOverview;
