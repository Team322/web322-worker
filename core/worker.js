// const Eth = require('web3-eth');

// const eth = new Eth('https://rpc2.sepolia.org');

// console.log(eth);
async function main() {
  const Web3 = require('web3');
  const config = require('../config.js');

  const web3 = new Web3(config.sepolia_ws);

  console.log(web3.eth);
  web3.eth.defaultAccount = '0xDA4e7a6E6FC5605a88Fb5768E9d92A59E8356ca5';

  const Contract = web3.eth.Contract;

  // Contract.setProvider(config.sepolia_ws);
  // Contract

  const fs = require("fs");
  const path = require("path");

  const getAbi = name => {
    try {
      const dir = path.resolve(
        __dirname,
        `../artifacts/contracts/${name}.sol/${name}.json`
      );
      const file = fs.readFileSync(dir, "utf8");
      const json = JSON.parse(file);
      const abi = json.abi;
      console.log(`abi`, abi)

      return abi;
    } catch (e) {
      console.log(`e`, e)
    }
  }

  const contract = new Contract(getAbi('Web322Endpoint'), config.endpoint_address);
  console.log(contract);
  let r = await contract.methods.owner().call();
  console.log(r);

  // r = await contract.methods.withdraw().call();
  // console.log(r);

  // console.log(contract.events.allEvents());

  contract.events.allEvents()
  .on("connected", function(subscriptionId){
    console.log(subscriptionId);
  })
  .on('data', function(event){
    console.log(event); // same results as the optional callback above
  })
  // .on('changed', function(event){
  //   // remove event from local database
  // })
  .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    console.log('error: '+error);
  });

  r = await contract.methods.withdraw().call();
  console.log(r);
}




main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});