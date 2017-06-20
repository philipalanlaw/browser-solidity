'use strict'
var yo = require('yo-yo')
var csjs = require('csjs-inject')
// var styleGuide = require('./style-guide')
var ensLookup = require('./ensLookup.js')
var ensPush = require('./ensPush.js')

var css = csjs``

module.exports = EnsView

/**
 * List all deployed contract and check if the current selected sender has right to publish to the reverse DNS
 *
 * @param {String} txHash    - hash of the transaction
 */
class EnsView {
  constructor (container, appAPI, appEvents, opts) {
    this.container = container
    this.container.appendChild(view())
  }
}


function view () {
  return yo`<div></div>`
}
