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
const { assert } = require("console");


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

const MockMakeRequestTx = async (contract, url) => {
  console.log(`making a request for url: ${url}`);
  r = await contract.methods.request({
    id: 200,
    req: Web3.utils.hexToBytes(Web3.utils.asciiToHex(url)),
  }).send({gas: 1000000, value: '1000000000000'});
  // console.log(r);
}

const exec = require('child_process').exec;

function execPromise(cmd) {
  console.log(cmd);
    return new Promise(function(resolve, reject) {
        exec(cmd, function(err, stdout, stderr) {
            if (err) return reject(err);
            resolve({stdout, stderr});
        });
    });
}

async function makeRequest({url, method, params, headers }) {
  let {stdout, stderr} = await execPromise(`mkdir data && sudo bash net-cap.sh ens4 'SSLKEYLOGFILE=data/tlskey curl "${url}" > data/curl_data'`);
  console.log({stdout, stderr});
  ({stdout, stderr} = await execPromise('zip -r -9 data.zip data && mv data.zip ~/'));
  console.log({stdout, stderr});
  const file = fs.readFileSync('./data/curl_data', 'utf8');
  ({stdout, stderr} = await execPromise('rm -r data'));
  return file;
}

function parse_req(s) {
  let curr = 0;
  let out = [];
  while (curr < s.length) {
    const l = s[curr].charCodeAt(0) & 0b11111;
    var len = 0;
    if (l <= 23) {
      const data = s.slice(curr+1, curr+l+1);
      out.push(data);
      curr += l+1;
    } else {
      var skip = 2**(l - 24);
      const skipped = skip;
      var len = 0;
      var offset = 0;
      var inner_curr = curr+1;
      while (skip > 0 && inner_curr < s.length) {
        len = len + (s[inner_curr].charCodeAt(0) * (2 ** offset));
        // len = (len << 8) | s[inner_curr].charCodeAt(0);
        offset += 8;
        inner_curr += 1;
        skip -= 1;
      }
      console.log(len);
      console.log(skipped);
      const data = s.slice(curr+skipped+1, curr+skipped+len+1);
      out.push(data);
      curr += skipped+len+1;
    }
  }
  return out;
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

  // console.log(contract);
  // log(parse_req('cgetfai.comfpromptvDraw a unicorn in TikZktemperaturea0hlogprobsefalse'));
  log(parse_req('cgetfai.commHContent-Typepapplication/jsonnHAuthorizationvBearer $OPENAI_API_KEYxiD{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Say this is a test!"}],"temperature":0.7}'))
  contract.events.Web2Request()
  .on("connected", async function(subscriptionId){
    log(`subscriptionId: ${subscriptionId}`);
    // await makeRequest(contract, 'https://google.com/abc');
  })
  .on('data', async function(event){
    log(event); // same results as the optional callback above
    const sender = event.returnValues.sender;
    const id = event.returnValues.id;
    const req = Web3.utils.hexToAscii(event.returnValues.buf);
    const parsed = parse_req(req);
    const method = parsed[0];
    const url = parsed[1];

    // const output = await makeRequest({
    //   url,
    //   method,
    //   params: {},
    //   headers: {},
    // });



    log('Got a new event');
    
    log(`sender: ${sender}`);
    log(`id: ${id}`);
    log(`req: ${req}`);
    log(`parsed: ${parsed}`);
    // network+sender_addr additional_param enc_key
    // network+sender_addr+id response user hash is_enc

  })
  .on('error', function(error, receipt) { // If the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
    log('error: '+error);
  });  
}

async function main() {
  // await makeRequest({
  //   url: 'https://github.com',
  //   method: 'GET',
  //   params: {},
  //   headers: {},
  // });
  let i = 0;
  for (const network of Object.keys(deployment_info)) {
    const f = log_color_fns[i];
    montiorNetwork(network, function (...args) {
      console.log(`[${f(network)}]`.padEnd(25, ' '), ...args);
    });
    i++;
  }
}

// console.log(parse_req('cgetfai.commHContent-Typepapplication/jsonnHAuthorizationvBearer $OPENAI_API_KEYxiD{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Say this is a test!"}],"temperature":0.7}xiD{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Say this is a test!"}],"temperature":0.7}'))

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});