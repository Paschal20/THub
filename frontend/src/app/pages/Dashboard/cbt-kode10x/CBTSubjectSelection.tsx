import { useState, useEffect } from "react";
import axios from "axios";
import { AlertCircle } from "lucide-react";

export default function CBTSubjectSelection({ onSubjectSelected }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          "https://kode10x-quiz-app-backend.onrender.com/api/question/subjects"
        );
        setSubjects(response.data.subjects || []);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError("Failed to load subjects. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const handleContinue = () => {
    if (!selectedSubject) {
      setError("Please select a subject to continue.");
      return;
    }
    localStorage.setItem("cbt_selectedSubject", selectedSubject);
    onSubjectSelected(selectedSubject);
  };

  if (loading) {
    return (
      <div className="text-center py-10 h-[500px] justify-center flex items-center flex-col">
        <svg className="animate-spin h-10 w-10 text-emerald-700" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-2xl text-emerald-700 font-semibold">Loading Subjects...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Select CBT Subject</h1>
        <p className="text-gray-600">Choose a subject to start your CBT quiz</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-emerald-100">
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Available Subjects
          </div>
        </div>

        <div className="px-6 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subjects available at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjects.map((subject, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setSelectedSubject(subject);
                    setError("");
                  }}
                  className={`flex items-center gap-3 border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedSubject === subject
                      ? "border-emerald-500 bg-emerald-50 shadow-md"
                      : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      name="subject"
                      checked={selectedSubject === subject}
                      onChange={() => setSelectedSubject(subject)}
                      className="h-4 w-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                    />
                  </div>
                  <label className="flex-1 cursor-pointer font-medium text-gray-900">
                    {subject}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-emerald-100 px-6 py-4 flex justify-center">
          <button
            onClick={handleContinue}
            disabled={!selectedSubject}
            className={`font-medium py-2 px-8 rounded-lg transition-colors ${
              selectedSubject
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Start CBT Quiz
          </button>
        </div>
      </div>
    </div>
  );
}