import { djangoApiUrl } from "../utils/djangoApi";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ReviewCard from "../components/common/ReviewCard";

/**
 * Reviews page — public list of all reviews across all dealerships
 */
const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSentiment, setSelectedSentiment] = useState("all");

  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        // First, get all dealerships
        const dealeRes = await fetch(
          djangoApiUrl(`/djangoapp/get_dealers`)
        );
        const dealeData = await dealeRes.json();
        if (dealeData.status !== 200) {
          setLoading(false);
          return;
        }

        const dealerships = dealeData.dealers || [];

        // Fetch reviews for each dealership and combine
        const allReviews = [];
        for (const dealer of dealerships) {
          try {
            const reviewRes = await fetch(
              djangoApiUrl(`/djangoapp/reviews/dealer/${dealer.id}`)
            );
            const reviewData = await reviewRes.json();
            if (reviewData.status === 200 && reviewData.reviews) {
              allReviews.push(
                ...reviewData.reviews.map((r) => ({
                  ...r,
                  dealerName: dealer.full_name,
                }))
              );
            }
          } catch (err) {
            console.error(`Error fetching reviews for dealer ${dealer.id}:`, err);
          }
        }

        // Sort by newest first
        allReviews.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        setReviews(allReviews);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllReviews();
  }, []);

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

  return (
    <div className="w-full">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-primary mb-2">
            Autocars UG
          </p>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Customer Reviews
          </h1>
          <p className="text-slate-600">
            Transparent feedback from real customers about their dealership
            experience on Autocars UG.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-slate-200 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4">
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
      </section>

      {/* Reviews Grid */}
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Loading reviews...</p>
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReviews.map((review) => (
                <div key={review.id} className="flex flex-col">
                  <ReviewCard review={review} />
                  <p className="text-xs text-slate-500 mt-2 px-1">
                    @ <strong>{review.dealerName}</strong>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-slate-600 text-lg">
                No reviews found for the selected filter.
              </p>
              <button
                onClick={() => setSelectedSentiment("all")}
                className="mt-4 text-brand-primary hover:underline font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-primary text-white py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Have a story to share?</h2>
          <p className="text-brand-light mb-6">
            Tell other customers about your dealership experience.
          </p>
          <Link
            to="/dealers"
            className="inline-flex items-center px-8 py-3 bg-white text-brand-primary rounded-lg font-bold hover:bg-brand-light transition-colors"
          >
            Write a Review
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Reviews;
