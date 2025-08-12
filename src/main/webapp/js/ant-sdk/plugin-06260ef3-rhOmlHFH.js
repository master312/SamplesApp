import { v as videojs } from './video.es-0951ae41-boIeAy0a.js';
import './_commonjsHelpers-7d1333e8-GWJfaxwO.js';

var version = "1.1.1";
var VideoJsButtonClass = videojs.getComponent('MenuButton');
var VideoJsMenuClass = videojs.getComponent('Menu');
var VideoJsComponent = videojs.getComponent('Component');
var Dom = videojs.dom;
/**
 * Convert string to title case.
 *
 * @param {string} string - the string to convert
 * @return {string} the returned titlecase string
 */

function toTitleCase(string) {
  if (typeof string !== 'string') {
    return string;
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}
/**
 * Convert string to title case.
 *
 * @param {Player} player - the string to convert
 * @return {MenuButton} the returned titlecase string
 */

function ConcreteButton(player) {
  var _this = this;
  var ConcreteButtonInit = new VideoJsButtonClass(player, {
    title: player.localize('Quality'),
    name: 'QualityButton',
    createItems: function createItems() {
      return [];
    },
    createMenu: function createMenu() {
      var menu = new VideoJsMenuClass(_this.player_, {
        menuButton: _this
      });
      _this.hideThreshold_ = 0; // Add a title list item to the top

      if (_this.options_.title) {
        var titleEl = Dom.createEl('li', {
          className: 'vjs-menu-title',
          innerHTML: toTitleCase(_this.options_.title),
          tabIndex: -1
        });
        var titleComponent = new VideoJsComponent(_this.player_, {
          el: titleEl
        });
        _this.hideThreshold_ += 1;
        menu.addItem(titleComponent);
      }
      _this.items = _this.createItems();
      if (_this.items) {
        // Add menu items to the menu
        for (var i = 0; i < _this.items.length; i++) {
          menu.addItem(_this.items[i]);
        }
      }
      return menu;
    }
  });
  return ConcreteButtonInit;
}
var VideoJsMenuItemClass = videojs.getComponent('MenuItem');
/**
 * Create a QualitySelectorHls plugin instance.
 *
 * @param  {player} player
 *         A Video.js Player instance.
 *
 * @param  {item} [item]
 *         The Item Quality Item
 *
 * @param  {qualityButton} [qualityButton]
 *         ConcreteButton
 *
 * @param  {plugin} plugin
 *         Plugin
 *
 * @return {MenuItem} MenuItem
 *         VideoJS Menu Item Class
 */

function ConcreteMenuItem(player, item, qualityButton, plugin) {
  var ConcreteMenuItemInit = new VideoJsMenuItemClass(player, {
    label: item.label,
    selectable: true,
    selected: item.selected || false
  });
  ConcreteMenuItemInit.item = item;
  ConcreteMenuItemInit.qualityButton = qualityButton;
  ConcreteMenuItemInit.plugin = plugin;
  ConcreteMenuItemInit.handleClick = function () {
    // Reset other menu items selected status.
    for (var i = 0; i < this.qualityButton.items.length; ++i) {
      this.qualityButton.items[i].selected(false);
    } // Set this menu item to selected, and set quality.

    this.plugin.setQuality(this.item.value);
    this.selected(true);
  };
  return ConcreteMenuItemInit;
}

// Default options for the plugin.

var defaults = {
  vjsIconClass: 'vjs-icon-hd',
  displayCurrentQuality: false,
  placementIndex: 0
};
/**
 * An advanced Video.js plugin. For more information on the API
 *
 * See: https://blog.videojs.com/feature-spotlight-advanced-plugins/
 */

var QualitySelectorHlsClass = /*#__PURE__*/function () {
  /**
   * Create a QualitySelectorHls plugin instance.
   *
   * @param  {Player} player
   *         A Video.js Player instance.
   *
   * @param  {Object} [options]
   *         An optional options object.
   *
   *         While not a core part of the Video.js plugin architecture, a
   *         second argument of options is a convenient way to accept inputs
   *         from your plugin's caller.
   */
  function QualitySelectorHlsClass(player, options) {
    var _this = this;

    // the parent class will add player under this.player
    this.player = player;
    this.config = videojs.obj.merge(defaults, options);
    player.ready(function () {
      _this.player.addClass('vjs-quality-selector-hls');
      if (_this.player.qualityLevels) {
        // Create the quality button.
        _this.createQualityButton();
        _this.bindPlayerEvents();
      }
    });
  }
  /**
   * Returns HLS Plugin
   *
   * @return {*} - videojs-hls-contrib plugin.
   */

  var _proto = QualitySelectorHlsClass.prototype;
  _proto.getHls = function getHls() {
    return this.player.tech({
      IWillNotUseThisInPlugins: true
    }).hls;
  }
  /**
   * Binds listener for quality level changes.
   */;
  _proto.bindPlayerEvents = function bindPlayerEvents() {
    this.player.qualityLevels().on('addqualitylevel', this.onAddQualityLevel.bind(this));
  }
  /**
   * Adds the quality menu button to the player control bar.
   */;
  _proto.createQualityButton = function createQualityButton() {
    var player = this.player;
    this._qualityButton = new ConcreteButton(player);
    var placementIndex = player.controlBar.children().length - 2;
    var concreteButtonInstance = player.controlBar.addChild(this._qualityButton, {
      componentClass: 'qualitySelector'
    }, this.config.placementIndex || placementIndex);
    concreteButtonInstance.addClass('vjs-quality-selector');
    if (!this.config.displayCurrentQuality) {
      var icon = " " + (this.config.vjsIconClass || 'vjs-icon-hd');
      concreteButtonInstance.menuButton_.$('.vjs-icon-placeholder').className += icon;
    } else {
      this.setButtonInnerText('auto');
    }
    concreteButtonInstance.removeClass('vjs-hidden');
  }
  /**
  *Set inner button text.
  *
  * @param {string} text - the text to display in the button.
  */;
  _proto.setButtonInnerText = function setButtonInnerText(text) {
    this._qualityButton.menuButton_.$('.vjs-icon-placeholder').innerHTML = text;
  }
  /**
   * Builds individual quality menu items.
   *
   * @param {Object} item - Individual quality menu item.
   * @return {ConcreteMenuItem} - Menu item
   */;
  _proto.getQualityMenuItem = function getQualityMenuItem(item) {
    var player = this.player;
    return ConcreteMenuItem(player, item, this._qualityButton, this);
  }
  /**
   * Executed when a quality level is added from HLS playlist.
   */;
  _proto.onAddQualityLevel = function onAddQualityLevel() {
    var _this2 = this;
    var player = this.player;
    var qualityList = player.qualityLevels();
    var levels = qualityList.levels_ || [];
    var levelItems = [];
    var _loop = function _loop(i) {
      var _levels$i = levels[i],
        width = _levels$i.width,
        height = _levels$i.height;
      var pixels = width > height ? height : width;
      if (!pixels) {
        return "continue";
      }
      if (!levelItems.filter(function (_existingItem) {
        return _existingItem.item && _existingItem.item.value === pixels;
      }).length) {
        var levelItem = _this2.getQualityMenuItem.call(_this2, {
          label: pixels + 'p',
          value: pixels
        });
        levelItems.push(levelItem);
      }
    };
    for (var i = 0; i < levels.length; ++i) {
      var _ret = _loop(i);
      if (_ret === "continue") continue;
    }
    levelItems.sort(function (current, next) {
      if (typeof current !== 'object' || typeof next !== 'object') {
        return -1;
      }
      if (current.item.value < next.item.value) {
        return -1;
      }
      if (current.item.value > next.item.value) {
        return 1;
      }
      return 0;
    });
    levelItems.push(this.getQualityMenuItem.call(this, {
      label: player.localize('Auto'),
      value: 'auto',
      selected: true
    }));
    if (this._qualityButton) {
      this._qualityButton.createItems = function () {
        return levelItems;
      };
      this._qualityButton.update();
    }
  }
  /**
   * Sets quality (based on media short side)
   *
   * @param {number} quality - A number representing HLS playlist.
   */;
  _proto.setQuality = function setQuality(quality) {
    var qualityList = this.player.qualityLevels(); // Set quality on plugin

    this._currentQuality = quality;
    if (this.config.displayCurrentQuality) {
      this.setButtonInnerText(quality === 'auto' ? quality : quality + "p");
    }
    for (var i = 0; i < qualityList.length; ++i) {
      var _qualityList$i = qualityList[i],
        width = _qualityList$i.width,
        height = _qualityList$i.height;
      var pixels = width > height ? height : width;
      qualityList[i].enabled = pixels === quality || quality === 'auto';
    }
    this._qualityButton.unpressButton();
  }
  /**
   * Return the current set quality or 'auto'
   *
   * @return {string} the currently set quality
   */;
  _proto.getCurrentQuality = function getCurrentQuality() {
    return this._currentQuality || 'auto';
  };
  return QualitySelectorHlsClass;
}();
var initPlugin = function initPlugin(player, options) {
  var QualitySelectorHls = new QualitySelectorHlsClass(player, options);
  player.QualitySelectorHlsVjs = true; // Define default values for the plugin's `state` object here.

  QualitySelectorHls.defaultState = {}; // Include the version number.

  QualitySelectorHls.VERSION = version;
  return QualitySelectorHls;
};
var QualitySelectorHls = function QualitySelectorHls(options) {
  return initPlugin(this, videojs.obj.merge({}, options));
}; // Register the plugin with video.js.

videojs.registerPlugin('qualitySelectorHls', QualitySelectorHls);

export { QualitySelectorHls as default };
