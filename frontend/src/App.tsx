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

export default function App() {
  const [active, setActive] = useState(0)
  const [query, setQuery] = useState("")
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const searchJobs = async () => {
    if (!query.trim()) return
    setLoading(true)
    setJobs([])
    setSearched(false)
    try {
      const res = await axios.post("http://localhost:8000/jobs/search", { query })
      console.log("API Response:", res.data)
      setJobs(res.data.jobs || [])
      setSearched(true)
    } catch (e) {
      console.error("Error:", e)
    }
    setLoading(false)
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
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>

            {loading && (
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
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm">Career Coach Agent - coming in Phase 3</p>
          </div>
        )}
      </div>
    </div>
  )
}
