import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminOverview = () => {
  const { authHeaders, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    dealerships: 0,
    users: 0,
    reviews: 0,
    pendingSentiment: 0,
    failedSentiment: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [dealersRes, usersRes] = await Promise.all([
          fetch(`${window.location.origin}/djangoapp/get_dealers`, {
            headers: { ...authHeaders() },
          }),
          fetch(`${window.location.origin}/djangoapp/admin/users`, {
            headers: { ...authHeaders() },
          }),
        ]);

        if (dealersRes.status === 401 || usersRes.status === 401) {
          logout();
          return;
        }

        const dealersData = await dealersRes.json();
        const usersData = await usersRes.json();

        if (dealersData.status !== 200 || usersData.status !== 200) {
          setError("Unable to load platform overview.");
          return;
        }

        const dealers = dealersData.dealers || [];
        const reviewResponses = await Promise.all(
          dealers.map((dealer) =>
            fetch(`${window.location.origin}/djangoapp/reviews/dealer/${dealer.id}`).then(
              (res) => res.json()
            )
          )
        );

        const allReviews = reviewResponses.flatMap((payload) => payload.reviews || []);
        const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

        allReviews.forEach((review) => {
          const label = review.sentiment;
          if (label && sentimentCounts[label] !== undefined) {
            sentimentCounts[label] += 1;
          }
        });

        setStats({
          dealerships: dealers.length,
          users: (usersData.users || []).length,
          reviews: allReviews.length,
          pendingSentiment: allReviews.filter((r) => r.sentiment_status === "pending").length,
          failedSentiment: allReviews.filter((r) => r.sentiment_status === "failed").length,
          ...sentimentCounts,
        });
      } catch (fetchError) {
        console.error("Failed to load admin overview:", fetchError);
        setError("Unable to load platform overview.");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [authHeaders, logout]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading platform overview...</div>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
    );
  }

  const cards = [
    { label: "Dealerships", value: stats.dealerships, to: "/admin/dealerships" },
    { label: "Users", value: stats.users, to: "/admin/users" },
    { label: "Total Reviews", value: stats.reviews, to: "/reviews" },
    { label: "Pending Sentiment", value: stats.pendingSentiment, to: "/reviews" },
    { label: "Failed Sentiment", value: stats.failedSentiment, to: "/reviews" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">System Admin Overview</h1>
        <p className="mt-1 text-slate-600">
          Platform-wide metrics for dealerships, users, and review sentiment.
        </p>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="rounded-lg bg-white p-5 shadow-md transition hover:shadow-lg"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow-md">
          <p className="text-sm text-slate-500">Positive Reviews</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{stats.positive}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-md">
          <p className="text-sm text-slate-500">Neutral Reviews</p>
          <p className="mt-2 text-2xl font-bold text-slate-600">{stats.neutral}</p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-md">
          <p className="text-sm text-slate-500">Negative Reviews</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{stats.negative}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
