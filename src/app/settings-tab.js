var yo = require('yo-yo')

// -------------- styling ----------------------
var csjs = require('csjs-inject')
var styleGuide = require('./style-guide')
var styles = styleGuide()

var css = csjs`
  .settingsTabView {
    padding: 2%;
    display: flex;
  }
  .info extends ${styles.infoTextBox} {
    margin-bottom: 2em;
    word-break: break-word;
  }
  .crow {
    margin-top: 1em;
    display: flex;
  }
  .select extends ${styles.dropdown} {
    float: left;
    max-width: 90%;
  }
}
`
module.exports = SettingsTab

function SettingsTab (container, appAPI, appEvents, opts) {
  if (typeof container === 'string') container = document.querySelector(container)
  if (!container) throw new Error('no container given')

  var el = yo`
    <div class="${css.settingsTabView} "id="settingsView">
      <div class="${css.info}">
        <div>Your current Solidity version is</div>
        <div id="version"></div>
      </div>
      <div class="${css.crow}">
        <select class="${css.select}" id="versionSelector"></select>
      </div>
    </div>
  `
  container.appendChild(el)
}
