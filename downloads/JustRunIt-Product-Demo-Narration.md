# Just Run It — Product Demo Narration Guide

**Audience:** Sales executives and prospective buyers  
**Video:** `assets/video/justrunit-product-demo.mp4`  
**Tone:** Calm, confident, outcome-focused — not feature laundry-list  

Use this script as a **voice-over** when presenting live, or as talking points while the silent demo plays. Timing is approximate for a ~2–3 minute cut.

---

## Opening (title cards)

> “Just Run It is enterprise workload automation built for teams who need to **define work, run it where the files live, schedule it, and see what failed** — without buying a suite of adapters you will never use.”

> “In the next few minutes I’ll show the same control plane your operators would use every day: jobs, workflows, agents, schedules, and execution triage.”

---

## Sign-in & dashboard

> “Teams sign in with local accounts or enterprise SSO via OIDC. The operations dashboard gives an at-a-glance view: job and execution counts, agent health, and recent activity so leaders and operators share the same picture.”

**Sales cue:** Emphasize *shared operational visibility* for ops + IT leadership.

---

## Jobs

> “Jobs are the unit of work. You can define NOOP placeholders, real **COMMAND** shell jobs, **HTTP** probes, and **GIT_RELEASE** jobs that pull versioned binaries onto an agent and run them.”

> “From the catalog, operators search, edit, schedule, or **run now**. The editor captures type, payload, preferred agent, timeouts, and concurrency — enough control for production, without a heavyweight designer.”

**Sales cue:** Map to a prospect’s start/status/stop scripts or batch jobs on Linux/Windows hosts.

---

## On-demand run

> “When you submit a job, federated agents claim the work and report results back to the control plane. That separation means compute and data stay close to the host — the control plane stays lean.”

---

## Workflows

> “Workflows chain jobs into multi-step pipelines — extract, transform, load, or any ordered process — with step conditions and restart. You get orchestration without a visual designer tax.”

**Sales cue:** Nightly ETL, multi-step app recycle, or promote-and-verify sequences.

---

## Schedules

> “Cron schedules attach to either a job or a full workflow. Nightly and business-hour automation stays visible and owned in one place.”

---

## Agents

> “Agents register from Linux, Windows, or containers. You see online status, capacity, and heartbeats — and you can prefer a specific host when the work must run next to local files or binaries.”

**Sales cue:** “Run where files live” is the product differentiator vs pure SaaS runners.

---

## Executions & triage

> “Every run lands in execution history. Filter by status, open detail, and get **error reason plus log output** for fast triage. Cancel or kill when something sticks. That is the ops loop buyers actually live in.”

---

## Governance

> “Access is role-based. Workspaces keep personal and group work separated, with platform-level visibility for admins. Optional OIDC plugs into your identity provider when you are ready.”

**Sales cue:** Security and audit conversations without overselling ABAC.

---

## Close

> “Just Run It: **define, run, schedule, observe** — deployable with Docker Compose or Kubernetes. If this matches how your teams actually operate, we would like to walk your environment next and talk licensing.”

**CTA (on screen / leave-behind):**  
https://justrunit.io · justrunit.io@gmail.com · 318-232-2280

---

## Optional longer demo (live meeting)

If the buyer wants more depth after the video:

1. Create a COMMAND job that runs a harmless `echo` or their sample script on a lab agent.  
2. Show a workflow restart from a failed step.  
3. Show schedule prefill from a job’s **Schedule** button.  
4. Discuss workspace boundaries for a multi-team org.  
5. Confirm deployment preference: Compose lab vs Helm/K8s.

---

## Sharing guidance

| Channel | Format | Notes |
|--------|--------|--------|
| Website | MP4 (H.264) | Embedded with controls; poster = dashboard screenshot |
| Email / Slack | MP4 or link | Prefer link to justrunit.io section to avoid large attachments |
| Teams / Zoom | Share MP4 or screen-share website | Keep mic open and use this narration |
| RFP leave-behind | MP4 + this markdown PDF export | Pair with Product Overview download |

**Do not** promise Automic-class object transport, hundreds of adapters, or multi-tenant SaaS isolation in early conversations — position for PoC and scoped production with clear hardening path.
