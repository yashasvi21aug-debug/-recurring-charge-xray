"""
detect.py (v2)

Now the "brain" does two smarter things:

1. FUZZY MATCHING: groups transactions even if the description text isn't
   identical (e.g. "NETFLIX.COM" and "Netflix*Subscription" are treated as
   the same merchant).

   How: bank descriptions are messy ("NETFLIX.COM", "Netflix*Subscription",
   "Netflix Subscription"). Comparing the FULL messy text directly doesn't
   work well, because things like ".com" or "*Subscription" throw off the
   similarity score. So instead, we first strip out symbols/numbers and
   grab the first clean word (the "core name") -- e.g. "netflix" -- and
   compare THAT. This is simpler and more reliable than comparing full
   messy strings.

2. INTERVAL CHECKING: after grouping, it looks at the DATES of each charge
   and checks if they happen at a roughly regular gap (like every ~30 days).
   Only if the gap is consistent do we call it "recurring" -- this avoids
   wrongly flagging things that just happened to repeat by coincidence.
"""

import csv
import re
from datetime import datetime
from rapidfuzz import fuzz

SIMILARITY_THRESHOLD = 80
INTERVAL_TOLERANCE_DAYS = 5


def load_transactions(filepath):
    transactions = []
    with open(filepath, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            row["date"] = datetime.strptime(row["date"], "%Y-%m-%d")
            row["amount"] = float(row["amount"])
            transactions.append(row)
    return transactions


def extract_core_name(description):
    cleaned = re.sub(r"[^a-zA-Z\s]", " ", description)
    words = cleaned.split()
    return words[0].lower() if words else description.lower()


def group_similar_merchants(transactions):
    groups = []
    for txn in transactions:
        core = extract_core_name(txn["description"])
        placed = False
        for group in groups:
            group_core = extract_core_name(group[0]["description"])
            similarity = fuzz.ratio(core, group_core)
            if similarity >= SIMILARITY_THRESHOLD:
                group.append(txn)
                placed = True
                break
        if not placed:
            groups.append([txn])
    return groups


def check_interval_consistency(group):
    if len(group) < 2:
        return False, None, 0
    sorted_group = sorted(group, key=lambda t: t["date"])
    gaps = []
    for i in range(1, len(sorted_group)):
        gap = (sorted_group[i]["date"] - sorted_group[i - 1]["date"]).days
        gaps.append(gap)
    avg_gap = sum(gaps) / len(gaps)
    max_deviation = max(abs(gap - avg_gap) for gap in gaps)
    is_recurring = max_deviation <= INTERVAL_TOLERANCE_DAYS
    confidence = max(0, 100 - (max_deviation * 10))
    return is_recurring, round(avg_gap), round(confidence)


def analyze(filepath):
    transactions = load_transactions(filepath)
    groups = group_similar_merchants(transactions)
    results = []
    for group in groups:
        is_recurring, avg_gap, confidence = check_interval_consistency(group)
        if is_recurring:
            results.append({
                "merchant": group[0]["description"],
                "occurrences": len(group),
                "avg_amount": round(sum(t["amount"] for t in group) / len(group), 2),
                "avg_interval_days": avg_gap,
                "confidence": confidence,
            })
    return results


if __name__ == "__main__":
    results = analyze("sample_transactions.csv")
    print(f"Found {len(results)} recurring charge(s):\n")
    for r in results:
        print(
            f"- {r['merchant']}: {r['occurrences']} times, "
            f"avg Rs.{r['avg_amount']}, every ~{r['avg_interval_days']} days "
            f"(confidence: {r['confidence']}%)"
        )