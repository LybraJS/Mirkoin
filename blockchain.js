const SHA356 = require('crypto-js/sha256')

class Transaction {
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
    }

    calculateHash() {
        return SHA356(this.fromAddress + this.toAddress + this.amount).toString;
    }

    // signing key is (genKeyPair) from elliptic
    signTransaction(signingKey) {

        // check if the signingKey equals the senders' address
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('You cannot sign transactions to other wallets!')
        }

        const hashTx = this.calculateHash();

        // sign inputted keyPair + encrypt it
        const sig = signingKey.sign(hashTx, 'base64');

        // convert signed keyPair to DER
        this.signature = sig.toDER('hex');
    }

    // NEXT: VARIFY IF TRANSACTION IS CORRECTLY SIGNED
}


// Blocks are to be found by navigating through Blockchain.chain[]
class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 1;
    }

    calculateHash() {
        return SHA356(this.previousHash + this.timestamp + JSON.stringify(this.transaction) + this.nonce).toString();
    }


    // while the first {difficulty} characters are NOT an Array with {difficulty} undefined items, JOINED with 0s -> Therefore {difficulty+1}
    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            // increasing {nonce} to make sure it's a different hash with each iteration
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log('Block minded: ' + this.hash);
    }
}

class Blockchain {
    constructor() {
        // setting first block (genesis block)
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 5;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock() {
        return new Block('01.01.2021', 'Genesis Block', '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        // setting {Block.transactions} to {pending Transactions} from Blockchain
        let block = new Block(Date.now(), this.pendingTransactions);

        // console logging the mining of block BEFORE it is actually mined
        console.log('Mining block...')

        // has to be mined in order to be pushed onto chain
        block.mineBlock(this.difficulty);

        console.log('Block succesfully mined!');
        this.chain.push(block);

        // resetting pending transactions and create new one for miner to get reward with next mined block
        this.pendingTransactions = [
            new Transaction(null, miningRewardAddress, this.miningReward)
        ];
    }

    createTransaction(transaction) {
        this.pendingTransactions.push(transaction);
    }

    getBalanceOfAddress(address) {
        let balance = 0;
        // for each {block} of chain
        for (const block of this.chain) {
            // for each {trans} of a {block}
            for (const trans of block.transactions) {
                if (trans.fromAddress === address) {
                    balance -= trans.amount;
                }
                if (trans.toAddress === address) {
                    balance += trans.amount;
                }
            }
        }

        return balance
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash != currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash = !previousBlock.hash) {
                return false;
            }
        }

        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Transaction = Transaction;