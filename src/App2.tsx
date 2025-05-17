import "./App.css";
import React, { useEffect, useState } from "react";
import { lottery } from "./lottery";
import web3 from "./web3";

const App: React.FC = () => {
  const [manager, setManager] = useState<string>("");
  const [winner, setWinner] = useState<string>("");
  const [players, setPlayers] = useState<string[]>([]);
  const [noOfPlayers, setNoOfPlayers] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [accounts, setAccounts] = useState<string>("");
  const [winnerMessage, setWinnerMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lotteryHistory, setLotteryHistory] = useState<any[]>([]);
  const [linkBalance, setLinkBalance] = useState<number>(0);
  const [requestId, setRequestId] = useState<string>("");
  const [isWaitingForRandom, setIsWaitingForRandom] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(0);

  const playersList = async () => {
    console.log("getting players list");
    const player: string[] = await lottery.methods.playersList().call();
    
    console.log(player);

    setPlayers(player);
    setNoOfPlayers(player.length);
  };

  const fetchLotteryHistory = async () => {
    try {
      const history = await lottery.methods.getRecentLotteries(5).call();
      setLotteryHistory(history);
      const round = await lottery.methods.currentRound().call();
      setCurrentRound(Number(round));
    } catch (error) {
      console.error("Error fetching lottery history:", error);
    }
  };

  const fetchLinkBalance = async () => {
    try {
      const balance = await lottery.methods.getLINKBalance().call();
      setLinkBalance(Number(web3.utils.fromWei(balance, "ether")));
    } catch (error) {
      console.error("Error fetching LINK balance:", error);
    }
  };

  const enterLottery = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("Entering the lottery");
    setMessage("You are entering to the lottery, please wait.......");
    try {
      const accounts = await web3.eth.getAccounts();
      console.log("accountssss", accounts[0]);
      setAccounts(accounts[0]);
      await lottery.methods.enter().send({ from: accounts[0], value: 100000000 });
      console.log("entered");
      setMessage("You have entered to the lottery");
      playersList();
    } catch (error) {
      console.error("Error entering lottery:", error);
      setMessage("Failed to enter lottery. Check console for details.");
    }
  };

  const chooseWinner = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("selecting winner");
    const accounts = await web3.eth.getAccounts();
    setAccounts(accounts[0]);
    setWinnerMessage("Requesting randomness from Chainlink VRF...");
    setIsWaitingForRandom(true);
    
    try {
      // This now returns a requestId instead of immediately picking a winner
      console.log("here inside try")
      const result = await lottery.methods.chooseWinner().send({ from: manager });
      
      // Extract the requestId from the event logs
      const requestIdLog = result.events.RequestedRandomness.returnValues.requestId;
      setRequestId(requestIdLog);
      console.log(requestIdLog, result, "request id log and result")
      setWinnerMessage(`Randomness requested! Request ID: ${requestIdLog.substring(0, 10)}...`);
      
      // Don't set up event listener here - it's already set up in useEffect
      // The fulfillRandomWords function is called in a different transaction
    } catch (error) {
      console.error("Error choosing winner:", error);
      setWinnerMessage("Error selecting winner. Check console for details.");
      setIsWaitingForRandom(false);
    }
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        // This line specifically will trigger the MetaMask popup
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        setAccounts(accounts[0]);
        console.log(accounts[0])

        console.log("Your manager", manager, accounts)
        if(accounts == manager){
            console.log("Your manager", manager)
        }
        setIsConnected(true);
        
        // Refresh contract data
        fetchManager();
        playersList();
        fetchLotteryHistory();
        fetchLinkBalance();
      } else {
        alert("Please install MetaMask to use this application");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const disconnectWallet = () => {
    setAccounts("");
    setIsConnected(false);
  };

  const fetchManager = async () => {
    try {
      const managerAddress = await lottery.methods.manager().call();
      const manager = managerAddress.toLowerCase();
      console.log(lottery);
      setManager(manager);
    } catch (error) {
      console.error("Error fetching manager:", error);
    }
  };

  // Setup event listeners
  const setupEventListeners = () => {
    console.log("Setting up event listeners");
    
    // Clear any existing event listeners to prevent duplicates
    lottery.events.WinnerPicked({}).removeAllListeners();
    
    // Set up WinnerPicked event listener
    lottery.events.WinnerPicked({})
      .on('data', (event) => {
        console.log("WinnerPicked event received:", event);
        const winnerAddress = event.returnValues.winner;
        const prize = web3.utils.fromWei(event.returnValues.prize, "ether");
        
        setWinner(winnerAddress);
        setWinnerMessage(`Winner chosen! 🎉 Prize: ${prize} ETH`);
        setIsWaitingForRandom(false);
        
        // Refresh data
        playersList();
        fetchLotteryHistory();
        fetchLinkBalance();
      })
      .on('error', (error) => {
        console.error("Error with WinnerPicked event:", error);
      });

  };

  // Call this function to check if there's a pending request
  const checkPendingRequest = async () => {
    try {
      if (requestId) {
        const { fulfilled } = await lottery.methods.getRequestStatus(requestId).call();
        if (!fulfilled) {
          setIsWaitingForRandom(true);
          setWinnerMessage(`Waiting for randomness... Request ID: ${requestId.substring(0, 10)}...`);
        }
      }
    } catch (error) {
      console.error("Error checking request status:", error);
    }
  };

  useEffect(() => {
    console.log("inside useEffect");

    const checkIfWalletIsConnected = async () => {
      try {
        if (window.ethereum) {
          // This only checks if already connected without prompting
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts'  // Note: eth_accounts instead of eth_requestAccounts
          });
          
          if (accounts.length > 0) {
            setAccounts(accounts[0]);
            setIsConnected(true);
            
            // Now fetch manager and players list
            await fetchManager();
            await playersList();
            await fetchLotteryHistory();
            await fetchLinkBalance();
            
            // Setup event listeners
            setupEventListeners();
            
            // Check if there's a pending request
            checkPendingRequest();
          } else {
            // Not connected yet - we'll wait for user to click connect
            console.log("No accounts connected. Please connect to MetaMask.");
          }
        } else {
          console.log("Please install MetaMask to use this application");
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };

    const handleAccountsChanged = (newAccounts: string[]) => {
      console.log("MetaMask accounts changed:", newAccounts);
      if (newAccounts.length === 0) {
        // User disconnected their wallet from the site
        setIsConnected(false);
        setAccounts("");
      } else {
        setAccounts(newAccounts[0]);
        setIsConnected(true);
      }
    };

    if (window.ethereum?.on) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
    }

    checkIfWalletIsConnected();

    // Cleanup listener
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
      
      // Clean up event listeners to prevent memory leaks
      if (lottery.events) {
        lottery.events.WinnerPicked({}).removeAllListeners();
        lottery.events.PlayerEntered({}).removeAllListeners();
      }
    };
  }, []);

  // Helper function to truncate address
  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    if (!timestamp) return "";
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white font-sans">
      {/* Navbar */}
      <nav className="bg-black/30 backdrop-blur-sm p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">
            DecentralizedLottery
          </h1>
          
          {!isConnected ? (
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 focus:outline-none"
            >
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="text-sm text-gray-300">Connected Wallet</span>
                </div>
                <span className="text-xs text-gray-300">{truncateAddress(accounts)}</span>
              </div>
              <button 
                onClick={disconnectWallet}
                className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-lg transform transition-transform duration-200 hover:scale-105 focus:outline-none"
              >
                Disconnect
              </button>
              {manager === accounts && (
                <div className="bg-purple-600/10 backdrop-blur-sm rounded-xl shadow-xl p-2 border border-yellow-500/20">
                  <h2 className="text-sm font-bold text-yellow-400">👑 Manager</h2>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main Content - Only show if connected */}
      {isConnected ? (
        <div className="container mx-auto px-4 py-8">
          {/* Status Card */}
          <div className="max-w-4xl mx-auto mb-8 bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <h3 className="text-lg text-gray-300">Total Prize</h3>
                <p className="text-3xl font-bold text-cyan-400">{(players.length * 0.00001).toFixed(5)} ETH</p>
              </div>
              <div className="text-center p-4 border-t md:border-t-0 md:border-l md:border-r border-white/10">
                <h3 className="text-lg text-gray-300">Players</h3>
                <p className="text-3xl font-bold text-pink-400">{players.length}</p>
              </div>
              <div className="text-center p-4 border-t md:border-t-0 md:border-r border-white/10">
                <h3 className="text-lg text-gray-300">Entry Fee</h3>
                <p className="text-3xl font-bold text-purple-400">0.00001 ETH</p>
              </div>
              <div className="text-center p-4 border-t md:border-t-0 border-white/10">
                <h3 className="text-lg text-gray-300">LINK Balance</h3>
                <p className="text-3xl font-bold text-blue-400">{linkBalance.toFixed(3)}</p>
                <p className="text-xs text-gray-400">Required for randomness</p>
              </div>
            </div>
          </div>

          {/* Winner Display */}
          {winner && (
            <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-yellow-500/30">
              <div className="flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-3a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0110 15zm0-2.25a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75zm0-2.25a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                </svg>
                <h2 className="text-xl font-semibold text-yellow-300">Winner Announced!</h2>
              </div>
              <p className="text-center mt-2 text-yellow-100">{winner}</p>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Players List */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400">
                Players List
              </h2>
              
              <div className="mb-4 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-purple-700/50 text-sm">
                  {players.length} Players Entered
                </span>
              </div>
              
              <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-500 scrollbar-track-transparent">
                {players.length === 0 ? (
                  <p className="text-center text-gray-400 italic py-4">No players have entered yet</p>
                ) : (
                  players.map((player, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3 flex items-center border border-white/10 hover:bg-white/10 transition-colors duration-200">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center mr-3">
                        <span className="text-xs">{index + 1}</span>
                      </div>
                      <p className="text-sm truncate">{player}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/10">
              <h2 className="text-2xl font-semibold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-400">
                Lottery Actions
              </h2>
              
              <div className="space-y-6">
                <div>
                  <p className="text-center text-gray-300 mb-4">
                    Enter the lottery for a chance to win {(players.length * 0.00001).toFixed(5)} ETH
                  </p>
                  
                  <button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 focus:outline-none"
                    onClick={enterLottery}
                  >
                    Enter Lottery
                  </button>
                  
                  {message && (
                    <div className="mt-3 text-center">
                      <p className="text-sm text-cyan-300">{message}</p>
                    </div>
                  )}
                </div>
                
                {accounts === manager && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-center text-gray-300 mb-4">
                      Manager Controls
                    </p>
                    
                    <button
                      className={`w-full ${isWaitingForRandom 
                        ? 'bg-gray-500 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 cursor-pointer transform transition-transform duration-200 hover:scale-105'}
                        text-white font-bold py-3 px-6 rounded-lg shadow-lg focus:outline-none`}
                      onClick={chooseWinner}
                      disabled={isWaitingForRandom}
                    >
                      {isWaitingForRandom ? 'Waiting for Chainlink VRF...' : 'Choose Winner'}
                    </button>
                    
                    {winnerMessage && (
                      <div className="mt-3 text-center">
                        <p className="text-sm text-pink-300">{winnerMessage}</p>
                        {requestId && !isWaitingForRandom && (
                          <p className="text-xs text-gray-400 mt-1">Request ID: {requestId.substring(0, 10)}...</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Lottery History */}
          <div className="max-w-4xl mx-auto mt-8 bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/10">
            <h2 className="text-2xl font-semibold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-cyan-400">
              Recent Winners
            </h2>
            
            {lotteryHistory.length === 0 ? (
              <p className="text-center text-gray-400 italic py-4">No previous lottery rounds</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-2 px-4 text-left text-gray-300">Round</th>
                      <th className="py-2 px-4 text-left text-gray-300">Winner</th>
                      <th className="py-2 px-4 text-left text-gray-300">Prize (ETH)</th>
                      <th className="py-2 px-4 text-left text-gray-300">Players</th>
                      <th className="py-2 px-4 text-left text-gray-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotteryHistory.map((round, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-4">{currentRound - index - 1}</td>
                        <td className="py-3 px-4 font-mono text-sm">{truncateAddress(round.winner)}</td>
                        <td className="py-3 px-4">{web3.utils.fromWei(round.prize, "ether")}</td>
                        <td className="py-3 px-4">{round.playerCount}</td>
                        <td className="py-3 px-4">{formatDate(round.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Footer - Contract Info */}
          <div className="max-w-4xl mx-auto mt-8 bg-black/20 rounded-xl p-4 text-center text-xs text-gray-400">
            <p>Contract managed by:</p>
            <p className="font-mono">{manager}</p>
          </div>
        </div>
      ) : (
        /* Not Connected Message */
        <div className="container mx-auto px-4 py-32 text-center">
          <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-10 border border-white/10">
            <svg className="w-16 h-16 mx-auto mb-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <h2 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">
              Connect Your Wallet
            </h2>
            <p className="text-gray-300 mb-8">
              Please connect your MetaMask wallet to participate in the decentralized lottery.
            </p>
            <button 
              onClick={connectWallet}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 focus:outline-none"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;