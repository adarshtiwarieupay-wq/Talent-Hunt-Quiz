"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Question {
  _id: string;
  section: string;
  questionText: string;
  options: string[];
}

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const answersRef = useRef(answers);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const performSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setShowSubmitModal(false);
    setIsSubmitting(true);

    const token = localStorage.getItem("quizToken");
    
    const formattedAnswers = Object.keys(answersRef.current).map(qId => ({
      questionId: qId,
      selectedOption: answersRef.current[qId]
    }));

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ answers: formattedAnswers })
      });
      
      const result = await res.json();
      
      if (res.ok) {
        localStorage.setItem("quizResult", JSON.stringify(result));
        router.push("/result");
      } else {
        alert(result.error || "Submission failed");
        setIsSubmitting(false);
      }
    } catch (err) {
      alert("An error occurred during submission.");
      setIsSubmitting(false);
    }
  }, [isSubmitting, router]);

  useEffect(() => {
    // Disable Back Button
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    
    // Disable Page Reload/Leave Warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; 
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Track Fullscreen
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to enable fullscreen:", err);
    }
  };

  useEffect(() => {
    const dataStr = localStorage.getItem("quizData");
    if (!dataStr) {
      router.push("/");
      return;
    }

    const data = JSON.parse(dataStr);
    setQuestions(data.questions);

    const startTime = new Date(data.startTime).getTime();
    const durationMs = data.durationMinutes * 60 * 1000;
    const endTime = startTime + durationMs;

    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        performSubmit();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [router, performSubmit]);

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  if (questions.length === 0 || timeLeft === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-[#0055A4] font-bold text-xl">Chargement (Loading)...</div>;
  }

  if (!isFullscreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900 p-6 relative">
        <div className="absolute top-6 left-6">
          <img src="/comapnyLogo/FullLogo.png" alt="Company Logo" className="h-8 object-contain" />
        </div>
        <div className="bg-white p-10 rounded-3xl border border-gray-200 text-center shadow-2xl max-w-lg w-full">
          <h2 className="text-3xl font-bold mb-4 text-[#EF4135]">Strict Environment</h2>
          <p className="text-gray-600 mb-8 text-lg">You must complete the test in fullscreen mode. Do not exit fullscreen or attempt to go back, or your test will be interrupted.</p>
          <button 
            onClick={requestFullscreen}
            className="w-full py-4 bg-[#0055A4] hover:bg-[#004488] rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 text-lg transition-all"
          >
            Enter Fullscreen to Continue
          </button>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col md:flex-row-reverse relative">


      <aside className="w-full md:w-80 bg-white p-6 md:border-l border-b md:border-b-0 border-gray-200 flex flex-col shadow-xl z-10 pt-10">
        <div className="mb-6 flex justify-center">
          <img src="/comapnyLogo/FullLogo.png" alt="Company Logo" className="h-10 object-contain" />
        </div>
        <div className="mb-8 text-center bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wider">Time Remaining</div>
          <div className={`text-4xl font-mono font-bold ${timeLeft < 300 ? 'text-[#EF4135] animate-pulse drop-shadow-sm' : 'text-[#0055A4] drop-shadow-sm'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <h3 className="text-xs font-extrabold text-gray-400 mb-4 uppercase tracking-widest text-center">Questions</h3>
          <div className="grid grid-cols-5 gap-2 p-2">
            {questions.map((q, idx) => {
              const isAnswered = !!answers[q._id];
              const isCurrent = idx === currentIndex;
              
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`
                    w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-300
                    ${isCurrent ? 'ring-2 ring-[#EF4135] ring-offset-2 ring-offset-white scale-110 shadow-md z-10' : 'hover:scale-105'}
                    ${isAnswered ? 'bg-[#0055A4] text-white shadow-blue-500/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'}
                  `}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="mt-6 w-full py-4 bg-[#EF4135] hover:bg-[#d63a2f] text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {isSubmitting ? "Submitting..." : "Submit Test"}
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-gray-50 pt-12 md:pt-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <span className="inline-block px-4 py-1.5 bg-blue-50 text-[#0055A4] text-sm font-extrabold rounded-full border border-blue-100 shadow-sm tracking-wide uppercase">
              {currentQuestion.section}
            </span>
            <span className="text-gray-500 font-bold font-mono text-sm bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-extrabold mb-10 leading-relaxed text-gray-900">
            {currentQuestion.questionText}
          </h2>

          <div className="space-y-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestion._id] === option;
              return (
                <div
                  key={idx}
                  onClick={() => setAnswers(prev => ({ ...prev, [currentQuestion._id]: option }))}
                  className={`
                    flex items-center p-5 rounded-2xl cursor-pointer border-2 transition-all duration-200 bg-white
                    ${isSelected 
                      ? 'border-[#0055A4] bg-blue-50/50 shadow-md transform scale-[1.01]' 
                      : 'border-gray-200 hover:border-[#0055A4]/40 hover:bg-gray-50'}
                  `}
                >
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 mr-4 transition-colors ${isSelected ? 'border-[#0055A4] bg-[#0055A4]' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  <span className={`text-lg transition-colors ${isSelected ? 'text-[#0055A4] font-bold' : 'text-gray-700 font-medium'}`}>
                    {option}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-16 flex justify-between items-center border-t border-gray-200 pt-8">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-8 py-3.5 bg-white border border-gray-300 text-gray-600 hover:text-gray-900 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-bold transition-all shadow-sm"
            >
              Previous
            </button>
            
            {!isLastQuestion ? (
              <button
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
                className="px-8 py-3.5 bg-[#0055A4] hover:bg-[#004488] rounded-xl font-bold text-white shadow-md shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3.5 bg-[#EF4135] hover:bg-[#d63a2f] rounded-xl font-bold text-white shadow-md shadow-red-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl transform scale-100 transition-transform">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#EF4135]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">Submit Test?</h3>
            <p className="text-center text-gray-600 mb-8 font-medium">
              Are you sure you want to submit your test? You will not be able to change your answers later.
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={performSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#EF4135] hover:bg-[#d63a2f] text-white rounded-xl font-bold text-lg shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                Yes, Submit Test
              </button>
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
