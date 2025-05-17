const ganache = require("ganache");
const { Web3 } = require("web3");
const { abi, evm } = require("../../compile.js");
const assert = require("assert");

const web3 = new Web3(ganache.provider());

let accounts;
let lottery;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  // console.log("accounts", accounts);
  lottery = await new web3.eth.Contract(abi)
    .deploy({ data: evm.bytecode.object })
    .send({ from: accounts[0], gas: "1000000" });
  // console.log("lottery", lottery);
});

describe("Lottery test", () => {
  it("Testing deployment", async () => {
    assert.ok(lottery.options.address);
  });

  it(" Entering one account", async () => {
    await lottery.methods
      .enter()
      .send({ from: accounts[0], value: "100000000" });
    let players = await lottery.methods.playersList().call();
    assert.equal(players[0], accounts[0]);
    assert.equal(1, players.length);
  });

  //making sure that not accidentally only latest one is being added
  it(" Entering multiple account", async () => {
    await lottery.methods.enter().send({ from: accounts[0], value: 100000000 });
    await lottery.methods.enter().send({ from: accounts[1], value: 100000000 });

    await lottery.methods.enter().send({ from: accounts[2], value: 100000000 });

    let players = await lottery.methods
      .playersList()
      .call({ from: accounts[0] });
    assert.equal(players[0], accounts[0]);
    assert.equal(players[1], accounts[1]);
    assert.equal(players[2], accounts[2]);
    assert.equal(3, players.length);
  });

  it("Requires ether amount 100000000", async () => {
    try {
      await lottery.methods.enter().send({ from: accounts[0], value: 0 });

      assert(false);
      // assert false is gonna give error
      //this line runs only when
    } catch (err) {
      assert(err);
    }
  });

  it("Only manager can call the winner", async () => {
    try {
      await lottery.methods.chooseWinner().send({ from: accounts[1] });

      assert(false); //automatically failes the test no matter what
    } catch (err) {
      assert(err);
    }
  });
  it("Sends monety to the winner and resets the players array", async () => {
    try {
      // only single player so that checks only one account

      await lottery.methods.enter().send({
        from: accounts[0],
        value: 100000000,
      });

      const initial_balance = await web3.eth.getBalance(accounts[0]);
      await lottery.methods.chooseWinner().send({ from: accounts[0] });
      const final_balance = await web3.eth.getBalance(accounts[0]);
      const difference = final_balance - initial_balance;
      assert(difference > 90000000);
      console.log(final_balance - initial - balance);
      let players = await lottery.methods.playersList().call();
      assert(players.length, 0);
    } catch (e) {
      assert(e);
    }
  });
});
