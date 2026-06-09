import React from "react";

/**
 * Aggregated sentiment summary for review list pages.
 */
const ReviewSummaryCard = ({ sentimentCounts, totalCount, title = "Review Summary" }) => {
  const total = totalCount ?? sentimentCounts?.all ?? 0;

  if (total <= 0) {
    return null;
  }

  const positive = sentimentCounts.positive ?? 0;
  const neutral = sentimentCounts.neutral ?? 0;
  const negative = sentimentCounts.negative ?? 0;

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h3 className="mb-4 text-lg font-bold text-slate-900">{title}</h3>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <p className="mt-1 text-sm text-slate-600">Total Reviews</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{positive}</p>
          <p className="mt-1 text-sm text-slate-600">5-Star Reviews</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-600">{neutral}</p>
          <p className="mt-1 text-sm text-slate-600">Neutral Reviews</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">{negative}</p>
          <p className="mt-1 text-sm text-slate-600">Negative Reviews</p>
        </div>
      </div>

      <div className="mt-6 flex h-3 gap-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="bg-green-600"
          style={{ width: `${(positive / total) * 100}%` }}
        />
        <div
          className="bg-yellow-600"
          style={{ width: `${(neutral / total) * 100}%` }}
        />
        <div
          className="bg-red-600"
          style={{ width: `${(negative / total) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default ReviewSummaryCard;
