# AI Combat Coach
## Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Ready for technical planning  
**Product type:** Consumer subscription SaaS  
**Platform:** Installable Progressive Web App (PWA)  
**Initial sports:** Boxing, followed by kickboxing  
**Primary interaction:** Live camera + AI voice instructor + post-session video analysis

---

## 1. Executive Summary

AI Combat Coach is a mobile-first web application that acts as a personal boxing and kickboxing instructor using live multimodal AI and video analysis.

Users position their phone to record a workout. During training, an AI instructor observes sampled video frames, provides occasional spoken instructions, and answers questions. After training, the application analyzes the complete recording to produce a personalized report containing technique observations, timestamped evidence, prioritized corrections, drills, and goals for the next session.

The product combines two complementary experiences:

1. **Live coaching:** Low-friction, conversational voice guidance during training.
2. **Post-session analysis:** Deeper review of the original recording to identify recurring technical issues and measure improvement over time.

The application will be built as an installable PWA rather than a native mobile application. Camera capture, video recording, audio streaming, session management, and offline-aware behavior must therefore be designed around real browser capabilities.

### Product vision

Make useful, personalized combat-sports coaching accessible to people who train without continuous one-to-one supervision.

### Product principles

- Evidence before assertions.
- Short, timely live coaching rather than constant narration.
- Detailed post-session feedback rather than generic AI summaries.
- Measurable progress instead of arbitrary scores.
- Privacy-conscious recording and transparent data handling.
- Mobile-first design that remains usable during exercise.

---

## 2. Problem Statement

People who train boxing or kickboxing without continuous individual coaching face several problems:

- They cannot easily observe their own technique while performing it.
- Online tutorials provide general instruction but rarely address an individual's mistakes.
- Recording a workout does not automatically explain what should be improved.
- Progress can be difficult to measure objectively across sessions.
- Private coaching may be unavailable, inconvenient, or expensive.

Existing conversational AI can explain boxing concepts, but explaining a jab is not the same as examining a particular person's jab.

AI Combat Coach will attempt to bridge that gap by connecting coaching feedback to evidence from the user's own training footage.

### Product hypothesis

Users who already train regularly will return to a product that identifies specific, credible technique improvements and helps them apply those corrections during subsequent sessions.

This hypothesis must be validated through repeat usage and paid conversion rather than assumed from the technical novelty of the product.

---

## 3. Target Audience

### Primary audience

Adults aged 18–34 who practice boxing or kickboxing at home or at a gym and lack consistent individual feedback.

Typical characteristics:

- Train approximately 2–5 times per week.
- Own a smartphone and can position it to record their movements.
- Watch online combat-sports tutorials.
- Want to improve technique rather than simply count calories.
- Are comfortable using an AI-powered coaching application.

### Secondary audiences

**Recreational gym members**

People who attend group classes but want additional feedback during solo training.

**Amateur competitors**

Athletes who want to review training footage and track selected technical improvements.

**Fitness-oriented beginners**

People who want structured, guided boxing workouts. They may need more beginner-friendly instruction and stronger safety guardrails.

### Initial exclusions

The MVP will not target:

- Professional fighters requiring elite biomechanical or tactical analysis.
- Live sparring supervision.
- Medical rehabilitation or injury diagnosis.
- Children as a dedicated customer segment.
- Coaches managing large teams.

These audiences may be considered after the core product is validated.

---

## 4. Goals and Non-Goals

### Goals

1. Let users start a recorded workout from a mobile browser or installed PWA.
2. Deliver live spoken coaching through Gemini Live.
3. Preserve the complete original workout recording independently of AI video sampling.
4. Analyze the recording after the workout.
5. Generate specific, evidence-linked coaching observations.
6. Save session history and compare repeated measurements where reliable.
7. Support a freemium-to-subscription business model.
8. Provide secure account management, consent, deletion, and subscription controls.

### Non-goals for MVP

- Native iOS or Android applications.
- Automated opponent analysis or fight prediction.
- Real-time scoring of every punch.
- Reliable measurement of impact force or muscle activation.
- Automatic injury diagnosis.
- Full sparring or multi-person match analysis.
- Social feeds, public leaderboards, and community messaging.
- Full offline AI inference.
- Automated fight choreography or unrestricted advanced training prescriptions.

---

## 5. Core User Journey

### 5.1 Onboarding

The user visits the website and can install the PWA where supported.

The application introduces the product and explains:

- How live camera coaching works.
- Why the entire body must remain visible.
- That video may be processed by external AI services when the user starts a session or requests analysis.
- Which recordings are stored locally and which are uploaded.
- That AI coaching can be incorrect and is not a substitute for qualified supervision.

The user creates an account or uses an explicitly supported guest experience.

### 5.2 Configure a workout

The user selects:

- Sport: Boxing or Kickboxing.
- Experience level: Beginner, Intermediate, or Advanced.
- Session type: Shadowboxing or Heavy Bag, where supported.
- Session duration.
- Training focus: Guard, balance, punch technique, combinations, or general fundamentals.
- Coaching frequency: Minimal, Balanced, or Frequent.
- Voice and language preferences.

Unsupported analysis modes must be disabled or clearly marked as experimental.

### 5.3 Camera setup

The application requests camera permission only after a clear user action.

It displays a live preview and a setup checklist:

- Entire body visible.
- Adequate lighting.
- Camera stable.
- Sufficient space to move.
- No other person unnecessarily visible.
- Microphone available if voice interaction is enabled.

The app should show a simple framing indicator where practical.

The user must be able to continue with recording if the live AI connection is unavailable, subject to a clear explanation that live coaching is disabled.

### 5.4 Live training

The user presses **Start Session**.

The application:

1. Starts local video recording.
2. Starts the live AI connection.
3. Sends supported sampled video and microphone audio to the model.
4. Tracks elapsed time and round/rest intervals.
5. Receives spoken coaching responses.
6. Displays connection and recording status.
7. Allows the user to pause, stop, or mute coaching.

The live instructor must avoid speaking continuously. It should provide short corrections, encourage rest when scheduled, and answer direct questions.

### 5.5 End session

The user presses **Finish Session**.

The application:

1. Stops recording cleanly.
2. Finalizes the recording file.
3. Confirms whether the video was saved successfully.
4. Shows a preview and recording duration.
5. Asks the user to upload the recording for AI analysis, unless they previously provided an explicit and understandable consent covering this action.
6. Creates a post-session analysis job.

A failed AI connection must not automatically destroy a successfully recorded workout.

### 5.6 Analysis and report

The UI displays processing status and allows the user to leave and return later.

Once completed, the report shows:

- Session summary.
- Main technical strengths.
- Highest-priority corrections.
- Timestamped video evidence.
- Suggested drills.
- A goal for the next workout.
- Comparisons with previous sessions when comparable evidence exists.

The user can replay relevant clips, mark feedback as useful or incorrect, and start another session.

---

## 6. Functional Requirements

### FR-01: Progressive Web App

**Priority:** P0

The application must:

- Be installable on supported browsers.
- Provide a responsive mobile-first interface.
- Include a web app manifest and service worker.
- Use HTTPS in production.
- Support browser navigation and authenticated routing.
- Handle installation, permissions, and unsupported capabilities gracefully.
- Provide an application version and update notification when a new version is available.

The app shell and basic navigation may work offline. Live coaching, cloud analysis, authentication-dependent operations, and subscriptions require connectivity.

### FR-02: Authentication and user profile

**Priority:** P0

Users must be able to:

- Register and sign in.
- Sign out.
- Recover access to their account.
- Manage their profile.
- Select preferred sport and training level.
- View their subscription and usage limits.
- Request account and data deletion.

Supabase Auth is the proposed authentication provider.

### FR-03: Camera preview and recording

**Priority:** P0

The application must:

- Request camera access through a user gesture.
- Prefer the rear camera on mobile devices.
- Show a live preview before recording.
- Record video using the browser's MediaRecorder API when supported.
- Detect supported recording formats rather than assume one codec.
- Display a clear recording indicator.
- Save the complete recording locally before uploading it.
- Allow the user to preview, retry, discard, or upload a recording.
- Detect recording errors and unexpected interruptions.
- Stop camera and microphone tracks when the session ends.
- Avoid requiring the page to remain backgrounded during recording.

**Initial recording target:** 720p, approximately 24–30 FPS where supported, subject to device capabilities and storage limits.

The application must not guarantee a specific frame rate or resolution on every device.

A local-storage quota check and a conservative maximum session duration must be implemented. The initial target is a 15-minute session, with longer sessions enabled only after testing.

### FR-04: Live AI instructor

**Priority:** P0

The application must integrate Gemini Live for bidirectional conversational interaction.

Capabilities:

- Receive sampled video frames.
- Receive microphone audio where enabled.
- Generate spoken instructions.
- Accept spoken user questions.
- Maintain session instructions and coaching preferences.
- Respect the configured coaching frequency.
- Recover gracefully from temporary connection failures.

The model should receive a system instruction defining its role as a supportive combat-sports fundamentals instructor.

It must not claim to have observed movements that were not present in the supplied frames.

The backend will provision short-lived Gemini Live credentials or another supported secure connection mechanism. Permanent API keys must never be exposed to the browser.

### FR-05: Live coaching behavior

**Priority:** P0

The live instructor must:

- Prefer one correction at a time.
- Use concise, actionable speech.
- Avoid interrupting the user excessively.
- Distinguish observations from uncertain interpretations.
- Avoid unsupported precise biomechanical measurements.
- Use beginner-appropriate language when necessary.
- Avoid presenting itself as a substitute for a qualified coach.
- Respect rest periods and user requests to stop speaking.

The default coaching mode is Balanced.

Example instruction:

"Bring your right hand back to guard after the cross."

The example represents the intended style, not a guarantee that the model can detect that specific error at every moment.

### FR-06: Live connection and session management

**Priority:** P0

The application must track:

- Recording state.
- AI connection state.
- Microphone state.
- Elapsed workout time.
- Current round and rest interval.
- Last successful AI response.
- Connection interruptions.

The system must implement session resumption or reconnection using the current Gemini Live API capabilities and documented session limits.

It must never assume an audio-video session can run indefinitely without renewal.

If live coaching fails:

1. Preserve the original recording.
2. Notify the user without blocking their workout.
3. Retry within a bounded policy.
4. Allow the user to continue without live coaching.
5. Resume coaching only when the connection is healthy.

### FR-07: Post-session video upload

**Priority:** P0

The application must:

- Upload the original recording over HTTPS.
- Support resumable or multipart upload where appropriate.
- Display upload progress.
- Allow retries after recoverable network failures.
- Validate file type, size and duration.
- Use private object storage.
- Restrict recording access to the owner and authorized processing services.
- Delete abandoned uploads according to a documented retention policy.

Supabase Storage or another private object-storage service may be used.

The recording must not be published through a public URL.

### FR-08: Post-session video analysis

**Priority:** P0

The analysis pipeline must:

1. Validate the uploaded recording.
2. Extract metadata and a timeline.
3. Sample representative frames from the complete recording.
4. Identify segments that may contain useful training evidence.
5. Extract higher-frame-rate clips around selected events when necessary.
6. Apply pose estimation or movement tracking where supported.
7. Ask the selected multimodal model to interpret relevant evidence.
8. Consolidate repeated observations.
9. Rank corrections by importance and confidence.
10. Generate a structured report.
11. Store the report and processing status.

The system must distinguish measured data, visual observations, and model-generated interpretations.

If a movement cannot be evaluated reliably, the report must say so instead of inventing feedback.

### FR-09: Coaching report

**Priority:** P0

Each report must contain:

- Session title, sport, duration and date.
- Short summary.
- Two or three prioritized improvement areas when sufficient evidence exists.
- Positive observations where supported by footage.
- Timestamped evidence for important findings.
- Confidence or uncertainty indicators.
- Specific correction instructions.
- Relevant drills.
- Suggested focus for the next session.
- Analysis limitations.

Every timestamp must refer to the original recording's timeline.

Users must be able to replay the relevant part of the video.

A universal numerical technique score is not required for the MVP. If a score is later introduced, it must have a defined methodology and validation evidence.

### FR-10: Progress tracking

**Priority:** P1

The application should:

- Maintain session history.
- Show completed workouts and training duration.
- Track repeated technique observations.
- Compare equivalent measurements across sessions.
- Identify recurring problems.
- Show progress only when the data supports the comparison.

The system must not claim improvement based solely on changing model-generated scores.

### FR-11: Training plans

**Priority:** P1

The application should provide short plans based on:

- User experience level.
- Training frequency.
- Selected sport.
- Previous observations.
- User-selected goals.

A plan must prioritize a small number of corrections instead of overwhelming the user with every possible technical adjustment.

### FR-12: Billing and usage limits

**Priority:** P1 for public paid launch

The application must support:

- Free usage limits.
- Paid monthly and annual plans.
- Subscription status.
- Analysis and live-session usage accounting.
- Upgrade and cancellation flows.
- Payment confirmation through trusted backend events.
- Enforcement of server-side usage limits.

The frontend must never determine subscription entitlement solely from client-controlled state.

---

## 7. AI Architecture

### 7.1 System overview

**Client**

React + TypeScript PWA

Responsibilities:

- Camera preview.
- Full video recording.
- Microphone capture.
- Live AI transport.
- Session controls.
- Playback and report UI.
- Local draft/session state.

**Application backend**

Python + FastAPI

Responsibilities:

- Authentication verification.
- Live-session credential provisioning.
- Usage and quota enforcement.
- Upload authorization.
- Analysis job creation.
- AI provider integration.
- Report validation.
- Data access control.

**AI services**

- Gemini Live for conversational, spoken coaching.
- A multimodal video model for post-session interpretation.
- A pose-estimation model for supported movement measurements.
- Optional specialized analysis models as accuracy requirements become clearer.

**Persistence**

- Supabase Auth for authentication.
- PostgreSQL for session metadata and reports.
- Private object storage for uploaded recordings.
- A durable job queue and worker for video analysis.

### 7.2 Live video pipeline

The camera stream must feed two independent paths:

**Path A: Local recording**

Camera stream → MediaRecorder → complete recording file.

**Path B: Live coaching**

Camera frames sampled at approximately 1 FPS → Gemini Live, with microphone audio and generated speech as configured.

The two paths must not depend on one another for successful recording.

The browser must not send every full-resolution frame to Gemini without regard to cost, bandwidth or documented API constraints.

### 7.3 Post-session pipeline

Uploaded recording → validation → timeline extraction → candidate segment detection → detailed clip analysis → evidence consolidation → structured report → persistent session history.

The initial implementation should use a straightforward asynchronous worker rather than an unnecessarily complex multi-agent system.

### 7.4 Live model limitations

The selected Gemini Live model and API configuration must be verified against current documentation before implementation.

Important constraints include:

- Video sampling loses fast-motion detail.
- Audio-video sessions have documented duration limits.
- Model output can be delayed or incorrect.
- Browser connections can be interrupted.
- A model's ability to converse does not establish its ability to measure boxing technique accurately.

The architecture must support reconnecting live sessions and separating live coaching from post-session analysis.

### 7.5 Analysis evidence schema

Each technical observation should contain fields equivalent to:

- `finding_id`
- `category`
- `observation`
- `evidence_start_seconds`
- `evidence_end_seconds`
- `confidence`
- `limitations`
- `correction`
- `recommended_drill`
- `validation_status`

Only supported observations should be presented as definitive findings.

The backend must validate model output against a schema before saving it.

---

## 8. UX and Interface Requirements

### 8.1 Main application screens

1. Landing page.
2. Sign-up and sign-in.
3. Onboarding.
4. Dashboard.
5. Workout configuration.
6. Camera setup.
7. Active workout.
8. Session completion.
9. Analysis processing.
10. Analysis report.
11. Session history.
12. Progress dashboard.
13. Subscription and billing.
14. Settings, privacy and account deletion.

### 8.2 Dashboard

The dashboard should prioritize starting another workout.

Primary elements:

- Start Training button.
- Resume or view latest session.
- Recent analysis summary.
- Current training focus.
- Weekly activity.
- Subscription usage.

### 8.3 Active workout screen

The active workout screen must be designed for use from a distance.

It should include:

- Large live camera preview.
- Recording indicator.
- Elapsed time.
- Current round and rest countdown.
- AI connection status.
- Coaching mute control.
- Pause and stop controls.
- Latest spoken instruction displayed as text.
- Minimal controls that can be reached easily.

The interface must not require users to read long paragraphs while moving.

### 8.4 Analysis report screen

The report should include:

- Summary.
- Priority corrections.
- Video timeline with markers.
- Replayable evidence clips.
- Drill instructions.
- Previous-session comparisons.
- Start-next-session action.

A report should never present invented precision through decorative scores or confidence percentages that have no defensible meaning.

### 8.5 Visual direction

Use a focused, premium sports-training aesthetic.

Suggested direction:

- Dark, high-contrast training interface.
- Large typography for workout controls.
- Clear recording and connection states.
- Minimal visual clutter during workouts.
- Strong contrast and accessible text sizes.
- More detailed layouts on post-session reports.

The visual design should communicate performance and clarity, not imitate a generic chatbot.

---

## 9. Data Model

### users

- `id`
- `display_name`
- `experience_level`
- `preferred_sport`
- `preferred_language`
- `created_at`

### training_sessions

- `id`
- `user_id`
- `sport`
- `session_type`
- `experience_level`
- `started_at`
- `ended_at`
- `duration_seconds`
- `recording_status`
- `analysis_status`
- `created_at`

### session_recordings

- `id`
- `session_id`
- `storage_key`
- `mime_type`
- `size_bytes`
- `duration_seconds`
- `retention_expires_at`
- `created_at`

### session_reports

- `id`
- `session_id`
- `summary`
- `strengths_json`
- `corrections_json`
- `training_plan_json`
- `model_version`
- `analysis_version`
- `created_at`

### analysis_jobs

- `id`
- `session_id`
- `status`
- `attempt_count`
- `error_code`
- `started_at`
- `completed_at`

### subscriptions

- `id`
- `user_id`
- `provider`
- `provider_subscription_id`
- `plan_id`
- `status`
- `current_period_end`

### usage_events

- `id`
- `user_id`
- `session_id`
- `event_type`
- `quantity`
- `estimated_cost`
- `created_at`

All user-owned records must enforce authorization through database policies and backend checks. Sensitive provider credentials must not be stored in client-accessible tables.

---

## 10. API Requirements

Illustrative REST endpoints:

### Authentication and configuration

- `GET /api/me`
- `GET /api/config`
- `POST /api/live-sessions/token`

### Training sessions

- `POST /api/sessions`
- `GET /api/sessions`
- `GET /api/sessions/{session_id}`
- `PATCH /api/sessions/{session_id}`
- `POST /api/sessions/{session_id}/finish`

### Recording and analysis

- `POST /api/sessions/{session_id}/recording/upload-init`
- `POST /api/sessions/{session_id}/recording/upload-complete`
- `POST /api/sessions/{session_id}/analysis`
- `GET /api/sessions/{session_id}/analysis`
- `GET /api/analysis-jobs/{job_id}`

### Reports and privacy

- `GET /api/sessions/{session_id}/report`
- `DELETE /api/sessions/{session_id}/recording`
- `DELETE /api/account`

These endpoints are a proposed interface, not an existing implementation. Request and response schemas, idempotency behavior, authorization and error codes must be defined before development.

Long-running analysis must run asynchronously. Clients should poll or use a supported push mechanism for status updates rather than keeping an HTTP request open throughout processing.

---

## 11. Security and Privacy

### Authentication

- Validate authentication tokens on every protected backend request.
- Enforce user ownership on every session and recording.
- Apply database row-level security.
- Restrict administrative access.

### API credentials

- Never embed permanent Gemini or payment-provider secrets in the frontend.
- Issue short-lived, restricted live-session credentials through the backend.
- Apply quotas and abuse protection.

### Video privacy

- Keep original recordings private.
- Obtain clear consent before uploading recordings for AI analysis.
- Explain external AI processing.
- Define default retention and deletion periods before public launch.
- Provide user-initiated deletion.
- Delete associated objects and derived records according to the retention policy.
- Avoid using recordings for model training unless separate, explicit permission and a lawful basis exist.
- Do not expose signed URLs in public logs or analytics.

### Browser permissions

Camera and microphone access require HTTPS in production and user permission. Permission denial must produce a helpful recovery path rather than a broken page.

### Safety

- State that AI feedback may be inaccurate.
- Do not diagnose injuries or medical conditions.
- Do not claim to guarantee injury prevention.
- Stop coaching when the user asks to stop.
- Include clear physical stop controls.
- Avoid encouraging dangerous intensity or unsupervised sparring.
- Provide conservative beginner guidance.
- Do not fabricate observations when the video is unclear.

---

## 12. PWA-Specific Constraints

The product must explicitly account for browser limitations.

### Camera and microphone

Use `navigator.mediaDevices.getUserMedia()` after a user gesture and handle unsupported or denied permissions.

### Recording

Use `MediaRecorder` with runtime MIME-type detection. Do not assume every browser records the same format.

### Local persistence

Do not rely on unlimited browser storage. Recording files may be large, browser storage may be evicted, and some devices may have little free space.

The MVP should provide a visible recording-save status and a reliable upload/retry path.

### Background behavior

The active workout must be treated as a foreground experience. Navigating away, locking the device, switching applications, or allowing the browser to suspend the page can interrupt recording or the live AI connection.

Do not promise uninterrupted background recording.

### iOS and Android

Test installed PWAs and normal browser tabs separately on actual devices.

Camera access, microphone behavior, supported codecs, memory pressure, audio playback, and page suspension can differ by browser and operating-system version.

### Offline behavior

The app shell and cached static assets may be available offline. AI streaming, authentication-dependent operations, uploads and cloud analysis require connectivity.

The app must not imply that the AI instructor remains live without a working network connection.

---

## 13. Performance Requirements

Initial targets:

- Dashboard first meaningful render: under 2.5 seconds on a representative mid-range device and normal network.
- Camera preview: usable within 3 seconds after permissions are granted on supported devices.
- Live AI connection: target under 5 seconds on a healthy connection.
- Spoken coaching: target a median of 3 seconds or less after a relevant input is processed, measured end to end.
- Analysis report: target completion within 3 minutes for a typical 10–15-minute recording, subject to the chosen provider and processing capacity.
- Recording recovery: a recoverable upload interruption must not require the user to repeat the workout.

These are engineering targets, not guaranteed API service levels.

Measure performance by device, network quality, session length and model configuration.

---

## 14. Subscription and Monetization

Proposed initial pricing experiments:

**Free**
- Limited live coaching.
- A small number of post-session analyses.
- Basic session history.

**Pro Monthly**
- Initial test price: $9.99/month.
- Higher live-session allowance.
- More post-session analyses.
- Detailed reports and progress history.

**Pro Annual**
- Initial test price: $59.99/year.
- Equivalent Pro functionality at a discounted annual rate.

Regional pricing, including India, should be tested independently.

Usage limits must be configurable on the backend. They should be based on actual inference costs, recording-processing costs and observed retention.

Do not launch unlimited AI video analysis before measuring its unit economics.

### Core business metrics

- Visitor-to-sign-up conversion.
- Sign-up-to-first-session conversion.
- First-session completion rate.
- Percentage of users who upload a recording for analysis.
- Second-session rate.
- Week-one and week-four retention.
- Paid conversion.
- Subscription cancellation.
- AI cost per completed session.
- Gross margin per paid user.

---

## 15. Analytics and Instrumentation

Track events such as:

- `signup_completed`
- `onboarding_completed`
- `workout_configured`
- `camera_permission_granted`
- `camera_permission_denied`
- `recording_started`
- `recording_completed`
- `live_session_connected`
- `live_session_interrupted`
- `coaching_response_received`
- `recording_upload_completed`
- `analysis_started`
- `analysis_completed`
- `report_opened`
- `report_feedback_submitted`
- `second_session_started`
- `subscription_started`
- `subscription_cancelled`

Do not send raw video, audio, transcripts or sensitive personal content to general analytics services.

Use aggregate metrics and pseudonymous identifiers where practical.

---

## 16. Testing and Quality Assurance

### Unit tests

- Session state transitions.
- Usage-limit enforcement.
- Report schema validation.
- Recording metadata validation.
- Authorization checks.
- Subscription entitlement logic.

### Integration tests

- Gemini Live credential provisioning.
- Live connection failure and recovery.
- Recording upload and retry.
- Analysis job creation and retries.
- Report persistence.
- Recording deletion.

### Device tests

Test on representative combinations of:

- Android Chrome.
- iOS Safari.
- Installed iOS PWA.
- Installed Android PWA.
- Desktop Chrome or Firefox for report review.

Include low-memory devices, weak network connections, camera permission denial, low storage, incoming calls, browser backgrounding and device lock.

### AI evaluation

Create a consented evaluation dataset containing boxing footage reviewed by experienced coaches.

For each supported finding, measure:

- Agreement with human reviewers.
- False-positive rate.
- Missed relevant errors.
- Timestamp accuracy.
- Repeatability across equivalent recordings.
- Confidence calibration.
- Quality of the recommended correction.

A coach-approved benchmark is required before making strong accuracy claims.

---

## 17. MVP Acceptance Criteria

The MVP is considered ready for a limited beta when all P0 requirements pass.

1. A user can sign in and configure a boxing session.
2. The PWA can request camera and microphone permissions correctly.
3. The application records a complete workout independently of the live AI stream.
4. The user can start and stop a Gemini Live session.
5. The AI can deliver spoken responses and handle user questions.
6. The app displays connection and recording status.
7. Live connection failure does not automatically destroy the recording.
8. The user can upload a completed recording.
9. An asynchronous analysis job can complete or report a recoverable error.
10. A report can display evidence-linked observations and recommended drills.
11. Every report is associated with the correct user's session.
12. A user cannot access another user's recordings or reports.
13. Recording deletion follows the documented retention policy.
14. Usage limits are enforced server-side.
15. Core flows pass tests on supported Android and iOS browsers.

The beta must not advertise validated biomechanical precision before the evaluation dataset supports those claims.

---

## 18. Development Roadmap

### Phase 1: Technical feasibility

- Build the PWA shell.
- Test camera capture and MediaRecorder on target browsers.
- Implement live Gemini connectivity.
- Validate simultaneous local recording and live audio interaction.
- Measure latency and connection interruptions.

**Exit criterion:** A 10–15-minute workout can be recorded while the live instructor operates, with recoverable failure handling.

### Phase 2: Post-session analysis

- Implement private uploads.
- Build the asynchronous processing worker.
- Extract frames and candidate clips.
- Integrate multimodal analysis.
- Generate validated report objects.
- Implement timestamped playback.

**Exit criterion:** A completed workout produces a report that can be reviewed against the original footage.

### Phase 3: Coaching quality

- Define supported boxing fundamentals.
- Build the evaluation dataset.
- Review findings with experienced coaches.
- Improve confidence thresholds and false-positive handling.
- Add feedback collection.

**Exit criterion:** Supported corrections meet predefined quality thresholds established during the evaluation phase.

### Phase 4: Product experience

- Complete onboarding and dashboard.
- Add session history.
- Add progress comparisons.
- Implement usage accounting.
- Add privacy and deletion flows.

**Exit criterion:** Test users can complete the end-to-end workflow without developer intervention.

### Phase 5: Paid beta

- Add subscriptions.
- Enforce usage limits.
- Monitor AI costs.
- Recruit initial users.
- Measure repeat sessions and paid conversion.
- Prioritize improvements based on actual feedback.

**Exit criterion:** Evidence of repeat use, credible coaching quality and sustainable per-session economics.

### Phase 6: Kickboxing expansion

- Add kick-specific movement categories.
- Create a separate evaluation dataset.
- Validate camera positioning for kicks.
- Extend coaching instructions and training plans.
- Release only supported techniques.

---

## 19. Risks and Mitigations

**Risk: AI gives incorrect technical feedback.**  
Mitigation: Require evidence, confidence thresholds, coach-reviewed evaluation and explicit uncertainty.

**Risk: Fast movements are missed by sampled live video.**  
Mitigation: Use sampled frames for general live guidance and higher-frame-rate clips for post-session review.

**Risk: Browser recording is interrupted.**  
Mitigation: Prioritize foreground operation, test device behavior, preserve recoverable recordings and provide upload retries.

**Risk: Live API sessions expire or disconnect.**  
Mitigation: Implement supported session renewal, reconnection and independent local recording.

**Risk: Video processing is expensive.**  
Mitigation: Enforce quotas, inspect selected clips and measure cost per completed report.

**Risk: Users try it once and leave.**  
Mitigation: Make corrections actionable, preserve progress history and give each new session a clear training focus.

**Risk: The product looks like a generic AI wrapper.**  
Mitigation: Invest in reliable video evidence, sport-specific evaluation, repeatable measurements and a coherent coaching progression.

**Risk: Camera footage is sensitive.**  
Mitigation: Use explicit consent, private storage, restricted access, clear retention and user-controlled deletion.

---

## 20. Open Technical Decisions

These decisions must be resolved during Phase 1:

1. Which currently supported Gemini Live model and connection method best fit browser-based audio-video coaching?
2. Which live-session renewal strategy is compatible with the selected API?
3. Which video-analysis model offers the best trade-off between evidence quality, latency and cost?
4. Which pose-estimation implementation performs adequately on supported mobile devices?
5. What recording duration, file size and upload limits are viable across iOS and Android?
6. Should the first analysis pipeline run on a dedicated Python worker or a managed job-processing service?
7. What retention period should apply to original recordings and derived clips?
8. Which payment provider and regional pricing configuration should be used for the initial launch?

These decisions should be made using working prototypes and measured results rather than assumptions.

---

## 21. Definition of Success

The product succeeds when users consistently return because the AI identifies useful improvements they can understand and apply.

The primary product metric is:

**Weekly coached training sessions per active user.**

Supporting measures include:

- Repeat-session rate.
- Completed analysis rate.
- User-rated correction usefulness.
- Agreement with coach-reviewed findings.
- Week-four retention.
- Paid conversion.
- Cost per completed session.

The first release should optimize for one outcome: a user records a workout, receives credible feedback, applies a correction, and returns to train again.

That repeatable improvement loop is the product. The AI model is only one component of it.
