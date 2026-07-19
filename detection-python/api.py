"""
api.py

This turns our detection logic into a small web server (an "API").
Instead of running detect.py by hand each time, other programs (like our
Node backend) can send it a CSV file over the internet/network, and this
will respond with the detected recurring charges as JSON data.

We are NOT rewriting the detection logic -- we're reusing the functions
from detect.py and just adding a "front door" that accepts file uploads.
"""

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

# Reuse everything we already built and tested in detect.py
from detect import analyze

app = FastAPI()

# Allows our Node backend / frontend (running on a different port) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for now, allow any origin -- we'll tighten this later
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    """Simple test route -- visit this in a browser to check the server is alive."""
    return {"message": "Detection API is running!"}


@app.post("/analyze")
async def analyze_csv(file: UploadFile = File(...)):
    """
    This is the real endpoint. It:
    1. Receives an uploaded CSV file
    2. Temporarily saves it to disk
    3. Runs our existing analyze() function from detect.py on it
    4. Returns the results as JSON
    5. Deletes the temporary file
    """
    temp_path = f"temp_{file.filename}"

    # Save the uploaded file temporarily so our existing analyze() function can read it
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        results = analyze(temp_path)
    finally:
        # Clean up the temp file whether it succeeded or failed
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return {"recurring_charges": results}