import { getApiUrl } from "../../utils/apiBridge";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import ReviewCard from "../../components/common/ReviewCard";
import ReviewSummaryCard from "../../components/common/ReviewSummaryCard";

/**
 * Dealer Reviews — read-only view of all reviews for the dealer's assigned dealership
 * DEALER_ADMIN can only view reviews for their own dealership
 */
const DealerReviews = () => {
  const { user } = useAuth();
  const dealerId = user?.assignedDealerId;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSentiment, setSelectedSentiment] = useState("all");

  useEffect(() => {
    if (!dealerId) {
      setError("No assigned dealership found");
      setLoading(false);
      return;
    }

    const fetchReviews = async () => {
      try {
        const res = await fetch(
          getApiUrl(`/djangoapp/reviews/dealer/${dealerId}`)
        );
        const data = await res.json();

        if (data.status === 200) {
          // Sort by newest first
          const sorted = (data.reviews || []).sort(
            (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
          );
          setReviews(sorted);
        } else {
          setError("Failed to load reviews");
        }
      } catch (err) {
        console.error("Error fetching dealer reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [dealerId]);

  // Filter reviews by sentiment
  const filteredReviews =
    selectedSentiment === "all"
      ? reviews
      : reviews.filter((r) => r.sentiment === selectedSentiment);

  const sentimentCounts = {
    all: reviews.length,
    positive: reviews.filter((r) => r.sentiment === "positive").length,
    neutral: reviews.filter((r) => r.sentiment === "neutral").length,
    negative: reviews.filter((r) => r.sentiment === "negative").length,
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Customer Reviews</h1>
        <p className="text-slate-600 mt-1">
          All feedback from customers about your dealership.
        </p>
      </div>

      {/* Sentiment Filter Buttons */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Reviews" },
            { id: "positive", label: "5 Stars" },
            { id: "neutral", label: "3 Stars" },
            { id: "negative", label: "1 Star" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedSentiment(filter.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedSentiment === filter.id
                  ? "bg-brand-primary text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              {filter.label} ({sentimentCounts[filter.id]})
            </button>
          ))}
        </div>
      </div>

      <ReviewSummaryCard sentimentCounts={sentimentCounts} />

      {/* Reviews Grid */}
      <div>
        {loading ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-slate-500">Loading reviews...</p>
          </div>
        ) : filteredReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((review) => (
              <div key={review.id}>
                <ReviewCard review={review} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-slate-600 text-lg">
              {selectedSentiment === "all"
                ? "No reviews yet. Keep up the great work!"
                : "No reviews found for the selected filter."}
            </p>
            {selectedSentiment !== "all" && (
              <button
                onClick={() => setSelectedSentiment("all")}
                className="mt-4 text-brand-primary hover:underline font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealerReviews;
