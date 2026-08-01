# Just Run It — Product Demo Narration Guide

**Audience:** Sales executives and prospective buyers  
**Video:** `assets/video/justrunit-product-demo.mp4`  
**Tone:** Confident, production-ready, outcome-focused — lead with strengths  

Use this script as a **voice-over** when presenting live, or as talking points while the silent demo plays. Timing is approximate for a ~2 minute cut.

---

## Positioning (read before every call)

| Lead with | Avoid in customer conversations |
|-----------|----------------------------------|
| Production-ready control plane available for commercial license **now** | Roadmaps, “gaps,” competitor shortfall lists |
| Real work on customer hosts (COMMAND, binaries, HTTP) | Apologizing for not being a legacy suite clone |
| Multi-team workspaces, RBAC, optional SSO | “PoC only” framing |
| HA Compose / Kubernetes / bare-metal deploy | Internal hardening plans unless asked |
| Fast go-live value → license revenue supports continuous product investment | Discounting the product as unfinished |

**One-line:** “Just Run It is production workload automation you can license and run today — define work, run it where files live, schedule it, and operate with confidence.”

---

## Opening (title cards)

> “Just Run It is **production-ready** enterprise workload automation for teams who need to **define work, run it where the files live, schedule it, and see what failed** — without buying a mountain of adapters you will never use.”

> “In the next few minutes I’ll walk the **same control plane your operators use in production**: jobs, workflows, agents, schedules, and execution triage.”

---

## Sign-in & dashboard

> “Teams sign in with local accounts or enterprise SSO via OIDC. The operations dashboard gives leaders and operators the same picture: job and execution counts, agent health, and recent activity.”

**Sales cue:** Shared operational visibility = less shadow scheduling, one system of record.

---

## Jobs

> “Jobs are the unit of work. Production teams run **COMMAND** shell jobs for real, **HTTP** probes, **GIT_RELEASE** jobs that pull versioned binaries onto an agent and execute them, and lightweight placeholders when they need them.”

> “From the catalog, operators search, edit, schedule, or **run now**. The editor captures type, payload, preferred agent, timeouts, and concurrency — the controls production needs, without a heavyweight designer.”

**Sales cue:** Map to their start/status/stop scripts and batch jobs on Linux/Windows hosts.

---

## On-demand run

> “When you submit a job, federated agents claim the work and report results. Compute and data stay on **your** hosts — the control plane stays focused on definition, schedule, and observation.”

---

## Workflows

> “Workflows chain jobs into multi-step pipelines — extract, transform, load, or multi-step app operations — with step conditions and restart. Orchestration without a visual designer tax.”

**Sales cue:** Nightly ETL, multi-step recycle, promote-and-verify.

---

## Schedules

> “Cron schedules attach to a job or a full workflow. Nightly and business-hour automation stays visible and owned in one production control plane.”

---

## Agents

> “Agents register from Linux, Windows, or containers. You see online status, capacity, and heartbeats — and you pin a preferred host when work must run next to local files or binaries.”

**Sales cue:** “Run where files live” is the differentiator vs pure SaaS runners that never touch their estate.

---

## Executions & triage

> “Every run lands in execution history. Filter by status, open detail, and get **error reason plus log output** for fast triage. Cancel or kill when something sticks. That is the production ops loop.”

---

## Governance

> “Access is role-based. Workspaces keep personal and group work separated, with platform-level visibility for admins. Optional OIDC plugs into your identity provider for enterprise sign-in.”

**Sales cue:** Multi-team federation on one control plane — commercial value without chaos.

---

## Close (license-forward)

> “Just Run It: **define, run, schedule, observe** — deployable with Docker Compose HA or Kubernetes, ready for production. If this matches how your teams operate, the next step is a **commercial license** and a guided rollout for your environments.”

**CTA:**  
https://justrunit.io · justrunit.io@gmail.com · 318-232-2280  
Subject line suggestion: *Just Run It production license inquiry*

---

## Optional live deep-dive (after the video)

1. Run their sample script as a COMMAND job on a demo or customer agent.  
2. Show workflow restart from a failed step.  
3. Show schedule prefill from a job’s **Schedule** button.  
4. Walk workspace boundaries for a multi-team org.  
5. Confirm production footprint: Compose HA vs Helm/K8s vs bare metal.

---

## Objection handling (strengths, not gaps)

| They say | You say |
|----------|---------|
| “How does this compare to Automic / Control-M / big suites?” | “We focus on script- and binary-centric automation with federated agents and fast time-to-value. Customers who need a lean production control plane choose us for clarity and cost of ownership — not for shipping every adapter on the market.” |
| “Is this ready for prod?” | “Yes. Production job types, workflows, schedules, agents, RBAC/SSO, execution triage, and HA deploy options. Commercial licenses are available now.” |
| “What about future features?” | “We invest continuously in the product as a commercial offering. Your license supports that investment; we plan roadmap items with paying customers, not as a reason to wait.” |
| “Can we try first?” | “We can arrange a guided demo and deployment planning session. Production licensing is how we structure commercial engagements.” |

---

## Sharing guidance

| Channel | Format | Notes |
|--------|--------|--------|
| Website | MP4 (H.264) | Embedded with controls; poster = dashboard screenshot |
| Email / Slack | Link preferred | justrunit.io/#demo |
| Teams / Zoom | Play video + this narration | Keep mic open; close on license CTA |
| RFP leave-behind | MP4 + Product Overview + this guide | Strengths and capabilities only |

**Public rule:** Show strengths and production readiness. Internal engineering priorities stay internal.
