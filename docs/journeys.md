# Wrayth End-to-End Journeys

The seven paths a real user takes through Wrayth. Every phase-12 QA pass
walks each one and screenshots the result into the Launch Checklist.

## 1. Personal user — first run

1. Land on `/`
2. Click **Meet Ray**
3. Sign up
4. Ray's onboarding: Personal or Business, name, first goal
5. Land on `/app/dashboard` with a personalized greeting
6. Add first password
7. Run a breach check
8. Return tomorrow → morning brief acknowledges the password added

## 2. Personal user — returning

1. Land on `/app/dashboard`
2. See greeting by name + one-line memory
3. Read morning brief
4. Ask Ray something via ⌘K
5. Complete a recommended playbook

## 3. Business admin — first run

1. Sign up
2. Choose "Business" in onboarding
3. Create organization
4. Invite two teammates
5. Land on `/app/org` with executive summary

## 4. Organization member

1. Accept invite email
2. Sign in
3. Complete personal onboarding
4. See both personal dashboard and org brief link

## 5. MSP — client rollup

1. Sign in as MSP
2. Land on `/app/msp`
3. Add a client organization
4. Review rollup health

## 6. Browser extension

1. Install extension
2. Sign in inside the popup
3. Visit a login page → Context Bar appears
4. Autofill from Passwords
5. Click "Explain this page" → Ray-voiced review
6. Timeline entry appears in the main app

## 7. Ray-driven playbook

1. From the dashboard, click a recommendation
2. Playbook opens in `/app/ray/playbook/:runId`
3. Step through each task
4. Completion writes to timeline
5. Score updates on the dashboard
