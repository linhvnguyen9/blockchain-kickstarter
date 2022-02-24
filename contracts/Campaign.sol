// SPDX-License-Identifier: MIT
pragma solidity ^0.8.6;
pragma abicoder v2;

contract Campaign {
  address public manager;
  uint public minimumContribution;
  mapping(address => bool) public approvers;
  Request[] public requests;
  uint public approversCount;

  constructor(address mgr, uint minimum) {
    manager = mgr; 
    minimumContribution = minimum;
  }

  function contribute() public payable {
    require(msg.value > minimumContribution, "Contribution below minimum");
    
    approvers[msg.sender] = true;
    approversCount++;
  }

  function createRequest(string memory description, uint value, address recipient) public onlyManager {
    Request storage request = requests.push();
    request.description = description;
    request.value = value;
    request.recipient = recipient;
    request.isComplete = false;
    request.approvalCount = 0;
  }

  function approveRequest(uint index) public {
    Request storage request = requests[index];

    require(approvers[msg.sender] == true, "Sender not backer of campaign");
    require(request.approvals[msg.sender] == false, "Sender already approved this request");

    request.approvals[msg.sender] = true;
    request.approvalCount++;
  }

  function getApprovalForRequest(address approver, uint index) public view returns (bool) {
    return requests[index].approvals[approver];
  } 

  function finalizeRequest(uint index) public onlyManager {
    require(!requests[index].isComplete, "Request is already completed");    
    require(requests[index].approvalCount > (approversCount / 2));
    Request storage request = requests[index];
    request.isComplete = true;
    address payable recipientAddress = payable(requests[index].recipient);
    (bool sent, ) = recipientAddress.call{ value: requests[index].value }("");
    require(sent, "Cannot send ether to given address!");
  }

  struct Request {
    string description;
    uint value;
    address recipient;
    bool isComplete;
    uint approvalCount;
    mapping(address => bool) approvals;
  }

  modifier onlyManager() {
    require(msg.sender == manager);
    _;
  }
}
