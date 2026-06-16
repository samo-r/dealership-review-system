import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ReviewCard from "../../components/common/ReviewCard";
import { useAuth } from "../../context/AuthContext";

const MyReviews = () => {
  const { user, authHeaders, logout } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSentiment, setSelectedSentiment] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchMyReviews = async () => {
      if (!user?.userName) {
        setReviews([]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${window.location.origin}/djangoapp/reviews/me`, {
          headers: {
            ...authHeaders(),
          },
        });

        if (response.status === 401) {
          logout();
          setReviews([]);
          return;
        }

        const data = await response.json();
        if (data.status !== 200 || !Array.isArray(data.reviews)) {
          setReviews([]);
          return;
        }

        const sortedReviews = [...data.reviews].sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        setReviews(sortedReviews);
      } catch (error) {
        console.error("Could not load customer reviews:", error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyReviews();
  }, [user, authHeaders, logout]);

  const sentimentCounts = useMemo(
    () => ({
      all: reviews.length,
      positive: reviews.filter((review) => review.sentiment === "positive").length,
      neutral: reviews.filter((review) => review.sentiment === "neutral").length,
      negative: reviews.filter((review) => review.sentiment === "negative").length,
    }),
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    const text = query.trim().toLowerCase();
    return reviews.filter((review) => {
      const sentimentMatch =
        selectedSentiment === "all" || review.sentiment === selectedSentiment;
      if (!sentimentMatch) return false;

      if (!text) return true;

      const haystack = [
        review.review,
        review.car_make,
        review.car_model,
        review.car_year,
        review.dealerName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(text);
    });
  }, [reviews, selectedSentiment, query]);

  return (
    <div className="w-full">
      <section className="border-b border-slate-200 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-primary">
            Autocars UG
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">My Reviews</h1>
          <p className="mt-2 text-sm text-slate-600">
            Track every review you have posted on Autocars UG and filter by sentiment.
          </p>
        </div>
      </section>

      <section className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All" },
              { id: "positive", label: "Positive" },
              { id: "neutral", label: "Neutral" },
              { id: "negative", label: "Negative" },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedSentiment(filter.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedSentiment === filter.id
                    ? "bg-brand-primary text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {filter.label} ({sentimentCounts[filter.id]})
              </button>
            ))}
          </div>

          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20 md:max-w-xs"
            placeholder="Search by dealer, car, or text"
          />
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto max-w-6xl px-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              Loading your reviews...
            </div>
          ) : filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredReviews.map((review) => (
                <div key={review.id} className="flex flex-col">
                  <ReviewCard review={review} />
                  <p className="mt-2 px-1 text-xs text-slate-500">
                    Dealer: <strong>{review.dealerName}</strong>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <h2 className="text-xl font-semibold text-slate-900">No reviews found</h2>
              <p className="mt-2 text-sm text-slate-600">
                {reviews.length === 0
                  ? "You have not posted any reviews yet."
                  : "No results match your current filters."}
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => {
                    setSelectedSentiment("all");
                    setQuery("");
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Clear filters
                </button>
                <Link
                  to="/dealers"
                  className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  Browse dealers
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MyReviews;
