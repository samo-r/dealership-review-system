import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import positive_icon from "../assets/positive.png";
import neutral_icon from "../assets/neutral.png";
import negative_icon from "../assets/negative.png";
import { useAuth } from "../../context/AuthContext";
import { hasCapability } from "../../utils/roleCapabilities";

const Dealer = () => {
  const { user, role } = useAuth();
  const { id } = useParams();

  const [dealer, setDealer] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loadingDealer, setLoadingDealer] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const canReview = Boolean(user) && hasCapability(role, "review.create");

  const sentiIcon = (sentiment) =>
    sentiment === "positive"
      ? positive_icon
      : sentiment === "negative"
      ? negative_icon
      : neutral_icon;

  useEffect(() => {
    const fetchDealer = async () => {
      try {
        const res = await fetch(`/djangoapp/dealer/${id}`);
        const data = await res.json();
        if (data.status === 200 && Array.isArray(data.dealer)) {
          setDealer(data.dealer[0] || null);
        }
      } catch (error) {
        console.error("Failed to load dealer:", error);
      } finally {
        setLoadingDealer(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await fetch(`/djangoapp/reviews/dealer/${id}`);
        const data = await res.json();
        if (data.status === 200 && Array.isArray(data.reviews)) {
          setReviews(data.reviews);
        }
      } catch (error) {
        console.error("Failed to load reviews:", error);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchDealer();
    fetchReviews();
  }, [id]);

  return (
    <div className="w-full">
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-primary">
                Dealership details
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                {loadingDealer
                  ? "Loading dealership..."
                  : dealer?.full_name || "Dealer not found"}
              </h1>
              {dealer && (
                <p className="mt-2 text-sm text-slate-600">
                  {dealer.district || dealer.city}
                  {(dealer.physical_address || dealer.address)
                    ? ` • ${dealer.physical_address || dealer.address}`
                    : ""}
                </p>
              )}
            </div>

            {canReview && (
              <Link
                to={`/postreview/${id}`}
                className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
              >
                Add Review
              </Link>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Customer reviews</h2>
            <p className="mt-2 text-sm text-slate-600">
              Read feedback from customers who visited this dealer.
            </p>
          </div>

          {loadingReviews ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Loading reviews...
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-lg font-semibold text-slate-900">No reviews yet</p>
              <p className="mt-2 text-sm text-slate-600">
                Be the first to share your experience at this dealership.
              </p>
              {canReview && (
                <Link
                  to={`/postreview/${id}`}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  Add the first review
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6">
              {reviews.map((review, index) => (
                <article
                  key={review.id ?? index}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={sentiIcon(review.sentiment)}
                      alt={review.sentiment || "review sentiment"}
                      className="h-11 w-11 rounded-full border border-slate-200 bg-slate-100 p-2"
                    />
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{review.name}</p>
                      <p className="text-sm text-slate-500">
                        {review.car_make} {review.car_model}
                        {review.car_year ? ` • ${review.car_year}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 rounded-3xl bg-slate-50 p-5 text-slate-700">
                    <p>{review.review}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dealer;
