require("@nomicfoundation/hardhat-toolbox");

const config = require('./config.js');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: config.sepolia.http,
      accounts: [config.account],
      // accounts: [privateKey1, privateKey2, ...]
    },
    polygon: {
      url: config.polygon.http,
      accounts: [config.account],
      // accounts: [privateKey1, privateKey2, ...]
    },
    taiko: {
      url: config.taiko.http,
      accounts: [config.account],
      // accounts: [privateKey1, privateKey2, ...]
    },
    scroll: {
      url: config.scroll.http,
      accounts: [config.account],
      // accounts: [privateKey1, privateKey2, ...]
    },
    chiado: {
      url: config.chiado.http,
      accounts: [config.account],
      // accounts: [privateKey1, privateKey2, ...]
    },
    alfajores: {
      url: config.alfajores.http,
      accounts: [config.account],
      // accounts: [privateKey1, privateKey2, ...]
    }
    
  },
};
