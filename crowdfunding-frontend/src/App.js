import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0xe1eB0742F16a1DC6DB40e3ed78ce6c1394515A1F";
const ABI = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "campaignId", "type": "uint256" },
      { "indexed": false, "internalType": "address", "name": "campaignAddress", "type": "address" }
    ],
    "name": "CampaignCreated",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "uint256", "name": "_goalAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "_durationInDays", "type": "uint256" }
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "campaignCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "campaigns",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const CAMPAIGN_ABI = [
  { "inputs": [], "name": "title", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "description", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "goalAmount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "currentAmount", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "deadline", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "contribute", "outputs": [], "stateMutability": "payable", "type": "function" }
];

export default function Home() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '', goal: '', duration: '' });
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedCampaignData, setSelectedCampaignData] = useState({ title: '', description: '', goal: '', current: '', timeLeft: '' });
  const [contributionAmount, setContributionAmount] = useState('');

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', () => connectWallet());
    }
  }, []);

  async function connectWallet() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    const address = await signer.getAddress();
    const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    setAccount(address);
    setContract(contractInstance);
  }

  async function fetchCampaigns() {
    if (!contract) return;
    const count = await contract.campaignCount();
    let all = [];
    for (let i = 0; i < count; i++) {
      let addr = await contract.campaigns(i);
      all.push(addr);
    }
    setCampaigns(all);
  }

  async function handleCreateCampaign() {
    const goalInWei = ethers.utils.parseEther(newCampaign.goal);
    const tx = await contract.createCampaign(
      newCampaign.title,
      newCampaign.description,
      goalInWei,
      parseInt(newCampaign.duration)
    );
    await tx.wait();
    fetchCampaigns();
    alert('Campaign created');
  }

  async function handleContribute() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const campaignContract = new ethers.Contract(selectedCampaign, CAMPAIGN_ABI, signer);

    const tx = await campaignContract.contribute({
      value: ethers.utils.parseEther(contributionAmount)
    });

    await tx.wait();
    alert("Contribution successful!");
  }

  async function loadCampaignDetails(addr) {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(addr, CAMPAIGN_ABI, provider);
    const title = await contract.title();
    const description = await contract.description();
    const goal = await contract.goalAmount();
    const current = await contract.currentAmount();
    const deadline = await contract.deadline();
    const now = Math.floor(Date.now() / 1000);
    const secondsLeft = deadline.toNumber() - now;
    const daysLeft = Math.max(0, Math.floor(secondsLeft / 86400));

    setSelectedCampaign(addr);
    setSelectedCampaignData({
      title,
      description,
      goal: ethers.utils.formatEther(goal),
      current: ethers.utils.formatEther(current),
      timeLeft: daysLeft
    });
  }

  function openCampaignInRemix(address) {
    const url = `https://sepolia.etherscan.io/address/${address}`;
    window.open(url, '_blank');
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 p-6">
      <h1 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-transparent bg-clip-text">
  Crowdfunding DApp
</h1>

      {!account ? (
        <button onClick={connectWallet} className="bg-blue-600 text-white px-4 py-2 rounded">
          Connect Wallet
        </button>
      ) : (
        <div>
          <p className="mb-4">Connected as: {account}</p>

          <div className="mb-8 bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold mb-2">Create New Campaign</h2>
            <input type="text" placeholder="Title" className="border p-2 mr-2 mb-2" onChange={e => setNewCampaign({ ...newCampaign, title: e.target.value })} />
            <input type="text" placeholder="Description" className="border p-2 mr-2 mb-2" onChange={e => setNewCampaign({ ...newCampaign, description: e.target.value })} />
            <input type="number" placeholder="Goal (ETH)" className="border p-2 mr-2 mb-2" onChange={e => setNewCampaign({ ...newCampaign, goal: e.target.value })} />
            <input type="number" placeholder="Duration (days)" className="border p-2 mr-2 mb-2" onChange={e => setNewCampaign({ ...newCampaign, duration: e.target.value })} />
            <button onClick={handleCreateCampaign} className="bg-green-600 text-white px-4 py-2 rounded">
              Create
            </button>
          </div>

          <div>
            <button onClick={fetchCampaigns} className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2 rounded mb-4 shadow">
              Fetch Campaigns
            </button>
            {campaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {campaigns.map((addr, idx) => (
                  <div key={idx} className="bg-white border p-5 rounded-xl shadow-lg transition hover:scale-[1.01]">
                    <p className="font-semibold">Campaign #{idx + 1}</p>
                    <p className="text-xs text-gray-500 mb-2">Address: {addr}</p>
                    <button onClick={() => openCampaignInRemix(addr)} className="bg-blue-500 text-white px-3 py-1 rounded mr-2">
                      View on Etherscan
                    </button>
                    <button onClick={() => loadCampaignDetails(addr)} className="bg-yellow-500 text-white px-3 py-1 rounded">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : <p>No campaigns found.</p>}
          </div>

          {selectedCampaign && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold mb-2">Campaign Details</h2>
              <p className="mb-1"><strong>Title:</strong> {selectedCampaignData.title}</p>
              <p className="mb-1"><strong>Description:</strong> {selectedCampaignData.description}</p>
              <p className="mb-1"><strong>Goal:</strong> {selectedCampaignData.goal} ETH</p>
              <p className="mb-1"><strong>Current Raised:</strong> {selectedCampaignData.current} ETH</p>
              <p className="mb-4"><strong>Time Remaining:</strong> {selectedCampaignData.timeLeft} day(s)</p>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div className="bg-green-500 h-4 rounded-full" style={{ width: `${(selectedCampaignData.current / selectedCampaignData.goal) * 100}%` }}></div>
              </div>
              <input
                type="number"
                placeholder="Amount in ETH"
                className="border p-2 mr-2 mb-2"
                onChange={e => setContributionAmount(e.target.value)}
              />
              <button onClick={handleContribute} className="bg-purple-600 text-white px-4 py-2 rounded">
                Contribute
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
