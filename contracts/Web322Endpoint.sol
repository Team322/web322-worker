// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Web322.sol";

contract Web322Endpoint is Ownable {
  event Web2Request(address sender, Web322.Request req);

  function request(Web322.Request calldata req) public payable {
    require(msg.value >= 0.000001 ether);
    emit Web2Request(msg.sender, req);
  }

  function withdraw() public onlyOwner {
    payable(owner()).transfer(address(this).balance);
  }

}
