import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";

import Button from "../../../Components/Button";
import {
  useAddReminderMutation,
  useUpdateReminderMutation,
  useGetRemindersQuery,
  useDeleteReminderMutation,
} from "../../../Features/auth/authApi";
import toast from "react-hot-toast";

interface StudyEvent {
  id: string;
  title: string;
  time: string;
  type: "class" | "study" | "assignment" | "others";
  date: string;
}

interface EventsByDate {
  [key: string]: StudyEvent[];
}

// Helper functions
const getRoundedTime = (): string => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 15) * 15;
  now.setMinutes(roundedMinutes);
  now.setSeconds(0);
  return now.toTimeString().slice(0, 5);
};

const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const stringToDate = (dateString: string): Date => {
  const parts = dateString.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  return new Date(year, month, day);
};

const isEventInPast = (eventDate: string, eventTime: string): boolean => {
  const selectedDate = stringToDate(eventDate);
  const [hours, minutes] = eventTime.split(":").map(Number);
  selectedDate.setHours(hours, minutes, 0, 0);
  const now = new Date();
  return selectedDate < now;
};

const EventManagementPage: React.FC = () => {
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<StudyEvent | null>(null);
  const [newEvent, setNewEvent] = useState<{
    title: string;
    time: string;
    date: string;
    type: "class" | "study" | "assignment" | "others";
  }>({
    title: "",
    time: getRoundedTime(),
    date: getTodayDateString(),
    type: "class",
  });
  const [error, setError] = useState<string>("");
  const modalRef = useRef<HTMLDivElement>(null);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: reminders, isLoading: isLoadingReminders } = useGetRemindersQuery();

  console.log("EventManagementPage: reminders", reminders);
  console.log("EventManagementPage: isLoadingReminders", isLoadingReminders);

  const [addReminder, { isLoading: isAdding }] = useAddReminderMutation();
  const [updateReminder, { isLoading: isUpdating }] = useUpdateReminderMutation();
  const [deleteReminder, { isLoading: isDeleting }] = useDeleteReminderMutation();

  const events: EventsByDate = useMemo(() => {
    const eventsByDate: EventsByDate = {};
    if (reminders) {
      reminders.forEach((reminder) => {
        try {
          const datetime = new Date(reminder.datetime);
          if (isNaN(datetime.getTime())) {
            console.warn(
              `Invalid datetime for reminder ${reminder._id}: ${reminder.datetime}`
            );
            return;
          }
          const date = datetime.toISOString().split("T")[0];
          const time = datetime.toTimeString().slice(0, 5);
          const event: StudyEvent = {
            id: reminder._id,
            title: reminder.title,
            time,
            date,
            type: "others",
          };
          if (!eventsByDate[date]) {
            eventsByDate[date] = [];
          }
          eventsByDate[date].push(event);
        } catch (error) {
          console.error(`Error processing reminder ${reminder._id}:`, error);
        }
      });
    }
    return eventsByDate;
  }, [reminders]);

  const month = currentDate.toLocaleString("default", { month: "short" });
  const year = currentDate.getFullYear();

  const getCalendarDays = (): (Date | null)[] => {
    const firstDay = new Date(year, currentDate.getMonth(), 1);
    const lastDay = new Date(year, currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return [
      ...Array(startingDay).fill(null),
      ...Array.from(
        { length: daysInMonth },
        (_, i) => new Date(year, currentDate.getMonth(), i + 1)
      ),
    ];
  };

  const hasEventsOnDate = (date: Date): boolean =>
    !!events[dateToString(date)]?.length;

  const isToday = (date: Date): boolean =>
    date.toDateString() === new Date().toDateString();

  const isSelectedDate = (date: Date): boolean =>
    date.toDateString() === selectedDate.toDateString();

  const formatDisplayDate = (dateString: string): string => {
    const date = stringToDate(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleCloseAddEditModal = useCallback((): void => {
    setShowAddEditModal(false);
    setEditingEvent(null);
    setNewEvent({
      title: "",
      time: getRoundedTime(),
      date: dateToString(selectedDate),
      type: "class",
    });
    setError("");
  }, [selectedDate]);

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleCloseAddEditModal();
      }
    };

    if (showAddEditModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddEditModal, handleCloseAddEditModal]);

  const saveEvent = async (): Promise<void> => {
    if (!newEvent.title.trim()) {
      setError("Please input event title");
      return;
    }

    if (isEventInPast(newEvent.date, newEvent.time)) {
      setError(
        "Cannot add events in the past. Please select a future date and time."
      );
      return;
    }

    const datetime = new Date(
      `${newEvent.date}T${newEvent.time}`
    ).toISOString();

    try {
      if (editingEvent) {
        await updateReminder({
          id: editingEvent.id,
          title: newEvent.title.trim(),
          datetime,
        }).unwrap();
      } else {
        await addReminder({ title: newEvent.title.trim(), datetime }).unwrap();
      }
      toast.success(editingEvent ? "Event updated successfully!" : "Event added successfully!");
      handleCloseAddEditModal();
    } catch (err: unknown) {
      const errorMessage =
        (err as { data?: { message?: string } })?.data?.message ||
        "Failed to save event";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const startEditingEvent = (event: StudyEvent): void => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      time: event.time,
      date: event.date,
      type: event.type,
    });
    setShowAddEditModal(true);
    setError("");
  };

  const handleDeleteEvent = async (event: StudyEvent, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    try {
      await deleteReminder(event.id).unwrap();
      toast.success("Event deleted successfully!");
    } catch (err: unknown) {
      console.error("Failed to delete event:", err);
      toast.error("Failed to delete event");
    }
  };

  const allEvents = useMemo(() => Object.entries(events)
    .flatMap(([date, events]) => events.map((event) => ({ ...event, date })))
    .sort((a, b) => {
      const dateA = stringToDate(a.date);
      const [hoursA, minutesA] = a.time.split(":").map(Number);
      dateA.setHours(hoursA, minutesA, 0, 0);

      const dateB = stringToDate(b.date);
      const [hoursB, minutesB] = b.time.split(":").map(Number);
      dateB.setHours(hoursB, minutesB, 0, 0);

      return dateA.getTime() - dateB.getTime();
    }), [events]);

  const calendarDays = getCalendarDays();
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className=" p-1 min-h-screen">
      <div className="max-w-4xl mx-auto rounded-lg">
        <h1 className="text-[15px] font-medium text-gray-900 mb-6">Event Management</h1>

        {/* Calendar Display */}

        {/* Calendar Display */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <div className="font-poppins font-semibold text-[#102844]">
              {month} {year}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  setCurrentDate(new Date(year, currentDate.getMonth() - 1, 1))
                }
                className="w-5 h-5 flex items-center justify-center bg-gray-50 rounded text-[#102844] hover:bg-[#0D9165] hover:text-white"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  setCurrentDate(new Date(year, currentDate.getMonth() + 1, 1))
                }
                className="w-5 h-5 flex items-center justify-center bg-gray-50 rounded text-[#102844] hover:bg-[#0D9165] hover:text-white"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-3">
            {dayNames.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className="text-center font-semibold text-[#767278] py-1 text-[10px]"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((day, i) =>
              day ? (
                <div
                  key={i}
                  className={`aspect-square flex items-center justify-center rounded text-[10px] cursor-pointer transition-all
                    ${isToday(day) ? "border border-[#0D9165]" : ""}
                    ${
                      isSelectedDate(day)
                        ? "bg-[#0D9165] text-white"
                        : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="flex flex-col items-center">
                    <span>{day.getDate()}</span>
                    {hasEventsOnDate(day) && (
                      <div
                        className={`w-1 h-1 rounded-full mt-0.5 ${
                          isSelectedDate(day) ? "bg-white" : "bg-[#0D9165]"
                        }`}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div key={i} className="aspect-square" />
              )
            )}
          </div>
        </div>

        {/* Add Event Button */}
        <div className="mb-3 w-full flex justify-center">

          <Button
            size="small"
            text="+ Add New Event"
            onClick={() => {
              setEditingEvent(null);
              setNewEvent({
                title: "",
                time: getRoundedTime(),
                date: getTodayDateString(),
                type: "class",
              });
              setShowAddEditModal(true);
              setError("");
            }}
         />
        </div>

        {/* Upcoming Events List */}
        <h2 className="text-[17px] text-center font-medium text-gray-900 mb-4">Upcoming Events</h2>
        <div className="space-y-2 flex flex-col items-center">
          {allEvents.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No upcoming events</div>
          ) : (
            allEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-2 p-3 bg-[#0D9165] text-white rounded-lg shadow-sm cursor-pointer hover:bg-[#17B883] transition-colors group relative"
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {event.time} - {event.title}
                  </div>
                  <div className="text-xs text-gray-200">
                    {formatDisplayDate(event.date)}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingEvent(event);
                    }}
                    className="w-7 h-7 rounded-full text-white flex items-center justify-center text-sm hover:bg-white hover:text-[#0D9165]"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => handleDeleteEvent(event, e)}
                    disabled={isDeleting}
                    className="w-7 h-7 rounded-full text-white flex items-center justify-center text-sm hover:bg-white hover:text-[#0D9165] disabled:opacity-50"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Event Modal */}
        {showAddEditModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              ref={modalRef}
              className="bg-white rounded-xl shadow-lg p-6 text-center max-w-sm w-full"
            >
              <h3 className="font-semibold text-gray-800 mb-4">
                {editingEvent ? "Edit Event" : "Add Event"}
              </h3>

              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Event title"
                    value={newEvent.title}
                    onChange={(e) => {
                      setNewEvent((prev) => ({ ...prev, title: e.target.value }));
                      if (error) setError("");
                    }}
                    className={`w-full p-2 border rounded text-sm ${
                      error ? "border-red-500" : "border-gray-200"
                    }`}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1 text-left">{error}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent((prev) => ({ ...prev, date: e.target.value }))
                    }
                    min={getTodayDateString()}
                    className="flex-1 p-2 border border-gray-200 rounded text-sm cursor-pointer"
                  />
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) =>
                      setNewEvent((prev) => ({ ...prev, time: e.target.value }))
                    }
                    className="flex-1 p-2 border border-gray-200 rounded text-sm cursor-pointer"
                  />
                </div>

                <select
                  value={newEvent.type}
                  onChange={(e) =>
                    setNewEvent((prev) => ({
                      ...prev,
                      type: e.target.value as
                        | "class"
                        | "study"
                        | "assignment"
                        | "others",
                    }))
                  }
                  className="w-full p-2 border border-gray-200 rounded text-sm cursor-pointer"
                >
                  <option value="class">Class</option>
                  <option value="study">Study</option>
                  <option value="assignment">Assignment</option>
                  <option value="others">Others</option>
                </select>
              </div>

              <div className="mt-6 flex gap-4 justify-center">
                <Button onClick={handleCloseAddEditModal} text="Cancel" />

                <Button onClick={saveEvent} disabled={isAdding || isUpdating} text={editingEvent ? "Update" : "Save"} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventManagementPage;
