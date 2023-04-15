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

async function makeRequest({url, method, data, headers }) {
  let headers_str = '';
  for (const [k, v] of Object.entries(headers)) {
    headers_str += ` -H "${k}: ${v}"`;
  }
  let data_str = `-d '${data}'`;
  let inner = `SSLKEYLOGFILE=data/tlskey curl -X ${method} ${headers_str} ${data_str} "${url}" > data/curl_data`;
  inner = inner.replace(/"/g, '\\"');
  let {stdout, stderr} = await execPromise(`mkdir data && sudo bash net-cap.sh ens4 "${inner}"`);
  console.log({stdout, stderr});
  ({stdout, stderr} = await execPromise(`zip -r -9 data.zip data`));
  console.log({stdout, stderr});
  const file = fs.readFileSync('./data/curl_data', 'utf8');
  ({stdout, stderr} = await execPromise('rm -r data'));
  ({stdout, stderr} = await execPromise('sha1sum ~/data.zip'));
  

  const hash = stdout.split(' ')[0];
  console.log(`hash: ${hash}`);
  ({stdout, stderr} = await execPromise(`mv data.zip /home/alanc/invocations/${hash}.zip`));
  return {output: file, hash};
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
      var size = 1<<(l - 24);
      var len = 0;
      for (let i = 0; i < size; i++) {
        len = len + (s[curr+1+i].charCodeAt(0))
        len = len << 8;
      }
      len = len >> 8;
      console.log(size);
      console.log(len);
      const data = s.slice(curr+1+size, curr+1+size+len);
      out.push(data);
      console.log(out);
      curr += 1+size+len;
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

    let curr = 2;
    let headers = {};
    let data = '';
    while (curr < parsed.length) {
      if (parsed[curr][0] === 'H') {
        headers[parsed[curr].slice(1)] = parsed[curr+1];
        curr += 2;
      } else if (parsed[curr][0] === 'D') {
        data = parsed[curr].slice(1);
        curr++;
      }
    }



    


    log('Got a new event');
    
    log(`sender: ${sender}`);
    log(`id: ${id}`);
    log(`req: ${req}`);
    log(`parsed: ${parsed}`);
    

    const host = 'http://127.0.0.1:5000/';
    const res = await fetch(host+'getapiparams',
    {
      headers: {
        'X-API-KEY': config.backend_key,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        contract_address: sender.toUpperCase(),
        contract_chain: 'Ethereum',
        api_url: url,
      }),

    });
    const json = await res.json();
    console.log(json);
    const params = JSON.parse(json.params);

    // let server_headers_str = '';
    // if (params.headers) {
    //   for (const [k,v] of Object.entries(params.headers)) {
    //     server_headers_str += ` -H "${k}: ${v}"`;
    //   }
    // }
    // console.log(`server_headers_str: ${server_headers_str}`);

    const {output, hash} = await makeRequest({
      url,
      method,
      headers: {...params.headers, ...headers},
      data,
    });

    const sender_contract = new Contract(getAbi('IWeb322Client'), sender, {
      from: account.address,
    });
    const hex_id = id;
    const encoded_output = output;
    const encoded_hash = '0x'+hash;
    console.log(`encoded_output: ${encoded_output}`);
    console.log(`encoded_hash: ${encoded_hash}`);
    console.log(`hex_id: ${hex_id}`);
    const r = await sender_contract.methods.fulfill(
      hex_id,
      encoded_output,
      encoded_hash
    ).send({gas: 1000000});
    log(r);


    const store_res = await fetch(host+'storeinvocation',
    {
      headers: {
        'X-API-KEY': config.backend_key,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        contract_address: sender.toUpperCase(),
        contract_chain: 'Ethereum',
        api_url: url,
        uid: hash,
      }),

    });
    const store_json = await store_res.json();
    console.log(store_json);
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
  // const r = await fetch(host+'/getapiparams',
  //   {
  //     headers: {
  //       'X-API-KEY': config.backend_key,
  //     },
  //     method: 'GET',
  //     body: JSON.stringify({
  //       contract_address: sender.toUpperCase(),
  //       contract_chain: 'Ethereum',
  //       api_url: url,
  //     }),

  //   });

  // const r = await fetch(host+'getapiparams',
  //   {
  //     headers: {
  //       'X-API-KEY': config.backend_key,
  //       'Accept': 'application/json',
  //       'Content-Type': 'application/json',
  //     },
  //     method: 'POST',
  //     body: JSON.stringify({
  //       contract_address: '0x59C70101BA058FD9FF7094973FD8B8CF2c5d092f'.toUpperCase(),
  //       contract_chain: 'Ethereum',
  //       api_url: 'https://api.openai.com/v1/completions',
  //     }),

  //   });
  // const json = await r.json();
  // const params = JSON.parse(json.params);
  
  // let server_headers_str = '';
  // if (params.headers) {
  //   for (const [k,v] of Object.entries(params.headers)) {
  //     server_headers_str += ` -H "${k}: ${v}"`;
  //   }
  // }
  // console.log(`server_headers_str: ${server_headers_str}`);

  // console.log(r);
  // console.log();
  // salkdg
  // console.log(parse_req('cgetfai.commHContent-Typepapplication/jsonnHAuthorizationvBearer $OPENAI_API_KEYxiD{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Say this is a test!"}],"temperature":0.7}'))

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