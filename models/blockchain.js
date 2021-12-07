const bitcoinLib = require("bitcoinjs-lib");
const bitcoinMessage = require("bitcoinjs-message");
const Promise = require("bluebird");
const SHA256 = require("crypto-js/sha256");
const Block = require("./block");
const initialHeight = -1;

class Blockchain {
  constructor() {
    this.chain = [];
    this.height = initialHeight;
  }

  _genesisBlockHasNotBeenAdded() {
    return this.height !== initialHeight;
  }

  _getGenesisBlock() {
    if (this._genesisBlockHasNotBeenAdded()) {
      return this.chain[0];
    }
    return false;
  }

  _getLatestBlock() {
    const lastBlockIndex = this.chain.length - 1;
    return this.chain[lastBlockIndex];
  }

  _addBlock(block) {
    return new Promise((resolve) => {
      if (this._genesisBlockHasNotBeenAdded()) {
        block.previousBlockHash = this._getLatestBlock().hash;
      }
      this.height += 1;
      block.height = this.height;
      block.timeStamp = new Date().getTime().toString().slice(0, -3);
      block.hash = SHA256(JSON.stringify(block)).toString();
      this.chain.push(block);
      resolve(true);
    });
  }

  _validateChain() {
    return new Promise(async (resolve, reject) => {
      try {
        const errorLog = [];
        const validationCallback = (hash) =>
          errorLog.push(`Block with a hash of ${hash} is not a valid block`);
        const validations = this.chain.map((bl) =>
          bl._validate(validationCallback)
        );
        await Promise.all(validations);
        if (errorLog.length) {
          resolve(
            `Chain validated on ${new Date().getTime().toString().slice(0, -3)}`
          );
        } else {
          reject(errorLog);
        }
      } catch (error) {
        console.log("Error:", error);
      }
    });
  }

  _findCountriesByAddress(address) {
    return Promise.filter(this.chain, async (block) => {
      const blockData = await block._getData();
      return blockData.walletAddress === address;
    });
  }

  _findCountryByName(countryName) {
    return Promise.filter(this.chain, async (block) => {
      const blockData = await block._getData();
      return blockData.countryInfo.name === countryName;
    });
  }

  async _submitCountry(address, privateKey, country) {
    try {
      const keyPair = bitcoinLib.ECPair.fromWIF(
        privateKey,
        bitcoinLib.networks.testnet
      );
      const pk = keyPair.privateKey;
      const message = Buffer.from(
        JSON.stringify({ countryInfo: country, walletAddress: address })
      );
      const signature = await bitcoinMessage.signAsync(
        message,
        pk,
        keyPair.compressed
      );
      const newBlock = new Block(message);
      /*
       * Pass the message that is a array buffer with the data of block stringified
       * Pass address
       * Pass the signature that was just signed by private key and message, also verify it using the signature, address(that is associated with private key), and message.
       * Since their is no messagePrefix, then pass null
       * Then set the checkSegWitAlways to true.
       */
      const isVerified = bitcoinMessage.verify(
        message,
        address,
        signature,
        null,
        true
      );
      if (isVerified) {
        this._addBlock(newBlock);
      }
    } catch (error) {
      console.log("ERROR:", error);
    }
  }
}

module.exports = Blockchain;
