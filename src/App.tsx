import React, { useEffect, useState } from "react";
import { lottery } from "./lottery";
import web3 from "./web3";
import Navbar from "./components/Navbar";
import LotteryDashboard from "./components/LotteryDashboard";
import LotteryHistory from "./components/LotteryHistory";


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
      
      // Clear the message after 10 seconds
      setTimeout(() => {
        setMessage("");
      }, 5000);
    } catch (error) {
      console.error("Error entering lottery:", error);
      setMessage("Failed to enter lottery. Check console for details.");
      
      // Clear error message after 10 seconds
      setTimeout(() => {
        setMessage("");
      }, 10000);
    }
  };

  // Update the chooseWinner function to start polling
  const chooseWinner = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log("selecting winner");
    const accounts = await web3.eth.getAccounts();
    setAccounts(accounts[0]);
    setWinnerMessage("Requesting randomness from Chainlink VRF...");
    setIsWaitingForRandom(true);
    
    try {
      // This returns a requestId instead of immediately picking a winner
      console.log("Calling chooseWinner method")
      setWinnerMessage("Choosing winner randomly")
      const result = await lottery.methods.chooseWinner().send({ from: manager });
      
      // Extract the requestId from the event logs
      const requestIdLog = result.events.RequestedRandomness.returnValues.requestId;
      setRequestId(requestIdLog);
      console.log(requestIdLog, result, "request id log and result")
    //   setWinnerMessage(`Randomness requested! Request ID: ${requestIdLog.substring(0, 10)}...`);
      
      // Start polling for the result (Chainlink VRF typically takes 1-3 minutes)
      setTimeout(() => pollForWinnerResult(requestIdLog), 30000);
      
      // Also check for past WinnerPicked events that match this requestId
      // This handles the case where the event might have been missed
      const pastEvents = await lottery.getPastEvents('WinnerPicked', {
        filter: { requestId: requestIdLog },
        fromBlock: result.blockNumber,
        toBlock: 'latest'
      });
      
      if (pastEvents.length > 0) {
        console.log("Found matching WinnerPicked event:", pastEvents[0]);
        const winnerAddress = pastEvents[0].returnValues.winner;
        const prize = web3.utils.fromWei(pastEvents[0].returnValues.prize, "ether");
        
        setWinner(winnerAddress);
        setWinnerMessage(`Winner chosen! 🎉 Prize: ${prize} ETH`);
        setIsWaitingForRandom(false);
        setRequestId("");
        
        // Refresh data
        playersList();
        fetchLotteryHistory();
        fetchLinkBalance();
      }
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
    
    // Set up WinnerPicked event listener with a broader range to capture events
    lottery.events.WinnerPicked({
      fromBlock: 'latest'  // This ensures we listen from the latest block onwards
    })
      .on('data', (event) => {
        console.log("WinnerPicked event received:", event);
        const winnerAddress = event.returnValues.winner;
        const prize = web3.utils.fromWei(event.returnValues.prize, "ether");
        
        setWinner(winnerAddress);
        setWinnerMessage(`Winner chosen! 🎉 Prize: ${prize} ETH`);
        setIsWaitingForRandom(false);
        setRequestId(""); // Clear the request ID since it's fulfilled
        
        // Refresh data
        playersList();
        fetchLotteryHistory();
        fetchLinkBalance();
      })
      .on('error', (error) => {
        console.error("Error with WinnerPicked event:", error);
      });
  };

  // Add a function to actively poll for the winner
  const pollForWinnerResult = async (requestId: string) => {
    if (!requestId) return;
    
    console.log("Polling for winner result with request ID:", requestId);
    
    try {
      // Check if the request has been fulfilled
      const { fulfilled } = await lottery.methods.getRequestStatus(requestId).call();
      
      if (fulfilled) {
        console.log("Request fulfilled, checking for winner");
        // If fulfilled, refresh data to get winner
        await playersList();
        await fetchLotteryHistory();
        await fetchLinkBalance();
        
        // Clear waiting state
        setIsWaitingForRandom(false);
        setWinnerMessage("Winner has been selected! 🎉 The prize has been transferred to the winner's wallet.");
        setRequestId("");
        
        // Clear success message after 30 seconds
        setTimeout(() => {
          setWinnerMessage("");
        }, 30000);
      } else {
        // Not fulfilled yet, schedule another check
        console.log("Request not fulfilled yet, polling again in 15 seconds");
        setWinnerMessage(`Waiting for Chainlink VRF to provide randomness... This typically takes 1-3 minutes. Request ID: ${requestId.substring(0, 10)}...`);
        setTimeout(() => pollForWinnerResult(requestId), 15000);
      }
    } catch (error) {
      console.error("Error polling for winner:", error);
      setWinnerMessage("Error checking winner status. Will try again shortly...");
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
            await playersList(); // Make sure players list is loaded on startup
            await fetchLotteryHistory();
            await fetchLinkBalance();
            
            // Setup event listeners
            setupEventListeners();
            
            // Check for stored requests
            const storedRequestId = localStorage.getItem('lotteryRequestId');
            if (storedRequestId) {
              setRequestId(storedRequestId);
              try {
                const { fulfilled } = await lottery.methods.getRequestStatus(storedRequestId).call();
                if (!fulfilled) {
                  setIsWaitingForRandom(true);
                  setWinnerMessage(`Waiting for randomness from Chainlink... Request ID: ${storedRequestId.substring(0, 10)}...`);
                  // Start polling for the result
                  pollForWinnerResult(storedRequestId);
                } else {
                  // If already fulfilled, clear it
                  localStorage.removeItem('lotteryRequestId');
                }
              } catch (error) {
                console.error("Error checking stored request:", error);
                localStorage.removeItem('lotteryRequestId');
              }
            }
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
        
        // Refresh data when account changes
        fetchManager();
        playersList(); // Reload players list when accounts change
        fetchLotteryHistory();
        fetchLinkBalance();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white font-sans">
      {/* Navbar Component */}
      <Navbar
        isConnected={isConnected}
        accounts={accounts}
        manager={manager}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
      />

      {/* Conditional Rendering based on connection status */}
      {isConnected ? (
        <>
          {/* LotteryDashboard Component */}
          <LotteryDashboard 
            players={players}
            linkBalance={linkBalance}
            winner={winner}
            accounts={accounts}
            manager={manager}
            message={message}
            winnerMessage={winnerMessage}
            isWaitingForRandom={isWaitingForRandom}
            requestId={requestId}
            enterLottery={enterLottery}
            chooseWinner={chooseWinner}
          />
          
          {/* LotteryHistory Component */}
          <LotteryHistory 
            lotteryHistory={lotteryHistory}
            currentRound={currentRound}
            manager={manager}
          />
        </>
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