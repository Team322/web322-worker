const fs = require("fs");
const path = require("path");
const Web3 = require('web3');
const chalk = require('chalk');

const log_color_fns = [
  chalk.green,
  chalk.blue,
  chalk.yellow,
  chalk.red,
  chalk.magenta,
  chalk.cyan,
  chalk.gray,
]

const config = require('../config.js');
const deployment_info = require('../deployment.json');


const getAbi = name => {
  try {
    const dir = path.resolve(
      __dirname,
      `../artifacts/contracts/${name}.sol/${name}.json`
    );
    const file = fs.readFileSync(dir, "utf8");
    const json = JSON.parse(file);
    const abi = json.abi;
    // console.log(`abi`, abi)

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
  }).send({gas: 1000000, value: '1000000000000'});
  // console.log(r);
}

async function montiorNetwork(network, new_log) {
  const log = new_log;
  
  log(`start monitoring contract: ${config[network].prefix}${deployment_info[network]['Web322Endpoint']}`);

  const web3 = new Web3(config[network].ws);
  const Contract = web3.eth.Contract;

  const account = web3.eth.accounts.privateKeyToAccount('0x'+config.account);
  web3.eth.accounts.wallet.add(account);

  const contract = new Contract(getAbi('Web322Endpoint'), deployment_info[network]['Web322Endpoint'], {
    from: account.address,
  });
  
  contract.events.Web2Request()
  .on("connected", async function(subscriptionId){
    log(`subscriptionId: ${subscriptionId}`);
    // await makeRequest(contract, 'https://google.com/abc');
  })
  .on('data', function(event){
    log(event); // same results as the optional callback above
    const sender = event.returnValues.sender;
    const id = event.returnValues.req.id;
    const req = Web3.utils.hexToAscii(event.returnValues.req.req);
    log('Got a new event');
    
    log(`sender: ${sender}`);
    log(`id: ${id}`);
    log(`req: ${req}`);
    // network+sender_addr additional_param enc_key
    // network+sender_addr+id response user hash is_enc

  })
  .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    log('error: '+error);
  });  
}

async function main() {
  let i = 0;
  for (const network of Object.keys(deployment_info)) {
    const f = log_color_fns[i];
    montiorNetwork(network, function (...args) {
      console.log(`[${f(network)}]`.padEnd(25, ' '), ...args);
    });
    i++;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});