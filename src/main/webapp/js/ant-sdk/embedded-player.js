function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || "default");
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : String(i);
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }
  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}
function _asyncToGenerator(fn) {
  return function () {
    var self = this,
      args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);
      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }
      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }
      _next(undefined);
    });
  };
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}

/*
* loglevel - https://github.com/pimterry/loglevel
*
* Copyright (c) 2013 Tim Perry
* Licensed under the MIT license.
*/
(function (root, definition) {
  window.log = definition();
})(undefined, function () {
  // Slightly dubious tricks to cut down minimized file size
  var noop = function noop() {};
  var undefinedType = "undefined";
  var isIE = typeof window !== undefinedType && typeof window.navigator !== undefinedType && /Trident\/|MSIE /.test(window.navigator.userAgent);
  var logMethods = ["trace", "debug", "info", "warn", "error"];

  // Cross-browser bind equivalent that works at least back to IE6
  function bindMethod(obj, methodName) {
    var method = obj[methodName];
    if (typeof method.bind === 'function') {
      return method.bind(obj);
    } else {
      try {
        return Function.prototype.bind.call(method, obj);
      } catch (e) {
        // Missing bind shim or IE8 + Modernizr, fallback to wrapping
        return function () {
          return Function.prototype.apply.apply(method, [obj, arguments]);
        };
      }
    }
  }

  // Trace() doesn't print the message in IE, so for that case we need to wrap it
  function traceForIE() {
    if (console.log) {
      if (console.log.apply) {
        console.log.apply(console, arguments);
      } else {
        // In old IE, native console methods themselves don't have apply().
        Function.prototype.apply.apply(console.log, [console, arguments]);
      }
    }
    if (console.trace) console.trace();
  }

  // Build the best logging method possible for this env
  // Wherever possible we want to bind, not wrap, to preserve stack traces
  function realMethod(methodName) {
    if (methodName === 'debug') {
      methodName = 'log';
    }
    if (typeof console === undefinedType) {
      return false; // No method possible, for now - fixed later by enableLoggingWhenConsoleArrives
    } else if (methodName === 'trace' && isIE) {
      return traceForIE;
    } else if (console[methodName] !== undefined) {
      return bindMethod(console, methodName);
    } else if (console.log !== undefined) {
      return bindMethod(console, 'log');
    } else {
      return noop;
    }
  }

  // These private functions always need `this` to be set properly

  function replaceLoggingMethods(level, loggerName) {
    /*jshint validthis:true */
    for (var i = 0; i < logMethods.length; i++) {
      var methodName = logMethods[i];
      this[methodName] = i < level ? noop : this.methodFactory(methodName, level, loggerName);
    }

    // Define log.log as an alias for log.debug
    this.log = this.debug;
  }

  // In old IE versions, the console isn't present until you first open it.
  // We build realMethod() replacements here that regenerate logging methods
  function enableLoggingWhenConsoleArrives(methodName, level, loggerName) {
    return function () {
      if (typeof console !== undefinedType) {
        replaceLoggingMethods.call(this, level, loggerName);
        this[methodName].apply(this, arguments);
      }
    };
  }

  // By default, we use closely bound real methods wherever possible, and
  // otherwise we wait for a console to appear, and then try again.
  function defaultMethodFactory(methodName, level, loggerName) {
    /*jshint validthis:true */
    return realMethod(methodName) || enableLoggingWhenConsoleArrives.apply(this, arguments);
  }
  function Logger(name, defaultLevel, factory) {
    var self = this;
    var currentLevel;
    defaultLevel = defaultLevel == null ? "WARN" : defaultLevel;
    var storageKey = "loglevel";
    if (typeof name === "string") {
      storageKey += ":" + name;
    } else if (typeof name === "symbol") {
      storageKey = undefined;
    }
    function persistLevelIfPossible(levelNum) {
      var levelName = (logMethods[levelNum] || 'silent').toUpperCase();
      if (typeof window === undefinedType || !storageKey) return;

      // Use localStorage if available
      try {
        window.localStorage[storageKey] = levelName;
        return;
      } catch (ignore) {}

      // Use session cookie as fallback
      try {
        window.document.cookie = encodeURIComponent(storageKey) + "=" + levelName + ";";
      } catch (ignore) {}
    }
    function getPersistedLevel() {
      var storedLevel;
      if (typeof window === undefinedType || !storageKey) return;
      try {
        storedLevel = window.localStorage[storageKey];
      } catch (ignore) {}

      // Fallback to cookies if local storage gives us nothing
      if (typeof storedLevel === undefinedType) {
        try {
          var cookie = window.document.cookie;
          var location = cookie.indexOf(encodeURIComponent(storageKey) + "=");
          if (location !== -1) {
            storedLevel = /^([^;]+)/.exec(cookie.slice(location))[1];
          }
        } catch (ignore) {}
      }

      // If the stored level is not valid, treat it as if nothing was stored.
      if (self.levels[storedLevel] === undefined) {
        storedLevel = undefined;
      }
      return storedLevel;
    }
    function clearPersistedLevel() {
      if (typeof window === undefinedType || !storageKey) return;

      // Use localStorage if available
      try {
        window.localStorage.removeItem(storageKey);
        return;
      } catch (ignore) {}

      // Use session cookie as fallback
      try {
        window.document.cookie = encodeURIComponent(storageKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
      } catch (ignore) {}
    }

    /*
     *
     * Public logger API - see https://github.com/pimterry/loglevel for details
     *
     */

    self.name = name;
    self.levels = {
      "TRACE": 0,
      "DEBUG": 1,
      "INFO": 2,
      "WARN": 3,
      "ERROR": 4,
      "SILENT": 5
    };
    self.methodFactory = factory || defaultMethodFactory;
    self.getLevel = function () {
      return currentLevel;
    };
    self.setLevel = function (level, persist) {
      if (typeof level === "string" && self.levels[level.toUpperCase()] !== undefined) {
        level = self.levels[level.toUpperCase()];
      }
      if (typeof level === "number" && level >= 0 && level <= self.levels.SILENT) {
        currentLevel = level;
        if (persist !== false) {
          // defaults to true
          persistLevelIfPossible(level);
        }
        replaceLoggingMethods.call(self, level, name);
        if (typeof console === undefinedType && level < self.levels.SILENT) {
          return "No console available for logging";
        }
      } else {
        throw "log.setLevel() called with invalid level: " + level;
      }
    };
    self.setDefaultLevel = function (level) {
      defaultLevel = level;
      if (!getPersistedLevel()) {
        self.setLevel(level, false);
      }
    };
    self.resetLevel = function () {
      self.setLevel(defaultLevel, false);
      clearPersistedLevel();
    };
    self.enableAll = function (persist) {
      self.setLevel(self.levels.TRACE, persist);
    };
    self.disableAll = function (persist) {
      self.setLevel(self.levels.SILENT, persist);
    };

    // Initialize with the right level
    var initialLevel = getPersistedLevel();
    if (initialLevel == null) {
      initialLevel = defaultLevel;
    }
    self.setLevel(initialLevel, false);
  }

  /*
   *
   * Top-level API
   *
   */

  var defaultLogger = new Logger();
  var _loggersByName = {};
  defaultLogger.getLogger = function getLogger(name) {
    if (typeof name !== "symbol" && typeof name !== "string" || name === "") {
      throw new TypeError("You must supply a name when creating a logger.");
    }
    var logger = _loggersByName[name];
    if (!logger) {
      logger = _loggersByName[name] = new Logger(name, defaultLogger.getLevel(), defaultLogger.methodFactory);
    }
    return logger;
  };

  // Grab the current global log variable in case of overwrite
  var _log = typeof window !== undefinedType ? window.log : undefined;
  defaultLogger.noConflict = function () {
    if (typeof window !== undefinedType && window.log === defaultLogger) {
      window.log = _log;
    }
    return defaultLogger;
  };
  defaultLogger.getLoggers = function getLoggers() {
    return _loggersByName;
  };

  // ES6 default export, for compatibility
  defaultLogger['default'] = defaultLogger;
  return defaultLogger;
});
var Logger = window.log;
var Logger_1 = Logger;

//ask if adaptive m3u8 file

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function (searchString, position) {
    var subjectString = this.toString();
    if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
      position = subjectString.length;
    }
    position -= searchString.length;
    var lastIndex = subjectString.lastIndexOf(searchString, position);
    return lastIndex !== -1 && lastIndex === position;
  };
}
/**
 *
 * @param {string} sParam
 * @param {string=} search
 * @returns
 */
function getUrlParameter$1(sParam, search) {
  if (typeof search === undefined || search == null) {
    search = window.location.search;
  }
  var sPageURL = decodeURIComponent(search.substring(1)),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;
  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
}
var getUrlParameter_1 = getUrlParameter$1;
var img = new Image();
img.src = "data:image/png;base64,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";
var STATIC_VIDEO_HTML = "<video id='video-player' class='video-js vjs-default-skin vjs-big-play-centered' controls playsinline></video>";
var PTZ_LEFT_BUTTON_ID = "left-button";
var PTZ_RIGHT_BUTTON_ID = "right-button";
var PTZ_UP_BUTTON_ID = "up-button";
var PTZ_DOWN_BUTTON_ID = "down-button";
var PTZ_ZOOM_IN_BUTTON_ID = "zoom-in-button";
var PTZ_ZOOM_OUT_BUTTON_ID = "zoom-out-button";
class WebPlayer {
  constructor(configOrWindow, containerElement, placeHolderElement) {
    /**
     * Video HTML content. It's by default STATIC_VIDEO_HTML
     */
    _defineProperty(this, "videoHTMLContent", void 0);
    /**
     * video player Id. It's by default "video-player"
     */
    _defineProperty(this, "videoPlayerId", void 0);
    /**
    *  "playOrder": the order which technologies is used in playing. Optional. Default value is "webrtc,hls".
    *	possible values are "hls,webrtc","webrtc","hls","ll-hls","vod","dash",
    *   It will be taken from url parameter "playOrder".
    */
    _defineProperty(this, "playOrder", void 0);
    /**
     * currentPlayType: current play type in playOrder
     */
    _defineProperty(this, "currentPlayType", void 0);
    /**
     * "is360": if true, player will be 360 degree player. Optional. Default value is false.
     * It will be taken from url parameter "is360".
     */
    _defineProperty(this, "is360", false);
    /**
     * "streamId": stream id. Mandatory. If it is not set, it will be taken from url parameter "id".
     * It will be taken from url parameter "id".
     */
    _defineProperty(this, "streamId", void 0);
    /**
     * "playType": play type. Optional.  It's used for vod. Default value is "mp4,webm".
     * It can be "mp4,webm","webm,mp4","mp4","webm","mov" and it's used for vod.
     * It will be taken from url parameter "playType".
     */
    _defineProperty(this, "playType", void 0);
    /**
     * "token": token. It's required when stream security for playback is enabled .
     * It will be taken from url parameter "token".
     */
    _defineProperty(this, "token", void 0);
    /**
     * autoplay: if true, player will be started automatically. Optional. Default value is true.
     * autoplay is false by default for mobile devices because of mobile browser's autoplay policy.
     * It will be taken from url parameter "autoplay".
     */
    _defineProperty(this, "autoPlay", true);
    /**
     * mute: if false the player will try to auto play the stream with audio if it fails player will mute the audio and try again to autoplay it.
     * It will be taken from url parameter "mute".
     */
    _defineProperty(this, "mute", false);
    /**
     * controls: Toggles the visibility of player controls.
     */
    _defineProperty(this, "controls", true);
    /**
     * Force the Player to play with audio Auto Play might not work.
     */
    _defineProperty(this, "forcePlayWithAudio", false);
    /**
     * targetLatency: target latency in seconds. Optional. Default value is 3.
     * It will be taken from url parameter "targetLatency".
     * It's used for dash(cmaf) playback.
     */
    _defineProperty(this, "targetLatency", 3);
    /**
     * subscriberId: subscriber id. Optional. It will be taken from url parameter "subscriberId".
     */
    _defineProperty(this, "subscriberId", void 0);
    /**
     * subscriberCode: subscriber code. Optional. It will be taken from url parameter "subscriberCode".
     */
    _defineProperty(this, "subscriberCode", void 0);
    /**
     * window: window object
     */
    _defineProperty(this, "window", void 0);
    /**
     * video player container element
     */
    _defineProperty(this, "containerElement", void 0);
    /**
     * player placeholder element
     */
    _defineProperty(this, "placeHolderElement", void 0);
    /**
     * videojs player
     */
    _defineProperty(this, "videojsPlayer", void 0);
    /**
     * dash player
     */
    _defineProperty(this, "dashPlayer", void 0);
    /**
     * Ice servers for webrtc
     */
    _defineProperty(this, "iceServers", void 0);
    /**
     * ice connection state
     */
    _defineProperty(this, "iceConnected", void 0);
    /**
     * flag to check if error callback is called
     */
    _defineProperty(this, "errorCalled", void 0);
    /**
     * scene for 360 degree player
     */
    _defineProperty(this, "aScene", void 0);
    /**
     * player listener
     */
    _defineProperty(this, "playerListener", void 0);
    /**
     * webRTCDataListener
     */
    _defineProperty(this, "webRTCDataListener", void 0);
    /**
     * Field to keep if tryNextMethod is already called
     */
    _defineProperty(this, "tryNextTechTimer", void 0);
    /**
    * Listener for ID3 text data
    */
    _defineProperty(this, "id3Listener", void 0);
    /**
     * REST API Filter JWT 
     */
    _defineProperty(this, "restJwt", void 0);
    /**
    * PTZ Control HTML Elements
    */
    _defineProperty(this, "ptzControlElements", void 0);
    /** 
     * PTZ Value Step
    */
    _defineProperty(this, "ptzValueStep", void 0);
    /**
     * PTZ Movement. It can be relative, absolute, continuous
     */
    _defineProperty(this, "ptzMovement", void 0);
    /**
     * Rest API promise to call REST api through some external methods
     */
    _defineProperty(this, "restAPIPromise", void 0);
    /**
     * Is IP Camera
     */
    _defineProperty(this, "isIPCamera", void 0);
    /**
     * Stream id of backup stream.
     */
    _defineProperty(this, "backupStreamId", void 0);
    /**
     * activeStreamId: is the stream id that is being played currently
     * It can be streamID or backupStreamId
     */
    _defineProperty(this, "activeStreamId", void 0);
    // we define insertSecurityParameters in this way because we want to get the this context such as this.subscriberId
    _defineProperty(this, "insertSecurityParameters", options => {
      var queryParams = [];
      if (!options.uri.includes("subscriberId") && this.subscriberId != null) {
        queryParams.push("subscriberId=".concat(this.subscriberId));
      }
      if (!options.uri.includes("subscriberCode") && this.subscriberCode != null) {
        queryParams.push("subscriberCode=".concat(this.subscriberCode));
      }
      if (!options.uri.includes("token") && this.token != null) {
        queryParams.push("token=".concat(this.token));
      }
      if (queryParams.length > 0) {
        var queryString = queryParams.join("&");
        options.uri += options.uri.includes("?") ? "&".concat(queryString) : "?".concat(queryString);
      }
      Logger_1.debug("hls request: " + options.uri);
    });
    WebPlayer.DEFAULT_PLAY_ORDER = ["webrtc", "hls"];
    WebPlayer.DEFAULT_PLAY_TYPE = ["mp4", "webm"];
    WebPlayer.HLS_EXTENSION = "m3u8";
    WebPlayer.WEBRTC_EXTENSION = "webrtc";
    WebPlayer.DASH_EXTENSION = "mpd";

    /**
    * streamsFolder: streams folder. Optional. Default value is "streams"
    */
    WebPlayer.STREAMS_FOLDER = "streams";
    WebPlayer.LL_HLS_Folder = "ll-hls";
    WebPlayer.VIDEO_PLAYER_ID = "video-player";
    WebPlayer.PLAYER_EVENTS = ['abort', 'canplay', 'canplaythrough', 'durationchange', 'emptied', 'ended', 'error', 'loadeddata', 'loadedmetadata', 'loadstart', 'pause', 'play', 'playing', 'progress', 'ratechange', 'seeked', 'seeking', 'stalled', 'suspend', 'timeupdate', 'volumechange', 'waiting', 'enterpictureinpicture', 'leavepictureinpicture', 'fullscreenchange', 'resize', 'audioonlymodechange', 'audiopostermodechange', 'controlsdisabled', 'controlsenabled', 'debugon', 'debugoff', 'disablepictureinpicturechanged', 'dispose', 'enterFullWindow', 'error', 'exitFullWindow', 'firstplay', 'fullscreenerror', 'languagechange', 'loadedmetadata', 'loadstart', 'playerreset', 'playerresize', 'posterchange', 'ready', 'textdata', 'useractive', 'userinactive', 'usingcustomcontrols', 'usingnativecontrols'];

    // Initialize default values
    this.setDefaults();

    // Check if the first argument is a config object or a Window object
    if (!this.isWindow(configOrWindow)) {
      // New config object mode
      Logger_1.info("config object mode");
      console.log("config object mode");
      Object.assign(this, configOrWindow);
      this.window = window;
    } else {
      // Backward compatibility mode
      Logger_1.info("getting from url mode");
      console.log("getting from url mode");
      this.window = configOrWindow;

      // Use getUrlParameter for backward compatibility
      this.initializeFromUrlParams();
    }
    this.containerElement = containerElement;
    if (this.containerElement.style && this.containerElement.style.display !== "") {
      this.containerElementInitialDisplay = this.containerElement.style.display;
    }
    this.placeHolderElement = placeHolderElement;
    if (this.placeHolderElement && this.placeHolderElement.style && this.placeHolderElement.style.display != "") {
      this.placeHolderElementInitialDisplay = this.placeHolderElement.style.display;
    }
    if (this.streamId == null) {
      var message = "Stream id is not set.Please add your stream id to the url as a query parameter such as ?id={STREAM_ID} to the url";
      Logger_1.error(message);
      //TODO: we may need to show this message on directly page
      alert(message);
      throw new Error(message);
    }
    //set the active stream id as stream id
    this.activeStreamId = this.streamId;
    if (!this.httpBaseURL) {
      //this is the case where web player gets everything from url
      var appName = "/";
      if (this.window.location.pathname && this.window.location.pathname.indexOf("/") != -1) {
        appName = this.window.location.pathname.substring(0, this.window.location.pathname.lastIndexOf("/") + 1);
      }
      var path = this.window.location.hostname;
      if (this.window.location.port != "") {
        path += ":" + this.window.location.port;
      }
      if (!appName.startsWith("/")) {
        appName = "/" + appName;
      }
      if (!appName.endsWith("/")) {
        appName += "/";
      }
      path += appName;
      this.httpBaseURL = this.window.location.protocol + "//" + path;
      this.websocketBaseURL = "ws://" + path;
      if (this.window.location.protocol.startsWith("https")) {
        this.websocketBaseURL = this.websocketBaseURL.replace("ws", "wss");
      }
    } else if (!this.websocketBaseURL) {
      //this is the case where web player gets inputs from config object
      if (!this.httpBaseURL.endsWith("/")) {
        this.httpBaseURL += "/";
      }
      this.websocketBaseURL = this.httpBaseURL.replace("http", "ws");
    }
    this.dom = this.window.document;
    this.containerElement.innerHTML = this.videoHTMLContent;
    this.setPlayerVisible(false);
  }
  isWindow(configOrWindow) {
    //accept that it's a window if it's a Window instance or it has location.href
    //location.href is used in test environment
    return configOrWindow instanceof Window || configOrWindow.location && configOrWindow.location.href;
  }
  initialize() {
    return this.loadVideoJSComponents().then(() => {
      return this.loadDashScript();
    }).then(() => {
      if (this.is360 && !window.AFRAME) {
        return import('./aframe-master-8ee6af74-c7iHvFLi.js').then(function (n) {
          return n.a;
        });
      }
    }).catch(e => {
      Logger_1.error("Scripts are not loaded. The error is " + e);
      throw e;
    });
  }
  loadDashScript() {
    if (this.playOrder.includes("dash") && !this.dashjsLoaded) {
      return import('./dash.all.min-af8b7133-1wUNRr-i.js').then(function (n) {
        return n.d;
      }).then(dashjs => {
        window.dashjs = dashjs.default;
        this.dashjsLoaded = true;
        console.log("dash.all.min.js is loaded");
      });
    } else {
      return Promise.resolve();
    }
  }
  setDefaults() {
    this.playOrder = WebPlayer.DEFAULT_PLAY_ORDER;
    this.currentPlayType = null;
    this.is360 = false;
    this.streamId = null;
    this.playType = WebPlayer.DEFAULT_PLAY_TYPE;
    this.token = null;
    this.autoPlay = true;
    this.mute = false;
    this.targetLatency = 3;
    this.subscriberId = null;
    this.subscriberCode = null;
    this.window = null;
    this.containerElement = null;
    this.placeHolderElement = null;
    this.videojsPlayer = null;
    this.dashPlayer = null;
    this.iceServers = '[ { "urls": "stun:stun1.l.google.com:19302" } ]';
    this.iceConnected = false;
    this.errorCalled = false;
    this.tryNextTechTimer = -1;
    this.aScene = null;
    this.playerListener = null;
    this.webRTCDataListener = null;
    this.websocketBaseURL = null;
    this.httpBaseURL = null;
    this.videoHTMLContent = STATIC_VIDEO_HTML;
    this.videoPlayerId = "video-player";
    this.videojsLoaded = false;
    this.dashjsLoaded = false;
    this.containerElementInitialDisplay = "block";
    this.placeHolderElementInitialDisplay = "block";
    this.forcePlayWithAudio = false;
    this.id3Listener = null;
    this.restJwt = "";
    this.ptzControlElements = {};
    this.ptzValueStep = 0.1;
    this.ptzMovement = "relative";
    this.restAPIPromise = null;
    this.isIPCamera = false;
    this.playerEvents = WebPlayer.PLAYER_EVENTS;
    this.backupStreamId = null;
  }
  initializeFromUrlParams() {
    var _getUrlParameter;
    // Fetch parameters from URL and set to class properties
    this.streamId = getUrlParameter_1("id", this.window.location.search) || this.streamId;
    if (this.streamId == null) {
      //check name variable for compatibility with older versions

      this.streamId = getUrlParameter_1("name", this.window.location.search) || this.streamId;
      if (this.streamId == null) {
        Logger_1.warn("Please use id parameter instead of name parameter.");
      }
    }
    this.is360 = getUrlParameter_1("is360", this.window.location.search) === "true" || this.is360;
    this.playType = ((_getUrlParameter = getUrlParameter_1("playType", this.window.location.search)) === null || _getUrlParameter === void 0 ? void 0 : _getUrlParameter.split(',')) || this.playType;
    this.token = getUrlParameter_1("token", this.window.location.search) || this.token;
    var autoPlayLocal = getUrlParameter_1("autoplay", this.window.location.search);
    if (autoPlayLocal === "false") {
      this.autoPlay = false;
    } else {
      this.autoPlay = true;
    }
    var muteLocal = getUrlParameter_1("mute", this.window.location.search);
    if (muteLocal === "false") {
      this.mute = false;
      //user specifically asks to play with audio so if it fails in auto play, it will not try to play without audio
      this.forcePlayWithAudio = true;
    } else if (muteLocal === "true") {
      this.mute = true;
    }
    var localTargetLatency = getUrlParameter_1("targetLatency", this.window.location.search);
    if (localTargetLatency != null) {
      var latencyInNumber = Number(localTargetLatency);
      if (!isNaN(latencyInNumber)) {
        this.targetLatency = latencyInNumber;
      } else {
        Logger_1.warn("targetLatency parameter is not a number. It will be ignored.");
        this.targetLatency = this.targetLatency || 3; // Default value or existing value
      }
    }
    this.subscriberId = getUrlParameter_1("subscriberId", this.window.location.search) || this.subscriberId;
    this.subscriberCode = getUrlParameter_1("subscriberCode", this.window.location.search) || this.subscriberCode;
    var playOrder = getUrlParameter_1("playOrder", this.window.location.search);
    this.playOrder = playOrder ? playOrder.split(',') : this.playOrder;
    this.restJwt = getUrlParameter_1("restJwt", this.window.location.search) || this.restJwt;
    this.ptzValueStep = getUrlParameter_1("ptzValueStep", this.window.location.search) || this.ptzValueStep;
    this.ptzMovement = getUrlParameter_1("ptzMovement", this.window.location.search) || this.ptzMovement;
    this.backupStreamId = getUrlParameter_1("backupStreamId", this.window.location.search) || this.backupStreamId;
  }
  loadWebRTCComponents() {
    if (this.playOrder.includes("webrtc")) {
      return import('./videojs-webrtc-plugin-5fadffd3-Lz5nGVSV.js').then(css => {
        Logger_1.info("videojs-webrtc-plugin.css is loaded");
        var styleElement = this.dom.createElement('style');
        styleElement.textContent = css.default.toString(); // Assuming css module exports a string
        this.dom.head.appendChild(styleElement);
        return import('./videojs-webrtc-plugin.es-f339fb8c-n6SxyHZa.js').then(videojsWebrtcPluginLocal => {
          Logger_1.info("videojs-webrtc-plugin is loaded");
        });
      });
    } else {
      return Promise.resolve();
    }
  }
  /**
   * load scripts dynamically
   */
  loadVideoJSComponents() {
    if (this.playOrder.includes("hls") || this.playOrder.includes("ll-hls") || this.playOrder.includes("vod") || this.playOrder.includes("webrtc")) {
      //it means we're going to use videojs
      //load videojs css
      if (!this.videojsLoaded) {
        return import('./video-js.min-9b374ff4-kk4alGLA.js').then(css => {
          var styleElement = this.dom.createElement('style');
          styleElement.textContent = css.default.toString(); // Assuming css module exports a string
          this.dom.head.appendChild(styleElement);
        }).then(() => {
          return import('./video.es-0951ae41-boIeAy0a.js').then(function (n) {
            return n.a;
          });
        }).then(videojs => {
          window.videojs = videojs.default;
          this.videojsLoaded = true;
        }).then(() => {
          return import('./plugin-06260ef3-rhOmlHFH.js');
        }).then(() => {
          return this.loadWebRTCComponents();
        });
      } else {
        return Promise.resolve();
      }
    } else {
      return Promise.resolve();
    }
  }

  /**
   * enable 360 player
   */
  enable360Player() {
    this.aScene = this.dom.createElement("a-scene");
    var elementId = this.dom.getElementsByTagName("video")[0].id;
    this.aScene.innerHTML = "<a-videosphere src=\"#" + elementId + "\" rotation=\"0 180 0\" style=\"background-color: antiquewhite\"></a-videosphere>";
    this.dom.body.appendChild(this.aScene);
  }

  /**
   * set player visibility
   * @param {boolean} visible
   */
  setPlayerVisible(visible) {
    this.containerElement.style.display = visible ? this.containerElementInitialDisplay : "none";
    if (this.placeHolderElement) {
      this.placeHolderElement.style.display = visible ? "none" : this.placeHolderElementInitialDisplay;
    }
    if (this.is360) {
      if (visible) {
        this.enable360Player();
      } else if (this.aScene != null) {
        var elements = this.dom.getElementsByTagName("a-scene");
        while (elements.length > 0) {
          this.dom.body.removeChild(elements[0]);
          elements = this.dom.getElementsByTagName("a-scene");
        }
        this.aScene = null;
      }
    }
  }
  handleWebRTCInfoMessages(infos) {
    if (infos["info"] == "ice_connection_state_changed") {
      Logger_1.debug("ice connection state changed to " + infos["obj"].state);
      if (infos["obj"].state == "completed" || infos["obj"].state == "connected") {
        this.iceConnected = true;
      } else if (infos["obj"].state == "failed" || infos["obj"].state == "disconnected" || infos["obj"].state == "closed") {
        //
        Logger_1.warn("Ice connection is not connected. tryNextTech to replay");
        this.tryNextTech();
      }
    } else if (infos["info"] == "closed") {
      //this means websocket is closed and it stops the playback - tryNextTech
      Logger_1.warn("Websocket is closed. tryNextTech to replay");
      this.tryNextTech();
    } else if (infos["info"] == "resolutionChangeInfo") {
      Logger_1.info("Resolution is changing");
      this.videojsPlayer.pause();
      setTimeout(() => {
        this.videojsPlayer.play();
      }, 2000);
    } else if (infos["info"] == "streaming_started") {
      Logger_1.info("Requested stream has started");
      this.playIfExists(this.currentPlayType, infos["obj"].streamId);
    }
  }
  /**
   * Play the stream via videojs
   * @param {*} streamUrl
   * @param {*} extension
   * @returns
   */
  playWithVideoJS(streamUrl, extension) {
    var type;
    if (extension == "mp4") {
      type = "video/mp4";
    } else if (extension == "webm") {
      type = "video/webm";
    } else if (extension == "mov") {
      type = "video/mp4";
      alert("Browsers do not support to play mov format");
    } else if (extension == "avi") {
      type = "video/mp4";
      alert("Browsers do not support to play avi format");
    } else if (extension == "m3u8") {
      type = "application/x-mpegURL";
    } else if (extension == "mpd") {
      type = "application/dash+xml";
    } else if (extension == "webrtc") {
      type = "video/webrtc";
    } else if (extension == "mp3") {
      type = "audio/mpeg";
    } else {
      Logger_1.warn("Unknown extension: " + extension);
      return;
    }
    var preview = this.streamId;
    if (this.streamId.endsWith("_adaptive")) {
      preview = streamId.substring(0, streamId.indexOf("_adaptive"));
    }

    //same videojs is being use for hls, vod and webrtc streams
    var videoPlayererer = this.dom.getElementById(this.videoPlayerId);
    console.log("videoPlayererer", videoPlayererer);
    this.videojsPlayer = videojs(this.videoPlayerId, {
      poster: "previews/" + preview + ".png",
      liveui: extension == "m3u8" ? true : false,
      liveTracker: {
        trackingThreshold: 0
      },
      html5: {
        vhs: {
          limitRenditionByPlayerDimensions: false
        }
      },
      controls: this.controls,
      class: 'video-js vjs-default-skin vjs-big-play-centered',
      muted: this.mute,
      preload: "auto",
      autoplay: this.autoPlay
    });

    //webrtc specific events
    if (extension == "webrtc") {
      this.videojsPlayer.on('webrtc-info', (event, infos) => {
        //Logger.warn("info callback: " + JSON.stringify(infos));
        this.handleWebRTCInfoMessages(infos);
      });
      this.videojsPlayer.on('webrtc-error', (event, errors) => {
        //some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
        Logger_1.warn("error callback: " + JSON.stringify(errors));
        if (errors["error"] == "no_stream_exist" && errors["message"] // check if message exists
        && errors["message"]["information"] == "stream_not_exist_or_not_streaming") {
          // server puts the this client to the waiting list automatically and it will notify with
          //streaming_started event

          //check if backup stream id is set
          if (this.backupStreamId != null) {
            this.tryNextTech();
          } else {
            //if backup stream id is not set, let the server notify
            Logger_1.info("Stream " + errors["message"]["streamId"] + " does not exists or not started yet. Waiting for the stream to start. It will be notified with streaming_started event by the server");
          }
        } else if (errors["error"] == "no_stream_exist" || errors["error"] == "WebSocketNotConnected" || errors["error"] == "not_initialized_yet" || errors["error"] == "data_store_not_available" || errors["error"] == "highResourceUsage" || errors["error"] == "unauthorized_access" || errors["error"] == "user_blocked") {
          //handle high resource usage and not authroized errors && websocket disconnected
          //Even if webrtc adaptor has auto reconnect scenario, we dispose the videojs immediately in tryNextTech
          // so that reconnect scenario is managed here

          this.tryNextTech();
        } else if (errors["error"] == "notSetRemoteDescription") {
          /*
          * If getting codec incompatible or remote description error, it will redirect HLS player.
          */
          Logger_1.warn("notSetRemoteDescription error. Redirecting to HLS player.");
          this.playIfExists("hls", this.activeStreamId);
        }
        if (this.playerListener != null) {
          this.playerListener("webrtc-error", errors);
        }
      });
      this.videojsPlayer.on("webrtc-data-received", (event, obj) => {
        Logger_1.trace("webrtc-data-received: " + JSON.stringify(obj));
        if (this.webRTCDataListener != null) {
          this.webRTCDataListener(obj);
        }
      });
    }

    //hls specific calls
    if (extension == "m3u8") {
      this.videojsPlayer.on('xhr-hooks-ready', () => {
        this.videojsPlayer.ready(() => {
          // tech is ready after ready event
          this.videojsPlayer.tech().vhs.xhr.onRequest(this.insertSecurityParameters);
        });
      });
      this.videojsPlayer.ready(() => {
        // If it's already added to player, no need to add again
        if (typeof this.videojsPlayer.qualitySelectorHls === "function") {
          this.videojsPlayer.qualitySelectorHls({
            displayCurrentQuality: true
          });
        }

        // If there is no adaptive option in m3u8 no need to show quality selector
        var qualityLevels = this.videojsPlayer.qualityLevels();
        qualityLevels.on('addqualitylevel', function (event) {
          var qualityLevel = event.qualityLevel;
          if (qualityLevel.height) {
            qualityLevel.enabled = true;
          } else {
            qualityLevels.removeQualityLevel(qualityLevel);
            qualityLevel.enabled = false;
          }
        });
      });
      this.listenForID3MetaData();
    }

    //videojs is being used to play mp4, webm, m3u8 and webrtc
    //make the videoJS visible when ready is called except for webrtc
    //webrtc fires ready event all cases so we use "play" event to make the player visible

    //this setting is critical to play in mobile
    if (extension == "mp4" || extension == "webm" || extension == "m3u8") {
      this.makeVideoJSVisibleWhenReady();
    }
    this.listenPlayerEvents();
    this.iceConnected = false;
    this.videojsPlayer.src({
      src: streamUrl,
      type: type,
      withCredentials: true,
      iceServers: this.iceServers,
      reconnect: false //webrtc adaptor has auto reconnect scenario, just disable it, we manage it here
    });
    if (this.autoPlay) {
      //try to play directly
      this.videojsPlayer.play().catch(e => {
        //if it's not allowed error and default value are being used, try to play it muted
        //if this.forcePlayWithAudio is true, it means user specifically ask to do. 
        // If it's false, it's default value so that we can proceed to try to play with muted
        //This implementation is added because of auto play policy of the browsers
        if (e.name === "NotAllowedError" && !this.forcePlayWithAudio) {
          this.videojsPlayer.muted(true);
          this.videojsPlayer.play();
        }
        Logger_1.warn("Problem in playback. The error is " + e);
      });
    }
  }
  listenPlayerEvents() {
    this.playerEvents.forEach(event => {
      this.videojsPlayer.on(event, eventData => {
        switch (event) {
          case 'play':
            this.setPlayerVisible(true);
            if (this.playerListener != null) {
              this.playerListener("play");
            }
            if (this.restJwt) {
              this.isIpCameraBroadcast();
            } else if (this.isIPCamera) {
              this.injectPtzElements();
            }
            break;
          case 'ended':
            //reinit to play after it ends
            Logger_1.warn("stream is ended");
            this.setPlayerVisible(false);
            //for webrtc, this event can be called by two reasons
            //1. ice connection is not established, it means that there is a networking issug
            //2. stream is ended
            if (this.currentPlayType != "vod") {
              //if it's vod, it means that stream is ended and no need to replay

              if (this.iceConnected) {
                //if iceConnected is true, it means that stream is really ended for webrtc

                //initialize to play again if the publishing starts again
                this.playIfExists(this.playOrder[0], this.activeStreamId);
              } else if (this.currentPlayType == "hls") {
                //if it's hls, it means that stream is ended

                this.setPlayerVisible(false);
                if (this.playOrder[0] = "hls") {
                  //do not play again if it's hls because it play last seconds again, let the server clear it
                  setTimeout(() => {
                    this.playIfExists(this.playOrder[0], this.activeStreamId);
                  }, 10000);
                } else {
                  this.playIfExists(this.playOrder[0], this.activeStreamId);
                }
                //TODO: what if the stream is hls vod then it always re-play
              } else {
                //if iceConnected is false, it means that there is a networking issue for webrtc
                this.tryNextTech();
              }
            }
            if (this.playerListener != null) {
              this.playerListener(event);
            }
            break;
          case 'timeupdate':
            if (this.playerListener != null) {
              this.playerListener(event, eventData, {
                currentTime: this.videojsPlayer.currentTime()
              });
            }
            break;
          case 'progress':
            if (this.playerListener != null) {
              this.playerListener(event, eventData, {
                bufferedPercent: this.videojsPlayer.bufferedPercent()
              });
            }
            break;
          case 'volumechange':
            if (this.playerListener != null) {
              this.playerListener(event, eventData, {
                volume: this.videojsPlayer.volume(),
                muted: this.videojsPlayer.muted()
              });
            }
            break;
          case 'ratechange':
            if (this.playerListener != null) {
              this.playerListener(event, eventData, {
                playbackRate: this.videojsPlayer.playbackRate()
              });
            }
            break;
          case 'error':
            Logger_1.warn("There is an error in playback: ", eventData);
            // We need to add this kind of check. If we don't add this kind of checkpoint, it will create an infinite loop
            if (!this.errorCalled) {
              this.errorCalled = true;
              setTimeout(() => {
                this.tryNextTech();
                this.errorCalled = false;
              }, 2500);
            }
            if (this.playerListener != null) {
              this.playerListener("error", eventData);
            }
            break;
          default:
            if (this.playerListener != null) {
              this.playerListener(event, eventData);
            }
        }
      });
    });
  }
  listenForID3MetaData() {
    this.videojsPlayer.textTracks().on('addtrack', e => {
      var metadataTrack = Array.from(this.videojsPlayer.textTracks()).find(t => t.label === 'Timed Metadata');
      if (metadataTrack) {
        metadataTrack.addEventListener('cuechange', () => {
          var _metadataTrack$active;
          var id3DataText = (_metadataTrack$active = metadataTrack.activeCues[0]) === null || _metadataTrack$active === void 0 ? void 0 : _metadataTrack$active.text;
          if (this.id3Listener) {
            this.id3Listener(id3DataText);
          }
          Logger_1.info("ID3 Meta Data Received: " + id3DataText);
        });
      }
    });
  }
  makeVideoJSVisibleWhenReady() {
    this.videojsPlayer.ready(() => {
      this.setPlayerVisible(true);
    });
  }

  /**
   * check if stream exists via http
   * @param {*} streamsfolder
   * @param {*} streamId
   * @param {*} extension
   * @returns
   */
  checkStreamExistsViaHttp(streamsfolder, streamId, extension) {
    var streamPath = this.httpBaseURL;
    if (!streamId.startsWith(streamsfolder)) {
      streamPath += streamsfolder + "/";
    }
    var llHls = streamsfolder.includes(WebPlayer.LL_HLS_FOLDER);
    if (llHls) {
      // LL-HLS path
      streamPath += "".concat(streamId, "/").concat(streamId, "__master");
    } else {
      streamPath += streamId;
    }
    if (extension) {
      streamPath += "_adaptive.".concat(extension);
    }
    streamPath = this.addSecurityParams(streamPath);
    return fetch(streamPath, {
      method: 'HEAD'
    }).then(response => {
      if (response.status == 200) {
        // adaptive m3u8 & mpd exists,play it
        return new Promise(function (resolve, reject) {
          resolve(streamPath);
        });
      } else {
        if (llHls) {
          streamPath = this.httpBaseURL + streamsfolder + "/" + streamId + "/" + streamId + "__master." + extension;
        } else {
          streamPath = this.httpBaseURL + streamsfolder + "/" + streamId + "." + extension;
        }
        streamPath = this.addSecurityParams(streamPath);
        return fetch(streamPath, {
          method: 'HEAD'
        }).then(response => {
          if (response.status == 200) {
            return new Promise(function (resolve, reject) {
              resolve(streamPath);
            });
          } else {
            Logger_1.warn("No stream found");
            return new Promise(function (resolve, reject) {
              reject("resource_is_not_available");
            });
          }
        });
      }
    });
  }
  addSecurityParams(streamPath) {
    var securityParams = this.getSecurityQueryParams();
    if (securityParams != null && securityParams != "") {
      streamPath += "?" + securityParams;
    }
    return streamPath;
  }

  /**
   * try next tech if current tech is not working
   */
  tryNextTech() {
    if (this.tryNextTechTimer == -1) {
      this.destroyDashPlayer();
      this.destroyVideoJSPlayer();
      this.setPlayerVisible(false);

      //before changing play type, let's check if there is any backup stream
      var playTypeIndex = this.playOrder.indexOf(this.currentPlayType);
      if (this.activeStreamId == this.streamId && this.backupStreamId != null) {
        //update active stream id to backup stream id
        this.activeStreamId = this.backupStreamId;
        //don't update playTypeIndex because we're trying backup stream with the same play type
      } else {
        //reset the activeStreamId back to streamId
        this.activeStreamId = this.streamId;
        //update the playTypeIndex to try next tech
        if (playTypeIndex == -1 || playTypeIndex == this.playOrder.length - 1) {
          playTypeIndex = 0;
        } else {
          playTypeIndex++;
        }
      }
      this.tryNextTechTimer = setTimeout(() => {
        this.tryNextTechTimer = -1;
        this.playIfExists(this.playOrder[playTypeIndex], this.activeStreamId);
      }, 3000);
    } else {
      Logger_1.debug("tryNextTech is already scheduled no need to schedule again");
    }
  }

  /**
   * play stream throgugh dash player
   * @param {string"} streamUrl
   */
  playViaDash(streamUrl) {
    this.destroyDashPlayer();
    this.dashPlayer = dashjs.MediaPlayer().create();
    this.dashPlayer.extend("RequestModifier", () => {
      return {
        modifyRequestHeader: function modifyRequestHeader(xhr, _ref) {
          return xhr;
        },
        modifyRequestURL: url => {
          var modifiedUrl = "";
          var securityParams = this.getSecurityQueryParams();
          if (!url.includes(securityParams)) {
            if (!url.endsWith("?")) {
              url += "?";
            }
            modifiedUrl = url + securityParams;
            Logger_1.warn(modifiedUrl);
            return modifiedUrl;
          }
          return url;
        },
        modifyRequest(request) {}
      };
    });
    this.dashPlayer.updateSettings({
      streaming: {
        delay: {
          liveDelay: this.targetLatency
        },
        liveCatchup: {
          maxDrift: 0.5,
          playbackRate: 0.5,
          latencyThreshold: 60
        }
      }
    });
    this.dashPlayer.initialize(this.containerElement.firstChild, streamUrl, this.autoPlay);
    this.dashPlayer.setMute(this.mute);
    this.dashLatencyTimer = setInterval(() => {
      Logger_1.warn("live latency: " + this.dashPlayer.getCurrentLiveLatency());
    }, 2000);
    this.makeDashPlayerVisibleWhenInitialized();
    this.dashPlayer.on(dashjs.MediaPlayer.events.PLAYBACK_PLAYING, event => {
      Logger_1.warn("playback started");
      this.setPlayerVisible(true);
      if (this.playerListener != null) {
        this.playerListener("play");
      }
    });
    this.dashPlayer.on(dashjs.MediaPlayer.events.PLAYBACK_ENDED, () => {
      Logger_1.warn("playback ended");
      this.destroyDashPlayer();
      this.setPlayerVisible(false);
      //streaming can be started again so try to play again with preferred tech
      if (this.playOrder[0] = "dash") {
        //do not play again if it's dash because it play last seconds again, let the server clear it
        setTimeout(() => {
          this.playIfExists(this.playOrder[0], this.activeStreamId);
        }, 10000);
      } else {
        this.playIfExists(this.playOrder[0], this.activeStreamId);
      }
      if (this.playerListener != null) {
        this.playerListener("ended");
      }
    });
    this.dashPlayer.on(dashjs.MediaPlayer.events.PLAYBACK_ERROR, event => {
      Logger_1.warn("dash playback error: " + event);
      this.tryNextTech();
    });
    this.dashPlayer.on(dashjs.MediaPlayer.events.ERROR, event => {
      Logger_1.warn("error: " + event);
      this.tryNextTech();
    });
    this.dashPlayer.on(dashjs.MediaPlayer.events.PLAYBACK_NOT_ALLOWED, event => {
      Logger_1.warn("dash playback not allowed: " + event);
      this.handleDashPlayBackNotAllowed();
    });
    this.dashPlayer.on(dashjs.MediaPlayer.events.PLAYBACK_PAUSED, event => {
      if (this.playerListener != null) {
        //same event with videojs
        this.playerListener("pause");
      }
    });
    this.dashPlayer.on(dashjs.MediaPlayer.events.PLAYBACK_SEEKED, event => {
      if (this.playerListener != null) {
        //same event with videojs
        this.playerListener("seeked");
      }
    });
    this.dashPlayer.on(dashjs.MediaPlayer.events.PLAYBACK_TIME_UPDATED, event => {
      if (this.playerListener != null) {
        //same event with videojs
        this.playerListener("timeupdate");
      }
    });
  }
  handleDashPlayBackNotAllowed() {
    if (!this.forcePlayWithAudio) {
      Logger_1.info("Try to play with muted audio");
      this.dashPlayer.setMute(true);
      this.dashPlayer.play();
    } else {
      this.tryNextTech();
    }
  }
  makeDashPlayerVisibleWhenInitialized() {
    this.dashPlayer.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, event => {
      Logger_1.warn("Stream initialized");
      //make the player visible in mobile devices
      this.setPlayerVisible(true);
    });
  }

  /**
   * destroy the dash player
   */
  destroyDashPlayer() {
    if (this.dashPlayer) {
      this.dashPlayer.destroy();
      this.dashPlayer = null;
      clearInterval(this.dashLatencyTimer);
    }
  }

  /**
   * destroy the videojs player
   */
  destroyVideoJSPlayer() {
    if (this.videojsPlayer) {
      this.videojsPlayer.dispose();
      this.videojsPlayer = null;
    }
  }

  /**
   * Destory the player
   */
  destroy() {
    this.destroyVideoJSPlayer();
    this.destroyDashPlayer();
  }

  /**
   * play the stream with the given tech
   * @param {string} tech
   */
  playIfExists(tech, streamIdToPlay) {
    var _this = this;
    return _asyncToGenerator(function* () {
      _this.currentPlayType = tech;
      _this.destroyVideoJSPlayer();
      _this.destroyDashPlayer();
      _this.setPlayerVisible(false);
      _this.containerElement.innerHTML = _this.videoHTMLContent;
      console.log("videoHTMLContent:", _this.videoHTMLContent);
      console.log("containerElement:", _this.containerElement);
      Logger_1.warn("Try to play the stream " + streamIdToPlay + " with " + _this.currentPlayType);
      switch (_this.currentPlayType) {
        case "hls":
          //TODO: Test case for hls
          //1. Play stream with adaptive m3u8 for live and VoD
          //2. Play stream with m3u8 for live and VoD
          //3. if files are not available check nextTech is being called
          return _this.checkStreamExistsViaHttp(WebPlayer.STREAMS_FOLDER, streamIdToPlay, WebPlayer.HLS_EXTENSION).then(streamPath => {
            _this.playWithVideoJS(streamPath, WebPlayer.HLS_EXTENSION);
            Logger_1.warn("incoming stream path: " + streamPath);
          }).catch(error => {
            Logger_1.warn("HLS stream resource not available for stream:" + streamIdToPlay + " error is " + error + ". Try next play tech");
            _this.tryNextTech();
          });
        case "ll-hls":
          return _this.checkStreamExistsViaHttp(WebPlayer.STREAMS_FOLDER + "/" + WebPlayer.LL_HLS_FOLDER, streamIdToPlay, WebPlayer.HLS_EXTENSION).then(streamPath => {
            _this.playWithVideoJS(streamPath, WebPlayer.HLS_EXTENSION);
            Logger_1.warn("incoming stream path: " + streamPath);
          }).catch(error => {
            Logger_1.warn("LL-HLS stream resource not available for stream:" + streamIdToPlay + " error is " + error + ". Try next play tech");
            _this.tryNextTech();
          });
        case "dash":
          return _this.checkStreamExistsViaHttp(WebPlayer.STREAMS_FOLDER, streamIdToPlay + "/" + streamIdToPlay, WebPlayer.DASH_EXTENSION).then(streamPath => {
            _this.playViaDash(streamPath);
          }).catch(error => {
            Logger_1.warn("DASH stream resource not available for stream:" + streamIdToPlay + " error is " + error + ". Try next play tech");
            _this.tryNextTech();
          });
        case "webrtc":
          return _this.playWithVideoJS(_this.addSecurityParams(_this.getWebsocketURLForStream(streamIdToPlay)), WebPlayer.WEBRTC_EXTENSION);
        case "vod":
          //TODO: Test case for vod
          //1. Play stream with mp4 for VoD
          //2. Play stream with webm for VoD
          //3. Play stream with playOrder type

          var lastIndexOfDot = streamIdToPlay.lastIndexOf(".");
          var extension;
          if (lastIndexOfDot != -1) {
            //if there is a dot in the streamId, it means that this is extension, use it. make the extension empty
            _this.playType[0] = "";
            extension = streamIdToPlay.substring(lastIndexOfDot + 1);
          } else {
            //we need to give extension to playWithVideoJS
            extension = _this.playType[0];
          }
          return _this.checkStreamExistsViaHttp(WebPlayer.STREAMS_FOLDER, streamIdToPlay, _this.playType[0]).then(streamPath => {
            //we need to give extension to playWithVideoJS
            _this.playWithVideoJS(streamPath, extension);
          }).catch(error => {
            Logger_1.warn("VOD stream resource not available for stream:" + streamIdToPlay + " and play type " + _this.playType[0] + ". Error is " + error);
            if (_this.playType.length > 1) {
              Logger_1.warn("Try next play type which is " + _this.playType[1] + ".");
              _this.checkStreamExistsViaHttp(WebPlayer.STREAMS_FOLDER, streamIdToPlay, _this.playType[1]).then(streamPath => {
                _this.playWithVideoJS(streamPath, _this.playType[1]);
              }).catch(error => {
                Logger_1.warn("VOD stream resource not available for stream:" + streamIdToPlay + " and play type error is " + error);
              });
            }
          });
      }
    })();
  }
  getWebsocketURLForStream(streamIdToPlay) {
    return this.websocketBaseURL + streamIdToPlay + ".webrtc";
  }

  /**
   *
   * @returns {String} query string for security
   */
  getSecurityQueryParams() {
    var queryString = "";
    if (this.token != null) {
      queryString += "token=" + this.token + "&";
    }
    if (this.subscriberId != null) {
      queryString += "subscriberId=" + this.subscriberId + "&";
    }
    if (this.subscriberCode != null) {
      queryString += "subscriberCode=" + this.subscriberCode + "&";
    }
    //remove the last character if it's "&"
    if (queryString.endsWith("&")) {
      queryString = queryString.substring(0, queryString.length - 1);
    }
    return queryString;
  }

  /**
   * play the stream with videojs player or dash player
   */
  play() {
    //if there is a request to play, try original stream first
    this.activeStreamId = this.streamId;
    if (this.activeStreamId.startsWith(WebPlayer.STREAMS_FOLDER)) {
      //start videojs player because it directly try to play stream from streams folder
      var lastIndexOfDot = this.activeStreamId.lastIndexOf(".");
      var extension = this.activeStreamId.substring(lastIndexOfDot + 1);
      this.playOrder = ["vod"];
      this.currentPlayType = this.playOrder[0];
      if (!this.httpBaseURL.endsWith("/")) {
        this.httpBaseURL += "/";
      }
      this.containerElement.innerHTML = this.videoHTMLContent;
      if (extension == WebPlayer.DASH_EXTENSION) {
        this.playViaDash(this.httpBaseURL + this.addSecurityParams(this.activeStreamId), extension);
      } else {
        this.playWithVideoJS(this.httpBaseURL + this.addSecurityParams(this.activeStreamId), extension);
      }
    } else {
      this.playIfExists(this.playOrder[0], this.activeStreamId);
    }
  }

  /**
   * mute or unmute the player
   * @param {boolean} mutestatus true to mute the player
   */
  mutePlayer(mutestatus) {
    this.mute = mutestatus;
    if (this.videojsPlayer) {
      this.videojsPlayer.muted(mutestatus);
    }
    if (this.dashPlayer) {
      this.dashPlayer.setMute(mutestatus);
    }
  }

  /**
   *
   * @returns {boolean} true if player is muted
   */
  isMuted() {
    return this.mute;
  }
  addPlayerListener(playerListener) {
    this.playerListener = playerListener;
  }

  /**
   * WebRTC data listener
   * @param {*} webRTCDataListener
   */
  addWebRTCDataListener(webRTCDataListener) {
    this.webRTCDataListener = webRTCDataListener;
  }

  /**
   * ID3 meta data listener
   * @param {*} id3Listener
   */
  addId3Listener(id3Listener) {
    this.id3Listener = id3Listener;
  }

  /**
   *
   * @param {*} data
   */
  sendWebRTCData(data) {
    try {
      if (this.videojsPlayer && this.currentPlayType == "webrtc") {
        this.videojsPlayer.sendDataViaWebRTC(data);
        return true;
      } else {
        Logger_1.warn("Player is not ready or playType is not WebRTC");
      }
    } catch (error) {
      // Handle the error here
      Logger_1.error("An error occurred while sending WebRTC data: ", error);
    }
    return false;
  }
  injectPtzElements() {
    var ptzControlsHtmlContent = "\n        <style>\n          .ptz-camera-container {\n            display: none;\n            position: absolute;\n            flex-direction: row;\n            align-items: center;\n            bottom: 30px;\n            right: 10px;\n            z-index:999;\n          }\n          .direction-arrow-container {\n            display: flex;\n            width: 200px;\n            height: 200px;\n            position: relative;\n          }\n         \n        </style>\n        <div id=\"ptz-camera-container\" class=\"ptz-camera-container\">\n          \n            <div style=\"display: flex; flex-direction: column;\">\n             <div style=\"margin-bottom:5px\">\n                <span id=\"zoom-out-button\" style=\"color: #bc1b22; font-size: 50px; font-weight: bold; user-select: none; cursor: pointer; margin-right: 5px;\">-</span>\n                <span id=\"zoom-in-button\" style=\"color: #bc1b22; font-size: 50px; font-weight: bold; cursor: pointer; margin-left: 5px; user-select: none;\">+</span>\n             </div>\n              <div id=\"direction-arrow-container\" class=\"direction-arrow-container\">\n                <img id=\"up-button\" style=\"position: absolute; width: 50px; cursor: pointer; height: 50px; left: 50%; transform: translateX(-50%);\" src=\"" + img.src + "\"/>\n             \n                <img id=\"left-button\" style=\"position: absolute; left: 0px; width: 50px; height: 50px; cursor: pointer; top: 50%; transform: translateY(-50%) rotate(-90deg);\" src=\"" + img.src + "\"/>\n                <img id=\"right-button\" style=\"position: absolute; right:0px; top: 50%; width: 50px; cursor: pointer; height: 50px; transform: translateY(-50%) rotate(90deg);\" src=\"" + img.src + "\"/>\n                <img id=\"down-button\" style=\"position: absolute; bottom:0px;left: 50%; width: 50px; cursor: pointer; height: 50px; transform: translateX(-50%) rotate(180deg);\" src=\"" + img.src + "\"/>\n               \n            </div>\n           \n           \n            </div>\n          </div>\n        </div>\n        ";
    var ptzCameraContainer = document.getElementById("ptz-camera-container");
    if (ptzCameraContainer) {
      Logger_1.info("PTZ controls are already injected");
      return;
    }
    var videoPlayerContainer = document.getElementById("video-player");
    videoPlayerContainer.insertAdjacentHTML('afterbegin', ptzControlsHtmlContent);
    var ptzButton = this.videojsPlayer.controlBar.addChild('button');
    var ptzButtonEl = ptzButton.el();
    ptzButtonEl.innerHTML = '<span style="cursor:pointer">PTZ</span>';
    ptzButtonEl.onclick = () => {
      var ptzContainer = document.getElementById("ptz-camera-container");
      var display = ptzContainer.style.display;
      if (display === "none" || display === "") {
        this.scalePtzControls();
        ptzContainer.style.display = "flex";
      } else {
        ptzContainer.style.display = "none";
      }
    };
    ptzButton.controlText('Show PTZ Controls');
    this.videojsPlayer.controlBar.el().insertBefore(ptzButtonEl, this.videojsPlayer.controlBar.getChild('fullscreenToggle').el());
    this.videojsPlayer.on('fullscreenchange', () => {
      this.scalePtzControls();
    });
    this.initPtzControls();
  }
  scalePtzControls() {
    var containerWidth = this.getContainerWidth();
    var arrowButtonWidthHeight = Math.round(containerWidth * 25 / 640);
    var arrowContainerWidthHeight = Math.round(containerWidth * 75 / 640);
    var zoomButtonTextSize = Math.round(containerWidth * 35 / 640);
    this.ptzControlElements.leftButton = document.getElementById(PTZ_LEFT_BUTTON_ID);
    this.ptzControlElements.rightButton = document.getElementById(PTZ_RIGHT_BUTTON_ID);
    this.ptzControlElements.upButton = document.getElementById(PTZ_UP_BUTTON_ID);
    this.ptzControlElements.downButton = document.getElementById(PTZ_DOWN_BUTTON_ID);
    this.ptzControlElements.leftButton.style.width = arrowButtonWidthHeight + "px";
    this.ptzControlElements.leftButton.style.height = arrowButtonWidthHeight + "px";
    this.ptzControlElements.rightButton.style.width = arrowButtonWidthHeight + "px";
    this.ptzControlElements.rightButton.style.height = arrowButtonWidthHeight + "px";
    this.ptzControlElements.upButton.style.width = arrowButtonWidthHeight + "px";
    this.ptzControlElements.upButton.style.height = arrowButtonWidthHeight + "px";
    this.ptzControlElements.downButton.style.width = arrowButtonWidthHeight + "px";
    this.ptzControlElements.downButton.style.height = arrowButtonWidthHeight + "px";
    this.ptzControlElements.directionArrowContainer.style.width = arrowContainerWidthHeight + "px";
    this.ptzControlElements.directionArrowContainer.style.height = arrowContainerWidthHeight + "px";
    this.ptzControlElements.zoomInButton.style.fontSize = zoomButtonTextSize + "px";
    this.ptzControlElements.zoomOutButton.style.fontSize = zoomButtonTextSize + "px";
  }
  getContainerWidth() {
    var videoPlayerContainer = document.getElementById("video-player");
    var rect = videoPlayerContainer.getBoundingClientRect();
    return rect.width;
  }
  initPtzControls() {
    this.ptzControlElements.directionArrowContainer = document.getElementById("direction-arrow-container");
    this.ptzControlElements.leftButton = document.getElementById(PTZ_LEFT_BUTTON_ID);
    this.ptzControlElements.rightButton = document.getElementById(PTZ_RIGHT_BUTTON_ID);
    this.ptzControlElements.upButton = document.getElementById(PTZ_UP_BUTTON_ID);
    this.ptzControlElements.downButton = document.getElementById(PTZ_DOWN_BUTTON_ID);
    this.ptzControlElements.zoomInButton = document.getElementById(PTZ_ZOOM_IN_BUTTON_ID);
    this.ptzControlElements.zoomOutButton = document.getElementById(PTZ_ZOOM_OUT_BUTTON_ID);
    this.ptzControlElements.leftButton.addEventListener('click', () => this.moveCamera(1 * this.ptzValueStep, 0, 0, this.ptzMovement));
    this.ptzControlElements.rightButton.addEventListener('click', () => this.moveCamera(-1 * this.ptzValueStep, 0, 0, this.ptzMovement));
    this.ptzControlElements.downButton.addEventListener('click', () => this.moveCamera(0, -1 * this.ptzValueStep, 0, this.ptzMovement));
    this.ptzControlElements.upButton.addEventListener('click', () => this.moveCamera(0, this.ptzValueStep, 0, this.ptzMovement));
    this.ptzControlElements.zoomInButton.addEventListener('click', () => this.moveCamera(0, 0, this.ptzValueStep, this.ptzMovement));
    this.ptzControlElements.zoomOutButton.addEventListener('click', () => this.moveCamera(0, 0, -1 * this.ptzValueStep, this.ptzMovement));
  }
  isIpCameraBroadcast() {
    var apiEndpoint = "rest/v2/broadcasts/" + this.streamId;
    var requestOptions = {
      method: 'GET',
      headers: {
        'Authorization': this.restJwt
      }
    };
    var restPromise;
    if (this.restAPIPromise) {
      restPromise = this.restAPIPromise(apiEndpoint, requestOptions);
    } else {
      restPromise = fetch(this.httpBaseURL + apiEndpoint, requestOptions);
    }
    restPromise.then(response => response.json ? response.json() : response).then(data => {
      var broadcastType = data.type;
      if (broadcastType === "ipCamera") {
        this.injectPtzElements();
      }
      console.log(data);
    }).catch(error => console.error('Error:', error));
  }
  moveCamera(valueX, valueY, valueZ, movement) {
    Logger_1.info("move camera called valuex:" + valueX + " valueY:" + valueY + " valueZ:" + valueZ + " movement:" + movement);
    var apiEndpoint = "rest/v2/broadcasts/" + this.streamId + "/ip-camera/move" + "?valueX=" + valueX + "&valueY=" + valueY + "&valueZ=" + valueZ + "&movement=" + movement;
    var requestOptions = {
      method: 'POST',
      headers: {
        'Authorization': this.restJwt,
        'Content-Type': 'application/json'
      }
    };
    var restPromise;
    if (this.restAPIPromise) {
      restPromise = this.restAPIPromise(apiEndpoint, requestOptions);
    } else {
      restPromise = fetch(this.httpBaseURL + apiEndpoint, requestOptions);
    }
    restPromise.then(response => response.json ? response.json() : response).then(data => {
      // Handle the response data as needed
    }).catch(error => console.error('Error:', error));
  }
  getSource() {
    if (this.videojsPlayer) {
      return this.videojsPlayer.currentSrc();
    } else if (this.dashPlayer) {
      return this.dashPlayer.getSource();
    }
  }
  getTime() {
    if (this.videojsPlayer) {
      return this.videojsPlayer.currentTime();
    } else if (this.dashPlayer) {
      return this.dashPlayer.time();
    }
  }
}
_defineProperty(WebPlayer, "PLAYER_EVENTS", ['abort', 'canplay', 'canplaythrough', 'durationchange', 'emptied', 'ended', 'error', 'loadeddata', 'loadedmetadata', 'loadstart', 'pause', 'play', 'playing', 'progress', 'ratechange', 'seeked', 'seeking', 'stalled', 'suspend', 'timeupdate', 'volumechange', 'waiting', 'enterpictureinpicture', 'leavepictureinpicture', 'fullscreenchange', 'resize', 'audioonlymodechange', 'audiopostermodechange', 'controlsdisabled', 'controlsenabled', 'debugon', 'debugoff', 'disablepictureinpicturechanged', 'dispose', 'enterFullWindow', 'error', 'exitFullWindow', 'firstplay', 'fullscreenerror', 'languagechange', 'loadedmetadata', 'loadstart', 'playerreset', 'playerresize', 'posterchange', 'ready', 'textdata', 'useractive', 'userinactive', 'usingcustomcontrols', 'usingnativecontrols']);
_defineProperty(WebPlayer, "DEFAULT_PLAY_ORDER", ["webrtc", "hls"]);
_defineProperty(WebPlayer, "DEFAULT_PLAY_TYPE", ["mp4", "webm"]);
_defineProperty(WebPlayer, "HLS_EXTENSION", "m3u8");
_defineProperty(WebPlayer, "WEBRTC_EXTENSION", "webrtc");
_defineProperty(WebPlayer, "DASH_EXTENSION", "mpd");
/**
* streamsFolder: streams folder. Optional. Default value is "streams"
*/
_defineProperty(WebPlayer, "STREAMS_FOLDER", "streams");
/**
* lowLatencyHlsFolder: ll-hls folder. Optional. Default value is "ll-hls"
*/
_defineProperty(WebPlayer, "LL_HLS_FOLDER", "ll-hls");

var webPlayer = new WebPlayer(window, document.getElementById("video_container"), document.getElementById("video_info"));
webPlayer.initialize().then(() => {
  webPlayer.play();
});
webPlayer.addWebRTCDataListener(data => {
  console.debug("Data received: " + data);
});
document.getElementById("unmuteButton").addEventListener("click", function () {
  if (webPlayer.isMuted()) {
    webPlayer.mutePlayer(false);
    document.getElementById("unmuteButton").innerHTML = "Mute";
  } else {
    webPlayer.mutePlayer(true);
    document.getElementById("unmuteButton").innerHTML = "Unmute";
  }
});
var httpBaseUrl = null;
function getHttpBaseUrl() {
  // Mute/Unmute Video Button for 360 playback
  if (httpBaseUrl == null) {
    let appName = "/";
    if (window.location.pathname && window.location.pathname.indexOf("/") != -1) {
      appName = window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/") + 1);
    }
    let path = window.location.hostname;
    if (window.location.port != "") {
      path += ":" + window.location.port;
    }
    if (!appName.startsWith("/")) {
      appName = "/" + appName;
    }
    if (!appName.endsWith("/")) {
      appName += "/";
    }
    path += appName;
    httpBaseUrl = window.location.protocol + "//" + path;
  }
  return httpBaseUrl;
}
function sendEventToBackend(data) {
  if (!sendAnalytic) {
    return;
  }
  let url = getHttpBaseUrl() + "analytic/events/";
  if (data.event.startsWith("play")) {
    url += "play";
  } else if (data.event.startsWith("watch")) {
    url += "watch-time";
  } else {
    console.warn("Not known event type");
  }
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  }).then(response => response.json()).then(data => console.log('Event sent successfully:', data)).catch(error => console.error('Error sending event:', error));
}
function getUrlParameter(sParam, search) {
  if (typeof search === undefined || search == null) {
    search = window.location.search;
  }
  var sPageURL = decodeURIComponent(search.substring(1)),
    sURLVariables = sPageURL.split('&'),
    sParameterName,
    i;
  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
}
let sendAnalytic = false;
if (getUrlParameter("sendAnalytic", window.location.search) == "true") {
  sendAnalytic = true;
}
httpBaseUrl = getHttpBaseUrl();
window.webPlayer = webPlayer;
let firstTimePlay = true;
let firstTimeUpdate = -1;
let lastTimeUpdate = -1;
webPlayer.addPlayerListener(status => {
  if (status == "play") {
    if (webPlayer.is360) {
      document.getElementById("unmuteButton").style.display = "block";
    }
    if (firstTimePlay) {
      firstTimePlay = false;
      sendEventToBackend({
        subscriberId: webPlayer.subscriberId,
        event: "playStartedFirstTime",
        streamId: webPlayer.streamId,
        protocol: webPlayer.currentPlayType
      });
    }

    //send play event
    sendEventToBackend({
      subscriberId: webPlayer.subscriberId,
      event: "playStarted",
      streamId: webPlayer.streamId,
      protocol: webPlayer.currentPlayType
    });
  } else if (status == "ended") {
    document.getElementById("unmuteButton").style.display = "none";

    //send watchtime evenet
    let timeDiff = (lastTimeUpdate - firstTimeUpdate).toFixed(2);
    sendEventToBackend({
      subscriberId: webPlayer.subscriberId,
      event: "watchTime",
      streamId: webPlayer.streamId,
      protocol: webPlayer.currentPlayType,
      watchTimeMs: timeDiff * 1000,
      startTimeMs: firstTimeUpdate * 1000
    });
    firstTimeUpdate = -1;

    //send ended event
    sendEventToBackend({
      subscriberId: webPlayer.subscriberId,
      event: "playEnded",
      streamId: webPlayer.streamId,
      protocol: webPlayer.currentPlayType
    });
  } else if (status == "seeked") {
    //send latest watchTime
    let timeDiff = (lastTimeUpdate - firstTimeUpdate).toFixed(2);
    sendEventToBackend({
      subscriberId: webPlayer.subscriberId,
      event: "watchTime",
      streamId: webPlayer.streamId,
      protocol: webPlayer.currentPlayType,
      watchTimeMs: timeDiff * 1000,
      startTimeMs: firstTimeUpdate * 1000
    });
    firstTimeUpdate = -1;
  } else if (status == "timeupdate") {
    //send duration event
    if (firstTimeUpdate == -1) {
      firstTimeUpdate = webPlayer.getTime().toFixed(2);
    }
    lastTimeUpdate = webPlayer.getTime().toFixed(2);
    let timeDiff = (lastTimeUpdate - firstTimeUpdate).toFixed(2);
    if (lastTimeUpdate - firstTimeUpdate > 5) {
      sendEventToBackend({
        subscriberId: webPlayer.subscriberId,
        event: "watchTime",
        streamId: webPlayer.streamId,
        protocol: webPlayer.currentPlayType,
        watchTimeMs: timeDiff * 1000,
        startTimeMs: firstTimeUpdate * 1000
      });
      firstTimeUpdate = -1;
    }
  } else if (status == "pause") {
    //send pause event
    sendEventToBackend({
      subscriberId: webPlayer.subscriberId,
      event: "playPaused",
      streamId: webPlayer.streamId,
      protocol: webPlayer.currentPlayType
    });
  }
  console.debug("player event: ", status);
});
