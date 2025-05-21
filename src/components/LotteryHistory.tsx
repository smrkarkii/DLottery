import React from "react";
import web3 from "../web3";

interface LotteryHistoryProps {
  lotteryHistory: any[];
  currentRound: number;
  manager: string;
}

const LotteryHistory: React.FC<LotteryHistoryProps> = ({
  lotteryHistory,
  currentRound,
  manager,
}) => {
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
    <>
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
    </>
  );
};

export default LotteryHistory;