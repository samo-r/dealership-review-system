import { getApiUrl } from "../../utils/apiBridge";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ReviewCard from "../../components/common/ReviewCard";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";

const AdminModeration = () => {
  const { authHeaders, logout } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedSentiment, setSelectedSentiment] = useState("all");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const dealersRes = await fetch(getApiUrl(`/djangoapp/get_dealers`), {
        headers: { ...authHeaders() },
      });

      if (dealersRes.status === 401) {
        logout();
        return;
      }

      const dealersData = await dealersRes.json();
      if (dealersData.status !== 200) {
        setError("Unable to load reviews for moderation.");
        return;
      }

      const dealerships = dealersData.dealers || [];
      const allReviews = [];

      for (const dealer of dealerships) {
        try {
          const reviewRes = await fetch(
            getApiUrl(`/djangoapp/reviews/dealer/${dealer.id}`)
          );
          const reviewData = await reviewRes.json();
          if (reviewData.status === 200 && reviewData.reviews) {
            allReviews.push(
              ...reviewData.reviews.map((item) => ({
                ...item,
                dealerName: dealer.full_name,
                dealershipId: dealer.id,
              }))
            );
          }
        } catch (fetchError) {
          console.error(`Error fetching reviews for dealer ${dealer.id}:`, fetchError);
        }
      }

      allReviews.sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
      setReviews(allReviews);
    } catch (fetchError) {
      console.error("Failed to load moderation feed:", fetchError);
      setError("Unable to load reviews for moderation.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders, logout]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const sentimentCounts = useMemo(
    () => ({
      all: reviews.length,
      positive: reviews.filter((r) => r.sentiment === "positive").length,
      neutral: reviews.filter((r) => r.sentiment === "neutral").length,
      negative: reviews.filter((r) => r.sentiment === "negative").length,
    }),
    [reviews]
  );

  const filteredReviews = useMemo(() => {
    if (selectedSentiment === "all") return reviews;
    return reviews.filter((r) => r.sentiment === selectedSentiment);
  }, [reviews, selectedSentiment]);

  const handleDeleteRequest = (reviewId) => {
    setActionError("");
    setPendingDeleteId(reviewId);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;

    setDeleting(true);
    setActionError("");
    try {
      const response = await fetch(
        getApiUrl(`/djangoapp/reviews/${pendingDeleteId}/delete`),
        {
          method: "DELETE",
          headers: { ...authHeaders() },
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();
      if (response.status === 200) {
        setReviews((current) => current.filter((r) => r.id !== pendingDeleteId));
        setPendingDeleteId(null);
        return;
      }

      setActionError(data.error?.message || "Failed to delete review.");
    } catch (deleteError) {
      console.error("Delete review failed:", deleteError);
      setActionError("Failed to delete review.");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveEdit = async (reviewId, newText) => {
    setActionError("");
    try {
      const response = await fetch(
        getApiUrl(`/djangoapp/reviews/${reviewId}/update`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders(),
          },
          body: JSON.stringify({ review: newText }),
        }
      );

      if (response.status === 401) {
        logout();
        return false;
      }

      const data = await response.json();
      if (response.status === 200) {
        setReviews((current) =>
          current.map((item) =>
            item.id === reviewId ? { ...item, review: newText } : item
          )
        );
        return true;
      }

      setActionError(data.error?.message || "Failed to update review.");
      return false;
    } catch (updateError) {
      console.error("Update review failed:", updateError);
      setActionError("Failed to update review.");
      return false;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Platform Moderation Console</h1>
        <p className="mt-1 text-slate-600">
          Browse, edit, and remove customer reviews across all dealerships.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-md">
          <p className="text-sm text-slate-500">Total Reviews</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{sentimentCounts.all}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-md">
          <p className="text-sm text-slate-500">Positive</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{sentimentCounts.positive}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-md">
          <p className="text-sm text-slate-500">Neutral</p>
          <p className="mt-1 text-2xl font-bold text-slate-600">{sentimentCounts.neutral}</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-md">
          <p className="text-sm text-slate-500">Negative</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{sentimentCounts.negative}</p>
        </div>
      </div>

      <div className="mb-6 rounded-lg bg-white p-4 shadow-md">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Reviews" },
            { id: "positive", label: "5 Stars" },
            { id: "neutral", label: "3 Stars" },
            { id: "negative", label: "1 Star" },
          ].map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setSelectedSentiment(filter.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
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

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {actionError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg bg-white p-8 text-center text-slate-500 shadow-md">
          Loading reviews...
        </div>
      ) : filteredReviews.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              dealerName={review.dealerName}
              showDeleteButton
              showEditButton
              onDelete={handleDeleteRequest}
              onSaveEdit={handleSaveEdit}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-white p-8 text-center shadow-md">
          <p className="text-slate-600">No reviews found for the selected filter.</p>
          {selectedSentiment !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedSentiment("all")}
              className="mt-4 text-sm font-medium text-brand-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete review"
        message="Are you sure you want to remove this review? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!deleting) setPendingDeleteId(null);
        }}
      />
    </div>
  );
};

export default AdminModeration;
