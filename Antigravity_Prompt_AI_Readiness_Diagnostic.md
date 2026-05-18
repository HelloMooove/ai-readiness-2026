# ANTIGRAVITY PROMPT — 2026 AI Readiness Diagnostic Form

---

## 🎯 PROJECT OVERVIEW

Build a **single-page, multi-step diagnostic form** called **"2026 AI Readiness Diagnostic"**. It is a professional-grade interactive questionnaire for business leaders in Mauritius to assess their AI readiness. The form must feel like a premium product — fluid, modern, and almost playful — while remaining credible and executive-level in tone.

---

## 🎨 DESIGN DIRECTION

**Aesthetic**: Dark luxury meets liquid tech. Think deep midnight navy/black backgrounds with electric teal and amber accent colors. It should feel like a high-end SaaS onboarding — not a Google Form.

**Typography**: Use a strong, geometric display font (e.g., `Syne`, `DM Serif Display`, or `Clash Display` from Google Fonts) for question text. Use a clean, readable sans-serif (e.g., `DM Sans` or `Plus Jakarta Sans`) for body/answer options.

**Animations & Transitions**:
- Questions appear one at a time, full-screen or centered card layout.
- Transition between questions: a smooth **slide-up + fade-in** for the incoming question, **fade-out + slide-up** for the outgoing one. Staggered timing (150ms delay between elements: question number, question text, then answers).
- Answer options animate in with a subtle stagger (each option slides in 60ms after the previous).
- When an option is selected, it gets a smooth highlight animation (border glow + background fill).
- On "Next" click, a satisfying micro-animation (brief scale pulse on the button) before transitioning.

**Progress Bar**:
- Fixed at the **bottom of the screen**, full width.
- Style it as a **liquid fill** — the filled portion has a soft, animated shimmer/wave effect inside it (like liquid sloshing gently).
- Color: electric teal (`#00E5CC`) with a glowing blur shadow beneath it.
- Background track: semi-transparent white at 10% opacity.
- Height: 6px. Show a small percentage label floating above the right edge of the fill.
- Animate smoothly (CSS transition `width 600ms cubic-bezier(0.4, 0, 0.2, 1)`).

**Cards**: Each question lives in a centered card with a subtle glass-morphism style (backdrop-filter: blur, semi-transparent background, thin border with low opacity). Max-width 680px.

**Buttons**: "Next" / "Continue" button is full-width on mobile, centered on desktop. Teal fill, bold font, slightly rounded corners (8px). On hover: brightness lift + subtle shadow glow.

**Color Palette**:
- Background: `#080C14` (deep navy black)
- Card bg: `rgba(255,255,255,0.04)`
- Card border: `rgba(255,255,255,0.09)`
- Primary accent: `#00E5CC` (electric teal)
- Secondary accent: `#F5A623` (warm amber)
- Text primary: `#F0F4FF`
- Text muted: `#8A94A8`
- Selected option bg: `rgba(0,229,204,0.12)`
- Selected option border: `#00E5CC`

---

## 📋 FORM STRUCTURE — 4 PHASES, 18 QUESTIONS

Show a phase label above the question number (e.g., "Phase 1 — Relationship with AI") as a small muted badge. Phase transitions should feel like a chapter change — a brief full-screen flash or color pulse.

---

### PHASE 1 — RELATIONSHIP WITH AI

**Q1 — Are you AI literate?**
Single choice:
- Yes
- No

**Q2 — How often do you use AI?**
Single choice:
- Always
- Sometimes
- Rarely
- Never

**Q3 — What do you use AI for?**
Multiple choice (select all that apply):
- Writing emails and replies
- Summarizing long meetings
- Finding info in big files
- Sorting through job applications
- Analyzing data and numbers
- Creating social media posts
- Writing code or Excel formulas
- Coming up with new ideas
- I don't use it for work yet

**Q4 — What conversational AI tools do you use?**
Multiple choice (select all that apply):
- ChatGPT
- Microsoft Copilot
- Google Gemini
- Claude
- Perplexity AI
- Poe
- Jasper
- Custom or Internal AI Company Bot
- Other
- None

**Q5 — What is the size of your company?**
Single choice:
- 1–10 employees
- 11–50 employees
- 51–250 employees
- 251+ employees

**Q6 — What is your current job title?**
Single choice:
- CEO / Founder
- CIO / CTO / Head of IT
- CHRO / Head of HR
- CFO / Head of Finance
- COO / Head of Operations
- Director / Head of (other function)
- HR Manager / L&D
- Operational Manager
- Other

---

### PHASE 2 — AI TODAY

**Q7 — What are your current business challenges?**
Multiple choice (select all that apply):
- Finding and keeping the right staff
- Too much time spent on manual "copy-paste" work
- We don't have clear, daily reports on our performance
- Our sales pipeline is messy and hard to track
- Teams don't talk or work well together
- Rising costs are eating our profit margins
- It takes too long to get new employees started
- We are moving too slow compared to competitors
- Finding the right files or info takes too much time
- Other

**Q8 — Have you considered AI as a solution to solve these problems?**
Single choice:
- Yes → show Q9
- No → show Q10

**Q9 — (If Yes) How did you proceed?**
Single choice:
- Hiring a consultant
- Train your teams
- Investigate the topic

**Q10 — (If No) What's preventing you from doing so?**
Single choice:
- Business readiness
- Budgeting in current financial year
- Lack of guidance

**Q11 — How do you track or measure your business KPIs?**
Single choice:
- Excel spreadsheets
- Business Intelligence via tools (ERP-based systems)
- Fully automated reports with live dashboards

**Q12 — In which industry is your organization active?**
Single choice:
- Technology & Software
- Banking & Financial Services
- Retail & E-commerce
- Manufacturing
- Healthcare & Life Sciences
- Education
- Professional Services (Consulting, Legal, etc.)
- Real Estate & Construction
- Hospitality & Tourism
- Energy & Utilities
- Other

**Q13 — What are your top 3 business priorities today?**
Multiple choice (select up to 3):
- Profitability & Cost Optimization
- Operational Efficiency & Automation
- Digital Transformation & AI Integration
- Talent Acquisition & Retention
- Customer Experience & Loyalty
- Market Expansion & Scaling
- Sustainability & ESG Strategy

---

### PHASE 3 — AI TOMORROW

**Q14 — What decisions are currently difficult to make in your organization?**
Multiple choice (select all that apply):
- Budgeting & Financial Forecasting
- Strategic Expansion & Market Entry
- Pricing & Competitive Strategy
- Talent Acquisition & Hiring
- Resource & Workforce Allocation

**Q15 — Do you plan to train your teams on AI usage in 2026?**
Single choice:
- Yes → show Q16
- No → show Q17

**Q16 — (If Yes) What training themes do you want to cover?**
Multiple choice (select all that apply):
- AI Foundations: Getting the whole team comfortable with the basics.
- Prompt Engineering: Learning how to "talk" to AI to get perfect results.
- Automating Repetitive Tasks: Cutting out "copy-paste" work.
- AI for Sales & Growth: Using AI to find leads and close deals faster.
- Smart Data & Reporting: Turning messy spreadsheets into clear daily dashboards.
- AI in HR & Recruitment: Speeding up hiring and making onboarding easier.
- Financial AI & Admin: Saving time on invoices, bills, and paperwork.
- AI Safety & Policy: Ensuring your team uses AI securely and legally.
- AI for Content & Marketing: Creating high-quality posts and emails in seconds.
- Advanced Workflow Design: Building custom "AI employees" for specific departments.

**Q17 — (If No) Why not?**
Open text answer (single textarea, styled beautifully — dark background, teal focus border)

**Q18 — What are the must-haves of a solid AI training in 2026?**
Multiple choice (select up to 2):
- Hands-on practice: Actually building and using tools during the session.
- Real-world examples: Seeing case studies from my specific industry.
- Data Security & Privacy: Clear rules on how to keep company secrets safe.
- ROI & Business Proof: Training that shows exactly how it saves money.
- Ready-to-use "Prompts": A library of commands my team can use immediately.
- No-code automation: Learning how to connect apps (like n8n) without IT.
- Human-AI Culture: Helping staff overcome the fear of being replaced.
- Latest 2026 tools: Access to the newest models, not old technology.
- Post-training support: A roadmap or community to help us after the session.
- Executive alignment: Ensuring the boss and the team are on the same page.

---

### PHASE 4 — CONTACT DETAILS

Show a friendly message before this phase: _"Almost done! Just a few details so we can send you your personalized AI Readiness Report."_

**First Name** — Text input
**Last Name** — Text input
**Email Address** — Email input (required, validated)
**Phone Number** — Text input (optional)

Final screen after submit: Show a beautiful **"Thank You"** screen with a teal checkmark animation, the message: **"Your AI Readiness Report is on its way!"** and a subtext: _"Our team will be in touch with your personalized results shortly."_

---

## 🔄 CONDITIONAL LOGIC

- If Q8 = "Yes" → Show Q9, skip Q10
- If Q8 = "No" → Show Q10, skip Q9
- If Q15 = "Yes" → Show Q16, skip Q17
- If Q15 = "No" → Show Q17, skip Q16

---

## 🗄️ AIRTABLE INTEGRATION

On form submit, send a POST request to the Airtable API.

**Base URL**: `https://api.airtable.com/v0/app7ZuPZvg2zgpYJO/tblQZwdF1jxSalzLi`
**Authorization**: `Bearer patGDb3jhe03IBp24`
**Content-Type**: `application/json`

Map form answers to Airtable fields as follows (field names must match exactly):

| Form Question | Airtable Field Name |
|---|---|
| Email | `Email Address` |
| First Name | `First Name` |
| Last Name | `Last Name` |
| Phone | `Phone Number` |
| Q1 | `Q1 - Are you AI literate?` |
| Q2 | `Q2 - How often do you use AI?` |
| Q3 | `Q3 - What do you use AI for?` |
| Q4 | `Q4 - What conversational AI do you use?` |
| Q5 | `Q5 - Company Size` |
| Q6 | `Q6 - Current Job Title` |
| Q7 | `Q7 - Current Business Challenges` |
| Q8 | `Q8 - Considered AI as a Solution?` |
| Q9 | `Q9 - How did you proceed with AI?` |
| Q10 | `Q10 - What prevents AI adoption?` |
| Q11 | `Q11 - How do you track business KPI?` |
| Q12 | `Q12 - Industry` |
| Q13 | `Q13 - Top 3 Business Priorities` |
| Q14 | `Q14 - Difficult Decisions in Organization` |
| Q15 | `Q15 - Plan to train teams on AI in 2026?` |
| Q16 | `Q16 - AI Training Themes to Cover` |
| Q17 | `Q17 - Why not training teams on AI?` |
| Q18 | `Q18 - Must-Haves of a Solid AI Training in 2026` |
| Calculated score | `AI_Score` |

For **multiple-choice fields**, send the selected values as a **comma-separated string** (e.g., `"ChatGPT, Google Gemini, Claude"`).

For **single-choice fields**, send the selected value as a plain string.

The `AI_Score` field is a **number** field. Send the final calculated integer score (see scoring logic below).

Show a loading spinner on the final submit button while the API call is in progress. If the call fails, show a friendly inline error message (do not navigate away).

---

## 📐 LAYOUT & UX NOTES

- **Mobile-first**, responsive. The card should fill 90% width on mobile, centered at 680px max on desktop.
- Each question card: large bold question number (like "01", "02"...) in muted teal, small phase badge above it, full question text, then answer options below.
- Answer options: pill/card style with icon or colored dot on the left. On hover: soft glow. On select: teal border + tinted background fill.
- For multi-select questions, show a subtle "(Select all that apply)" or "(Select up to X)" hint below the question in muted text.
- "Back" button: small, ghost style, top-left of the card. Don't make it prominent — forward momentum is the goal.
- "Next / Continue" button appears only after at least one answer is selected (for required questions).
- Keyboard navigation support: Enter to select/deselect highlighted option, Tab to move between options, Space to select.
- No scrolling within a question card — if there are many options, make the card scrollable with a subtle fade at the bottom to hint at more options.

---

## ✅ SCORING LOGIC (INTERNAL — NOT SHOWN TO USER)

Calculate a running `totalScore` integer silently in the background as the user progresses. **Never display the score to the user at any point — not during the form, not on the thank-you screen, nowhere.** No "points", no progress indicators linked to score, no scoring language in the UI whatsoever.

Send the final `totalScore` as a number to the `AI_Score` field in Airtable on submit.

### Point values per answer:

**Q1 — AI Literacy**
- Yes → +10
- No → 0

**Q2 — Frequency of AI use**
- Always → +10
- Sometimes → +7
- Rarely → +3
- Never → 0

**Q3 — What they use AI for** (add points for each selected)
- Writing emails and replies → +2
- Summarizing long meetings → +2
- Finding info in big files → +5
- Sorting through job applications → +8
- Analyzing data and numbers → +10
- Creating social media posts → +2
- Writing code or Excel formulas → +10
- Coming up with new ideas → +5
- I don't use it for work yet → 0

**Q4 — Conversational AI tools used** (add points for each selected)
- ChatGPT → +5
- Microsoft Copilot → +5
- Google Gemini → +5
- Claude → +10
- Perplexity AI → +10
- Poe → +8
- Jasper → +8
- Custom or Internal AI Company Bot → +20
- Other → +5
- None → 0

**Q5 — Company size** → Unscored (0 pts, always)

**Q6 — Job title** → Unscored in total score (0 pts for totalScore purposes)

**Q7 — Business challenges** (add points for each selected — note: these are negative)
- Finding and keeping the right staff → 0
- Too much time spent on manual "copy-paste" work → -5
- We don't have clear, daily reports on our performance → -5
- Our sales pipeline is messy and hard to track → -5
- Teams don't talk or work well together → 0
- Rising costs are eating our profit margins → 0
- It takes too long to get new employees started → 0
- We are moving too slow compared to competitors → -3
- Finding the right files or info takes too much time → -3
- Other → 0

**Q8 — Considered AI as a solution?**
- Yes → +10
- No → 0

**Q9 — How did you proceed with AI?** (only if Q8 = Yes)
- Hiring a consultant → +10
- Train your teams → +5
- Investigate the topic → 0

**Q10 — What prevents AI adoption?** (only if Q8 = No)
- Business readiness → -10
- Budgeting in current financial year → -5
- Lack of guidance → 0

**Q11 — How do you track business KPIs?**
- Excel spreadsheets → 0
- Business Intelligence via tools (ERP-based systems) → +5
- Fully automated reports with live dashboards → +10

**Q12 — Industry** → Unscored (0 pts, always)

**Q13 — Top 3 business priorities** → Unscored (0 pts, always)

**Q14 — Difficult decisions** (add points for each selected — all negative)
- Budgeting & Financial Forecasting → -2
- Strategic Expansion & Market Entry → -2
- Pricing & Competitive Strategy → -2
- Talent Acquisition & Hiring → -2
- Resource & Workforce Allocation → -2

**Q15 — Plan to train teams on AI in 2026?**
- Yes → +5
- No → -5

**Q16 — AI training themes** → Unscored (0 pts, always)

**Q17 — Why not training** → Unscored (0 pts, always)

**Q18 — Must-haves of a solid AI training** → Unscored (0 pts, always)

### Implementation note:
Maintain a `let totalScore = 0` variable. After each question is answered, add/subtract the appropriate points immediately. When the user goes **back** and changes an answer, subtract the previously added points and add the new ones. This ensures the score is always accurate at submit time.

---

_End of prompt._
