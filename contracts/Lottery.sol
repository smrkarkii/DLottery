//SPDX-License-Identifier:MIT

pragma solidity ^0.8.9;

import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import {VRFV2WrapperConsumerBase} from "@chainlink/contracts/src/v0.8/vrf/VRFV2WrapperConsumerBase.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/shared/interfaces/LinkTokenInterface.sol";

contract Lottery is VRFV2WrapperConsumerBase, ConfirmedOwner {
    address public manager;
    address payable[] public players;
    address public winner;

    struct LotteryRound {
        address winner;
        uint256 prize;
        uint256 timestamp;
        uint256 playerCount;
    }

    // Array of all past lottery rounds
    LotteryRound[] public lotteryHistory;
    uint256 public currentRound = 0;

    // VRF v2 configuration
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    uint32 numWords = 1; // We only need one random word

    // Address of wrapper and link token
    address linkAddress;
    address wrapperAddress;

    // Request tracking
    struct RequestStatus {
        uint256 paid; // amount paid in link
        bool fulfilled; // whether the request has been successfully fulfilled
        uint256[] randomWords;
    }
    
    mapping(uint256 => RequestStatus) public s_requests;
    uint256[] public requestIds;
    uint256 public lastRequestId;

    event RequestedRandomness(uint256 requestId);
    event WinnerPicked(address winner, uint256 prize, uint256 roundNumber);
    event PlayerEntered(address player, uint256 roundNumber);

    constructor(
        address _linkAddress,
        address _wrapperAddress
    ) 
        ConfirmedOwner(msg.sender)
        VRFV2WrapperConsumerBase(_linkAddress, _wrapperAddress)
    {
        linkAddress = _linkAddress;
        wrapperAddress = _wrapperAddress;
        manager = msg.sender;
    }

    function enter() public payable {
        require(msg.value == 100000000 wei, "The sent value is not enough");
        players.push(payable(msg.sender));
        emit PlayerEntered(msg.sender, currentRound);
    }

    function noOfPlayers() public view returns (uint) {
        return players.length;
    }

    function playersList() public view returns (address payable[] memory) {
        return players;
    }

    modifier isManager() {
        require(msg.sender == manager, "The sender must be contract manager");
        _;
    }

    /**
     * @dev Starts the process of picking a winner by requesting randomness
     */
    function chooseWinner() public isManager returns (uint256) {
        require(players.length > 0, "No players in the lottery");
        
        // Calculate the LINK cost for this request
        uint256 requestCost = VRF_V2_WRAPPER.calculateRequestPrice(callbackGasLimit);
        
        // Check if the contract has enough LINK
        LinkTokenInterface link = LinkTokenInterface(linkAddress);
        require(link.balanceOf(address(this)) >= requestCost, "Not enough LINK to pay fee");
        
        // Request randomness from Chainlink VRF v2
        uint256 requestId = requestRandomness(
            callbackGasLimit,
            requestConfirmations,
            numWords
        );
        
        // Store request details
        s_requests[requestId] = RequestStatus({
            paid: requestCost,
            randomWords: new uint256[](0),
            fulfilled: false
        });
        
        requestIds.push(requestId);
        lastRequestId = requestId;
        
        emit RequestedRandomness(requestId);
        
        return requestId;
    }

    /**
     * @dev Callback function used by VRF Coordinator to return the random number
     */
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        // Verify request exists
        require(s_requests[_requestId].paid > 0, "request not found");
        
        // Update request status
        s_requests[_requestId].fulfilled = true;
        s_requests[_requestId].randomWords = _randomWords;
        
        // Use the random number to select a winner
        uint256 winnerIndex = _randomWords[0] % players.length;
        address payable winningPlayer = players[winnerIndex];
        winner = winningPlayer;
        
        // Get prize amount
        uint256 prize = address(this).balance;
        
        // Store this round in history before transferring money
        lotteryHistory.push(LotteryRound({
            winner: winningPlayer,
            prize: prize,
            timestamp: block.timestamp,
            playerCount: players.length
        }));
        
        // Transfer the prize to the winner
        winningPlayer.transfer(prize);
        
        // Emit event with this round's data
        emit WinnerPicked(winningPlayer, prize, currentRound);
        
        // Increment round counter and reset players array
        currentRound++;
        players = new address payable[](0);
    }

    function getLotteryHistory() public view returns (LotteryRound[] memory) {
        return lotteryHistory;
    }

    /**
     * @dev Gets the most recent lottery rounds (up to 'count')
     */
    function getRecentLotteries(uint256 count) public view returns (LotteryRound[] memory) {
        // Determine how many rounds to return
        uint256 resultCount = count;
        if (lotteryHistory.length < count) {
            resultCount = lotteryHistory.length;
        }
        
        // Create result array with proper size
        LotteryRound[] memory recentLotteries = new LotteryRound[](resultCount);
        
        // Fill with most recent lotteries (in reverse chronological order)
        for (uint256 i = 0; i < resultCount; i++) {
            recentLotteries[i] = lotteryHistory[lotteryHistory.length - 1 - i];
        }
        
        return recentLotteries;
    }

    /**
     * @dev Gets the contract's LINK token balance
     */
    function getLINKBalance() public view returns (uint256) {
        LinkTokenInterface link = LinkTokenInterface(linkAddress);
        return link.balanceOf(address(this));
    }
    
    /**
     * @dev Gets the request status
     */
    function getRequestStatus(uint256 _requestId) 
        external
        view
        returns (uint256 paid, bool fulfilled, uint256[] memory randomWords)
    {
        require(s_requests[_requestId].paid > 0, "request not found");
        RequestStatus memory request = s_requests[_requestId];
        return (request.paid, request.fulfilled, request.randomWords);
    }
    
    /**
     * @dev Calculates the fee required for the VRF request
     */
    function getRequestFee() public view returns (uint256) {
        return VRF_V2_WRAPPER.calculateRequestPrice(callbackGasLimit);
    }
    
    /**
     * @dev Allows withdrawal of Link tokens from the contract
     */
    function withdrawLink() public onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(linkAddress);
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }
}