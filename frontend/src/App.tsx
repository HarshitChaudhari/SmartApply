import { useState } from "react"
import axios from "axios"

const tabs = ["Job Finder", "Career Coach"]

interface Job {
  title: string
  company: string
  location: string
  type: string
  link: string
  description: string
}

interface Analysis {
  skills_found: string[]
  skills_missing: string[]
  match_score: number
  interview_questions: string[]
  roadmap: {
    "30_days": string[]
    "60_days": string[]
    "90_days": string[]
  }
}

export default function App() {
  const [active, setActive] = useState(0)

  // Job Finder state
  const [query, setQuery] = useState("")
  const [jobs, setJobs] = useState<Job[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [searched, setSearched] = useState(false)

  // Career Coach state
  const [file, setFile] = useState<File | null>(null)
  const [jobRole, setJobRole] = useState("")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  const searchJobs = async () => {
    if (!query.trim()) return
    setLoadingJobs(true)
    setJobs([])
    setSearched(false)
    try {
      const res = await axios.post("http://localhost:8000/jobs/search", { query })
      setJobs(res.data.jobs || [])
      setSearched(true)
    } catch (e) {
      console.error("Error:", e)
    }
    setLoadingJobs(false)
  }

  const analyzeResume = async () => {
    if (!file || !jobRole.trim()) return
    setLoadingAnalysis(true)
    setAnalysis(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("job_role", jobRole)
      const res = await axios.post("http://localhost:8000/career/analyze", formData)
      setAnalysis(res.data.analysis)
    } catch (e) {
      console.error("Error:", e)
    }
    setLoadingAnalysis(false)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-3">
        <span className="text-xl font-semibold tracking-tight">SmartApply</span>
        <span className="text-xs bg-purple-600 px-2 py-0.5 rounded-full">beta</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActive(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active === i
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {active === 0 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Find Jobs</h2>
              <p className="text-gray-400 text-sm">Describe the role you are looking for</p>
            </div>
            <div className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && searchJobs()}
                placeholder="e.g. Computer Vision intern jobs in India"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors"
              />
              <button
                onClick={searchJobs}
                disabled={loadingJobs}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {loadingJobs ? "Searching..." : "Search"}
              </button>
            </div>

            {loadingJobs && (
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                Searching for jobs...
              </div>
            )}

            {searched && jobs.length === 0 && (
              <p className="text-gray-400 text-sm">No jobs found. Try a different query.</p>
            )}

            {jobs.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">{jobs.length} jobs found</p>
                {jobs.map((job, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-purple-500 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{job.title}</h3>
                        <p className="text-purple-400 text-sm mt-0.5">{job.company}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">📍 {job.location}</span>
                          <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-300">{job.type}</span>
                        </div>
                        <p className="text-gray-400 text-sm mt-3 leading-relaxed">{job.description}</p>
                      </div>
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        Apply
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {active === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-1">Career Coach</h2>
              <p className="text-gray-400 text-sm">Upload your resume and get personalized career guidance</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Target Job Role</label>
                <input
                  type="text"
                  value={jobRole}
                  onChange={e => setJobRole(e.target.value)}
                  placeholder="e.g. Machine Learning Engineer"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Upload Resume (PDF)</label>
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    {file ? (
                      <p className="text-purple-400 text-sm font-medium">{file.name}</p>
                    ) : (
                      <div>
                        <p className="text-gray-400 text-sm">Click to upload your resume</p>
                        <p className="text-gray-600 text-xs mt-1">PDF files only</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <button
                onClick={analyzeResume}
                disabled={loadingAnalysis || !file || !jobRole.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {loadingAnalysis ? "Analyzing..." : "Analyze Resume"}
              </button>
            </div>

            {loadingAnalysis && (
              <div className="flex items-center gap-3 text-gray-400 text-sm">
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                Analyzing your resume...
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-semibold mb-3">Match Score</h3>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-purple-400">{analysis.match_score}%</div>
                    <div className="flex-1 bg-gray-800 rounded-full h-3">
                      <div
                        className="bg-purple-600 h-3 rounded-full transition-all"
                        style={{ width: `${analysis.match_score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="font-semibold mb-3 text-green-400">Skills You Have</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills_found.map((skill, i) => (
                        <span key={i} className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded-full">{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <h3 className="font-semibold mb-3 text-red-400">Skills to Learn</h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.skills_missing.map((skill, i) => (
                        <span key={i} className="text-xs bg-red-900 text-red-300 px-2 py-1 rounded-full">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-semibold mb-3">Interview Questions</h3>
                  <div className="space-y-2">
                    {analysis.interview_questions.map((q, i) => (
                      <div key={i} className="flex gap-3 text-sm text-gray-300">
                        <span className="text-purple-400 font-medium">{i + 1}.</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <h3 className="font-semibold mb-4">Learning Roadmap</h3>
                  <div className="space-y-4">
                    {[
                      { label: "30 Days", key: "30_days", color: "text-blue-400" },
                      { label: "60 Days", key: "60_days", color: "text-purple-400" },
                      { label: "90 Days", key: "90_days", color: "text-pink-400" },
                    ].map(({ label, key, color }) => (
                      <div key={key}>
                        <h4 className={`text-sm font-medium mb-2 ${color}`}>{label}</h4>
                        <div className="space-y-1">
                          {analysis.roadmap[key as keyof typeof analysis.roadmap].map((item, i) => (
                            <div key={i} className="flex gap-2 text-sm text-gray-400">
                              <span>-</span>
                              <span>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}