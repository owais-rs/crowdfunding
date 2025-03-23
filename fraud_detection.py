import json
from tabulate import tabulate

# Load sample data
with open("sample_campaign_data.json", "r") as f:
    data = json.load(f)

contributions = data["contributions"]
approvals = data["approvals"]

# Define fraud detection rules
FRAUD_THRESHOLD_LARGE_AMOUNT = 3  # ETH
FRAUD_THRESHOLD_RAPID_TRANSACTIONS = 3  # Contributions in 10 min
FRAUD_THRESHOLD_APPROVALS = 80  # % of contributors approving milestones instantly

def detect_fraud():
    fraud_cases = {"Large Contributions": [], "Suspicious Milestone Approvals": []}

    # Rule 1: Large Contributions
    for contribution in contributions:
        if contribution["amount"] > FRAUD_THRESHOLD_LARGE_AMOUNT:
            fraud_cases["Large Contributions"].append([
                contribution["campaign_id"],
                contribution["contributor"],
                contribution["amount"],
                "Unusually large contribution detected"
            ])

    # Rule 3: Suspicious Milestone Approvals
    campaign_approval_counts = {}
    campaign_total_contributors = {}

    for approval in approvals:
        campaign_id = approval["campaign_id"]
        if campaign_id not in campaign_approval_counts:
            campaign_approval_counts[campaign_id] = 0
            campaign_total_contributors[campaign_id] = set()
        campaign_approval_counts[campaign_id] += 1
        campaign_total_contributors[campaign_id].add(approval["approver"])

    for campaign_id, approval_count in campaign_approval_counts.items():
        total_contributors = len(campaign_total_contributors[campaign_id])
        if total_contributors > 0:
            approval_rate = (approval_count / total_contributors) * 100
            if approval_rate > FRAUD_THRESHOLD_APPROVALS:
                fraud_cases["Suspicious Milestone Approvals"].append([
                    campaign_id,
                    "Milestone approved by an unusually high number of contributors"
                ])

    return fraud_cases

# Run fraud detection
fraud_cases = detect_fraud()

# Print results in a more readable format
print("\n🚨 FRAUD DETECTION REPORT 🚨\n")

if fraud_cases["Large Contributions"]:
    print(tabulate(fraud_cases["Large Contributions"], headers=["Campaign ID", "Contributor", "Amount (ETH)", "Reason"], tablefmt="grid"))
else:
    print("✅ No large contributions detected.")

print("\n------------------------------------------------------\n")

if fraud_cases["Suspicious Milestone Approvals"]:
    print(tabulate(fraud_cases["Suspicious Milestone Approvals"], headers=["Campaign ID", "Reason"], tablefmt="grid"))
else:
    print("✅ No suspicious milestone approvals detected.")
