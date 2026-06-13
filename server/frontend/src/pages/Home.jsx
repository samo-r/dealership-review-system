import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DealershipCard from "../components/common/DealershipCard";
import ReviewCard from "../components/common/ReviewCard";

/**
 * Home page — landing page with:
 *   - Hero section
 *   - Dealership carousel (4-6 cards)
 *   - Wall of Love (5-star reviews)
 */
const Home = () => {
  const [dealerships, setDealerships] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dealerships
        const dealeRes = await fetch(
          `${window.location.origin}/djangoapp/get_dealers`
        );
        const dealeData = await dealeRes.json();
        const dealershipList = dealeData.status === 200 ? dealeData.dealers || [] : [];
        if (dealeData.status === 200) {
          setDealerships(dealershipList.slice(0, 6));
        }

        const reviewBatches = await Promise.all(
          dealershipList.map(async (dealer) => {
            try {
              const reviewRes = await fetch(
                `${window.location.origin}/djangoapp/reviews/dealer/${dealer.id}`
              );
              const reviewData = await reviewRes.json();
              if (reviewData.status === 200 && reviewData.reviews) {
                return reviewData.reviews
                  .filter((review) => review.sentiment === "positive")
                  .map((review) => ({
                    ...review,
                    dealerName: dealer.full_name,
                  }));
              }
            } catch (reviewError) {
              console.error(`Error fetching reviews for dealer ${dealer.id}:`, reviewError);
            }
            return [];
          })
        );

        const allPositiveReviews = reviewBatches.flat();

        allPositiveReviews.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        setReviews(allPositiveReviews.slice(0, 5));
      } catch (err) {
        console.error("Error fetching home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="w-full bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-brand-primary to-brand-dark text-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4">Autocars UG</h1>
          <p className="text-xl text-brand-light mb-8">
            Transparent reviews. Real customer feedback. Find your perfect
            dealership today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/dealers"
              className="px-8 py-3 bg-white text-brand-primary rounded-lg font-bold hover:bg-brand-light transition-colors"
            >
              Browse Dealerships
            </Link>
            <Link
              to="/reviews"
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-bold hover:bg-white hover:text-brand-primary transition-colors"
            >
              Read Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* Dealership Carousel */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Featured Dealerships
          </h2>
          <p className="text-slate-600 mb-8">
            Browse trusted dealerships in your area
          </p>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-500">Loading dealerships...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {dealerships.length > 0 ? (
                  dealerships.map((dealer) => (
                    <DealershipCard key={dealer.id} dealer={dealer} />
                  ))
                ) : (
                  <p className="text-slate-500">No dealerships available.</p>
                )}
              </div>
              <div className="text-center">
                <Link
                  to="/dealers"
                  className="inline-flex items-center px-6 py-3 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-dark transition-colors"
                >
                  View All Dealerships
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Wall of Love — Top Reviews */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Wall of Love
          </h2>
          <p className="text-slate-600 mb-8">
            See what customers are saying about our dealerships
          </p>

          {loading ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-500">Loading reviews...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} dealerName={review.dealerName} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-500">No reviews yet.</p>
              <p className="text-slate-400 text-sm mt-2">
                Be the first to share your experience!
              </p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/reviews"
              className="inline-flex items-center px-6 py-3 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-dark transition-colors"
            >
              Read All Reviews
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-100 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">
            Share Your Experience
          </h2>
          <p className="text-slate-600 mb-8">
            Help other customers make informed decisions. Leave a review today.
          </p>
          <Link
            to="/dealers"
            className="inline-flex items-center px-8 py-3 bg-brand-primary text-white rounded-lg font-bold hover:bg-brand-dark transition-colors"
          >
            Start Reviewing
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;
