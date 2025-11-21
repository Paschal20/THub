import React, { useState, useMemo } from "react";
import {
  useGetActivitiesQuery,
  useDeleteActivityMutation,
  useClearAllActivitiesMutation,
} from "../../../Features/auth/authApi";
import type { Activity } from "../../../Features/Types/types";
import toast from "react-hot-toast";

const History: React.FC = () => {
  const { data, isLoading, isError, refetch } = useGetActivitiesQuery();
  const [deleteActivity] = useDeleteActivityMutation();
  const [clearAllActivities] = useClearAllActivitiesMutation();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Search, sort, filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date-asc" | "date-desc" | "type">(
    "date-desc"
  );
  const [filterType, setFilterType] = useState<string>("all");

  React.useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  const handleDeleteActivity = async (id: string) => {
    try {
      await deleteActivity(id).unwrap();
      toast.success("Activity deleted successfully");
      setShowDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete activity");
    }
  };

  const handleClearAllActivities = async () => {
    try {
      await clearAllActivities().unwrap();
      toast.success("All activities cleared successfully");
      setShowClearConfirm(false);
    } catch {
      toast.error("Failed to clear activities");
    }
  };

  const activities = useMemo(() => {
    return Array.isArray(data) ? data : [];
  }, [data]);

  // Filtered and sorted activities
  const filteredAndSortedActivities = useMemo(() => {
    const filtered = activities.filter((activity) => {
      const matchesSearch =
        searchTerm === "" ||
        activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter =
        filterType === "all" || activity.type === filterType;
      return matchesSearch && matchesFilter;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "date-asc") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      } else if (sortBy === "date-desc") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } else if (sortBy === "type") {
        return a.type.localeCompare(b.type);
      }
      return 0;
    });

    return sorted;
  }, [activities, searchTerm, sortBy, filterType]);

  if (isLoading)
    return <div className="p-4 text-gray-600">Loading activities...</div>;
  if (isError)
    return (
      <div className="p-4 text-red-600">
        ⚠ Could not fetch activities. Please start your backend server.
      </div>
    );

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "reminder":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "quiz":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        );
      case "chat":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case "file":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getActivityColor = (type: Activity["type"]) => {
    switch (type) {
      case "reminder":
        return "bg-blue-100 text-blue-600";
      case "quiz":
        return "bg-purple-100 text-purple-600";
      case "chat":
        return "bg-green-100 text-green-600";
      case "file":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const fmtDate = (date: string) => new Date(date).toLocaleDateString();
  const fmtTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="min-h-full p-4 md:p-6">
      <div className="max-w-4xl mx-auto flex flex-col">
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Activity History
            </h1>
            <p className="text-sm text-gray-500">
              Your complete activity timeline — reminders, quizzes, chats, and
              files
            </p>
          </div>
          {activities.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="bg-red-500 text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 rounded-lg hover:bg-red-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              Clear All History
            </button>
          )}
        </header>

        {/* Search, Sort, Filter Controls */}
        {activities.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date-desc" className="cursor-pointer">Newest First</option>
              <option value="date-asc" className="cursor-pointer">Oldest First</option>
              <option value="type" className="cursor-pointer">By Type</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all" className="cursor-pointer">All Types</option>
              <option value="reminder" className="cursor-pointer">Reminders</option>
              <option value="quiz" className="cursor-pointer">Quizzes</option>
              <option value="chat" className="cursor-pointer">Chats</option>
              <option value="file" className="cursor-pointer">Files</option>
            </select>
          </div>
        )}

        {filteredAndSortedActivities.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500 flex-1">
            <p className="mb-2">No activities found.</p>
            <p className="text-sm">
              {activities.length === 0
                ? "Your activities will appear here once you start using the app."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <ul className="space-y-4">
              {filteredAndSortedActivities.map((activity) => (
                <li
                  key={activity.id}
                  className="bg-white shadow-sm rounded-lg p-4 flex items-start gap-4"
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${getActivityColor(
                      activity.type
                    )}`}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1 ">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <h3 className="text-lg font-medium text-gray-800 max-w-full min-w-0">
                          {activity.title}
                        </h3>
                        <span className="text-xs uppercase font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          {activity.type}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(activity.id)}
                        className="text-red-500 hover:text-red-700 p-2 flex-shrink-0"
                        title="Delete activity"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 "
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 break-words">
                      {activity.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {fmtDate(activity.createdAt)} at{" "}
                      {fmtTime(activity.createdAt)}
                    </p>
                    {activity.type === "reminder" && activity.lastSeen && (
                      <p className="text-sm text-gray-500 mt-1">
                        Last seen: {fmtDate(activity.lastSeen)} at{" "}
                        {fmtTime(activity.lastSeen)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Clear All History
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to clear all your activity history? This
                action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 text-gray-600 border cursor-pointer border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleClearAllActivities()}
                  className="px-4 py-2 bg-red-500 cursor-pointer text-white rounded-lg hover:bg-red-600"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Delete Activity
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this activity? This action
                cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteActivity(showDeleteConfirm)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
