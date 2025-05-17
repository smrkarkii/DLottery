const HDWalletProvider = require("@truffle/hdwallet-provider");
const { Web3 } = require("Web3");
//updated web3 and hdwallet-provider imports added for convenience
const { abi, evm } = require("./compile");
require("dotenv").config();

// deploy code will go here

const provider = new HDWalletProvider(
  process.env.pnemonics,
  process.env.infura
);
const web3 = new Web3(provider);

const deploy = async () => {
  //getting accounts from web3
  const accounts = await web3.eth.getAccounts();
  //contract instance
  const lottery = await new web3.eth.Contract(abi)
    .deploy({ data: evm.bytecode.object })
    .send({ from: accounts[0] });

  console.log("Contract deployed to", lottery.options.address);
  console.log("Contract deployed by", accounts[0]);
  console.log("abi", abi);
  // console.log(JSON.parse(abi));
  provider.engine.stop();
};

deploy();

// deployed address = 0x760008097AFC2Bc175d2476632F52E9472780BD7
