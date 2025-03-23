import json
import random
import time

# Function to generate random Ethereum addresses
def random_address():
    return "0x" + "".join(random.choices("abcdef0123456789", k=40))

# Generate sample campaigns
sample_campaigns = []
for i in range(5):
    campaign = {
        "campaign_id": i,
        "creator": random_address(),
        "title": f"Campaign {i}",
        "description": f"Description for Campaign {i}",
        "goal_amount": random.randint(5, 20),  # ETH
        "current_amount": 0,
        "deadline": int(time.time()) + random.randint(1, 10) * 86400,  # Future timestamp
        "milestones": [
            {
                "milestone_id": j,
                "description": f"Milestone {j} for Campaign {i}",
                "amount": random.randint(1, 5),  # ETH
                "contributed_amount": 0,
                "approved": False,
                "approval_count": 0
            }
            for j in range(random.randint(2, 5))
        ]
    }
    sample_campaigns.append(campaign)

# Generate random contributions
sample_contributions = []
for _ in range(20):
    contribution = {
        "campaign_id": random.randint(0, 4),
        "contributor": random_address(),
        "amount": round(random.uniform(0.01, 5), 2),  # ETH
        "timestamp": int(time.time()) - random.randint(1, 5000)
    }
    sample_contributions.append(contribution)

# Generate milestone approvals
sample_approvals = []
for _ in range(15):
    approval = {
        "campaign_id": random.randint(0, 4),
        "milestone_id": random.randint(0, 3),
        "approver": random_address(),
        "approved": random.choice([True, False])
    }
    sample_approvals.append(approval)

# Save all generated data into a JSON file
sample_data = {
    "campaigns": sample_campaigns,
    "contributions": sample_contributions,
    "approvals": sample_approvals
}

with open("sample_campaign_data.json", "w") as f:
    json.dump(sample_data, f, indent=4)

print("Sample campaign data generated successfully.")
