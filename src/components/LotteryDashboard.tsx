import React from "react";
import web3 from "../web3";

interface LotteryDashboardProps {
  players: string[];
  linkBalance: number;
  winner: string;
  accounts: string;
  manager: string;
  message: string;
  winnerMessage: string;
  isWaitingForRandom: boolean;
  requestId: string;
  enterLottery: (event: React.FormEvent) => Promise<void>;
  chooseWinner: (event: React.FormEvent) => Promise<void>;
}

const LotteryDashboard: React.FC<LotteryDashboardProps> = ({
  players,
  linkBalance,
  winner,
  accounts,
  manager,
  message,
  winnerMessage,
  isWaitingForRandom,
  requestId,
  enterLottery,
  chooseWinner,
}) => {
  return (
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
                    {requestId && (
                      <p className="text-xs text-gray-400 mt-1">Request ID: {requestId.substring(0, 10)}...</p>
                    )}
                  </div>
                )}
                
                {isWaitingForRandom && (
                  <div className="flex justify-center mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LotteryDashboard;