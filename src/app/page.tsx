"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const res = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, contactNo, country }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          throw new Error(data.error || "Validation failed");
        }
        throw new Error(data.error || "Failed to start quiz");
      }

      localStorage.setItem("quizToken", data.token);
      localStorage.setItem("quizData", JSON.stringify(data));
      
      router.push("/quiz");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-24 bg-gray-50 relative overflow-hidden">


      <div className="z-10 max-w-2xl w-full flex-col items-center justify-between">
        <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100">
          
          <div className="flex justify-center mb-8">
            <img src="/comapnyLogo/FullLogo.png" alt="Company Logo" className="h-16 object-contain" />
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6 text-center tracking-tight">
            European Pay <span className="text-[#0055A4]">Talent</span> Hunt
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl text-center mb-10 leading-relaxed font-light">
            Welcome to the French Edition of the European Pay Talent hunt. To check your overall knowledge, you must get a minimum of <strong className="text-[#EF4135] font-bold">25 questions right</strong> to proceed.
          </p>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-10 text-[#0055A4] text-center font-medium shadow-sm">
            Bonne chance! There is no negative marking. All questions carry equal points.
          </div>

          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-5 py-4 rounded-xl bg-gray-50 border ${fieldErrors.name ? 'border-[#EF4135] focus:ring-[#EF4135]/20' : 'border-gray-200 focus:border-[#0055A4] focus:ring-[#0055A4]/20'} focus:ring-2 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400`}
                placeholder="Jean Dupont"
              />
              {fieldErrors.name && <p className="text-[#EF4135] text-sm mt-1">{fieldErrors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-5 py-4 rounded-xl bg-gray-50 border ${fieldErrors.email ? 'border-[#EF4135] focus:ring-[#EF4135]/20' : 'border-gray-200 focus:border-[#0055A4] focus:ring-[#0055A4]/20'} focus:ring-2 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400`}
                placeholder="jean@example.fr"
              />
              {fieldErrors.email && <p className="text-[#EF4135] text-sm mt-1">{fieldErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="contactNo" className="block text-sm font-bold text-gray-700 mb-2">Contact Number</label>
              <input
                id="contactNo"
                type="tel"
                required
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                className={`w-full px-5 py-4 rounded-xl bg-gray-50 border ${fieldErrors.contactNo ? 'border-[#EF4135] focus:ring-[#EF4135]/20' : 'border-gray-200 focus:border-[#0055A4] focus:ring-[#0055A4]/20'} focus:ring-2 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400`}
                placeholder="+33 6 12 34 56 78"
              />
              {fieldErrors.contactNo && <p className="text-[#EF4135] text-sm mt-1">{fieldErrors.contactNo}</p>}
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-bold text-gray-700 mb-2">Country</label>
              <input
                id="country"
                type="text"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className={`w-full px-5 py-4 rounded-xl bg-gray-50 border ${fieldErrors.country ? 'border-[#EF4135] focus:ring-[#EF4135]/20' : 'border-gray-200 focus:border-[#0055A4] focus:ring-[#0055A4]/20'} focus:ring-2 outline-none transition-all duration-300 text-gray-900 placeholder-gray-400`}
                placeholder="France"
              />
              {fieldErrors.country && <p className="text-[#EF4135] text-sm mt-1">{fieldErrors.country}</p>}
            </div>
            {error && <p className="text-[#EF4135] text-sm text-center font-bold bg-red-50 py-3 rounded-lg border border-red-100">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-[#0055A4] hover:bg-[#004488] text-white font-bold text-lg shadow-lg hover:shadow-blue-500/30 transform transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Starting..." : "Commencer (Start Quiz)"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
