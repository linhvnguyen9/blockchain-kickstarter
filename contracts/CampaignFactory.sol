// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Campaign.sol";

contract CampaignFactory {
  address[] public deployedCampaign;

  constructor() {

  }

  function createCampaign(uint minContribution) public {
    address newCampaign = address(new Campaign(msg.sender, minContribution));
    deployedCampaign.push(newCampaign);
  }

  function getDeployedCampaigns() public view returns (address[] memory) {
    return deployedCampaign;
  }
}
