import React, { useState } from "react";
import { useAddReminderMutation } from "../../../Features/auth/authApi";

const SetReminder: React.FC = () => {
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");
  const [error, setError] = useState("");

  const [addReminder, { isLoading, isSuccess }] = useAddReminderMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!datetime) {
      setError("Date and time are required");
      return;
    }
    const selectedDate = new Date(datetime);
    if (selectedDate <= new Date()) {
      setError("Date and time must be in the future");
      return;
    }

    try {
      await addReminder({ title: title.trim(), datetime: new Date(datetime).toISOString() }).unwrap();
      // Reset form on success
      setTitle("");
      setDatetime("");
    } catch (err: unknown) {
      setError((err as { data?: { message?: string } })?.data?.message || "Failed to add reminder");
    }
  };

  return (
    <div className="page-container max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">Set Reminder</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter reminder title"
          />
        </div>
        <div>
          <label htmlFor="datetime" className="block text-sm font-medium text-gray-700">
            Date and Time
          </label>
          <input
            type="datetime-local"
            id="datetime"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {isSuccess && <p className="text-green-500 text-sm">Reminder added successfully!</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? "Adding..." : "Add Reminder"}
        </button>
      </form>
    </div>
  );
};

export default SetReminder;
