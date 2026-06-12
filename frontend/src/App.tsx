import { useState, useEffect, useRef } from "react"
import axios from "axios"

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

interface ParsedJob {
  title: string
  company: string
  location: string
  type: string
  link: string
  description: string
}

function parseJobs(raw: string): ParsedJob[] {
  const jobs: ParsedJob[] = []
  // Try splitting by double newline first, then by numbered list
  let blocks = raw.split(/\n\s*\n/).filter(b => b.match(/title|company/i))
  if (blocks.length === 0) {
    blocks = raw.split(/(?=\d+\.\s|\-\s*Title:)/i).filter(b => b.match(/title/i))
  }
  for (const block of blocks) {
    const get = (key: string) => {
      const match = block.match(new RegExp(`[-*]?\\s*\\*?${key}\\*?:?\\s*(.+)`, "i"))
      return match ? match[1].replace(/\*\*/g, "").trim() : ""
    }
    const job: ParsedJob = {
      title: get("Title") || get("Job Title") || get("Position"),
      company: get("Company") || get("Organization"),
      location: get("Location") || get("Place"),
      type: get("Type") || get("Job Type") || get("Employment"),
      link: get("Link") || get("URL") || get("Apply"),
      description: get("Description") || get("About") || get("Summary"),
    }
    if (job.title && job.title.length > 1) jobs.push(job)
  }
  return jobs
}

function AnimatedScore({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(target / 40)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(start)
    }, 30)
    return () => clearInterval(timer)
  }, [target])
  return <>{val}</>
}

function SkeletonCard() {
  return (
    <div style={{ background: "#111820", border: "0.5px solid #1a2a3e", borderRadius: 14, padding: 18 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#1a2a3e", animation: "pulse 1.5s ease-in-out infinite" }}></div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, background: "#1a2a3e", borderRadius: 6, width: "70%", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }}></div>
          <div style={{ height: 9, background: "#1a2a3e", borderRadius: 6, width: "40%", animation: "pulse 1.5s ease-in-out infinite" }}></div>
        </div>
      </div>
      <div style={{ height: 8, background: "#1a2a3e", borderRadius: 6, width: "90%", marginBottom: 6, animation: "pulse 1.5s ease-in-out infinite" }}></div>
      <div style={{ height: 8, background: "#1a2a3e", borderRadius: 6, width: "60%", animation: "pulse 1.5s ease-in-out infinite" }}></div>
    </div>
  )
}

type Page = "jobs" | "coach"
type CoachStep = 1 | 2 | 3

export default function App() {
  const [page, setPage] = useState<Page>("jobs")

  // Job Finder
  const [query, setQuery] = useState("")
  const [jobs, setJobs] = useState<ParsedJob[]>([])
  const [rawResult, setRawResult] = useState("")
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [copiedLink, setCopiedLink] = useState<number | null>(null)

  // Career Coach
  const [file, setFile] = useState<File | null>(null)
  const [jobRole, setJobRole] = useState("")
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [_loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [coachStep, setCoachStep] = useState<CoachStep>(1)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const searchJobs = async (q?: string) => {
    const searchQuery = q || query
    if (!searchQuery.trim()) return
    setQuery(searchQuery)
    setLoadingJobs(true)
    setJobs([])
    setRawResult("")
    setSearched(false)
    try {
      const res = await axios.post("https://smartapply-bebp.onrender.com/jobs/search", { query: searchQuery })
      const raw = res.data.result || ""
      const parsed = parseJobs(raw)
      if (parsed.length > 0) {
        setJobs(parsed)
      } else {
        setRawResult(raw)
      }
      setSearched(true)
      setSearchHistory(prev => {
        const updated = [searchQuery, ...prev.filter(h => h !== searchQuery)].slice(0, 5)
        return updated
      })
    } catch (e) {
      setRawResult("Something went wrong. Please try again.")
    }
    setLoadingJobs(false)
  }

  const copyLink = (link: string, i: number) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(i)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const analyzeResume = async () => {
    if (!file || !jobRole.trim()) return
    setLoadingAnalysis(true)
    setAnalysis(null)
    setCoachStep(2)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("job_role", jobRole)
      const res = await axios.post("https://smartapply-bebp.onrender.com/career/analyze", formData)
      setAnalysis(res.data.analysis)
      setCoachStep(3)
    } catch (e) {
      console.error(e)
      setCoachStep(1)
    }
    setLoadingAnalysis(false)
  }

  const exportJobs = () => {
    if (!jobs.length && !rawResult) return
    let content = "SmartApply - Job Search Results\n"
    content += "================================\n\n"
    if (jobs.length > 0) {
      jobs.forEach((job, i) => {
        content += `${i + 1}. ${job.title}\n`
        content += `   Company: ${job.company}\n`
        content += `   Location: ${job.location}\n`
        content += `   Type: ${job.type}\n`
        content += `   Link: ${job.link}\n`
        content += `   ${job.description}\n\n`
      })
    } else {
      content += rawResult
    }
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "smartapply-jobs.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportAnalysis = () => {
    if (!analysis) return
    let content = `SmartApply - Career Analysis\n`
    content += `Role: ${jobRole}\n`
    content += `==============================\n\n`
    content += `Match Score: ${analysis.match_score}%\n\n`
    content += `Skills You Have:\n${analysis.skills_found.join(", ")}\n\n`
    content += `Skills to Learn:\n${analysis.skills_missing.join(", ")}\n\n`
    content += `Interview Questions:\n`
    analysis.interview_questions.forEach((q, i) => { content += `${i + 1}. ${q}\n` })
    content += `\n30-Day Plan:\n${analysis.roadmap["30_days"].join("\n")}\n\n`
    content += `60-Day Plan:\n${analysis.roadmap["60_days"].join("\n")}\n\n`
    content += `90-Day Plan:\n${analysis.roadmap["90_days"].join("\n")}\n`
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "smartapply-career-analysis.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const resetCoach = () => {
    setFile(null)
    setJobRole("")
    setAnalysis(null)
    setCoachStep(1)
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#090d12", fontFamily: "var(--font-sans)", color: "#d4dde8" }}>

      {/* Sidebar */}
      <div style={{ width: 200, background: "#0d1218", borderRight: "0.5px solid #1a2332", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 10 }}>
        <div style={{ padding: "16px 18px", borderBottom: "0.5px solid #1a2332", display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" width="26" height="26" alt="SmartApply logo" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#e2ecf4" }}>SmartApply</span>
          <span style={{ fontSize: 10, background: "#0d2040", color: "#378ADD", padding: "2px 7px", borderRadius: 20 }}>beta</span>
        </div>
        <div style={{ padding: "14px 0", flex: 1 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "#334455", padding: "8px 18px 6px" }}>Menu</div>
          {([["jobs", "ti-search", "Job Finder"], ["coach", "ti-user-check", "Career Coach"]] as const).map(([id, icon, label]) => (
            <div key={id} onClick={() => setPage(id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 18px", fontSize: 13, cursor: "pointer", transition: "background 0.15s", background: page === id ? "#0d2040" : "transparent", color: page === id ? "#378ADD" : "#667788", fontWeight: page === id ? 500 : 400, borderLeft: page === id ? "2px solid #378ADD" : "2px solid transparent" }}>
              <i className={`ti ${icon}`} style={{ fontSize: 16 }} aria-hidden="true"></i>
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft: 200, flex: 1, padding: "32px 36px" }}>

        {/* JOB FINDER */}
        {page === "jobs" && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 500, color: "#e2ecf4" }}>Find Jobs</div>
                <div style={{ fontSize: 13, color: "#445566", marginTop: 4 }}>AI searches the web for real, live job listings</div>
              </div>
              {(jobs.length > 0 || rawResult) && (
                <button onClick={exportJobs} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 16px", borderRadius: 10, background: "#0d2040", color: "#378ADD", border: "0.5px solid #1a3a5e", cursor: "pointer" }}>
                  <i className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true"></i>
                  Export
                </button>
              )}
            </div>

            {/* Search */}
            <div style={{ display: "flex", gap: 10, marginBottom: searchHistory.length > 0 ? 12 : 24 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "#0d1218", border: "0.5px solid #1a2a3e", borderRadius: 12, padding: "11px 16px" }}>
                <i className="ti ti-search" style={{ fontSize: 16, color: "#334455" }} aria-hidden="true"></i>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchJobs()}
                  placeholder="e.g. Computer Vision intern in Bangalore..."
                  style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, color: "#d4dde8", width: "100%" }}
                />
                {query && <i className="ti ti-x" onClick={() => setQuery("")} style={{ fontSize: 14, color: "#334455", cursor: "pointer" }} aria-hidden="true"></i>}
              </div>
              <button onClick={() => searchJobs()} disabled={loadingJobs} style={{ background: "#378ADD", color: "white", border: "none", borderRadius: 12, padding: "11px 24px", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: loadingJobs ? 0.6 : 1 }}>
                {loadingJobs ? "Searching..." : "Search"}
              </button>
            </div>

            {/* Search history */}
            {searchHistory.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#334455" }}>Recent:</span>
                {searchHistory.map((h, i) => (
                  <div key={i} onClick={() => searchJobs(h)} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "#0d1a2e", color: "#5a8ab8", border: "0.5px solid #1a2a3e", cursor: "pointer" }}>
                    {h}
                  </div>
                ))}
              </div>
            )}

            {/* Skeleton loading */}
            {loadingJobs && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#445566", fontSize: 13, marginBottom: 20 }}>
                  <div style={{ width: 14, height: 14, border: "2px solid #378ADD", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }}></div>
                  Agent is searching for real jobs...
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
              </div>
            )}

            {/* Job cards */}
            {!loadingJobs && jobs.length > 0 && (
              <div>
                <div style={{ fontSize: 12, color: "#445566", marginBottom: 14 }}>{jobs.length} jobs found</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {jobs.map((job, i) => (
                    <div key={i}
                      style={{ background: "#0d1218", border: "0.5px solid #1a2332", borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 10, transition: "border-color 0.15s" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "#378ADD")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a2332")}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#0d2040", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, color: "#378ADD", flexShrink: 0 }}>
                          {job.company ? job.company.slice(0, 2).toUpperCase() : "??"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 500, color: "#e2ecf4" }}>{job.title}</div>
                          <div style={{ fontSize: 12, color: "#667788", marginTop: 2 }}>{job.company}</div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {job.location && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#0d1a2e", color: "#667788" }}>📍 {job.location}</span>}
                        {job.type && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#0d2040", color: "#378ADD" }}>{job.type}</span>}
                      </div>

                      {job.description && <div style={{ fontSize: 12, color: "#556677", lineHeight: 1.6 }}>{job.description}</div>}

                      <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 4 }}>
                        {job.link && (
                          <a href={job.link} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, color: "white", background: "#378ADD", textDecoration: "none", fontWeight: 500, padding: "7px 0", borderRadius: 8 }}>
                            Apply now <i className="ti ti-arrow-right" style={{ fontSize: 12 }} aria-hidden="true"></i>
                          </a>
                        )}
                        {job.link && (
                          <button onClick={() => copyLink(job.link, i)} style={{ padding: "7px 12px", borderRadius: 8, background: "#0d2040", color: copiedLink === i ? "#5ab87a" : "#378ADD", border: "0.5px solid #1a3a5e", cursor: "pointer", fontSize: 12 }}>
                            {copiedLink === i ? "Copied!" : <i className="ti ti-copy" style={{ fontSize: 13 }} aria-hidden="true"></i>}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw fallback */}
            {!loadingJobs && rawResult && !jobs.length && searched && (
              <div style={{ background: "#0d1218", border: "0.5px solid #1a2332", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 14, borderBottom: "0.5px solid #1a2332" }}>
                  <i className="ti ti-sparkles" style={{ fontSize: 15, color: "#378ADD" }} aria-hidden="true"></i>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#e2ecf4" }}>AI found these jobs for you</span>
                </div>
                <div style={{ fontSize: 13, color: "#667788", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{rawResult}</div>
              </div>
            )}

            {/* Empty state */}
            {!loadingJobs && searched && jobs.length === 0 && !rawResult && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "#334455", gap: 12 }}>
                <i className="ti ti-mood-sad" style={{ fontSize: 40 }} aria-hidden="true"></i>
                <div style={{ fontSize: 14, color: "#445566" }}>No jobs found. Try a different search.</div>
              </div>
            )}
          </div>
        )}

        {/* CAREER COACH */}
        {page === "coach" && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 500, color: "#e2ecf4" }}>Career Coach</div>
                <div style={{ fontSize: 13, color: "#445566", marginTop: 4 }}>AI-powered resume analysis, skill gap and roadmap</div>
              </div>
              {analysis && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={exportAnalysis} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 16px", borderRadius: 10, background: "#0d2040", color: "#378ADD", border: "0.5px solid #1a3a5e", cursor: "pointer" }}>
                    <i className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true"></i>
                    Export
                  </button>
                  <button onClick={resetCoach} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 16px", borderRadius: 10, background: "#0d1218", color: "#667788", border: "0.5px solid #1a2332", cursor: "pointer" }}>
                    <i className="ti ti-refresh" style={{ fontSize: 14 }} aria-hidden="true"></i>
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* Step indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
              {([["1", "Upload"], ["2", "Analyze"], ["3", "Results"]] as const).map(([num, label], i) => (
                <div key={num} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, background: coachStep > i + 1 ? "#378ADD" : coachStep === i + 1 ? "#0d2040" : "#0d1218", color: coachStep > i + 1 ? "white" : coachStep === i + 1 ? "#378ADD" : "#334455", border: coachStep === i + 1 ? "1.5px solid #378ADD" : coachStep > i + 1 ? "none" : "0.5px solid #1a2332" }}>
                      {coachStep > i + 1 ? <i className="ti ti-check" style={{ fontSize: 13 }} aria-hidden="true"></i> : num}
                    </div>
                    <span style={{ fontSize: 12, color: coachStep === i + 1 ? "#378ADD" : coachStep > i + 1 ? "#667788" : "#334455" }}>{label}</span>
                  </div>
                  {i < 2 && <div style={{ width: 40, height: 1, background: coachStep > i + 1 ? "#378ADD" : "#1a2332", margin: "0 10px" }}></div>}
                </div>
              ))}
            </div>

            {/* Step 1 — Upload */}
            {coachStep === 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: "#0d1218", border: "0.5px solid #1a2332", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#e2ecf4", marginBottom: 16 }}>Your details</div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: "#445566", marginBottom: 6 }}>Target job role</div>
                    <input value={jobRole} onChange={e => setJobRole(e.target.value)} placeholder="e.g. Machine Learning Engineer"
                      style={{ width: "100%", background: "#090d12", border: "0.5px solid #1a2a3e", borderRadius: 10, padding: "10px 14px", fontSize: 13, outline: "none", color: "#d4dde8" }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "#445566", marginBottom: 6 }}>Resume PDF</div>
                    <label htmlFor="resume-upload" style={{ display: "block", border: "1.5px dashed #1a2a3e", borderRadius: 10, padding: "24px", textAlign: "center", cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = "#378ADD")}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a2a3e")}
                    >
                      <i className="ti ti-upload" style={{ fontSize: 24, color: "#334455", display: "block", marginBottom: 8 }} aria-hidden="true"></i>
                      {file
                        ? <span style={{ fontSize: 13, color: "#378ADD", fontWeight: 500 }}>{file.name}</span>
                        : <><span style={{ fontSize: 13, color: "#445566" }}>Click to upload PDF</span><br /><span style={{ fontSize: 11, color: "#334455" }}>Max 10MB</span></>
                      }
                      <input ref={fileInputRef} type="file" accept=".pdf" id="resume-upload" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <button onClick={analyzeResume} disabled={!file || !jobRole.trim()}
                    style={{ width: "100%", background: "#378ADD", color: "white", border: "none", borderRadius: 10, padding: "11px", fontSize: 13, fontWeight: 500, cursor: !file || !jobRole.trim() ? "not-allowed" : "pointer", opacity: !file || !jobRole.trim() ? 0.4 : 1 }}>
                    Analyze Resume
                  </button>
                </div>

                <div style={{ background: "#0d1218", border: "0.5px solid #1a2332", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <i className="ti ti-file-analytics" style={{ fontSize: 48, color: "#1a2a3e" }} aria-hidden="true"></i>
                  <div style={{ fontSize: 14, color: "#334455", textAlign: "center" }}>Upload your resume to get<br />a personalized analysis</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", marginTop: 8 }}>
                    {["Skill gap analysis", "Match score", "Interview prep", "30/60/90 day roadmap"].map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#445566" }}>
                        <i className="ti ti-check" style={{ fontSize: 13, color: "#1a3a5e" }} aria-hidden="true"></i>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 — Loading */}
            {coachStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 20 }}>
                <div style={{ width: 56, height: 56, border: "3px solid #0d2040", borderTopColor: "#378ADD", borderRadius: "50%", animation: "spin 0.9s linear infinite" }}></div>
                <div style={{ fontSize: 15, color: "#e2ecf4", fontWeight: 500 }}>Analyzing your resume...</div>
                <div style={{ fontSize: 13, color: "#445566" }}>Reading skills, comparing with {jobRole}, building roadmap</div>
              </div>
            )}

            {/* Step 3 — Results */}
            {coachStep === 3 && analysis && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Score + skills */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 14 }}>
                  <div style={{ background: "#0d1218", border: "0.5px solid #1a2332", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ fontSize: 11, color: "#445566", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>Match Score</div>
                    <div style={{ fontSize: 60, fontWeight: 500, color: "#378ADD", lineHeight: 1 }}>
                      <AnimatedScore target={analysis.match_score} />
                      <span style={{ fontSize: 24, color: "#334455" }}>%</span>
                    </div>
                    <div style={{ background: "#0d1a2e", borderRadius: 20, height: 6, width: "100%", margin: "14px 0 10px" }}>
                      <div style={{ background: "#378ADD", height: 6, borderRadius: 20, width: `${analysis.match_score}%`, transition: "width 1s" }}></div>
                    </div>
                    <div style={{ fontSize: 12, color: "#445566", textAlign: "center" }}>
                      {analysis.match_score >= 80 ? "Strong match" : analysis.match_score >= 60 ? "Good match" : "Needs improvement"}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div style={{ background: "#0d1218", border: "0.5px solid #1a2332", borderRadius: 14, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                        <i className="ti ti-circle-check" style={{ fontSize: 14, color: "#4a9e6a" }} aria-hidden="true"></i>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#e2ecf4" }}>You have</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {analysis.skills_found.map((s, i) => <span key={i} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "#0a1e12", color: "#4a9e6a" }}>{s}</span>)}
                      </div>
                    </div>
                    <div style={{ background: "#0d1218", border: "0.5px solid #1a2332", borderRadius: 14, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                        <i className="ti ti-alert-circle" style={{ fontSize: 14, color: "#c47a5a" }} aria-hidden="true"></i>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#e2ecf4" }}>To learn</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {analysis.skills_missing.map((s, i) => <span key={i} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, background: "#1e100a", color: "#c47a5a" }}>{s}</span>)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interview questions */}
                <div style={{ background: "#0d1218", border: "0.5px solid #1a2332", borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <i className="ti ti-messages" style={{ fontSize: 15, color: "#378ADD" }} aria-hidden="true"></i>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#e2ecf4" }}>Interview questions to prep</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {analysis.interview_questions.map((q, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, padding: "10px 14px", background: "#090d12", borderRadius: 10, alignItems: "flex-start" }}>
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#378ADD", minWidth: 20, marginTop: 1 }}>{i + 1}.</span>
                        <span style={{ fontSize: 13, color: "#778899", lineHeight: 1.6 }}>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Roadmap */}
                <div style={{ background: "#0d1218", border: "0.5px solid #1a2332", borderRadius: 14, padding: 18 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <i className="ti ti-road" style={{ fontSize: 15, color: "#378ADD" }} aria-hidden="true"></i>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#e2ecf4" }}>Learning roadmap</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                    {[
                      { label: "30 days", key: "30_days", bg: "#0a1520", color: "#5a8ac4", border: "#1a2a3e" },
                      { label: "60 days", key: "60_days", bg: "#0d1a2e", color: "#378ADD", border: "#1a3a5e" },
                      { label: "90 days", key: "90_days", bg: "#0a1520", color: "#85B7EB", border: "#1a2a3e" },
                    ].map(({ label, key, bg, color, border }) => (
                      <div key={key} style={{ background: bg, borderRadius: 10, padding: 14, border: `0.5px solid ${border}` }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color, marginBottom: 10 }}>{label}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                          {analysis.roadmap[key as keyof typeof analysis.roadmap].map((item, i) => (
                            <div key={i} style={{ display: "flex", gap: 6, fontSize: 12, color, lineHeight: 1.5, opacity: 0.85 }}>
                              <span style={{ marginTop: 1 }}>–</span><span>{item}</span>
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        input::placeholder { color: #334455; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: #090d12; }
        ::-webkit-scrollbar-thumb { background: #1a2332; border-radius: 3px; }
      `}</style>
    </div>
  )
}