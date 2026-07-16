"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const resultStr = localStorage.getItem("quizResult");
    if (!resultStr) {
      router.push("/");
      return;
    }
    
    // Clear local storage to prevent retaking via back button
    localStorage.removeItem("quizData");
    localStorage.removeItem("quizToken");
    
    setResult(JSON.parse(resultStr));
  }, [router]);

  if (!result) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-[#0055A4] font-bold text-xl">Chargement...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50 relative overflow-hidden">
      


      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center">
        
        <div className="flex justify-center mb-8">
          <img src="/comapnyLogo/FullLogo.png" alt="Company Logo" className="h-12 object-contain" />
        </div>

        {result.passed ? (
          <div>
            <div className="w-24 h-24 bg-blue-50 text-[#0055A4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(0,85,164,0.15)] border border-blue-100">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Félicitations!</h1>
            <p className="text-gray-500 mb-8 font-medium">You have successfully cleared the first round.</p>
          </div>
        ) : (
          <div>
            <div className="w-24 h-24 bg-red-50 text-[#EF4135] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(239,65,53,0.15)] border border-red-100">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Keep Learning</h1>
            <p className="text-gray-500 mb-8 font-medium">Unfortunately, you did not meet the required score.</p>
          </div>
        )}

        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 mb-2 shadow-inner">
          <div className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Your Score</div>
          <div className={`text-6xl font-black ${result.passed ? 'text-[#0055A4]' : 'text-[#EF4135]'}`}>
            {result.score} <span className="text-2xl text-gray-400">/ 40</span>
          </div>
        </div>
      </div>
    </main>
  );
}
