import React, { useEffect, useState } from "react";

/**
 * ReviewCard — displays a single review.
 * Reused on public lists, dealer feeds, and admin moderation.
 *
 * Props:
 *   review: { id, review, car_make, car_model, car_year, author_username, sentiment }
 *   dealerName?: string — dealership context (moderation)
 *   showDeleteButton?: boolean
 *   onDelete?: (reviewId) => void
 *   showEditButton?: boolean
 *   onSaveEdit?: (reviewId, newText) => Promise<boolean>
 */
const ReviewCard = ({
  review,
  dealerName,
  onDelete,
  showDeleteButton = false,
  showEditButton = false,
  onSaveEdit,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(review?.review || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setEditText(review?.review || "");
    }
  }, [review?.review, isEditing]);

  if (!review) return null;

  const sentimentMap = {
    positive: { stars: 5, color: "text-yellow-400", bgColor: "bg-yellow-50" },
    neutral: { stars: 3, color: "text-slate-400", bgColor: "bg-slate-50" },
    negative: { stars: 1, color: "text-red-400", bgColor: "bg-red-50" },
  };

  const sentiment = review.sentiment || "neutral";
  const { stars, color, bgColor } = sentimentMap[sentiment] || sentimentMap.neutral;

  const handleSave = async () => {
    const trimmed = editText.trim();
    if (!trimmed || !onSaveEdit) return;

    setSaving(true);
    try {
      const success = await onSaveEdit(review.id, trimmed);
      if (success) {
        setIsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditText(review.review || "");
    setIsEditing(false);
  };

  return (
    <div className={`${bgColor} rounded-lg p-4 border border-slate-200`}>
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
            {review.car_make} {review.car_model}
            {review.car_year ? ` (${review.car_year})` : ""}
          </p>
          {dealerName && (
            <p className="text-xs text-slate-500 mt-1">
              Dealership: <strong>{dealerName}</strong>
            </p>
          )}
        </div>

        {(showDeleteButton || showEditButton) && (
          <div className="ml-2 flex shrink-0 gap-1">
            {showEditButton && onSaveEdit && !isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors font-medium"
              >
                Edit
              </button>
            )}
            {showDeleteButton && onDelete && !isEditing && (
              <button
                type="button"
                onClick={() => onDelete(review.id)}
                className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors font-medium"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="mb-3">
          <textarea
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !editText.trim()}
              className="px-3 py-1 text-xs font-medium rounded bg-brand-primary text-white hover:bg-brand-dark disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1 text-xs font-medium rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-800 mb-3 line-clamp-3">{review.review}</p>
      )}

      <div className="text-xs text-slate-600 border-t border-slate-300 pt-2">
        <strong>{review.author_username || review.name || "Anonymous"}</strong>
      </div>
    </div>
  );
};

export default ReviewCard;
