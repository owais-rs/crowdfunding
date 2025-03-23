// Solidity version
pragma solidity ^0.8.0;

// Campaign Factory Contract to manage the creation of campaigns
contract CampaignFactory {
    mapping(uint256 => address) public campaigns;
    uint256 public campaignCount;

    event CampaignCreated(uint256 campaignId, address campaignAddress);

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goalAmount,
        uint256 _durationInDays
    ) public {
        Campaign newCampaign = new Campaign(
            msg.sender,
            _title,
            _description,
            _goalAmount,
            _durationInDays
        );
        campaigns[campaignCount] = address(newCampaign);
        emit CampaignCreated(campaignCount, address(newCampaign));
        campaignCount++;
    }
}

// Smart Contract for an individual Crowdfunding Campaign
contract Campaign {
    // Struct to store milestone details
    struct Milestone {
        string description;
        uint256 amount;
        uint256 contributedAmount;
        bool approved;
        uint256 approvalCount;
        mapping(address => bool) approvals;
    }

    address payable public creator;
    string public title;
    string public description;
    uint256 public goalAmount;
    uint256 public currentAmount;
    uint256 public deadline;
    uint256 public milestoneCount;
    uint256 public currentMilestone;
    bool public fundsReleased;

    mapping(uint256 => Milestone) public milestones;
    mapping(address => bool) public contributors;

    event ContributionReceived(address contributor, uint256 amount);
    event FundsReleased(uint256 milestoneId, uint256 amount);
    event MilestoneApproved(uint256 milestoneId, address approver);
    event RefundIssued(address contributor, uint256 amount);

    constructor(
        address _creator,
        string memory _title,
        string memory _description,
        uint256 _goalAmount,
        uint256 _durationInDays
    ) {
        require(_goalAmount > 0, "Goal amount should be greater than zero");
        require(_durationInDays > 0, "Duration should be greater than zero");

        creator = payable(_creator);
        title = _title;
        description = _description;
        goalAmount = _goalAmount;
        currentAmount = 0;
        deadline = block.timestamp + (_durationInDays * 1 days);
        fundsReleased = false;
        milestoneCount = 0;
        currentMilestone = 0;
    }

    // Function to add a milestone
    function addMilestone(string memory _description, uint256 _amount) public {
        require(msg.sender == creator, "Only campaign creator can add milestones");
        require(_amount > 0, "Milestone amount must be greater than zero");
        require(currentAmount + _amount <= goalAmount, "Milestone amount exceeds goal");

        milestones[milestoneCount].description = _description;
        milestones[milestoneCount].amount = _amount;
        milestones[milestoneCount].contributedAmount = 0;
        milestones[milestoneCount].approved = false;
        milestones[milestoneCount].approvalCount = 0;
        milestoneCount++;
    }

    // Function to contribute to a campaign
    function contribute() public payable {
        require(block.timestamp < deadline, "Campaign has ended");
        require(currentAmount < goalAmount, "Campaign goal has already been reached");
        require(msg.value > 0, "Contribution should be greater than zero");

        currentAmount += msg.value;
        contributors[msg.sender] = true;

        // Update the contributed amount for the current milestone
        if (currentMilestone < milestoneCount) {
            milestones[currentMilestone].contributedAmount += msg.value;
        }

        emit ContributionReceived(msg.sender, msg.value);
    }

    // Function to approve a milestone
    function approveMilestone(uint256 _milestoneId) public {
        require(contributors[msg.sender], "Only contributors can approve milestones");
        require(_milestoneId < milestoneCount, "Invalid milestone ID");
        Milestone storage milestone = milestones[_milestoneId];
        require(!milestone.approvals[msg.sender], "You have already approved this milestone");

        milestone.approvals[msg.sender] = true;
        milestone.approvalCount++;

        if (milestone.approvalCount > (milestoneCount / 2)) {
            milestone.approved = true;
        }

        emit MilestoneApproved(_milestoneId, msg.sender);
    }

    // Function to release funds for a milestone
    function releaseMilestoneFunds() public {
        require(msg.sender == creator, "Only campaign creator can release funds");
        require(currentMilestone < milestoneCount, "All milestones have been completed");

        Milestone storage milestone = milestones[currentMilestone];
        require(milestone.approved, "Milestone has not been approved by contributors");

        creator.transfer(milestone.amount);
        currentMilestone++;

        if (currentMilestone == milestoneCount) {
            fundsReleased = true;
        }

        emit FundsReleased(currentMilestone - 1, milestone.amount);
    }

    // Function to request a refund if the campaign goal is not met
    function requestRefund() public {
        require(block.timestamp >= deadline, "Campaign is still ongoing");
        require(currentAmount < goalAmount, "Campaign goal has been met");
        require(contributors[msg.sender], "You are not a contributor");

        uint256 contributedAmount = address(this).balance * msg.sender.balance / currentAmount;
        payable(msg.sender).transfer(contributedAmount);
        contributors[msg.sender] = false;

        emit RefundIssued(msg.sender, contributedAmount);
    }

    // Function to get the progress of the ongoing milestone
    function getMilestoneProgress(uint256 _milestoneId) public view returns (uint256, uint256) {
        require(_milestoneId < milestoneCount, "Invalid milestone ID");
        Milestone storage milestone = milestones[_milestoneId];
        return (milestone.contributedAmount, milestone.amount);
    }
}
