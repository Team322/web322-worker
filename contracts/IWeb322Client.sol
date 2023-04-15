// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface IWeb322Client {
    function fulfill(
        uint256 _requestId,
        string memory _answer,
        bytes20 verificationHash
    ) external;
}