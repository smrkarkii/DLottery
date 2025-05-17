// import "./App.css";
// import React, { useEffect, useState } from "react";
// import { lottery } from "./lottery";
// import web3 from "./web3";

// const App: React.FC = () => {
//   const [manager, setManager] = useState<string>("");
//   const [winner, setWinner] = useState<string>("");
//   const [players, setPlayers] = useState<string[]>([]);
//   const [noOfPlayers, setNoOfPlayers] = useState<number>(0);
//   const [message, setMessage] = useState<string>("");
//   const [accounts, setAccounts] = useState<string>("");
//   const [winnerMessage, setWinnerMessage] = useState<string>("");
//   const [isConnected, setIsConnected] = useState<boolean>(false);

//   const playersList = async () => {
//     console.log("getting players list");
//     const player: string[] = await lottery.methods.playersList().call();
//     console.log(player);

//     setPlayers(player);
//     setNoOfPlayers(player.length);
//   };

//   const connectWallet = async () => {
//   try {
//     if (window.ethereum) {
//       const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
//       setAccounts(accounts[0]);
//       setIsConnected(true);
      
//       // Refresh contract data
//       fetchManager();
//       playersList();
//     } else {
//       alert("Please install MetaMask to use this application");
//     }
//   } catch (error) {
//     console.error("Error connecting wallet:", error);
//   }
// };

// const disconnectWallet = () => {
//   setAccounts("");
//   setIsConnected(false);
// };

//   const enterLottery = async (event: React.FormEvent) => {
//     event.preventDefault();
//     console.log("Entering the lottery");
//     setMessage("You are entering to the lottery, please wait.......");
//     const accounts = await web3.eth.getAccounts();
//     console.log("accountssss", accounts[0]);
//     setAccounts(accounts[0]);
//     await lottery.methods.enter().send({ from: accounts[0], value: 100000000 });
//     console.log("entered");
//     setMessage("You have entered to the lottery");
//     playersList();
//   };

//   const chooseWinner = async (event: React.FormEvent) => {
//     event.preventDefault();
//     console.log("selecting winner");
//     const accounts = await web3.eth.getAccounts();
//     setAccounts(accounts[0]);
//     setWinnerMessage("Selecting the winner randomly");
//     await lottery.methods.chooseWinner().send({ from: accounts[0] });
//     const win = await lottery.methods.winner().call();
//     console.log("winner has been selected", win);
//     setWinner(win);
//     setWinnerMessage("Winner chosen 🎉");
//     playersList();
//   };

//   useEffect(() => {
//   console.log("inside useEffect");

//   const fetchManager = async () => {
//     try {
//       const managerAddress = await lottery.methods.manager().call();
//       console.log(lottery);
//       setManager(managerAddress);

//       const address = await web3.eth.getAccounts();
//       if (address && address.length > 0) {
//         setAccounts(address[0]);
//         setIsConnected(true);
//       }
//       console.log(manager);
//     } catch (error) {
//       console.error("Error fetching manager:", error);
//     }
//   }
//     const handleAccountsChanged = (newAccounts: string[]) => {
//       console.log("MetaMask accounts changed:", newAccounts);
//       setAccounts(newAccounts[0]);
//     };

//     if (window.ethereum?.on) {
//       window.ethereum.on("accountsChanged", handleAccountsChanged);
//     }

//     fetchManager();
//     playersList();

//     // Cleanup listener
//     return () => {
//       if (window.ethereum?.removeListener) {
//         window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
//       }
//     };
//   }, [noOfPlayers]);

//   // Helper function to truncate address
//   const truncateAddress = (address: string) => {
//     if (!address) return "";
//     return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 text-white font-sans">
//       {/* Navbar */}
//       <nav className="bg-black/30 backdrop-blur-sm p-4 shadow-lg">
//   <div className="container mx-auto flex justify-between items-center">
//     <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-400">
//       DecentralizedLottery
//     </h1>
    
//     {!isConnected ? (
//       <button 
//         onClick={connectWallet}
//         className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 focus:outline-none"
//       >
//         Connect Wallet
//       </button>
//     ) : (
//       <div className="flex items-center space-x-4">
//         <div className="flex flex-col items-end">
//           <div className="flex items-center space-x-2">
//             <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
//             <span className="text-sm text-gray-300">Connected Wallet</span>
//           </div>
//           <span className="text-xs text-gray-300">{truncateAddress(accounts)}</span>
//         </div>
//         <button 
//           onClick={disconnectWallet}
//           className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-1 px-3 rounded-lg text-sm shadow-lg transform transition-transform duration-200 hover:scale-105 focus:outline-none"
//         >
//           Disconnect
//         </button>
//       </div>
//     )}
//   </div>
// </nav>

//       {/* Main Content */}
//       <div className="container mx-auto px-4 py-8">
//         {/* Status Card */}
//         <div className="max-w-4xl mx-auto mb-8 bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/10">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="text-center p-4">
//               <h3 className="text-lg text-gray-300">Total Prize</h3>
//               <p className="text-3xl font-bold text-cyan-400">{players.length * 0.00001} ETH</p>
//             </div>
//             <div className="text-center p-4 border-t md:border-t-0 md:border-l md:border-r border-white/10">
//               <h3 className="text-lg text-gray-300">Players</h3>
//               <p className="text-3xl font-bold text-pink-400">{players.length}</p>
//             </div>
//             <div className="text-center p-4 border-t md:border-t-0 border-white/10">
//               <h3 className="text-lg text-gray-300">Entry Fee</h3>
//               <p className="text-3xl font-bold text-purple-400">0.00001 ETH</p>
//             </div>
//           </div>
//         </div>

//         {/* Winner Display */}
//         {winner && (
//           <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-yellow-500/30">
//             <div className="flex items-center justify-center">
//               <svg className="w-8 h-8 text-yellow-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-3a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 0110 15zm0-2.25a.75.75 0 01.75-.75h3.5a.75.75 0 010 1.5h-3.5a.75.75 0 01-.75-.75zm0-2.25a.75.75 0 01.75-.75h5.5a.75.75 0 010 1.5h-5.5a.75.75 0 01-.75-.75z" clipRule="evenodd" />
//               </svg>
//               <h2 className="text-xl font-semibold text-yellow-300">Winner Announced!</h2>
//             </div>
//             <p className="text-center mt-2 text-yellow-100">{winner}</p>
//           </div>
//         )}

//         {/* Main Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
//           {/* Players List */}
//           <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/10">
//             <h2 className="text-2xl font-semibold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-400">
//               Players List
//             </h2>
            
//             <div className="mb-4 text-center">
//               <span className="inline-block px-3 py-1 rounded-full bg-purple-700/50 text-sm">
//                 {players.length} Players Entered
//               </span>
//             </div>
            
//             <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-500 scrollbar-track-transparent">
//               {players.length === 0 ? (
//                 <p className="text-center text-gray-400 italic py-4">No players have entered yet</p>
//               ) : (
//                 players.map((player, index) => (
//                   <div key={index} className="bg-white/5 rounded-lg p-3 flex items-center border border-white/10 hover:bg-white/10 transition-colors duration-200">
//                     <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center mr-3">
//                       <span className="text-xs">{index + 1}</span>
//                     </div>
//                     <p className="text-sm truncate">{player}</p>
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>

//           {/* Actions */}
//           <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-xl p-6 border border-white/10">
//             <h2 className="text-2xl font-semibold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-400">
//               Lottery Actions
//             </h2>
            
//             <div className="space-y-6">
//               <div>
//                 <p className="text-center text-gray-300 mb-4">
//                   Enter the lottery for a chance to win {players.length * 0.00001} ETH
//                 </p>
                
//                 <button
//                   className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 focus:outline-none"
//                   onClick={enterLottery}
//                 >
//                   Enter Lottery
//                 </button>
                
//                 {message && (
//                   <div className="mt-3 text-center">
//                     <p className="text-sm text-cyan-300">{message}</p>
//                   </div>
//                 )}
//               </div>
              
//               {accounts === manager && (
//                 <div className="pt-4 border-t border-white/10">
//                   <p className="text-center text-gray-300 mb-4">
//                     Manager Controls
//                   </p>
                  
//                   <button
//                     className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 focus:outline-none"
//                     onClick={chooseWinner}
//                   >
//                     Choose Winner
//                   </button>
                  
//                   {winnerMessage && (
//                     <div className="mt-3 text-center">
//                       <p className="text-sm text-pink-300">{winnerMessage}</p>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
        
//         {/* Footer - Contract Info */}
//         <div className="max-w-4xl mx-auto mt-8 bg-black/20 rounded-xl p-4 text-center text-xs text-gray-400">
//           <p>Contract managed by:</p>
//           <p className="font-mono">{manager}</p>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default App;