// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");



async function main() {
  

  // const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  // const unlockTime = currentTimestampInSeconds + 60;

  // const lockedAmount = hre.ethers.utils.parseEther("0.001");

  // const Lock = await hre.ethers.getContractFactory("Lock");
  // const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

  // await lock.deployed();

  // console.log(
  //   `Lock with ${ethers.utils.formatEther(
  //     lockedAmount
  //   )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.address}`
  // );
  
  

  const Web322Endpoint = await hre.ethers.getContractFactory("Web322Endpoint");
  const web322Endpoint = await Web322Endpoint.deploy();

  await web322Endpoint.deployed();

  console.log(
    `Web322Endpoint deployed to ${web322Endpoint.address}`
  );


  const deployment_path = path.resolve(path.resolve(
    __dirname,
    `../deployment.json`
  ));
  const json = JSON.parse(fs.readFileSync(deployment_path, "utf8"));
  
  json[hre.network.name] = {}
  json[hre.network.name]['Web322Endpoint'] = web322Endpoint.address;

  fs.writeFileSync(deployment_path, JSON.stringify(json));

  // console.log(`${web322Endpoint}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
