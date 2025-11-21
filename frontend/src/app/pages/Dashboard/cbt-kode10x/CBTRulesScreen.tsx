export default function CBTRulesScreen({ onStartQuiz }) {
  return (
    <div className="space-y-8 py-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">CBT Quiz Rules</h1>
        <p className="text-gray-600">Please read the rules carefully before starting</p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md overflow-hidden border border-emerald-100">
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            CBT Guidelines
          </div>
        </div>

        <div className="px-6 py-6 space-y-4">
          <div className="space-y-4">
            {[
              "You will have 5 minutes to complete the entire quiz.",
              "The quiz consists of multiple-choice questions with options A, B, C, and D.",
              "You can navigate between questions using the Previous and Next buttons.",
              "Each question has only one correct answer. Select the option you believe is correct.",
            ].map((rule, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="bg-emerald-100 text-emerald-800 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                  {index + 1}
                </div>
                <p>{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-emerald-100 px-6 py-4 flex justify-center">
          <button
            onClick={onStartQuiz}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-8 rounded-lg transition-colors"
          >
            Select Subject
          </button>
        </div>
      </div>
    </div>
  );
}