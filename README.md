# Recurring Charge X-Ray — Starter Setup

This is Step 1 of the project. Here's what exists so far, in plain terms.

## What's here

```
recurring-charge-xray/
├── backend-node/          ← the app's skeleton (API, will handle uploads/auth)
│   ├── server.js
│   ├── routes/upload.js
│   └── package.json
├── detection-python/       ← the "brain" that finds recurring charges
│   ├── detect.py
│   └── sample_transactions.csv   ← fake test data
└── README.md
```

## How to run the Python part (the brain) — do this first

1. Open a terminal in `detection-python/`
2. Run: `python3 detect.py`
3. You should see it print out "NETFLIX.COM" and "SPOTIFY PREMIUM" as recurring charges

This is intentionally very basic right now — it just checks for exact repeated
descriptions. It doesn't yet:
- handle slightly different descriptions for the same merchant (e.g. "NETFLIX.COM" vs "Netflix Inc")
- check if the charges actually happen at regular time intervals
- give a confidence score

We'll build all of that next, one piece at a time.

## How to run the Node backend

1. Open a terminal in `backend-node/`
2. Run: `npm install` (downloads the packages it needs)
3. Run: `npm run start`
4. Visit `http://localhost:5000` in your browser — you should see
   "Recurring Charge X-Ray backend is running!"

This currently does nothing with the CSV yet — it's just the skeleton running.
Next step: connect the upload route to actually accept a CSV file from the user.

## What's next (in order)

1. Make the Python detection smarter (fuzzy matching + interval checking)
2. Connect Node's upload route to actually receive a CSV and call the Python script
3. Store results in a database
4. Build the React frontend to upload files and show the dashboard

Tell Claude "let's do step 1" (or whichever step) whenever you're ready to continue.
