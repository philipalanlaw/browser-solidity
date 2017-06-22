'use strict'
var EventManager = require('ethereum-remix').lib.EventManager

/**
  * poll web3 each 2s if web3
  * listen on transaction executed event if VM
  * trigger 'newBlock'
  *
  */
class TxListener {
  constructor (opt) {
    this.event = new EventManager()
    this._appAPI = opt.appAPI
    this._resolvedTransactions = {}
    this._resolvedContracts = {}
    this.init()
    opt.appEvent.executionContext.register('contextChanged', (context) => {
      this.startListening(context)
    })
    opt.appEvent.udapp.register('transactionExecuted', (to, data, lookupOnly, txResult) => {
      if (this.loopId && this._appAPI.isVM()) {
        this._newBlock({
          number: 'VM',
          txs: [{
            to: to,
            data: data,
            lookupOnly: lookupOnly,
            txResult: txResult
          }]
        })
      }
    })
  }

  /**
    * reset recorded transactions
    */
  init () {
    this.blocks = []
    this.lastBlock = null
  }

  /**
    * start listening for incoming transactions
    *
    * @param {String} type - type/name of the provider to add
    * @param {Object} obj  - provider
    */
  startListening (context) {
    this.stopListening()
    this.init()
    if (context === 'vm') {
      this.loopId = 'vm-listener'
    } else {
      this.loopId = setInterval(() => {
        this._appAPI.web3().eth.getBlockNumber((error, blockNumber) => {
          if (error) return console.log(error)
          if (!this.lastBlock || blockNumber > this.lastBlock) {
            this.lastBlock = blockNumber
            this._appAPI.web3().eth.getBlock(this.lastBlock, true, (error, result) => {
              if (!error) {
                this._newBlock(result)
              }
            })
          }
        })
      }, 2)
    }
  }

  /**
    * stop listening for incoming transactions. do not reset the recorded pool.
    *
    * @param {String} type - type/name of the provider to add
    * @param {Object} obj  - provider
    */
  stopListening () {
    if (this.loopId) {
      clearInterval(this.loopId)
    }
    this.loopId = null
  }

  /**
    * try to resolve the contract name from the given @arg address
    *
    * @param {String} address - contract address to resolve
    * @return {String} - contract name
    */
  resolvedContracts (address) {
    return this._resolvedContracts[address]
  }

  /**
    * try to resolve the transaction from the given @arg txHash
    *
    * @param {String} txHash - contract address to resolve
    * @return {String} - contract name
    */
  resolvedTransaction (txHash) {
    var ret = null
    if (this._resolvedTransactions[txHash.hash]) {
      var resolved = this._resolvedTransactions[txHash.hash]
      ret = Object.assign({}, resolved)
      resolved.contractName = this._resolvedContracts[resolved.to]
    }
    return ret
  }

  _newBlock (block) {
    console.log(block)
    this.blocks.push(block)
    this._resolve(block)
    this.event.trigger('newBlock', [block])
  }

  _resolve (block) {
    for (var tx in block.txs) {
      this._resolveTx(tx)
    }
  }

  _resolveTx (tx) {
    var swarmHashExtraction = /a165627a7a72305820([0-9a-f]{64})0029$/
    var contracts = this._appAPI.contracts()
    if (!tx.to) {
      // contract creation / resolve using the creation bytes code
      // if web3: we have to call getTransactionReceipt to get the created address
      // if VM: created address already included
      var code = tx.input
      for (var k in contracts) {
        if (code.replace(swarmHashExtraction, '').indexOf('0x' + contracts[k]['bytecode'].replace(swarmHashExtraction, '')) === 0) {
          this._resolveCreationAddress(tx, (error, address) => {
            if (error) return console.log(error)
            this._resolvedContracts[address] = k
            this._resolvedTransactions[tx.hash] = {
              createdAddress: address,
              param: null
            }
          })
        }
        continue
      }
    } else {
      // resolve to againt known contract, function name and param from the input/data field
      var contractName = this._resolvedContracts[tx.to]
      if (contractName && contracts[contractName]) {
        for (var fn in contracts[contractName].contract.functionHashes) {
          if (contracts[contractName].contract.functionHashes[fn] === tx.input.substring(0, 8)) {
            this._resolvedTransactions[tx.hash] = {
              to: tx.to,
              fn: fn,
              param: null
            }
          }
        }
      }
    }
  }

  _resolveCreationAddress (tx, cb) {
    if (this._appAPI.isVM()) {
      cb(null, tx.createdAddress)
    } else {
      this._appAPI.web3().getTransactionReceipt(tx.hash, (error, receipt) => {
        if (error) return cb(error)
        if (!error) {
          return cb(null, receipt.contractAddress)
        }
      })
    }
  }
}

module.exports = TxListener
