// web3.ts
import Web3 from "web3";

const rpcUrl = import.meta.env.VITE_RPC_URL;


// Extend the Window interface to include `ethereum`
declare global {
  interface Window {
    ethereum?: any; // You can replace `any` with a stricter type if needed
  }
}

let web3: Web3;

if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
  // Use MetaMask's provider
  web3 = new Web3(window.ethereum);

  // Request account access
  window.ethereum
    .request({ method: "eth_requestAccounts" })
    .catch((error: unknown) => {
      console.error("User denied account access", error);
    });
} else {
  // Fallback provider
  const provider = new Web3.providers.HttpProvider(rpcUrl)
  web3 = new Web3(provider);
  console.warn("No MetaMask found. Using fallback provider.");
}

export default web3;
