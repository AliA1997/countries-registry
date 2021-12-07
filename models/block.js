const SHA256 = require('crypto-js/sha256');
const hex2ascii = require('hex2ascii');
class Block {
    constructor(data) {
        this.height = 0;
        this.address = "";
        this.body = Buffer.from(data).toString("hex");
        this.timeStamp = undefined;
        this.hash = "";
        this.previousBlockHash = "";
    }

    _isGenesisBlock() {
        return this.previousBlockHash === "";
    }

    _validate(validationCallback) {
        const self = this;
        return new Promise((resolve, reject) => {
            const hash = self.hash;
            const recalculatedHash = SHA256(JSON.stringify(self)).toString();
            if(hash == recalculatedHash) {
                resolve(true);
            } else { 
                validationCallback();
                resolve(false);
            }
        });
    }
    
    _getData() {
        return new Promise((resolve, reject) => {
            const encodedBlockData = this.body;
            const decodedBlockData = hex2ascii(encodedBlockData);
            const parsedDecodedBlockData = JSON.parse(decodedBlockData);
            if(!this._isGenesisBlock()){
                 return resolve(parsedDecodedBlockData);
            } else {
                console.log("_getData else hit this is the genesis block!");
                resolve({ countryInfo: {} })
            }
        });
    }

}

module.exports = Block;