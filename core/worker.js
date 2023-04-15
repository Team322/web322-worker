// const Eth = require('web3-eth');

// const eth = new Eth('https://rpc2.sepolia.org');

// console.log(eth);

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

async function main() {
  const Web3 = require('web3');
  const config = require('../config.js');

  const web3 = new Web3(config.sepolia_ws);
  const Contract = web3.eth.Contract;

  const account = web3.eth.accounts.privateKeyToAccount('0x'+config.account);
  web3.eth.accounts.wallet.add(account);
  web3.eth.defaultAccount = account.address;
  console.log(`web3.eth.defaultAccount: ${web3.eth.defaultAccount}`);


  // Contract.setProvider(config.sepolia_ws);
  // Contract


  const contract = new Contract(getAbi('Web322Endpoint'), config.endpoint_address, {
    from: account.address,
  });
  // console.log(contract);
  let r = await contract.methods.owner().call();
  console.log(r);

  // r = await contract.methods.withdraw().call();
  // console.log(r);

  // console.log(contract.events.allEvents());

  contract.events.Web2Request(event => {
    console.log('called two');
    console.log(event);
  })
  .on("connected", async function(subscriptionId){
    console.log(subscriptionId);
    console.log('making a request');
    r = await contract.methods.request({
      id: 200,
      req: web3.utils.hexToBytes(web3.utils.asciiToHex('abcde')),
    }).send({gas: 1000000});
    console.log(r);
  })
  .on('data', function(event){
    console.log('called');
    console.log(event); // same results as the optional callback above
  })
  // .on('changed', function(event){
  //   // remove event from local database
  // })
  .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    console.log('error: '+error);
  });

  
}




main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});