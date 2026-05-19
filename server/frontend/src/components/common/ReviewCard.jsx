import React from "react";

/**
 * ReviewCard — displays a single review.
 * Reused on:
 *   - Home page "Wall of Love"
 *   - /reviews public list
 *   - Dealer's private review feed
 *   - Admin moderation view
 *
 * Props:
 *   review: { review, car_make, car_model, car_year, author_username, sentiment }
 *   onDelete?: (reviewId) => void  — delete callback (optional, for admin)
 *   showDeleteButton?: boolean  — show delete button if onDelete is present
 */
const ReviewCard = ({ review, onDelete, showDeleteButton = false }) => {
  if (!review) return null;

  // Map sentiment to star count and color
  const sentimentMap = {
    positive: { stars: 5, color: "text-yellow-400", bgColor: "bg-yellow-50" },
    neutral: { stars: 3, color: "text-slate-400", bgColor: "bg-slate-50" },
    negative: { stars: 1, color: "text-red-400", bgColor: "bg-red-50" },
  };

  const sentiment = review.sentiment || "neutral";
  const { stars, color, bgColor } = sentimentMap[sentiment] || sentimentMap.neutral;

  return (
    <div className={`${bgColor} rounded-lg p-4 border border-slate-200`}>
      {/* Header: Stars + Car info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-1 mb-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`h-4 w-4 ${i < stars ? color : "text-slate-300"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-xs text-slate-600 font-medium">
            {review.car_make} {review.car_model} ({review.car_year})
          </p>
        </div>

        {/* Delete button (admin only) */}
        {showDeleteButton && onDelete && (
          <button
            onClick={() => onDelete(review.id)}
            className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
          >
            Delete
          </button>
        )}
      </div>

      {/* Review text */}
      <p className="text-sm text-slate-800 mb-3 line-clamp-3">{review.review}</p>

      {/* Footer: Author */}
      <div className="text-xs text-slate-600 border-t border-slate-300 pt-2">
        <strong>{review.author_username || "Anonymous"}</strong>
      </div>
    </div>
  );
};

export default ReviewCard;
