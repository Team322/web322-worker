// const Eth = require('web3-eth');

// const eth = new Eth('https://rpc2.sepolia.org');

// console.log(eth);

const fs = require("fs");
const path = require("path");
const Web3 = require('web3');


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

const makeRequest = async (contract, url) => {
  console.log(`making a request for url: ${url}`);
  r = await contract.methods.request({
    id: 200,
    req: Web3.utils.hexToBytes(Web3.utils.asciiToHex(url)),
  }).send({gas: 1000000});
  // console.log(r);
}

async function main() {
  const config = require('../config.js');
  const deployment_info = require('../deployment.json');

  const network = 'sepolia';
  
  const web3 = new Web3(config[network].ws);
  const Contract = web3.eth.Contract;

  const account = web3.eth.accounts.privateKeyToAccount('0x'+config.account);
  web3.eth.accounts.wallet.add(account);
  console.log(`web3.eth.defaultAccount: ${web3.eth.defaultAccount}`);


  // Contract.setProvider(config.sepolia_ws);
  // Contract


  const contract = new Contract(getAbi('Web322Endpoint'), deployment_info[network]['Web322Endpoint'], {
    from: account.address,
  });
  
  contract.events.Web2Request()
  .on("connected", async function(subscriptionId){
    console.log(`subscriptionId: ${subscriptionId}`);
    // await makeRequest(contract, 'https://google.com');
  })
  .on('data', function(event){
    console.log('called');
    console.log(event); // same results as the optional callback above
  })
  .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    console.log('error: '+error);
  });  
}




main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});