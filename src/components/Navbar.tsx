import React from "react";

interface NavbarProps {
  isConnected: boolean;
  accounts: string;
  manager: string;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  isConnected,
  accounts,
  manager,
  connectWallet,
  disconnectWallet,
}) => {
  // Helper function to truncate address
  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
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
  );
};

export default Navbar;