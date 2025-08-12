import { v as videojs, _ as _extends$3 } from './video.es-0951ae41-boIeAy0a.js';
import './_commonjsHelpers-7d1333e8-GWJfaxwO.js';

/*! @name @antmedia/videojs-webrtc-plugin @version 1.3.3 @license MIT */
const ANT_CALLBACKS = {
  INITIALIZED: 'initialized',
  PLAY_STARTED: 'play_started',
  PLAY_FINISHED: 'play_finished',
  CLOSED: 'closed',
  STREAM_INFORMATION: 'streamInformation',
  RESOLUTION_CHANGE_INFO: 'resolutionChangeInfo',
  ICE_CONNECTION_STATE_CHANGED: 'ice_connection_state_changed',
  DATA_RECEIVED: 'data_received',
  DATACHANNEL_NOT_OPEN: 'data_channel_not_open',
  NEW_TRACK_AVAILABLE: 'newTrackAvailable'
};
const MenuItem = videojs.getComponent('MenuItem');
const Component = videojs.getComponent('Component');
class ResolutionMenuItem extends MenuItem {
  constructor(player, options) {
    options.selectable = true;
    options.multiSelectable = false;
    super(player, options);
  }
  handleClick() {
    this.options().plugin.changeStreamQuality(this.options().value);
  }
}
Component.registerComponent('ResolutionMenuItem', ResolutionMenuItem);
const MenuButton = videojs.getComponent('MenuButton');
class ResolutionMenuButton extends MenuButton {
  constructor(player, options) {
    super(player, options);
  }
  createEl() {
    return videojs.dom.createEl('div', {
      className: 'vjs-http-source-selector vjs-menu-button vjs-menu-button-popup vjs-control vjs-button'
    });
  }
  buildCSSClass() {
    return `${super.buildCSSClass()} vjs-icon-cog`;
  }
  update() {
    return super.update();
  }
  createItems() {
    const menuItems = [];
    const levels = [{
      label: 'auto',
      value: 0
    }, ...this.player().resolutions];
    for (let i = 0; i < levels.length; i++) {
      menuItems.push(new ResolutionMenuItem(this.player_, {
        label: levels[i].label,
        value: levels[i].value,
        selected: levels[i].value === this.player().selectedResolution,
        plugin: this.options().plugin,
        streamName: this.options().streamName
      }));
    }
    return menuItems;
  }
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
var Logger$4 = window.log;
class SoundMeter {
  /**
   * 
   * @param {AudioContext} context 
   */
  constructor(context, volumeMeterUrl) {
    this.context = context;
    this.instant = 0.0;
    this.mic = null;
    this.volumeMeterNode = null;
    this.url = volumeMeterUrl;
  }
  /**
   * 
   * @param {MediaStream} stream 
   * @param {Function} levelCallback 
   * @param {Function} errorCallback 
   * @returns 
   */
  connectToSource(stream, levelCallback, errorCallback) {
    return this.context.audioWorklet.addModule(this.url).then(() => {
      this.mic = this.context.createMediaStreamSource(stream);
      this.volumeMeterNode = new AudioWorkletNode(this.context, 'volume-meter');
      this.volumeMeterNode.port.onmessage = event => {
        if (event.data.type == 'debug') {
          Logger$4.debug(event.data.message);
        } else {
          this.instant = event.data;
          levelCallback(this.instant.toFixed(2));
          Logger$4.debug("Audio level: " + this.instant.toFixed(2));
        }
      };
      this.mic.connect(this.volumeMeterNode);
    }).catch(err => {
      if (errorCallback !== undefined) {
        errorCallback(err);
      }
      Logger$4.error("Error in soundmeter: " + err);
      Logger$4.error("You may need to define the url of the volume-meter-processor.js");
      throw err;
    });
  }
  stop() {
    if (this.volumeMeterNode != null) {
      this.volumeMeterNode.port.postMessage('stop');
      this.volumeMeterNode.disconnect();
      this.volumeMeterNode.port.close();
      this.volumeMeterNode = null;
    }
    if (this.mic != null) {
      this.mic.disconnect();
      this.mic = null;
    }
  }
}

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
 * @returns {boolean}
 */
function isAndroid() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android/i.test(userAgent);
}
var Logger$3 = window.log;
/**
 * Media management class is responsible to manage audio and video
 * sources and tracks management for the local stream.
 * Also audio and video properties (like bitrate) are managed by this class .
 */
class MediaManager {
  /**
   *
   * @param {object} initialValues
   */
  constructor(initialValues) {
    /**
     * the maximum bandwith value that browser can send a stream
     * keep in mind that browser may send video less than this value
     */
    this.bandwidth = 1200; //kbps

    /**
     * This flags enables/disables debug logging
     */
    this.debug = false;

    /**
     * The cam_location below is effective when camera and screen is send at the same time.
     * possible values are top and bottom. It's on right all the time
     */
    this.camera_location = "top";

    /**
     * The cam_margin below is effective when camera and screen is send at the same time.
     * This is the margin value in px from the edges
     */
    this.camera_margin = 15;

    /**
     * this camera_percent is how large the camera view appear on the screen. It's %15 by default.
     */
    this.camera_percent = 15;

    /**
     * initial media constraints provided by the user
    * @type {MediaStreamConstraints}
     */
    this.mediaConstraints = {
      /** @type {MediaTrackConstraints} */
      video: true,
      /** @type {MediaTrackConstraints} */
      audio: true
    };

    /**
     * this is the callback function to get video/audio sender from WebRTCAdaptor
     */
    this.getSender = initialValues.getSender;

    /**
     * This is the Stream Id for the publisher.
     */
    this.publishStreamId = null;

    /**
     * this is the object of the local stream to publish
     * it is initiated in initLocalStream method
     */
    this.localStream = null;

    /**
     * publish mode is determined by the user and set by @mediaConstraints.video
     * It may be camera, screen, screen+camera
     */
    this.publishMode = "camera"; //screen, screen+camera

    /**
     * Default callback. It's overriden below if it exists
     */
    this.callback = (info, obj) => {
      Logger$3.debug("Callback info: " + info + " object: " + typeof obj !== undefined ? JSON.stringify(obj) : "");
    };

    /**
     * Default callback error implementation. It's overriden below if it exists
     */
    this.callbackError = err => {
      Logger$3.error(err);
    };

    /**
           * volume-meter-process.js file to find directly. You can locate the file to your assets
     */
    this.volumeMeterUrl = 'volume-meter-processor.js';

    /**
     * The values of the above fields are provided as user parameters by the constructor.
     * TODO: Also some other hidden parameters may be passed here
     */
    for (var key in initialValues.userParameters) {
      if (initialValues.userParameters.hasOwnProperty(key)) {
        this[key] = initialValues.userParameters[key];
      }
    }

    //set the callback if it's defined
    if (initialValues.callback) {
      this.callback = initialValues.callback;
    }

    //set the callbackError if it's defined
    if (initialValues.callbackError) {
      this.callbackError = initialValues.callbackError;
    }

    /**
     * current volume value which is set by the user
     */
    this.currentVolume = null;

    /**
     * Keeps the audio track to be closed in case of audio track change
     */
    this.previousAudioTrack = null;

    /**
    * silent audio track for switching between dummy track to real tracks on the fly
    */
    this.silentAudioTrack = null;

    /**
     * The screen video track in screen+camera mode
     */
    this.desktopStream = null;

    /**
     * The camera (overlay) video track in screen+camera mode
     */
    this.smallVideoTrack = null;

    /**
    * black video track for switching between dummy video track to real tracks on the fly
    */
    this.blackVideoTrack = null;

    /**
     * Audio context to use for meter, mix, gain
     */
    this.audioContext = new AudioContext();

    /**
    * osciallator to generate silent audio
    */
    this.oscillator = null;

    /**
     * the main audio in single audio case
     * the primary audio in mixed audio case
     *
     * its volume can be controled
     */
    this.primaryAudioTrackGainNode = null;

    /**
     * the secondary audio in mixed audio case
     *
     * its volume can be controled
     */
    this.secondaryAudioTrackGainNode = null;

    /**
     * this is the sound meter object for the local stream
     */
    this.localStreamSoundMeter = null;

    /**
     * this is the level callback for sound meter object
     */
    this.levelCallback = null;

    /**
     * Timer to create black frame to publish when video is muted
     */
    this.blackFrameTimer = null;

    /**
     * Timer to draw camera and desktop to canvas
     */
    this.desktopCameraCanvasDrawerTimer = null;

    /**
     * For audio check when the user is muted itself.
     * Check enableAudioLevelWhenMuted
     */
    this.mutedAudioStream = null;

    /**
     * This flag is the status of audio stream
     * Checking when the audio stream is updated
     */
    this.isMuted = false;

    /**
     * meter refresh period for "are you talking?" check
     */
    this.meterRefresh = null;

    /**
     * For keeping track of whether user turned off the camera
     */
    this.cameraEnabled = true;

    /**
     * Replacement stream for video track when the camera is turn off
    */
    this.replacementStream = null;

    /**
     * html video element that presents local stream
     */
    this.localVideo = this.localVideoElement || document.getElementById(this.localVideoId);

    //A dummy stream created to replace the tracks when camera is turned off.
    this.dummyCanvas = document.createElement("canvas");

    // It should be compatible with previous version
    if (this.mediaConstraints) {
      if (this.mediaConstraints.video == "camera") {
        this.publishMode = "camera";
      } else if (this.mediaConstraints.video == "screen") {
        this.publishMode = "screen";
      } else if (this.mediaConstraints.video == "screen+camera") {
        this.publishMode = "screen+camera";
      }
    } else {
      //just define default values
      this.mediaConstraints = {
        video: true,
        audio: true
      };
    }

    //Check browser support for screen share function
    this.checkBrowserScreenShareSupported();
  }

  /**
   * Called by the WebRTCAdaptor at the start if it isn't play mode
   */
  initLocalStream() {
    this.checkWebRTCPermissions();
    if (typeof this.mediaConstraints.video != "undefined" && this.mediaConstraints.video != false) {
      return this.openStream(this.mediaConstraints);
    } else if (typeof this.mediaConstraints.audio != "undefined" && this.mediaConstraints.audio != false) {
      // get only audio
      var media_audio_constraint = {
        audio: this.mediaConstraints.audio
      };
      return this.navigatorUserMedia(media_audio_constraint, stream => {
        return this.gotStream(stream);
      }, true);
    } else {
      //neither video nor audio is requested
      //just return null stream
      Logger$3.debug("no media requested, just return an empty stream");
      return Promise.resolve(null);
    }
  }

  /*
  * Called to checks if Websocket and media usage are allowed
  */
  checkWebRTCPermissions() {
    if (!("WebSocket" in window)) {
      Logger$3.debug("WebSocket not supported.");
      this.callbackError("WebSocketNotSupported");
      return;
    }
    if (typeof navigator.mediaDevices == "undefined") {
      Logger$3.debug("Cannot open camera and mic because of unsecure context. Please Install SSL(https)");
      this.callbackError("UnsecureContext");
      return;
    }
    if (typeof navigator.mediaDevices == "undefined" || navigator.mediaDevices == undefined || navigator.mediaDevices == null) {
      this.callbackError("getUserMediaIsNotAllowed");
    }
  }

  /*
   * Called to get the available video and audio devices on the system
   */
  getDevices() {
    return navigator.mediaDevices.enumerateDevices().then(devices => {
      var deviceArray = new Array();
      var checkAudio = false;
      var checkVideo = false;
      devices.forEach(device => {
        if (device.kind == "audioinput" || device.kind == "videoinput") {
          deviceArray.push(device);
          if (device.kind == "audioinput") {
            checkAudio = true;
          }
          if (device.kind == "videoinput") {
            checkVideo = true;
          }
        }
      });
      this.callback("available_devices", deviceArray);

      //TODO: is the following part necessary. why?
      if (checkAudio == false && this.localStream == null) {
        Logger$3.debug("Audio input not found");
        Logger$3.debug("Retrying to get user media without audio");
        if (this.inputDeviceNotFoundLimit < 2) {
          if (checkVideo != false) {
            this.openStream({
              video: true,
              audio: false
            });
            this.inputDeviceNotFoundLimit++;
          } else {
            Logger$3.debug("Video input not found");
            alert("There is no video or audio input");
          }
        } else {
          alert("No input device found, publish is not possible");
        }
      }
      return deviceArray;
    }).catch(err => {
      Logger$3.error("Cannot get devices -> error name: " + err.name + ": " + err.message);
      throw err;
    });
  }

  /*
   * Called to add a device change listener
   */
  trackDeviceChange() {
    navigator.mediaDevices.ondevicechange = () => {
      this.getDevices();
    };
  }

  /**
   * This function create a canvas which combines screen video and camera video as an overlay
   *
   * @param {*} stream : screen share stream
   * @param {*} streamId
   * @param {*} onEndedCallback : callback when called on screen share stop
   */
  setDesktopwithCameraSource(stream, streamId, onEndedCallback) {
    this.desktopStream = stream;
    return this.navigatorUserMedia({
      video: true,
      audio: false
    }, cameraStream => {
      this.smallVideoTrack = cameraStream.getVideoTracks()[0];

      //create a canvas element
      var canvas = document.createElement("canvas");
      var canvasContext = canvas.getContext("2d");

      //create video element for screen
      //var screenVideo = document.getElementById('sourceVideo');
      var screenVideo = document.createElement('video');
      screenVideo.srcObject = stream;
      screenVideo.play();
      //create video element for camera
      var cameraVideo = document.createElement('video');
      cameraVideo.srcObject = cameraStream;
      cameraVideo.play();
      var canvasStream = canvas.captureStream(15);
      if (onEndedCallback != null) {
        stream.getVideoTracks()[0].onended = function (event) {
          onEndedCallback(event);
        };
      }
      var promise;
      if (this.localStream == null) {
        promise = this.gotStream(canvasStream);
      } else {
        promise = this.updateVideoTrack(canvasStream, streamId, onended, null);
      }
      promise.then(() => {
        //update the canvas
        this.desktopCameraCanvasDrawerTimer = setInterval(() => {
          //draw screen to canvas
          canvas.width = screenVideo.videoWidth;
          canvas.height = screenVideo.videoHeight;
          canvasContext.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
          var cameraWidth = screenVideo.videoWidth * (this.camera_percent / 100);
          var cameraHeight = cameraVideo.videoHeight / cameraVideo.videoWidth * cameraWidth;
          var positionX = canvas.width - cameraWidth - this.camera_margin;
          var positionY;
          if (this.camera_location == "top") {
            positionY = this.camera_margin;
          } else {
            //if not top, make it bottom
            //draw camera on right bottom corner
            positionY = canvas.height - cameraHeight - this.camera_margin;
          }
          canvasContext.drawImage(cameraVideo, positionX, positionY, cameraWidth, cameraHeight);
        }, 66);
      });
    }, true);
  }

  /**
   * This function does these:
   *    1. Remove the audio track from the stream provided if it is camera. Other case
   *       is screen video + system audio track. In this case audio is kept in stream.
   *    2. Open audio track again if audio constaint isn't false
   *    3. Make audio track Gain Node to be able to volume adjustable
   *  4. If screen is shared and system audio is available then the system audio and
   *     opened audio track are mixed
   *
   * @param {*} mediaConstraints
   * @param {*} audioConstraint
   * @param {*} stream
   * @param {*} streamId
   */
  prepareStreamTracks(mediaConstraints, audioConstraint, stream, streamId) {
    //this trick, getting audio and video separately, make us add or remove tracks on the fly
    var audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0 && this.publishMode == "camera") {
      audioTracks[0].stop();
      stream.removeTrack(audioTracks[0]);
    }
    //now get only audio to add this stream
    if (audioConstraint != "undefined" && audioConstraint != false) {
      var media_audio_constraint = {
        audio: audioConstraint
      };
      return this.navigatorUserMedia(media_audio_constraint).then(audioStream => {
        //here audioStream has onr audio track only
        audioStream = this.setGainNodeStream(audioStream);
        // now audio stream has two audio strams.
        // 1. Gain Node : this will be added to local stream to publish
        // 2. Original audio track : keep its reference to stop later

        //add callback if desktop is sharing
        var onended = event => {
          this.callback("screen_share_stopped");
          this.setVideoCameraSource(streamId, mediaConstraints, null, true);
        };
        if (this.publishMode == "screen") {
          return this.updateVideoTrack(stream, streamId, onended, true).then(() => {
            if (audioTracks.length > 0) {
              //system audio share case, then mix it with device audio
              audioStream = this.mixAudioStreams(stream, audioStream);
            }
            return this.updateAudioTrack(audioStream, streamId, null);
          });
        } else if (this.publishMode == "screen+camera") {
          if (audioTracks.length > 0) {
            //system audio share case, then mix it with device audio
            audioStream = this.mixAudioStreams(stream, audioStream);
          }
          return this.updateAudioTrack(audioStream, streamId, null).then(() => {
            return this.setDesktopwithCameraSource(stream, streamId, onended);
          });
        } else {
          if (audioConstraint != false && audioConstraint != undefined) {
            stream.addTrack(audioStream.getAudioTracks()[0]);
          }
          if (stream.getVideoTracks().length > 0) {
            return this.updateVideoTrack(stream, streamId, null, null).then(() => {
              return this.updateAudioTrack(stream, streamId, null).then(() => {
                return this.gotStream(stream);
              });
            });
          } else if (stream.getAudioTracks().length > 0) {
            return this.updateAudioTrack(stream, streamId, null).then(() => {
              return this.gotStream(stream);
            });
          } else {
            return this.gotStream(stream);
          }
        }
      }).catch(error => {
        if (error.name == "NotFoundError") {
          this.getDevices();
        } else {
          this.callbackError(error.name, error.message);
        }
        //throw error for promise
        throw error;
      });
    } else {
      return this.gotStream(stream);
    }
  }

  /**
   * Called to get user media (camera and/or mic)
   *
   * @param {*} mediaConstraints : media constaint
   * @param {*} func : callback on success. The stream which is got, is passed as parameter to this function
   * @param {*} catch_error : error is checked if catch_error is true
   */
  navigatorUserMedia(mediaConstraints, func, catch_error) {
    if (mediaConstraints.video == "dummy" || mediaConstraints.audio == "dummy") {
      var stream = new MediaStream();
      if (mediaConstraints.audio == "dummy") {
        stream.addTrack(this.getSilentAudioTrack());
      }
      if (mediaConstraints.video == "dummy") {
        stream.addTrack(this.getBlackVideoTrack());
      }
      return new Promise((resolve, reject) => {
        resolve(stream);
      });
    } else {
      return navigator.mediaDevices.getUserMedia(mediaConstraints).then(stream => {
        if (typeof func != "undefined" || func != null) {
          func(stream);
        }
        return stream;
      }).catch(error => {
        if (catch_error == true) {
          if (error.name == "NotFoundError") {
            this.getDevices();
          } else {
            this.callbackError(error.name, error.message);
          }
        } else {
          Logger$3.warn(error);
        }
        //throw error if there is a promise
        throw error;
      });
    }
  }

  /**
   * Called to get display media (screen share)
   *
   * @param {*} mediaConstraints : media constaint
   * @param {*} func : callback on success. The stream which is got, is passed as parameter to this function
   */
  navigatorDisplayMedia(mediaConstraints, func) {
    return navigator.mediaDevices.getDisplayMedia(mediaConstraints).then(stream => {
      if (typeof func != "undefined") {
        func(stream);
      }
      return stream;
    }).catch(error => {
      if (error.name === "NotAllowedError") {
        Logger$3.debug("Permission denied error");
        this.callbackError("ScreenSharePermissionDenied");

        // If error catched then redirect Default Stream Camera
        if (this.localStream == null) {
          var mediaConstraints = {
            video: true,
            audio: true
          };
          this.openStream(mediaConstraints);
        } else {
          this.switchVideoCameraCapture(streamId);
        }
      }
    });
  }

  /**
   * Called to get the media (User Media or Display Media)
   * @param {*} mediaConstraints, media constraints
   * @param {*} streamId, streamId to be used to replace track if there is an active peer connection
   */
  getMedia(mediaConstraints, streamId) {
    var audioConstraint = false;
    if (typeof mediaConstraints.audio != "undefined" && mediaConstraints.audio != false) {
      audioConstraint = mediaConstraints.audio;
    }
    if (this.desktopCameraCanvasDrawerTimer != null) {
      clearInterval(this.desktopCameraCanvasDrawerTimer);
      this.desktopCameraCanvasDrawerTimer = null;
    }

    // Check Media Constraint video value screen or screen + camera
    if (this.publishMode == "screen+camera" || this.publishMode == "screen") {
      return this.navigatorDisplayMedia(mediaConstraints).then(stream => {
        if (this.smallVideoTrack) this.smallVideoTrack.stop();
        return this.prepareStreamTracks(mediaConstraints, audioConstraint, stream, streamId);
      });
    } else {
      return this.navigatorUserMedia(mediaConstraints).then(stream => {
        if (this.smallVideoTrack) this.smallVideoTrack.stop();
        return this.prepareStreamTracks(mediaConstraints, audioConstraint, stream, streamId);
      }).catch(error => {
        if (error.name == "NotFoundError") {
          this.getDevices();
        } else {
          this.callbackError(error.name, error.message);
        }
      });
    }
  }

  /**
   * Open media stream, it may be screen, camera or audio
   */
  openStream(mediaConstraints, streamId) {
    this.mediaConstraints = mediaConstraints;
    return this.getMedia(mediaConstraints, streamId).then(() => {
      if (this.mediaConstraints.video != "dummy" && this.mediaConstraints.video != undefined) {
        this.stopBlackVideoTrack();
        this.clearBlackVideoTrackTimer();
      }
      if (this.mediaConstraints.audio != "dummy" && this.mediaConstraints.audio != undefined) {
        this.stopSilentAudioTrack();
      }
    });
  }

  /**
   * Closes stream, if you want to stop peer connection, call stop(streamId)
   */
  closeStream() {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(function (track) {
        track.onended = null;
        track.stop();
      });
      this.localStream.getAudioTracks().forEach(function (track) {
        track.onended = null;
        track.stop();
      });
    }
    if (this.videoTrack) {
      this.videoTrack.stop();
    }
    if (this.audioTrack) {
      this.audioTrack.stop();
    }
    if (this.smallVideoTrack) {
      this.smallVideoTrack.stop();
    }
    if (this.previousAudioTrack) {
      this.previousAudioTrack.stop();
    }
  }

  /**
   * Checks browser supports screen share feature
   * if exist it calls callback with "browser_screen_share_supported"
   */
  checkBrowserScreenShareSupported() {
    if (typeof navigator.mediaDevices != "undefined" && navigator.mediaDevices.getDisplayMedia || navigator.getDisplayMedia) {
      this.callback("browser_screen_share_supported");
    }
  }
  /**
   * Changes the secondary stream gain in mixed audio mode
   *
   * @param {*} enable
   */
  enableSecondStreamInMixedAudio(enable) {
    if (this.secondaryAudioTrackGainNode != null) {
      if (enable) {
        this.secondaryAudioTrackGainNode.gain.value = 1;
      } else {
        this.secondaryAudioTrackGainNode.gain.value = 0;
      }
    }
  }

  /**
   * Changes local stream when new stream is prepared
   *
   * @param {*} stream
   */
  gotStream(stream) {
    this.localStream = stream;
    if (this.localVideo) {
      this.localVideo.srcObject = stream;
    }
    this.getDevices();
    this.trackDeviceChange();
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  /**
   * Changes local video and sets localStream as source
   *
   * @param {*} videoEl
   */
  changeLocalVideo(videoEl) {
    this.localVideo = videoEl;
    if (this.localStream) {
      this.localVideo.srcObject = this.localStream;
    }
  }

  /**
   * These methods are initialized when the user is muted himself in a publish scenario
   * It will keep track if the user is trying to speak without sending any data to server
   * Please don't forget to disable this function with disableAudioLevelWhenMuted if you use it.
   */
  enableAudioLevelWhenMuted() {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      }).then(stream => {
        this.mutedAudioStream = stream;
        this.mutedSoundMeter = new SoundMeter(this.audioContext, this.volumeMeterUrl);
        this.mutedSoundMeter.connectToSource(this.mutedAudioStream, value => {
          if (value > 0.1) {
            this.callback("speaking_but_muted");
          }
        }, e => {
          if (e) {
            reject(e);
          }
          this.meterRefresh = setInterval(() => {
            if (this.mutedSoundMeter.instant.toFixed(2) > 0.1) {
              this.callback("speaking_but_muted");
            }
          }, 200);
          resolve(null);
        });
      }).catch(function (err) {
        Logger$3.debug("Can't get the soundlevel on mute");
        reject(err);
      });
    });
  }
  disableAudioLevelWhenMuted() {
    if (this.meterRefresh != null) {
      clearInterval(this.meterRefresh);
      this.meterRefresh = null;
    }
    if (this.mutedSoundMeter != null) {
      this.mutedSoundMeter.stop();
      this.mutedSoundMeter = null;
    }
    if (this.mutedAudioStream != null) {
      this.mutedAudioStream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
  }

  /**
  * @Deprecated. It's not the job of SDK to make these things. It increases the complexity of the code.
   * We provide samples for having these function
   *
   * This method mixed the first stream audio to the second stream audio and
   * @param {*} stream  : Primary stream that contain video and audio (system audio)
   * @param {*} secondStream :stream has device audio
   * @returns mixed stream.
   */
  mixAudioStreams(stream, secondStream) {
    //Logger.debug("audio stream track count: " + audioStream.getAudioTracks().length);
    var composedStream = new MediaStream();
    //added the video stream from the screen
    stream.getVideoTracks().forEach(function (videoTrack) {
      composedStream.addTrack(videoTrack);
    });
    var audioDestionation = this.audioContext.createMediaStreamDestination();
    if (stream.getAudioTracks().length > 0) {
      this.primaryAudioTrackGainNode = this.audioContext.createGain();

      //Adjust the gain for screen sound
      this.primaryAudioTrackGainNode.gain.value = 1;
      var audioSource = this.audioContext.createMediaStreamSource(stream);
      audioSource.connect(this.primaryAudioTrackGainNode).connect(audioDestionation);
    } else {
      Logger$3.debug("Origin stream does not have audio track");
    }
    if (secondStream.getAudioTracks().length > 0) {
      this.secondaryAudioTrackGainNode = this.audioContext.createGain();

      //Adjust the gain for second sound
      this.secondaryAudioTrackGainNode.gain.value = 1;
      var audioSource2 = this.audioContext.createMediaStreamSource(secondStream);
      audioSource2.connect(this.secondaryAudioTrackGainNode).connect(audioDestionation);
    } else {
      Logger$3.debug("Second stream does not have audio track");
    }
    audioDestionation.stream.getAudioTracks().forEach(function (track) {
      composedStream.addTrack(track);
      Logger$3.debug("audio destination add track");
    });
    return composedStream;
  }

  /**
   * This method creates a Gain Node stream to make the audio track adjustable
   *
   * @param {*} stream
   * @returns
   */
  setGainNodeStream(stream) {
    if (this.mediaConstraints.audio != false && typeof this.mediaConstraints.audio != "undefined") {
      // Get the videoTracks from the stream.
      var videoTracks = stream.getVideoTracks();

      // Get the audioTracks from the stream.
      var audioTracks = stream.getAudioTracks();

      /**
       * Create a new audio context and build a stream source,
       * stream destination and a gain node. Pass the stream into
       * the mediaStreamSource so we can use it in the Web Audio API.
       */
      this.audioContext = new AudioContext();
      var mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
      var mediaStreamDestination = this.audioContext.createMediaStreamDestination();
      this.primaryAudioTrackGainNode = this.audioContext.createGain();

      /**
       * Connect the stream to the gainNode so that all audio
       * passes through the gain and can be controlled by it.
       * Then pass the stream from the gain to the mediaStreamDestination
       * which can pass it back to the RTC client.
       */
      mediaStreamSource.connect(this.primaryAudioTrackGainNode);
      this.primaryAudioTrackGainNode.connect(mediaStreamDestination);
      if (this.currentVolume == null) {
        this.primaryAudioTrackGainNode.gain.value = 1;
      } else {
        this.primaryAudioTrackGainNode.gain.value = this.currentVolume;
      }

      /**
       * The mediaStreamDestination.stream outputs a MediaStream object
       * containing a single AudioMediaStreamTrack. Add the video track
       * to the new stream to rejoin the video with the controlled audio.
       */
      var controlledStream = mediaStreamDestination.stream;
      for (var videoTrack of videoTracks) {
        controlledStream.addTrack(videoTrack);
      }
      for (var audioTrack of audioTracks) {
        controlledStream.addTrack(audioTrack);
      }
      if (this.previousAudioTrack !== null) {
        this.previousAudioTrack.stop();
      }
      this.previousAudioTrack = controlledStream.getAudioTracks()[1];

      /**
       * Use the stream that went through the gainNode. This
       * is the same stream but with altered input volume levels.
       */
      return controlledStream;
    }
    return stream;
  }

  /**
   * Called by User
   * to switch the Screen Share mode
   *
   * @param {*} streamId
   */
  switchDesktopCapture(streamId) {
    this.publishMode = "screen";
    if (typeof this.mediaConstraints.video != "undefined" && this.mediaConstraints.video != false) {
      this.mediaConstraints.video = true;
    }
    //TODO: I don't think we need to get audio again. We just need to switch the video stream
    return this.getMedia(this.mediaConstraints, streamId);
  }

  /**
   * Called by User
   * to switch the Screen Share with Camera mode
   *
   * @param {*} streamId
   */
  switchDesktopCaptureWithCamera(streamId) {
    if (typeof this.mediaConstraints.video != "undefined" && this.mediaConstraints.video != false) {
      this.mediaConstraints.video = true;
    }
    this.publishMode = "screen+camera";

    //TODO: I don't think we need to get audio again. We just need to switch the video stream
    return this.getMedia(this.mediaConstraints, streamId);
  }

  /**
   * This method updates the local stream. It removes existant audio track from the local stream
   * and add the audio track in `stream` parameter to the local stream
   */
  updateLocalAudioStream(stream, onEndedCallback) {
    var newAudioTrack = stream.getAudioTracks()[0];
    if (this.localStream != null && this.localStream.getAudioTracks()[0] != null) {
      var audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack != newAudioTrack) {
        this.localStream.removeTrack(audioTrack);
        audioTrack.stop();
        this.localStream.addTrack(newAudioTrack);
      }
    } else if (this.localStream != null) {
      this.localStream.addTrack(newAudioTrack);
    } else {
      this.localStream = stream;
    }
    if (this.localVideo != null) {
      //it can be null
      this.localVideo.srcObject = this.localStream;
    }
    if (onEndedCallback != null) {
      stream.getAudioTracks()[0].onended = function (event) {
        onEndedCallback(event);
      };
    }
    if (this.isMuted) {
      this.muteLocalMic();
    } else {
      this.unmuteLocalMic();
    }
    if (this.localStreamSoundMeter != null) {
      this.enableAudioLevelForLocalStream(this.levelCallback);
    }
  }

  /**
   * This method updates the local stream. It removes existant video track from the local stream
   * and add the video track in `stream` parameter to the local stream
   */
  updateLocalVideoStream(stream, onEndedCallback, stopDesktop) {
    if (stopDesktop && this.desktopStream != null) {
      this.desktopStream.getVideoTracks()[0].stop();
    }
    var newVideoTrack = stream.getVideoTracks()[0];
    if (this.localStream != null && this.localStream.getVideoTracks()[0] != null) {
      var videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack != newVideoTrack) {
        this.localStream.removeTrack(videoTrack);
        videoTrack.stop();
        this.localStream.addTrack(newVideoTrack);
      }
    } else if (this.localStream != null) {
      this.localStream.addTrack(newVideoTrack);
    } else {
      this.localStream = stream;
    }
    if (this.localVideo) {
      this.localVideo.srcObject = this.localStream;
    }
    if (onEndedCallback != null) {
      stream.getVideoTracks()[0].onended = function (event) {
        onEndedCallback(event);
      };
    }
  }

  /**
   * Called by User
   * to change video source
   *
   * @param {*} streamId
   * @param {*} deviceId
   */
  switchAudioInputSource(streamId, deviceId) {
    //stop the track because in some android devices need to close the current camera stream
    var audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack && isAndroid()) {
      audioTrack.stop();
    }
    if (typeof audioTrack == "undefined") {
      Logger$3.warn("There is no audio track in local stream");
    }
    if (typeof deviceId != "undefined") {
      //Update the media constraints
      if (this.mediaConstraints.audio !== true) this.mediaConstraints.audio.deviceId = deviceId;else this.mediaConstraints.audio = {
        "deviceId": deviceId
      };

      //to change only audio track set video false otherwise issue #3826 occurs on Android
      var tempMediaConstraints = {
        "video": false,
        "audio": {
          "deviceId": deviceId
        }
      };
      return this.setAudioInputSource(streamId, tempMediaConstraints, null, deviceId);
    } else {
      return new Promise((resolve, reject) => {
        reject("There is no device id for audio input source");
      });
    }
  }

  /**
   * This method sets Audio Input Source and called when you change audio device
   * It calls updateAudioTrack function to update local audio stream.
   */
  setAudioInputSource(streamId, mediaConstraints, onEndedCallback) {
    return this.navigatorUserMedia(mediaConstraints, stream => {
      stream = this.setGainNodeStream(stream);
      return this.updateAudioTrack(stream, streamId, mediaConstraints, onEndedCallback);
    }, true);
  }
  checkAndStopLocalVideoTrackOnAndroid() {
    //stop the track because in some android devices need to close the current camera stream
    if (this.localStream && this.localStream.getVideoTracks().length > 0 && isAndroid()) {
      var videoTrack = this.localStream.getVideoTracks()[0];
      videoTrack.stop();
    }
    if (this.localStream === null || this.localStream.getVideoTracks().length === 0) {
      Logger$3.warn("There is no video track in local stream");
    }
  }

  /**
   * Called by User
   * to change video camera capture
   *
   * @param {*} streamId Id of the stream to be changed.
   * @param {*} deviceId Id of the device which will use as a media device
   * @param {*} onEndedCallback callback for when the switching video state is completed, can be used to understand if it is loading or not
   *
   * This method is used to switch to video capture.
   */
  switchVideoCameraCapture(streamId, deviceId, onEndedCallback) {
    this.checkAndStopLocalVideoTrackOnAndroid();
    this.publishMode = "camera";
    return navigator.mediaDevices.enumerateDevices().then(devices => {
      for (var i = 0; i < devices.length; i++) {
        if (devices[i].kind == "videoinput") {
          //Adjust video source only if there is a matching device id with the given one.
          //It creates problems if we don't check that since video can be just true to select default cam and it is like that in many cases.
          if (devices[i].deviceId == deviceId) {
            if (this.mediaConstraints.video !== true) this.mediaConstraints.video.deviceId = {
              exact: deviceId
            };else this.mediaConstraints.video = {
              deviceId: {
                exact: deviceId
              }
            };
            break;
          }
        }
      }
      //If no matching device found don't adjust the media constraints let it be true instead of a device ID
      Logger$3.debug("Given deviceId = " + deviceId + " - Media constraints video property = " + this.mediaConstraints.video);
      return this.setVideoCameraSource(streamId, this.mediaConstraints, onEndedCallback, true, deviceId);
    });
  }

  /**
   * This method sets Video Input Source and called when you change video device
   * It calls updateVideoTrack function to update local video stream.
   */
  setVideoCameraSource(streamId, mediaConstraints, onEndedCallback, stopDesktop) {
    return this.navigatorUserMedia(mediaConstraints, stream => {
      if (stopDesktop && this.secondaryAudioTrackGainNode && stream.getAudioTracks().length > 0) {
        //This audio track update is necessary for such a case:
        //If you enable screen share with browser audio and then
        //return back to the camera, the audio should be only from mic.
        //If, we don't update audio with the following lines,
        //the mixed (mic+browser) audio would be streamed in the camera mode.
        this.secondaryAudioTrackGainNode = null;
        stream = this.setGainNodeStream(stream);
        this.updateAudioTrack(stream, streamId, mediaConstraints, onEndedCallback);
      }
      if (this.cameraEnabled) {
        return this.updateVideoTrack(stream, streamId, onEndedCallback, stopDesktop);
      } else {
        return this.turnOffLocalCamera();
      }
    }, true);
  }

  /**
   * Called by User
   * to switch between front and back camera on mobile devices
   *
   * @param {*} streamId Id of the stream to be changed.
   * @param {*} facingMode it can be "user" or "environment"
   *
   * This method is used to switch front and back camera.
   */
  switchVideoCameraFacingMode(streamId, facingMode) {
    this.checkAndStopLocalVideoTrackOnAndroid();

    // When device id set, facing mode is not working
    // so, remove device id
    if (this.mediaConstraints.video !== undefined && this.mediaConstraints.video.deviceId !== undefined) {
      delete this.mediaConstraints.video.deviceId;
    }
    var videoConstraint = {
      'facingMode': facingMode
    };
    this.mediaConstraints.video = _extends$3({}, this.mediaConstraints.video, videoConstraint);
    this.publishMode = "camera";
    Logger$3.debug("Media constraints video property = " + this.mediaConstraints.video);
    return this.setVideoCameraSource(streamId, {
      video: this.mediaConstraints.video
    }, null, true);
  }

  /**
   * Updates the audio track in the audio sender
   * getSender method is set on MediaManagercreation by WebRTCAdaptor
   *
   * @param {*} stream
   * @param {*} streamId
   * @param {*} onEndedCallback
   */
  updateAudioTrack(stream, streamId, onEndedCallback) {
    var audioTrackSender = this.getSender(streamId, "audio");
    if (audioTrackSender) {
      return audioTrackSender.replaceTrack(stream.getAudioTracks()[0]).then(result => {
        this.updateLocalAudioStream(stream, onEndedCallback);
      }).catch(function (error) {
        Logger$3.debug(error.name);
        throw error;
      });
    } else {
      this.updateLocalAudioStream(stream, onEndedCallback);
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
  }

  /**
   * Updates the video track in the video sender
   * getSender method is set on MediaManagercreation by WebRTCAdaptor
   *
   * @param {*} stream
   * @param {*} streamId
   * @param {*} onEndedCallback
   */
  updateVideoTrack(stream, streamId, onEndedCallback, stopDesktop) {
    var videoTrackSender = this.getSender(streamId, "video");
    if (videoTrackSender) {
      return videoTrackSender.replaceTrack(stream.getVideoTracks()[0]).then(result => {
        this.updateLocalVideoStream(stream, onEndedCallback, stopDesktop);
      }).catch(error => {
        Logger$3.debug(error.name);
      });
    } else {
      this.updateLocalVideoStream(stream, onEndedCallback, stopDesktop);
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
  }

  /**
   * If you mute turn off the camera still some data should be sent
   * Tihs method create a black frame to reduce data transfer
   */
  getBlackVideoTrack() {
    this.dummyCanvas.getContext('2d').fillRect(0, 0, 320, 240);

    //REFACTOR: it's not good to set to a replacement stream
    this.replacementStream = this.dummyCanvas.captureStream();
    //We need to send black frames within a time interval, because when the user turn off the camera,
    //player can't connect to the sender since there is no data flowing. Sending a black frame in each 3 seconds resolves it.
    if (this.blackFrameTimer == null) {
      this.blackFrameTimer = setInterval(() => {
        this.getBlackVideoTrack();
      }, 3000);
    }
    this.blackVideoTrack = this.replacementStream.getVideoTracks()[0];
    return this.blackVideoTrack;
  }

  /**
   * Silent audio track
  */
  getSilentAudioTrack() {
    this.stopSilentAudioTrack();
    this.oscillator = this.audioContext.createOscillator();
    var dst = this.oscillator.connect(this.audioContext.createMediaStreamDestination());
    this.oscillator.start();
    this.silentAudioTrack = dst.stream.getAudioTracks()[0];
    return this.silentAudioTrack;
  }
  stopSilentAudioTrack() {
    if (this.oscillator != null) {
      this.oscillator.stop();
      this.oscillator.disconnect();
      this.oscillator = null;
    }
    if (this.silentAudioTrack != null) {
      this.silentAudioTrack.stop();
      this.silentAudioTrack = null;
    }
  }

  /**
   * Called by User
   * turns of the camera stream and starts streaming black dummy frame
   */
  turnOffLocalCamera(streamId) {
    //Initialize the first dummy frame for switching.
    this.getBlackVideoTrack();
    if (this.localStream != null) {
      var choosenId;
      if (streamId != null || typeof streamId != "undefined") {
        choosenId = streamId;
      } else {
        choosenId = this.publishStreamId;
      }
      this.cameraEnabled = false;
      return this.updateVideoTrack(this.replacementStream, choosenId, null, true);
    } else {
      return new Promise((resolve, reject) => {
        this.callbackError("NoActiveConnection");
        reject("NoActiveStream");
      });
    }
  }
  clearBlackVideoTrackTimer() {
    if (this.blackFrameTimer != null) {
      clearInterval(this.blackFrameTimer);
      this.blackFrameTimer = null;
    }
  }
  stopBlackVideoTrack() {
    if (this.blackVideoTrack != null) {
      this.blackVideoTrack.stop();
      this.blackVideoTrack = null;
    }
  }

  /**
   * Called by User
   * turns of the camera stream and starts streaming camera again instead of black dummy frame
   */
  turnOnLocalCamera(streamId) {
    this.clearBlackVideoTrackTimer();
    this.stopBlackVideoTrack();
    if (this.localStream == null) {
      return this.navigatorUserMedia(this.mediaConstraints, stream => {
        this.gotStream(stream);
      }, false);
    }
    //This method will get the camera track and replace it with dummy track
    else {
      return this.navigatorUserMedia(this.mediaConstraints, stream => {
        var choosenId;
        if (streamId != null || typeof streamId != "undefined") {
          choosenId = streamId;
        } else {
          choosenId = this.publishStreamId;
        }
        this.cameraEnabled = true;
        this.updateVideoTrack(stream, choosenId, null, true);
      }, false);
    }
  }

  /**
   * Called by User
   * to mute local audio streaming
   */
  muteLocalMic() {
    this.isMuted = true;
    if (this.localStream != null) {
      this.localStream.getAudioTracks().forEach(track => track.enabled = false);
    } else {
      this.callbackError("NoActiveConnection");
    }
  }

  /**
   * Called by User
   * to unmute local audio streaming
   *
   * if there is audio it calls callbackError with "AudioAlreadyActive" parameter
   */
  unmuteLocalMic() {
    this.isMuted = false;
    if (this.localStream != null) {
      this.localStream.getAudioTracks().forEach(track => track.enabled = true);
    } else {
      this.callbackError("NoActiveConnection");
    }
  }

  /**
   * If we have multiple video tracks in coming versions, this method may cause some issues
   */
  getVideoSender(streamId) {
    var videoSender = null;
    if (typeof adapter !== "undefined" && adapter !== null && (adapter.browserDetails.browser === 'chrome' || adapter.browserDetails.browser === 'firefox' || adapter.browserDetails.browser === 'safari' && adapter.browserDetails.version >= 64) && 'RTCRtpSender' in window && 'setParameters' in window.RTCRtpSender.prototype) {
      videoSender = this.getSender(streamId, "video");
    }
    return videoSender;
  }

  /**
   * Called by User
   * to set maximum video bandwidth is in kbps
   */
  changeBandwidth(bandwidth, streamId) {
    var errorDefinition = "";
    var videoSender = this.getVideoSender(streamId);
    if (videoSender != null) {
      var parameters = videoSender.getParameters();
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      if (bandwidth === 'unlimited') {
        delete parameters.encodings[0].maxBitrate;
      } else {
        parameters.encodings[0].maxBitrate = bandwidth * 1000;
      }
      return videoSender.setParameters(parameters);
    } else {
      errorDefinition = "Video sender not found to change bandwidth. Streaming may not be active";
    }
    return Promise.reject(errorDefinition);
  }
  /**
   * Called by user
   * sets the volume level
   *
   * @param {*} volumeLevel : Any number between 0 and 1.
   */
  setVolumeLevel(volumeLevel) {
    this.currentVolume = volumeLevel;
    if (this.primaryAudioTrackGainNode != null) {
      this.primaryAudioTrackGainNode.gain.value = volumeLevel;
    }
    if (this.secondaryAudioTrackGainNode != null) {
      this.secondaryAudioTrackGainNode.gain.value = volumeLevel;
    }
  }

  /**
   * Called by user
   * To create a sound meter for the local stream
   *
   * @param {Function} levelCallback : callback to provide the audio level to user
   * @param {*} period : measurement period
   */
  enableAudioLevelForLocalStream(levelCallback) {
    this.levelCallback = levelCallback;
    this.disableAudioLevelForLocalStream();
    this.localStreamSoundMeter = new SoundMeter(this.audioContext, this.volumeMeterUrl);
    if (this.audioContext.state !== 'running') {
      return this.audioContext.resume().then(() => {
        return this.localStreamSoundMeter.connectToSource(this.localStream, levelCallback);
      });
    } else {
      return this.localStreamSoundMeter.connectToSource(this.localStream, levelCallback);
    }
  }
  disableAudioLevelForLocalStream() {
    if (this.localStreamSoundMeter != null) {
      this.localStreamSoundMeter.stop();
      this.localStreamSoundMeter = null;
    }
  }

  /**
   * Called by user
   * To change audio/video constraints on the fly
   *
   */
  applyConstraints(newConstraints) {
    var constraints = {};
    if (newConstraints.audio === undefined && newConstraints.video === undefined) {
      //if audio or video field is not defined, assume that it's a video constraint
      constraints.video = newConstraints;
      this.mediaConstraints.video = _extends$3({}, this.mediaConstraints.video, constraints.video);
    } else if (newConstraints.video !== undefined) {
      constraints.video = newConstraints.video;
      this.mediaConstraints.video = _extends$3({}, this.mediaConstraints.video, constraints.video);
    }
    if (newConstraints.audio !== undefined) {
      constraints.audio = newConstraints.audio;
      this.mediaConstraints.audio = _extends$3({}, this.mediaConstraints.audio, constraints.audio);
    }
    var promise = null;
    if (constraints.video !== undefined) {
      if (this.localStream && this.localStream.getVideoTracks().length > 0) {
        var videoTrack = this.localStream.getVideoTracks()[0];
        promise = videoTrack.applyConstraints(this.mediaConstraints.video);
      } else {
        promise = new Promise((resolve, reject) => {
          reject("There is no video track to apply constraints");
        });
      }
    }
    if (constraints.audio !== undefined) {
      //just give the audio constraints not to get video stream
      //we dont call applyContrains for audio because it does not work. I think this is due to gainStream things. This is why we call getUserMedia again

      //use the publishStreamId because we don't have streamId in the parameter anymore
      promise = this.setAudioInputSource(this.publishStreamId, {
        audio: this.mediaConstraints.audio
      }, null);
    }
    if (this.localStreamSoundMeter != null) {
      this.enableAudioLevelForLocalStream(this.levelCallback);
    }
    return promise;
  }
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
function _toPrimitive(input, hint) {
  if (typeof input !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (typeof res !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return typeof key === "symbol" ? key : String(key);
}
function _classPrivateFieldGet(receiver, privateMap) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get");
  return _classApplyDescriptorGet(receiver, descriptor);
}
function _classPrivateFieldSet(receiver, privateMap, value) {
  var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");
  _classApplyDescriptorSet(receiver, descriptor, value);
  return value;
}
function _classExtractFieldDescriptor(receiver, privateMap, action) {
  if (!privateMap.has(receiver)) {
    throw new TypeError("attempted to " + action + " private field on non-instance");
  }
  return privateMap.get(receiver);
}
function _classApplyDescriptorGet(receiver, descriptor) {
  if (descriptor.get) {
    return descriptor.get.call(receiver);
  }
  return descriptor.value;
}
function _classApplyDescriptorSet(receiver, descriptor, value) {
  if (descriptor.set) {
    descriptor.set.call(receiver, value);
  } else {
    if (!descriptor.writable) {
      throw new TypeError("attempted to set read only private field");
    }
    descriptor.value = value;
  }
}
function _classPrivateMethodGet(receiver, privateSet, fn) {
  if (!privateSet.has(receiver)) {
    throw new TypeError("attempted to get private field on non-instance");
  }
  return fn;
}
function _checkPrivateRedeclaration(obj, privateCollection) {
  if (privateCollection.has(obj)) {
    throw new TypeError("Cannot initialize the same private elements twice on an object");
  }
}
function _classPrivateFieldInitSpec(obj, privateMap, value) {
  _checkPrivateRedeclaration(obj, privateMap);
  privateMap.set(obj, value);
}
function _classPrivateMethodInitSpec(obj, privateSet) {
  _checkPrivateRedeclaration(obj, privateSet);
  privateSet.add(obj);
}
class PeerStats {
  /**
   * Creates an instance of the class.
   * @param {string} streamId - The stream ID.
   * @constructor
   */
  constructor(streamId) {
    /**
     * The stream ID.
     * @type {string}
     */
    this.streamId = streamId;

    /**
     * The total number of bytes received.
     * @type {number}
     */
    this.totalBytesReceivedCount = 0;

    /**
     * The total number of bytes sent.
     * @type {number}
     */
    this.totalBytesSent = 0;

    /**
     * The number of video packets lost.
     * @type {number}
     */
    this.videoPacketsLost = 0;

    /**
     * The fraction of lost video packets.
     * @type {number}
     */
    this.fractionLost = 0;

    /**
     * The start time.
     * @type {number}
     */
    this.startTime = 0;

    /**
     * The last number of frames encoded.
     * @type {number}
     */
    this.lastFramesEncoded = 0;

    /**
     * The total number of frames encoded.
     * @type {number}
     */
    this.totalFramesEncodedCount = 0;

    /**
     * The last number of bytes received.
     * @type {number}
     */
    this.lastBytesReceived = 0;

    /**
     * The last number of bytes sent.
     * @type {number}
     */
    this.lastBytesSent = 0;

    /**
     * The total number of video packets sent.
     * @type {number}
     */
    this.totalVideoPacketsSent = 0;

    /**
     * The total number of audio packets sent.
     * @type {number}
     */
    this.totalAudioPacketsSent = 0;

    /**
     * The current timestamp.
     * @type {number}
     */
    this.currentTimestamp = 0;

    /**
     * The last recorded timestamp.
     * @type {number}
     */
    this.lastTime = 0;

    /**
     * The timer ID.
     * @type {number}
     */
    this.timerId = 0;

    /**
     * The first byte sent count.
     * @type {number}
     */
    this.firstByteSentCount = 0;

    /**
     * The first bytes received count.
     * @type {number}
     */
    this.firstBytesReceivedCount = 0;

    /**
     * The audio level.
     * @type {number}
     */
    this.audioLevel = -1;

    /**
     * The quality limitation reason.
     * @type {string}
     */
    this.qualityLimitationReason = "";

    /**
     * The source resolution width.
     * @type {number}
     */
    this.resWidth = 0;

    /**
     * The source resolution height.
     * @type {number}
     */
    this.resHeight = 0;

    /**
     * The source frames per second.
     * @type {number}
     */
    this.srcFps = 0;

    /**
     * The frame width of the sent video.
     * @type {number}
     */
    this.frameWidth = 0;

    /**
     * The frame height of the sent video.
     * @type {number}
     */
    this.frameHeight = 0;

    /**
     * The video round-trip time.
     * @type {number}
     */
    this.videoRoundTripTime = 0;

    /**
     * The video jitter.
     * @type {number}
     */
    this.videoJitter = 0;

    /**
     * The audio round-trip time.
     * @type {number}
     */
    this.audioRoundTripTime = 0;

    /**
     * The audio jitter.
     * @type {number}
     */
    this.audioJitter = 0;

    /**
     * The number of audio packets lost.
     * @type {number}
     */
    this.audioPacketsLost = 0;

    /**
     * The number of frames received.
     * @type {number}
     */
    this.framesReceived = 0;

    /**
     * The number of frames dropped.
     * @type {number}
     */
    this.framesDropped = 0;

    /**
     * The number of frames decoded.
     * @type {number}
     */
    this.framesDecoded = 0;

    /**
     * The average audio jitter delay.
     * @type {number}
     */
    this.audioJitterAverageDelay = 0;

    /**
     * The average video jitter delay.
     * @type {number}
     */
    this.videoJitterAverageDelay = 0;
    this.availableOutgoingBitrate = Infinity;

    /**
     * The list of inbound RTP list.
     * It can be used to view the inbound RTP statistics per track in the multi-track conference or the multi-track playback scenarios.
     * @type {*[]}
     */
    this.inboundRtpList = [];
  }
  //kbits/sec
  get averageOutgoingBitrate() {
    return Math.floor(8 * (this.totalBytesSentCount - this.firstByteSentCount) / (this.currentTimestamp - this.startTime));
  }

  //frames per second
  get currentFPS() {
    return ((this.totalFramesEncodedCount - this.lastFramesEncoded) / (this.currentTimestamp - this.lastTime) * 1000).toFixed(1);
  }

  //kbits/sec
  get averageIncomingBitrate() {
    return Math.floor(8 * (this.totalBytesReceivedCount - this.firstBytesReceivedCount) / (this.currentTimestamp - this.startTime));
  }

  //kbits/sec
  get currentOutgoingBitrate() {
    return Math.floor(8 * (this.totalBytesSentCount - this.lastBytesSent) / (this.currentTimestamp - this.lastTime));
  }

  //kbits/sec
  get currentIncomingBitrate() {
    return Math.floor(8 * (this.totalBytesReceivedCount - this.lastBytesReceived) / (this.currentTimestamp - this.lastTime));
  }
  /**
   * @param {number} timestamp
   * @returns {void}
   */
  set currentTime(timestamp) {
    this.lastTime = this.currentTimestamp;
    this.currentTimestamp = timestamp;
    if (this.startTime == 0) {
      this.startTime = timestamp - 1; // do not have zero division error
    }
  }
  /**
   * @param {number} bytesReceived
   * @returns {void}
   */
  set totalBytesReceived(bytesReceived) {
    this.lastBytesReceived = this.totalBytesReceivedCount;
    this.totalBytesReceivedCount = bytesReceived;
    if (this.firstBytesReceivedCount == 0) {
      this.firstBytesReceivedCount = bytesReceived;
    }
  }
  /**
   * @param {number} bytesSent
   * @returns {void}
   */
  set totalBytesSent(bytesSent) {
    this.lastBytesSent = this.totalBytesSentCount;
    this.totalBytesSentCount = bytesSent;
    if (this.firstByteSentCount == 0) {
      this.firstByteSentCount = bytesSent;
    }
  }
  /**
   * @param {number} framesEncoded
   * @returns {void}
   */
  set totalFramesEncoded(framesEncoded) {
    this.lastFramesEncoded = this.totalFramesEncodedCount;
    this.totalFramesEncodedCount = framesEncoded;
    if (this.lastFramesEncoded == 0) {
      this.lastFramesEncoded = framesEncoded;
    }
  }
}
var Logger$1 = window.log;
class WebSocketAdaptor {
  /**
   * 
   * @param {object} initialValues 
   */
  constructor(initialValues) {
    /**
     * @type {boolean}
     */
    this.debug = false;
    for (var key in initialValues) {
      if (initialValues.hasOwnProperty(key)) {
        this[key] = initialValues[key];
      }
    }
    this.initWebSocketConnection();
    addEventListener("offline", event => {
      this.connected = false;
      this.connecting = false;
      Logger$1.info("Network status has changed to offline. Resetting flags to reconnect faster");
    });
  }
  /**
   * Initializes the WebSocket connection.
   * @param {Function} callbackConnected - Optional callback function to be called when the connection is established.
   * @returns {void}
   */
  initWebSocketConnection(callbackConnected) {
    this.connecting = true;
    this.connected = false;
    this.pingTimerId = -1;

    /*
    * It's not mandatory if you don't use the new Load Balancer mechanism
    * It uses one of the nodes on Cluster mode
    * Example parameters: "origin" or "edge"
    */
    var url = new URL(this.websocket_url);
    if (!['origin', 'edge'].includes(url.searchParams.get('target'))) {
      url.searchParams.set('target', this.webrtcadaptor.isPlayMode ? 'edge' : 'origin');
      this.websocket_url = url.toString();
    }
    this.wsConn = new WebSocket(this.websocket_url);
    this.wsConn.onopen = () => {
      if (this.debug) {
        Logger$1.debug("websocket connected");
      }
      this.pingTimerId = setInterval(() => {
        this.sendPing();
      }, 3000);
      this.connected = true;
      this.connecting = false;
      this.callback("initialized");
      if (typeof callbackConnected != "undefined") {
        callbackConnected();
      }
    };
    this.wsConn.onmessage = event => {
      var obj = JSON.parse(event.data);
      if (obj.command == "start") {
        //this command is received first, when publishing so playmode is false

        if (this.debug) {
          Logger$1.debug("received start command");
        }
        this.webrtcadaptor.startPublishing(obj.streamId);
      } else if (obj.command == "takeCandidate") {
        if (this.debug) {
          Logger$1.debug("received ice candidate for stream id " + obj.streamId);
          Logger$1.debug(obj.candidate);
        }
        this.webrtcadaptor.takeCandidate(obj.streamId, obj.label, obj.candidate);
      } else if (obj.command == "takeConfiguration") {
        if (this.debug) {
          Logger$1.debug("received remote description type for stream id: " + obj.streamId + " type: " + obj.type);
        }
        this.webrtcadaptor.takeConfiguration(obj.streamId, obj.sdp, obj.type, obj.idMapping);
      } else if (obj.command == "stop") {
        if (this.debug) {
          Logger$1.debug("Stop command received");
        }
        //server sends stop command when the peers are connected to each other in peer-to-peer.
        //It is not being sent in publish,play modes
        this.webrtcadaptor.closePeerConnection(obj.streamId);
      } else if (obj.command == "error") {
        this.callbackError(obj.definition, obj);
      } else if (obj.command == "notification") {
        this.callback(obj.definition, obj);
      } else if (obj.command == "streamInformation") {
        this.callback(obj.command, obj);
      } else if (obj.command == "roomInformation") {
        this.callback(obj.command, obj);
      } else if (obj.command == "pong") {
        this.callback(obj.command);
      } else if (obj.command == "trackList") {
        this.callback(obj.command, obj);
      } else if (obj.command == "connectWithNewId") {
        this.multiPeerStreamId = obj.streamId;
        this.join(obj.streamId);
      } else if (obj.command == "peerMessageCommand") {
        this.callback(obj.command, obj);
      }
    };
    this.wsConn.onerror = error => {
      this.connecting = false;
      this.connected = false;
      Logger$1.info(" error occured: " + JSON.stringify(error));
      this.clearPingTimer();
      this.callbackError("WebSocketNotConnected", error);
    };
    this.wsConn.onclose = event => {
      this.connecting = false;
      this.connected = false;
      if (this.debug) {
        Logger$1.debug("connection closed.");
      }
      this.clearPingTimer();
      this.callback("closed", event);
    };
  }
  clearPingTimer() {
    if (this.pingTimerId != -1) {
      if (this.debug) {
        Logger$1.debug("Clearing ping message timer");
      }
      clearInterval(this.pingTimerId);
      this.pingTimerId = -1;
    }
  }
  sendPing() {
    var jsCmd = {
      command: "ping"
    };
    this.wsConn.send(JSON.stringify(jsCmd));
  }
  close() {
    this.wsConn.close();
  }
  /**
   * 
   * @param {*} text 
   * @returns 
   */
  send(text) {
    if (this.connecting == false && this.connected == false) {
      //try to reconnect
      this.initWebSocketConnection(() => {
        this.send(text);
      });
      return;
    }
    try {
      this.wsConn.send(text);
      if (this.debug) {
        Logger$1.debug("sent message:" + text);
      }
    } catch (error) {
      Logger$1.warn("Cannot send message:" + text);
    }
  }
  isConnected() {
    return this.connected;
  }
  isConnecting() {
    return this.connecting;
  }
}
var Logger$2 = window.log;

/**
 * This structure is used to handle large size data channel messages (like image)
 * which should be splitted into chunks while sending and receiving.
 *
 */
class ReceivingMessage {
  /**
   *
   * @param {number} size
   */
  constructor(size) {
    this.size = size;
    this.received = 0;
    this.data = new ArrayBuffer(size);
  }
}

/**
 * WebRTCAdaptor Class is interface to the JS SDK of Ant Media Server (AMS). This class manages the signalling,
 * keeps the states of peers.
 *
 * This class is used for peer-to-peer signalling,
 * publisher and player signalling and conference.
 *
 * Also it is responsible for some room management in conference case.
 *
 * There are different use cases in AMS. This class is used for all of them.
 *
 * WebRTC Publish
 * WebRTC Play
 * WebRTC Data Channel Connection
 * WebRTC Conference
 * WebRTC Multitrack Play
 * WebRTC Multitrack Conference
 * WebRTC peer-to-peer session
 *
 */
class WebRTCAdaptor {
  /**
   * Register plugins to the WebRTCAdaptor
   * @param {Function} plugin
   */
  static register(pluginInitMethod) {
    WebRTCAdaptor.pluginInitMethods.push(pluginInitMethod);
  }
  /**
   *
   * @param {object} initialValues
   */
  constructor(initialValues) {
    /**
     * PeerConnection configuration while initializing the PeerConnection.
     * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/RTCPeerConnection#parameters
     *
     * More than one STURN and/or TURN servers can be added.  Here is a typical turn server configuration
     *
     *    {
     * 	  urls: "",
     *	  username: "",
     *    credential: "",
     *	}
     *
     *  Default value is the google stun server
     */
    this.peerconnection_config = {
      'iceServers': [{
        'urls': 'stun:stun1.l.google.com:19302'
      }],
      sdpSemantics: 'unified-plan'
    };

    /**
     * Used while creating SDP (answer or offer)
     * https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createOffer#parameters
     */
    this.sdp_constraints = {
      OfferToReceiveAudio: false,
      OfferToReceiveVideo: false
    };

    /**
     * This keeps the PeerConnections for each stream id.
     * It is an array because one @WebRTCAdaptor instance can manage multiple WebRTC connections as in the conference.
     * Its indices are the Stream Ids of each stream
     */
    this.remotePeerConnection = new Array();

    /**
     * This keeps statistics for the each PeerConnection.
     * It is an array because one @WebRTCAdaptor instance can manage multiple WebRTC connections as in the conference.
     * Its indices are the Stream Ids of each stream
     */
    this.remotePeerConnectionStats = new Array();

    /**
     * This keeps the Remote Description (SDP) set status for each PeerConnection.
     * We need to keep this status because sometimes ice candidates from the remote peer
     * may come before the Remote Description (SDP). So we need to store those ice candidates
     * in @iceCandidateList field until we get and set the Remote Description.
     * Otherwise setting ice candidates before Remote description may cause problem.
     */
    this.remoteDescriptionSet = new Array();

    /**
     * This keeps the Ice Candidates which are received before the Remote Description (SDP) received.
     * For details please check @remoteDescriptionSet field.
     */
    this.iceCandidateList = new Array();

    /**
     * This is the name for the room that is desired to join in conference mode.
     */
    this.roomName = null;

    /**
     * This keeps StreamIds for the each playing session.
     * It is an array because one @WebRTCAdaptor instance can manage multiple playing sessions.
     */
    this.playStreamId = new Array();

    /**
     * This is the flag indicates if multiple peers will join a peer in the peer to peer mode.
     * This is used only with Embedded SDk
     */
    this.isMultiPeer = false;

    /**
     * This is the stream id that multiple peers can join a peer in the peer to peer mode.
     * This is used only with Embedded SDk
     */
    this.multiPeerStreamId = null;

    /**
     * This is instance of @WebSocketAdaptor and manages to websocket connection.
     * All signalling messages are sent to/recived from
     * the Ant Media Server over this web socket connection
     */
    this.webSocketAdaptor = null;

    /**
     * This flags indicates if this @WebRTCAdaptor instance is used only for playing session(s)
     * You don't need camera/mic access in play mode
     */
    this.isPlayMode = false;

    /**
     * This flags enables/disables debug logging
     */
    this.debug = false;

    /**
     * This is the Stream Id for the publisher. One @WebRCTCAdaptor supports only one publishing
     * session for now (23.02.2022).
     * In conference mode you can join a room with null stream id. In that case
     * Ant Media Server generates a stream id and provides it JoinedTheRoom callback and it is set to this field.
     */
    this.publishStreamId = null;

    /**
     * This is used to keep stream id and track id (which is provided in SDP) mapping
     * in MultiTrack Playback and conference.
     */
    this.idMapping = new Array();

    /**
     * This is used when only data is brodcasted with the same way video and/or audio.
     * The difference is that no video or audio is sent when this field is true
     */
    this.onlyDataChannel = false;

    /**
     * While publishing and playing streams data channel is enabled by default
     */
    this.dataChannelEnabled = true;

    /**
     * This is array of @ReceivingMessage
     * When you receive multiple large size messages @ReceivingMessage simultaneously
     * this map is used to indicate them with its index tokens.
     */
    this.receivingMessages = new Map();

    /**
     * Supported candidate types. Below types are for both sending and receiving candidates.
     * It means if when client receives candidate from STUN server, it sends to the server if candidate's protocol
     * is in the list. Likely, when client receives remote candidate from server, it adds as ice candidate
     * if candidate protocol is in the list below.
     */
    this.candidateTypes = ["udp", "tcp"];

    /**
     * Method to call when there is an event happened
     */
    this.callback = null;

    /**
     * Method to call when there is an error happened
     */
    this.callbackError = null;

    /**
     * Flag to indicate if the stream is published or not after the connection fails
     */
    this.reconnectIfRequiredFlag = true;

    /**
     * websocket url to connect
     * @deprecated use websocketURL
     */
    this.websocket_url = null;

    /**
     * Websocket URL
     */
    this.websocketURL = null;

    /**
     * flag to initialize components in constructor
     */
    this.initializeComponents = true;

    /**
     * Degradation Preference
     * 
     * maintain-framerate, maintain-resolution, or balanced
     */
    this.degradationPreference = "maintain-resolution";

    /**
     * PAY ATTENTION: The values of the above fields are provided as this constructor parameter.
     * TODO: Also some other hidden parameters may be passed here
     */
    for (var key in initialValues) {
      if (initialValues.hasOwnProperty(key)) {
        this[key] = initialValues[key];
      }
    }
    if (this.websocketURL == null) {
      this.websocketURL = this.websocket_url;
    }
    if (this.websocketURL == null) {
      throw new Error("WebSocket URL is not defined. It's mandatory");
    }
    /**
     * The html video tag for receiver is got here
     */
    this.remoteVideo = this.remoteVideoElement || document.getElementById(this.remoteVideoId);

    /**
     * Keeps the sound meters for each connection. Its index is stream id
     */
    this.soundMeters = new Array();

    /**
     * Keeps the current audio level for each playing streams in conference mode
     */
    this.soundLevelList = new Array();

    /**
     * This is the event listeners that WebRTC Adaptor calls when there is a new event happened
     */
    this.eventListeners = new Array();

    /**
     * This is the error event listeners that WebRTC Adaptor calls when there is an error happened
     */
    this.errorEventListeners = new Array();

    /**
     * This is token that is being used to publish the stream. It's added here to use in reconnect scenario
     */
    this.publishToken = null;

    /**
     * subscriber id that is being used to publish the stream. It's added here to use in reconnect scenario
     */
    this.publishSubscriberId = null;

    /**
     * subscriber code that is being used to publish the stream. It's added here to use in reconnect scenario
     */
    this.publishSubscriberCode = null;

    /**
     * This is the stream name that is being published. It's added here to use in reconnect scenario
     */
    this.publishStreamName = null;

    /**
     * This is the stream id of the main track that the current publishStreamId is going to be subtrack of it. It's added here to use in reconnect scenario
     */
    this.publishMainTrack = null;

    /**
     * This is the metadata that is being used to publish the stream. It's added here to use in reconnect scenario
     */
    this.publishMetaData = null;

    /**
     * This is the role for selective subtrack playback. It's added here to use in reconnect scenario
     */
    this.publishRole = null;

    /**
     * This is the token to play the stream. It's added here to use in reconnect scenario
     */
    this.playToken = null;

    /**
     * This is the room id to play the stream. It's added here to use in reconnect scenario
     * This approach is old conferencing. It's better to use multi track conferencing
     */
    this.playRoomId = null;

    /**
     * These are enabled tracks to play the stream. It's added here to use in reconnect scenario
     */
    this.playEnableTracks = null;

    /**
     * This is the subscriber Id to play the stream. It's added here to use in reconnect scenario
     */
    this.playSubscriberId = null;

    /**
     * This is the subscriber code to play the stream. It's added here to use in reconnect scenario
     */
    this.playSubscriberCode = null;

    /**
     * This is the meta data to play the stream. It's added here to use in reconnect scenario
     */
    this.playMetaData = null;

    /**
     * This is the role for selective subtrack playback. It's added here to use in reconnect scenario
     */
    this.playRole = null;

    /**
     * This is the time info for the last reconnection attempt
     */
    this.lastReconnectiontionTrialTime = 0;

    /**
     * All media management works for teh local stream are made by @MediaManager class.
     * for details please check @MediaManager
     */
    this.mediaManager = new MediaManager({
      userParameters: initialValues,
      webRTCAdaptor: this,
      callback: (info, obj) => {
        this.notifyEventListeners(info, obj);
      },
      callbackError: (error, message) => {
        this.notifyErrorEventListeners(error, message);
      },
      getSender: (streamId, type) => {
        return this.getSender(streamId, type);
      }
    });

    //Initialize the local stream (if needed) and web socket connection
    if (this.initializeComponents) {
      this.initialize();
    }
  }

  /**
   * Init plugins
   */
  initPlugins() {
    WebRTCAdaptor.pluginInitMethods.forEach(initMethod => {
      initMethod(this);
    });
  }

  /**
   * Add event listener to be notified. This is generally for plugins
   * @param {*} listener
   */
  addEventListener(listener) {
    this.eventListeners.push(listener);
  }

  /**
   * Add error event listener to be notified. Thisis generally for plugins
   * @param {*} errorListener
   */
  addErrorEventListener(errorListener) {
    this.errorEventListeners.push(errorListener);
  }

  /**
   * Notify event listeners and callback method
   * @param {*} info
   * @param {*} obj
   */
  notifyEventListeners(info, obj) {
    this.eventListeners.forEach(listener => {
      listener(info, obj);
    });
    if (this.callback != null) {
      this.callback(info, obj);
    }
  }

  /**
   * Notify error event listeners and callbackError method
   * @param {*} error
   * @param {*} message
   */
  notifyErrorEventListeners(error, message) {
    this.errorEventListeners.forEach(listener => {
      listener(error, message);
    });
    if (this.callbackError != null) {
      this.callbackError(error, message);
    }
  }

  /**
   * Called by constuctor to
   *    -check local stream unless it is in play mode
   *    -start websocket connection
   */
  initialize() {
    if (!this.isPlayMode && !this.onlyDataChannel && this.mediaManager.localStream == null) {
      //we need local stream because it not a play mode
      return this.mediaManager.initLocalStream().then(() => {
        this.initPlugins();
        this.checkWebSocketConnection();
        return new Promise((resolve, reject) => {
          resolve("Wait 'initialized' callback from websocket");
        });
      }).catch(error => {
        Logger$2.warn(error);
        throw error;
      });
    }
    return new Promise((resolve, reject) => {
      this.initPlugins();
      this.checkWebSocketConnection();
      resolve("Wait 'initialized' callback from websocket");
    });
  }

  /**
   * Called to start a new WebRTC stream. AMS responds with start message.
   * Parameters:
   *  @param {string} streamId : unique id for the stream
   *  @param {string=} [token] : required if any stream security (token control) enabled. Check https://github.com/ant-media/Ant-Media-Server/wiki/Stream-Security-Documentation
   *  @param {string=} [subscriberId] : required if TOTP enabled. Check https://github.com/ant-media/Ant-Media-Server/wiki/Time-based-One-Time-Password-(TOTP)
   *  @param {string=} [subscriberCode] : required if TOTP enabled. Check https://github.com/ant-media/Ant-Media-Server/wiki/Time-based-One-Time-Password-(TOTP)
   *  @param {string=} [streamName] : required if you want to set a name for the stream
   *  @param {string=} [mainTrack] :  required if you want to start the stream as a subtrack for a main stream which has id of this parameter.
   *                Check:https://antmedia.io/antmediaserver-webrtc-multitrack-playing-feature/
   *                !!! for multitrack conference set this value with roomName
   *  @param {string=} [metaData] : a free text information for the stream to AMS. It is provided to Rest methods by the AMS
   *  @param {string=} [role] : role for the stream. It is used for selective forwarding of subtracks in conference mode.
   */
  publish(streamId, token, subscriberId, subscriberCode, streamName, mainTrack, metaData, role) {
    //TODO: should refactor the repeated code
    this.publishStreamId = streamId;
    this.mediaManager.publishStreamId = streamId;
    this.publishToken = token;
    this.publishSubscriberId = subscriberId;
    this.publishSubscriberCode = subscriberCode;
    this.publishStreamName = streamName;
    this.publishMainTrack = mainTrack;
    this.publishMetaData = metaData;
    this.publishRole = role;
    if (this.onlyDataChannel) {
      this.sendPublishCommand(streamId, token, subscriberId, subscriberCode, streamName, mainTrack, metaData, role, false, false);
    }
    //If it started with playOnly mode and wants to publish now
    else if (this.mediaManager.localStream == null) {
      this.mediaManager.initLocalStream().then(() => {
        var videoEnabled = false;
        var audioEnabled = false;
        if (this.mediaManager.localStream != null) {
          videoEnabled = this.mediaManager.localStream.getVideoTracks().length > 0;
          audioEnabled = this.mediaManager.localStream.getAudioTracks().length > 0;
        }
        this.sendPublishCommand(streamId, token, subscriberId, subscriberCode, streamName, mainTrack, metaData, role, videoEnabled, audioEnabled);
      }).catch(error => {
        Logger$2.warn(error);
        throw error;
      });
    } else {
      var videoEnabled = this.mediaManager.localStream.getVideoTracks().length > 0;
      var audioEnabled = this.mediaManager.localStream.getAudioTracks().length > 0;
      this.sendPublishCommand(streamId, token, subscriberId, subscriberCode, streamName, mainTrack, metaData, role, videoEnabled, audioEnabled);
    }
    //init peer connection for reconnectIfRequired
    this.initPeerConnection(streamId, "publish");
    setTimeout(() => {
      //check if it is connected or not
      //this resolves if the server responds with some error message
      if (this.iceConnectionState(this.publishStreamId) != "checking" && this.iceConnectionState(this.publishStreamId) != "connected" && this.iceConnectionState(this.publishStreamId) != "completed") {
        //if it is not connected, try to reconnect
        this.reconnectIfRequired(0);
      }
    }, 3000);
  }
  sendPublishCommand(streamId, token, subscriberId, subscriberCode, streamName, mainTrack, metaData, role, videoEnabled, audioEnabled) {
    var jsCmd = {
      command: "publish",
      streamId: streamId,
      token: token,
      subscriberId: typeof subscriberId !== undefined && subscriberId != null ? subscriberId : "",
      subscriberCode: typeof subscriberCode !== undefined && subscriberCode != null ? subscriberCode : "",
      streamName: typeof streamName !== undefined && streamName != null ? streamName : "",
      mainTrack: typeof mainTrack !== undefined && mainTrack != null ? mainTrack : "",
      video: videoEnabled,
      audio: audioEnabled,
      metaData: typeof metaData !== undefined && metaData != null ? metaData : "",
      role: typeof role !== undefined && role != null ? role : ""
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to join a room. AMS responds with joinedTheRoom message.
   * Parameters:
   * @param {string} roomName : unique id of the room
   * @param {string=} streamId : unique id of the stream belongs to this participant
   * @param {string=} mode :    legacy for older implementation (default value)
   *            mcu for merging streams
   *            amcu: audio only conferences with mixed audio
   */
  joinRoom(roomName, streamId, mode) {
    this.roomName = roomName;
    var jsCmd = {
      command: "joinRoom",
      room: roomName,
      streamId: streamId,
      mode: mode
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to start a playing session for a stream. AMS responds with start message.
   * Parameters:
   *  @param {string} streamId :(string) unique id for the stream that you want to play
   *  @param {string=} token :(string) required if any stream security (token control) enabled. Check https://github.com/ant-media/Ant-Media-Server/wiki/Stream-Security-Documentation
   *  @param {string=} roomId :(string) required if this stream is belonging to a room participant
   *  @param {Array.<MediaStreamTrack>=} enableTracks :(array) required if the stream is a main stream of multitrack playing. You can pass the the subtrack id list that you want to play.
   *                    you can also provide a track id that you don't want to play by adding ! before the id.
   *  @param {string=} subscriberId :(string) required if TOTP enabled. Check https://github.com/ant-media/Ant-Media-Server/wiki/Time-based-One-Time-Password-(TOTP)
   *  @param {string=} subscriberCode :(string) required if TOTP enabled. Check https://github.com/ant-media/Ant-Media-Server/wiki/Time-based-One-Time-Password-(TOTP)
   *  @param {string=} metaData :(string, json) a free text information for the stream to AMS. It is provided to Rest methods by the AMS
   *  @param {string=} [role] : role for the stream. It is used for selective forwarding of subtracks in conference mode.
   */
  play(streamId, token, roomId, enableTracks, subscriberId, subscriberCode, metaData, role) {
    this.playStreamId.push(streamId);
    this.playToken = token;
    this.playRoomId = roomId;
    this.playEnableTracks = enableTracks;
    this.playSubscriberId = subscriberId;
    this.playSubscriberCode = subscriberCode;
    this.playMetaData = metaData;
    this.playRole = role;
    var jsCmd = {
      command: "play",
      streamId: streamId,
      token: typeof token !== undefined && token != null ? token : "",
      room: typeof roomId !== undefined && roomId != null ? roomId : "",
      trackList: typeof enableTracks !== undefined && enableTracks != null ? enableTracks : [],
      subscriberId: typeof subscriberId !== undefined && subscriberId != null ? subscriberId : "",
      subscriberCode: typeof subscriberCode !== undefined && subscriberId != null ? subscriberCode : "",
      viewerInfo: typeof metaData !== undefined && metaData != null ? metaData : "",
      role: typeof role !== undefined && role != null ? role : ""
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));

    //init peer connection for reconnectIfRequired
    this.initPeerConnection(streamId, "play");
    setTimeout(() => {
      //check if it is connected or not
      //this resolves if the server responds with some error message
      if (this.iceConnectionState(streamId) != "checking" && this.iceConnectionState(streamId) != "connected" && this.iceConnectionState(streamId) != "completed") {
        //if it is not connected, try to reconnect
        this.reconnectIfRequired(0);
      }
    }, 3000);
  }

  /**
   * Reconnects to the stream if it is not stopped on purpose
   * @param {number} [delayMs]
   * @returns
   */
  reconnectIfRequired() {
    var delayMs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3000;
    if (this.reconnectIfRequiredFlag) {
      //It's important to run the following methods after 3000 ms because the stream may be stopped by the user in the meantime
      if (delayMs > 0) {
        setTimeout(() => {
          this.tryAgain();
        }, delayMs);
      } else {
        this.tryAgain();
      }
    }
  }
  tryAgain() {
    var _this = this;
    var now = Date.now();
    //to prevent too many trial from different paths
    if (now - this.lastReconnectiontionTrialTime < 3000) {
      return;
    }
    this.lastReconnectiontionTrialTime = now;

    //reconnect publish
    //if remotePeerConnection has a peer connection for the stream id, it means that it is not stopped on purpose

    if (this.remotePeerConnection[this.publishStreamId] != null &&
    //check connection status to not stop streaming an active stream
    this.iceConnectionState(this.publishStreamId) != "checking" && this.iceConnectionState(this.publishStreamId) != "connected" && this.iceConnectionState(this.publishStreamId) != "completed") {
      // notify that reconnection process started for publish
      this.notifyEventListeners("reconnection_attempt_for_publisher", this.publishStreamId);
      this.stop(this.publishStreamId);
      setTimeout(() => {
        //publish about some time later because server may not drop the connection yet 
        //it may trigger already publishing error 
        Logger$2.log("Trying publish again for stream: " + this.publishStreamId);
        this.publish(this.publishStreamId, this.publishToken, this.publishSubscriberId, this.publishSubscriberCode, this.publishStreamName, this.publishMainTrack, this.publishMetaData, this.publishRole);
      }, 500);
    }

    //reconnect play
    var _loop = function _loop() {
      var streamId = _this.playStreamId[index];
      if (_this.remotePeerConnection[streamId] != "null" &&
      //check connection status to not stop streaming an active stream
      _this.iceConnectionState(streamId) != "checking" && _this.iceConnectionState(streamId) != "connected" && _this.iceConnectionState(streamId) != "completed") {
        // notify that reconnection process started for play
        _this.notifyEventListeners("reconnection_attempt_for_player", streamId);
        Logger$2.log("It will try to play again for stream: " + streamId + " because it is not stopped on purpose");
        _this.stop(streamId);
        setTimeout(() => {
          //play about some time later because server may not drop the connection yet 
          //it may trigger already playing error 
          Logger$2.log("Trying play again for stream: " + streamId);
          _this.play(streamId, _this.playToken, _this.playRoomId, _this.playEnableTracks, _this.playSubscriberId, _this.playSubscriberCode, _this.playMetaData, _this.playRole);
        }, 500);
      }
    };
    for (var index in this.playStreamId) {
      _loop();
    }
  }

  /**
   * Called to stop a publishing/playing session for a stream. AMS responds with publishFinished or playFinished message.
   * Parameters:
   *  @param {string} streamId : unique id for the stream that you want to stop publishing or playing
   */
  stop(streamId) {
    //stop is called on purpose and it deletes the peer connection from remotePeerConnections
    this.closePeerConnection(streamId);
    if (this.webSocketAdaptor != null && this.webSocketAdaptor.isConnected()) {
      var jsCmd = {
        command: "stop",
        streamId: streamId
      };
      this.webSocketAdaptor.send(JSON.stringify(jsCmd));
    }
  }

  /**
   * Called to join a peer-to-peer mode session as peer. AMS responds with joined message.
   * Parameters:
   * @param {string} streamId : unique id for the peer-to-peer session
   */
  join(streamId) {
    var jsCmd = {
      command: "join",
      streamId: streamId,
      multiPeer: this.isMultiPeer && this.multiPeerStreamId == null,
      mode: this.isPlayMode ? "play" : "both"
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called by browser when a new track is added to WebRTC connetion. This is used to infor html pages with newStreamAvailable callback.
   * Parameters:
   * 	 event: TODO
   * 	 streamId: unique id for the stream
   */
  onTrack(event, streamId) {
    Logger$2.debug("onTrack for stream");
    if (this.remoteVideo != null) {
      if (this.remoteVideo.srcObject !== event.streams[0]) {
        this.remoteVideo.srcObject = event.streams[0];
        Logger$2.debug('Received remote stream');
      }
    } else {
      var dataObj = {
        stream: event.streams[0],
        track: event.track,
        streamId: streamId,
        trackId: this.idMapping[streamId][event.transceiver.mid]
      };
      this.notifyEventListeners("newTrackAvailable", dataObj);

      //deprecated. Listen newTrackAvailable in callback. It's kept for backward compatibility
      this.notifyEventListeners("newStreamAvailable", dataObj);
    }
  }

  /**
   * Called to leave from a conference room. AMS responds with leavedTheRoom message.
   * Parameters:
   * @param {string} roomName : unique id for the conference room
   */
  leaveFromRoom(roomName) {
    for (var key in this.remotePeerConnection) {
      this.closePeerConnection(key);
    }
    this.roomName = roomName;
    var jsCmd = {
      command: "leaveFromRoom",
      room: roomName
    };
    Logger$2.debug("leave request is sent for " + roomName);
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to leave from a peer-to-peer mode session. AMS responds with leaved message.
   * Parameters:
   * @param {string} streamId : unique id for the peer-to-peer session
   */
  leave(streamId) {
    var jsCmd = {
      command: "leave",
      streamId: this.isMultiPeer && this.multiPeerStreamId != null ? this.multiPeerStreamId : streamId
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
    this.closePeerConnection(streamId);
    this.multiPeerStreamId = null;
  }

  /**
   * Called to get a stream information for a specific stream. AMS responds with streamInformation message.
   * Parameters:
   * @param {string} streamId : unique id for the stream that you want to get info about
   */
  getStreamInfo(streamId) {
    var jsCmd = {
      command: "getStreamInfo",
      streamId: streamId
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to get the list of video track assignments. AMS responds with the videoTrackAssignmentList message.
   * Parameters:
   * @param {string} streamId : unique id for the stream that you want to get info about
   */
  requestVideoTrackAssignments(streamId) {
    var jsCmd = {
      command: "getVideoTrackAssignmentsCommand",
      streamId: streamId
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to get the broadcast object for a specific stream. AMS responds with the broadcastObject callback.
   * Parameters:
   * @param {string} streamId : unique id for the stream that you want to get info about
   */
  getBroadcastObject(streamId) {
    var jsCmd = {
      command: "getBroadcastObject",
      streamId: streamId
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to update the meta information for a specific stream.
   * Parameters:
   * @param {string} streamId : unique id for the stream that you want to update MetaData
   * @param {string}  metaData : new free text information for the stream
   */
  updateStreamMetaData(streamId, metaData) {
    var jsCmd = {
      command: "updateStreamMetaData",
      streamId: streamId,
      metaData: metaData
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to get the room information for a specific room. AMS responds with roomInformation message
   * which includes the ids and names of the streams in that room.
   * If there is no active streams in the room, AMS returns error `no_active_streams_in_room` in error callback
   * Parameters:
   * @param {string} roomName : unique id for the room that you want to get info about
   * @param {string} streamId : unique id for the stream that is streamed by this @WebRTCAdaptor
   */
  getRoomInfo(roomName, streamId) {
    var jsCmd = {
      command: "getRoomInfo",
      streamId: streamId,
      room: roomName
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to get the subtracks for a specific maintrack. AMS responds with the subtrackList callback.
   * Parameters:
   * @param {string} streamId : main track id
   * @param {string} role : filter the subtracks with the role
   * @param {number} offset : offset for the subtrack list
   * @param {number} size : size for the subtrack list
   */
  getSubtracks(streamId, role, offset, size) {
    var jsCmd = {
      command: "getSubtracks",
      streamId: streamId,
      role: role,
      offset: offset,
      size: size
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to enable/disable data flow from the AMS for a specific track under a main track.
   * Parameters:
   * @param {string}  mainTrackId : unique id for the main stream
   * @param {string}  trackId : unique id for the track that you want to enable/disable data flow for
   * @param {boolean} enabled : true or false
   */
  enableTrack(mainTrackId, trackId, enabled) {
    var jsCmd = {
      command: "enableTrack",
      streamId: mainTrackId,
      trackId: trackId,
      enabled: enabled
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to get the track ids under a main stream. AMS responds with trackList message.
   * Parameters:
   * @param {string} streamId : unique id for the main stream
   * @param {string=} [token] : not used
   * TODO: check this function
   */
  getTracks(streamId, token) {
    this.playStreamId.push(streamId);
    var jsCmd = {
      command: "getTrackList",
      streamId: streamId,
      token: token
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called by WebSocketAdaptor when a new ice candidate is received from AMS.
   * Parameters:
   *     event: TODO
   *     streamId: unique id for the stream
   */
  iceCandidateReceived(event, streamId) {
    if (event.candidate) {
      var protocolSupported = false;
      if (event.candidate.candidate == "") {
        //event candidate can be received and its value can be "".
        //don't compare the protocols
        protocolSupported = true;
      } else if (typeof event.candidate.protocol == "undefined") {
        this.candidateTypes.forEach(element => {
          if (event.candidate.candidate.toLowerCase().includes(element)) {
            protocolSupported = true;
          }
        });
      } else {
        protocolSupported = this.candidateTypes.includes(event.candidate.protocol.toLowerCase());
      }
      if (protocolSupported) {
        var jsCmd = {
          command: "takeCandidate",
          streamId: streamId,
          label: event.candidate.sdpMLineIndex,
          id: event.candidate.sdpMid,
          candidate: event.candidate.candidate
        };
        if (this.debug) {
          Logger$2.debug("sending ice candiate for stream Id " + streamId);
          Logger$2.debug(JSON.stringify(event.candidate));
        }
        this.webSocketAdaptor.send(JSON.stringify(jsCmd));
      } else {
        Logger$2.debug("Candidate's protocol(full sdp: " + event.candidate.candidate + ") is not supported. Supported protocols: " + this.candidateTypes);
        if (event.candidate.candidate != "") {
          //
          this.notifyErrorEventListeners("protocol_not_supported", "Support protocols: " + this.candidateTypes.toString() + " candidate: " + event.candidate.candidate);
        }
      }
    } else {
      Logger$2.debug("No event.candidate in the iceCandidate event");
    }
  }

  /**
   * Called internally to sanitize the text if it contains script to prevent xss
   * @param text
   * @returns {*}
   */
  sanitizeHTML(text) {
    if (text.includes("script")) return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return text;
  }

  /**
   * Called internally to initiate Data Channel.
   * Note that Data Channel should be enabled fromAMS settings.
   *  @param {string}  streamId : unique id for the stream
   *  @param {*} dataChannel : provided by PeerConnection
   */
  initDataChannel(streamId, dataChannel) {
    dataChannel.onerror = error => {
      Logger$2.debug("Data Channel Error:", error);
      var obj = {
        streamId: streamId,
        error: error
      };
      Logger$2.debug("channel status: ", dataChannel.readyState);
      if (dataChannel.readyState != "closed") {
        this.notifyErrorEventListeners("data_channel_error", obj);
      }
    };
    dataChannel.onmessage = event => {
      var obj = {
        streamId: streamId,
        data: event.data
      };
      var data = obj.data;
      if (typeof data === 'string' || data instanceof String) {
        obj.data = this.sanitizeHTML(obj.data);
        this.notifyEventListeners("data_received", obj);
      } else {
        var length = data.length || data.size || data.byteLength;
        var view = new Int32Array(data, 0, 1);
        var token = view[0];
        var msg = this.receivingMessages[token];
        if (msg == undefined) {
          var view = new Int32Array(data, 0, 2);
          var size = view[1];
          msg = new ReceivingMessage(size);
          this.receivingMessages[token] = msg;
          if (length > 8) {
            Logger$2.debug("something went wrong in msg receiving");
          }
          return;
        }
        var rawData = data.slice(4, length);
        var dataView = new Uint8Array(msg.data);
        dataView.set(new Uint8Array(rawData), msg.received, length - 4);
        msg.received += length - 4;
        if (msg.size == msg.received) {
          obj.data = msg.data;
          this.notifyEventListeners("data_received", obj);
        }
      }
    };
    dataChannel.onopen = () => {
      this.remotePeerConnection[streamId].dataChannel = dataChannel;
      Logger$2.debug("Data channel is opened");
      this.notifyEventListeners("data_channel_opened", streamId);
    };
    dataChannel.onclose = () => {
      Logger$2.debug("Data channel is closed");
      this.notifyEventListeners("data_channel_closed", streamId);
    };
  }

  /**
   * Called internally to initiate PeerConnection.
   * @param {string} streamId : unique id for the stream
   * @param {string}  dataChannelMode : can be "publish" , "play" or "peer" based on this it is decided which way data channel is created
   */
  initPeerConnection(streamId, dataChannelMode) {
    //null == undefined -> it's true
    //null === undefined -> it's false

    if (this.remotePeerConnection[streamId] == null) {
      var closedStreamId = streamId;
      Logger$2.debug("stream id in init peer connection: " + streamId + " close stream id: " + closedStreamId);
      this.remotePeerConnection[streamId] = new RTCPeerConnection(this.peerconnection_config);
      this.remoteDescriptionSet[streamId] = false;
      this.iceCandidateList[streamId] = new Array();
      if (!this.playStreamId.includes(streamId)) {
        if (this.mediaManager.localStream != null) {
          this.mediaManager.localStream.getTracks().forEach(track => {
            var rtpSender = this.remotePeerConnection[streamId].addTrack(track, this.mediaManager.localStream);
            if (track.kind == 'video') {
              var parameters = rtpSender.getParameters();
              parameters.degradationPreference = this.degradationPreference;
              rtpSender.setParameters(parameters).then(() => {
                Logger$2.info("Degradation Preference is set to " + this.degradationPreference);
              }).catch(err => {
                Logger$2.warn("Degradation Preference cannot be set to " + this.degradationPreference);
              });
            }
            //
            //parameters.degradationPreference
          });
        }
      }
      this.remotePeerConnection[streamId].onicecandidate = event => {
        this.iceCandidateReceived(event, closedStreamId);
      };
      this.remotePeerConnection[streamId].ontrack = event => {
        this.onTrack(event, closedStreamId);
      };
      this.remotePeerConnection[streamId].onnegotiationneeded = event => {
        Logger$2.debug("onnegotiationneeded");
      };
      if (this.dataChannelEnabled) {
        // skip initializing data channel if it is disabled
        if (dataChannelMode == "publish") {
          //open data channel if it's publish mode peer connection
          var dataChannelOptions = {
            ordered: true
          };
          if (this.remotePeerConnection[streamId].createDataChannel) {
            var dataChannel = this.remotePeerConnection[streamId].createDataChannel(streamId, dataChannelOptions);
            this.initDataChannel(streamId, dataChannel);
          } else {
            Logger$2.warn("CreateDataChannel is not supported");
          }
        } else if (dataChannelMode == "play") {
          //in play mode, server opens the data channel
          this.remotePeerConnection[streamId].ondatachannel = ev => {
            this.initDataChannel(streamId, ev.channel);
          };
        } else {
          //for peer mode do both for now
          var _dataChannelOptions = {
            ordered: true
          };
          if (this.remotePeerConnection[streamId].createDataChannel) {
            var dataChannelPeer = this.remotePeerConnection[streamId].createDataChannel(streamId, _dataChannelOptions);
            this.initDataChannel(streamId, dataChannelPeer);
            this.remotePeerConnection[streamId].ondatachannel = ev => {
              this.initDataChannel(streamId, ev.channel);
            };
          } else {
            Logger$2.warn("CreateDataChannel is not supported");
          }
        }
      }
      this.remotePeerConnection[streamId].oniceconnectionstatechange = event => {
        var obj = {
          state: this.remotePeerConnection[streamId].iceConnectionState,
          streamId: streamId
        };
        if (obj.state == "failed" || obj.state == "disconnected" || obj.state == "closed") {
          this.reconnectIfRequired(3000);
        }
        this.notifyEventListeners("ice_connection_state_changed", obj);

        //
        if (!this.isPlayMode && !this.playStreamId.includes(streamId)) {
          if (this.remotePeerConnection[streamId].iceConnectionState == "connected") {
            this.mediaManager.changeBandwidth(this.mediaManager.bandwidth, streamId).then(() => {
              Logger$2.debug("Bandwidth is changed to " + this.mediaManager.bandwidth);
            }).catch(e => Logger$2.warn(e));
          }
        }
      };
    }
    return this.remotePeerConnection[streamId];
  }

  /**
   * Called internally to close PeerConnection.
   * @param {string} streamId : unique id for the stream
   */
  closePeerConnection(streamId) {
    var peerConnection = this.remotePeerConnection[streamId];
    if (peerConnection != null) {
      this.remotePeerConnection[streamId] = null;
      delete this.remotePeerConnection[streamId];
      if (peerConnection.dataChannel != null) {
        peerConnection.dataChannel.close();
      }
      if (peerConnection.signalingState != "closed") {
        peerConnection.close();
      }
      var playStreamIndex = this.playStreamId.indexOf(streamId);
      if (playStreamIndex != -1) {
        this.playStreamId.splice(playStreamIndex, 1);
      }
    }
    //this is for the stats
    if (this.remotePeerConnectionStats[streamId] != null) {
      clearInterval(this.remotePeerConnectionStats[streamId].timerId);
      delete this.remotePeerConnectionStats[streamId];
    }
    if (this.soundMeters[streamId] != null) {
      delete this.soundMeters[streamId];
    }
  }

  /**
   * Called to get the signalling state for a stream.
   * This information can be used for error handling.
   * Check: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/connectionState
   * @param {string} streamId : unique id for the stream
   */
  signallingState(streamId) {
    if (this.remotePeerConnection[streamId] != null) {
      return this.remotePeerConnection[streamId].signalingState;
    }
    return null;
  }

  /**
   * Called to get the ice connection state for a stream.
   * This information can be used for error handling.
   * Check: https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/iceConnectionState
   * @param {string} streamId : unique id for the stream
   */
  iceConnectionState(streamId) {
    if (this.remotePeerConnection[streamId] != null) {
      return this.remotePeerConnection[streamId].iceConnectionState;
    }
    return null;
  }

  /**
   * Called by browser when Local Configuration (SDP) is created successfully.
   * It is set as LocalDescription first then sent to AMS.
   * @param {object} configuration : created Local Configuration (SDP)
   * @param {string} streamId : unique id for the stream
   */
  gotDescription(configuration, streamId) {
    this.remotePeerConnection[streamId].setLocalDescription(configuration).then(responose => {
      Logger$2.debug("Set local description successfully for stream Id " + streamId);
      var jsCmd = {
        command: "takeConfiguration",
        streamId: streamId,
        type: configuration.type,
        sdp: configuration.sdp
      };
      Logger$2.debug("setLocalDescription:" + configuration.sdp);
      this.webSocketAdaptor.send(JSON.stringify(jsCmd));
    }).catch(error => {
      Logger$2.error("Cannot set local description. Error is: " + error);
    });
  }

  /**
   * Called by WebSocketAdaptor when Remote Configuration (SDP) is received from AMS.
   * It is set as RemoteDescription first then if @iceCandidateList has candidate that
   * is received bfore this message, it is added as ice candidate.
   * @param {object} configuration : received Remote Configuration (SDP)
   * @param {string} idOfStream : unique id for the stream
   * @param {string} typeOfConfiguration
   * @param {string} idMapping : stream id and track id (which is provided in SDP) mapping in MultiTrack Playback and conference.
   *                It is recorded to match stream id as new tracks are added with @onTrack
   */
  takeConfiguration(idOfStream, configuration, typeOfConfiguration, idMapping) {
    var streamId = idOfStream;
    var type = typeOfConfiguration;
    var conf = configuration;
    var isTypeOffer = type == "offer";
    var dataChannelMode = "publish";
    if (isTypeOffer) {
      dataChannelMode = "play";
    }
    this.idMapping[streamId] = idMapping;
    this.initPeerConnection(streamId, dataChannelMode);
    Logger$2.debug("setRemoteDescription:" + conf);
    this.remotePeerConnection[streamId].setRemoteDescription(new RTCSessionDescription({
      sdp: conf,
      type: type
    })).then(response => {
      if (this.debug) {
        Logger$2.debug("set remote description is succesfull with response: " + response + " for stream : " + streamId + " and type: " + type);
        Logger$2.debug(conf);
      }
      this.remoteDescriptionSet[streamId] = true;
      var length = this.iceCandidateList[streamId].length;
      Logger$2.debug("Ice candidate list size to be added: " + length);
      for (var i = 0; i < length; i++) {
        this.addIceCandidate(streamId, this.iceCandidateList[streamId][i]);
      }
      this.iceCandidateList[streamId] = [];
      if (isTypeOffer) {
        //SDP constraints may be different in play mode
        Logger$2.debug("try to create answer for stream id: " + streamId);
        this.remotePeerConnection[streamId].createAnswer(this.sdp_constraints).then(configuration => {
          Logger$2.debug("created answer for stream id: " + streamId);
          //support for stereo
          configuration.sdp = configuration.sdp.replace("useinbandfec=1", "useinbandfec=1; stereo=1");
          this.gotDescription(configuration, streamId);
        }).catch(error => {
          Logger$2.error("create answer error :" + error);
        });
      }
    }).catch(error => {
      if (this.debug) {
        Logger$2.error("set remote description is failed with error: " + error);
      }
      if (error.toString().indexOf("InvalidAccessError") > -1 || error.toString().indexOf("setRemoteDescription") > -1) {
        /**
         * This error generally occurs in codec incompatibility.
         * AMS for a now supports H.264 codec. This error happens when some browsers try to open it from VP8.
         */
        this.notifyErrorEventListeners("notSetRemoteDescription");
      }
    });
  }

  /**
   * Called by WebSocketAdaptor when new ice candidate is received from AMS.
   * If Remote Description (SDP) is already set, the candidate is added immediately,
   * otherwise stored in @iceCandidateList to add after Remote Description (SDP) set.
   * @param {string} idOfTheStream : unique id for the stream
   * @param {number|null} tmpLabel : sdpMLineIndex
   * @param {string} tmpCandidate : ice candidate
   */
  takeCandidate(idOfTheStream, tmpLabel, tmpCandidate) {
    var streamId = idOfTheStream;
    var label = tmpLabel;
    var candidateSdp = tmpCandidate;
    var candidate = new RTCIceCandidate({
      sdpMLineIndex: label,
      candidate: candidateSdp
    });
    var dataChannelMode = "peer";
    this.initPeerConnection(streamId, dataChannelMode);
    Logger$2.debug("takeCandidate:" + candidateSdp);
    if (this.remoteDescriptionSet[streamId] == true) {
      this.addIceCandidate(streamId, candidate);
    } else {
      Logger$2.debug("Ice candidate is added to list because remote description is not set yet");
      this.iceCandidateList[streamId].push(candidate);
    }
  }
  /**
   * Called internally to add the Ice Candidate to PeerConnection
   *  @param {string} streamId : unique id for the stream
   *  @param {object} candidate : ice candidate
   */
  addIceCandidate(streamId, candidate) {
    var protocolSupported = false;
    if (candidate.candidate == "") {
      //candidate can be received and its value can be "".
      //don't compare the protocols
      protocolSupported = true;
    } else if (typeof candidate.protocol == "undefined") {
      this.candidateTypes.forEach(element => {
        if (candidate.candidate.toLowerCase().includes(element)) {
          protocolSupported = true;
        }
      });
    } else {
      protocolSupported = this.candidateTypes.includes(candidate.protocol.toLowerCase());
    }
    if (protocolSupported) {
      this.remotePeerConnection[streamId].addIceCandidate(candidate).then(response => {
        if (this.debug) {
          Logger$2.debug("Candidate is added for stream " + streamId);
        }
      }).catch(error => {
        Logger$2.error("ice candiate cannot be added for stream id: " + streamId + " error is: " + error);
        Logger$2.error(candidate);
      });
    } else {
      if (this.debug) {
        Logger$2.debug("Candidate's protocol(" + candidate.protocol + ") is not supported." + "Candidate: " + candidate.candidate + " Supported protocols:" + this.candidateTypes);
      }
    }
  }
  /**
   * Called by WebSocketAdaptor when start message is received //TODO: may be changed. this logic shouldn't be in WebSocketAdaptor
   * @param {string} idOfStream : unique id for the stream
   */
  startPublishing(idOfStream) {
    var streamId = idOfStream;
    var peerConnection = this.initPeerConnection(streamId, "publish");

    //this.remotePeerConnection[streamId]
    peerConnection.createOffer(this.sdp_constraints).then(configuration => {
      this.gotDescription(configuration, streamId);
    }).catch(error => {
      Logger$2.error("create offer error for stream id: " + streamId + " error: " + error);
    });
  }

  /**
   * Toggle video track on the server side.
   *
   * @param {string}  streamId : is the id of the stream
   * @param {string}  trackId : is the id of the track. streamId is also one of the trackId of the stream. If you are having just a single track on your
   *         stream, you need to give streamId as trackId parameter as well.
   * @param {boolean}  enabled : is the enable/disable video track. If it's true, server sends video track. If it's false, server does not send video
   */
  toggleVideo(streamId, trackId, enabled) {
    var jsCmd = {
      command: "toggleVideo",
      streamId: streamId,
      trackId: trackId,
      enabled: enabled
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Toggle audio track on the server side.
   *
   * @param {string} streamId : is the id of the stream
   * @param {string}  trackId : is the id of the track. streamId is also one of the trackId of the stream. If you are having just a single track on your
   *            stream, you need to give streamId as trackId parameter as well.
   * @param {boolean}  enabled : is the enable/disable video track. If it's true, server sends audio track. If it's false, server does not send audio
   *
   */
  toggleAudio(streamId, trackId, enabled) {
    var jsCmd = {
      command: "toggleAudio",
      streamId: streamId,
      trackId: trackId,
      enabled: enabled
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to get statistics for a PeerConnection. It can be publisher or player.
   *
   * @param {string} streamId : unique id for the stream
   */
  getStats(streamId) {
    Logger$2.debug("peerstatsgetstats = " + this.remotePeerConnectionStats[streamId]);
    return new Promise((resolve, reject) => {
      this.remotePeerConnection[streamId].getStats(null).then(stats => {
        var bytesReceived = -1;
        var videoPacketsLost = -1;
        var audioPacketsLost = -1;
        var fractionLost = -1;
        var currentTime = -1;
        var bytesSent = -1;
        var videoPacketsSent = -1;
        var audioPacketsSent = -1;
        var audioLevel = -1;
        var qlr = "";
        var framesEncoded = -1;
        var width = -1;
        var height = -1;
        var fps = -1;
        var frameWidth = -1;
        var frameHeight = -1;
        var videoRoundTripTime = -1;
        var videoJitter = -1;
        var audioRoundTripTime = -1;
        var audioJitter = -1;
        var framesDecoded = -1;
        var framesDropped = -1;
        var framesReceived = -1;
        var audioJitterAverageDelay = -1;
        var videoJitterAverageDelay = -1;
        var availableOutgoingBitrate = Infinity;
        var inboundRtp = [];
        stats.forEach(value => {
          //Logger.debug(value);
          if (value.type == "inbound-rtp" && typeof value.kind != "undefined") {
            var inboundRtpObj = {};
            inboundRtpObj.trackIdentifier = value.trackIdentifier;
            bytesReceived += value.bytesReceived;
            if (value.kind == "audio") {
              audioPacketsLost = value.packetsLost;
              inboundRtpObj.audioPacketsLost = value.packetsLost;
            } else if (value.kind == "video") {
              videoPacketsLost = value.packetsLost;
              inboundRtpObj.videoPacketsLost = value.packetsLost;
              inboundRtpObj.framesDropped = value.framesDropped;
              inboundRtpObj.framesDecoded = value.framesDecoded;
              inboundRtpObj.framesPerSecond = value.framesPerSecond;
            }
            inboundRtpObj.bytesReceived = value.bytesReceived;
            inboundRtpObj.jitterBufferDelay = value.jitterBufferDelay;
            inboundRtpObj.lastPacketReceivedTimestamp = value.lastPacketReceivedTimestamp;
            fractionLost += value.fractionLost;
            inboundRtpObj.fractionLost = value.fractionLost;
            currentTime = value.timestamp;
            inboundRtpObj.currentTime = value.timestamp;
            if (typeof value.frameWidth != "undefined") {
              frameWidth = value.frameWidth;
              inboundRtpObj.frameWidth = value.frameWidth;
            }
            if (typeof value.frameHeight != "undefined") {
              frameHeight = value.frameHeight;
              inboundRtpObj.frameHeight = value.frameHeight;
            }
            if (typeof value.framesDecoded != "undefined") {
              framesDecoded = value.framesDecoded;
              inboundRtpObj.framesDecoded = value.framesDecoded;
            }
            if (typeof value.framesDropped != "undefined") {
              framesDropped = value.framesDropped;
              inboundRtpObj.framesDropped = value.framesDropped;
            }
            if (typeof value.framesReceived != "undefined") {
              framesReceived = value.framesReceived;
              inboundRtpObj.framesReceived = value.framesReceived;
            }
            inboundRtp.push(inboundRtpObj);
          } else if (value.type == "outbound-rtp") {
            //TODO: SPLIT AUDIO AND VIDEO BITRATES
            if (value.kind == "audio") {
              audioPacketsSent = value.packetsSent;
            } else if (value.kind == "video") {
              videoPacketsSent = value.packetsSent;
              frameWidth = value.frameWidth;
              frameHeight = value.frameHeight;
            }
            bytesSent += value.bytesSent;
            currentTime = value.timestamp;
            qlr = value.qualityLimitationReason;
            if (value.framesEncoded != null) {
              //audio tracks are undefined here
              framesEncoded += value.framesEncoded;
            }
          } else if (value.type == "track" && typeof value.kind != "undefined" && value.kind == "audio") {
            if (typeof value.audioLevel != "undefined") {
              audioLevel = value.audioLevel;
            }
            if (typeof value.jitterBufferDelay != "undefined" && typeof value.jitterBufferEmittedCount != "undefined") {
              audioJitterAverageDelay = value.jitterBufferDelay / value.jitterBufferEmittedCount;
            }
          } else if (value.type == "track" && typeof value.kind != "undefined" && value.kind == "video") {
            if (typeof value.frameWidth != "undefined") {
              frameWidth = value.frameWidth;
            }
            if (typeof value.frameHeight != "undefined") {
              frameHeight = value.frameHeight;
            }
            if (typeof value.framesDecoded != "undefined") {
              framesDecoded = value.framesDecoded;
            }
            if (typeof value.framesDropped != "undefined") {
              framesDropped = value.framesDropped;
            }
            if (typeof value.framesReceived != "undefined") {
              framesReceived = value.framesReceived;
            }
            if (typeof value.jitterBufferDelay != "undefined" && typeof value.jitterBufferEmittedCount != "undefined") {
              videoJitterAverageDelay = value.jitterBufferDelay / value.jitterBufferEmittedCount;
            }
          } else if (value.type == "remote-inbound-rtp" && typeof value.kind != "undefined") {
            //this is coming when webrtc publishing

            if (typeof value.packetsLost != "undefined") {
              if (value.kind == "video") {
                //this is the packetsLost for publishing
                videoPacketsLost = value.packetsLost;
              } else if (value.kind == "audio") {
                //this is the packetsLost for publishing
                audioPacketsLost = value.packetsLost;
              }
            }
            if (typeof value.roundTripTime != "undefined") {
              if (value.kind == "video") {
                videoRoundTripTime = value.roundTripTime;
              } else if (value.kind == "audio") {
                audioRoundTripTime = value.roundTripTime;
              }
            }
            if (typeof value.jitter != "undefined") {
              if (value.kind == "video") {
                videoJitter = value.jitter;
              } else if (value.kind == "audio") {
                audioJitter = value.jitter;
              }
            }
          } else if (value.type == "media-source") {
            if (value.kind == "video") {
              //returns video source dimensions, not necessarily dimensions being encoded by browser
              width = value.width;
              height = value.height;
              fps = value.framesPerSecond;
            }
          } else if (value.type == "candidate-pair" && value.state == "succeeded" && value.availableOutgoingBitrate != undefined) {
            availableOutgoingBitrate = value.availableOutgoingBitrate / 1000;
          }
        });
        if (typeof this.remotePeerConnectionStats[streamId] == 'undefined' || this.remotePeerConnectionStats[streamId] == null) {
          this.remotePeerConnectionStats[streamId] = new PeerStats(streamId);
        }
        this.remotePeerConnectionStats[streamId].totalBytesReceived = bytesReceived;
        this.remotePeerConnectionStats[streamId].videoPacketsLost = videoPacketsLost;
        this.remotePeerConnectionStats[streamId].audioPacketsLost = audioPacketsLost;
        this.remotePeerConnectionStats[streamId].fractionLost = fractionLost;
        this.remotePeerConnectionStats[streamId].currentTime = currentTime;
        this.remotePeerConnectionStats[streamId].totalBytesSent = bytesSent;
        this.remotePeerConnectionStats[streamId].totalVideoPacketsSent = videoPacketsSent;
        this.remotePeerConnectionStats[streamId].totalAudioPacketsSent = audioPacketsSent;
        this.remotePeerConnectionStats[streamId].audioLevel = audioLevel;
        this.remotePeerConnectionStats[streamId].qualityLimitationReason = qlr;
        this.remotePeerConnectionStats[streamId].totalFramesEncoded = framesEncoded;
        this.remotePeerConnectionStats[streamId].resWidth = width;
        this.remotePeerConnectionStats[streamId].resHeight = height;
        this.remotePeerConnectionStats[streamId].srcFps = fps;
        this.remotePeerConnectionStats[streamId].frameWidth = frameWidth;
        this.remotePeerConnectionStats[streamId].frameHeight = frameHeight;
        this.remotePeerConnectionStats[streamId].videoRoundTripTime = videoRoundTripTime;
        this.remotePeerConnectionStats[streamId].videoJitter = videoJitter;
        this.remotePeerConnectionStats[streamId].audioRoundTripTime = audioRoundTripTime;
        this.remotePeerConnectionStats[streamId].audioJitter = audioJitter;
        this.remotePeerConnectionStats[streamId].framesDecoded = framesDecoded;
        this.remotePeerConnectionStats[streamId].framesDropped = framesDropped;
        this.remotePeerConnectionStats[streamId].framesReceived = framesReceived;
        this.remotePeerConnectionStats[streamId].videoJitterAverageDelay = videoJitterAverageDelay;
        this.remotePeerConnectionStats[streamId].audioJitterAverageDelay = audioJitterAverageDelay;
        this.remotePeerConnectionStats[streamId].availableOutgoingBitrate = availableOutgoingBitrate;
        this.remotePeerConnectionStats[streamId].inboundRtpList = inboundRtp;
        this.notifyEventListeners("updated_stats", this.remotePeerConnectionStats[streamId]);
        resolve(true);
      }).catch(err => {
        resolve(false);
      });
    });
  }

  /**
   * Called to start a periodic timer to get statistics periodically (5 seconds) for a specific stream.
   *
   * @param {string} streamId : unique id for the stream
   * @param {number} periodMs : period in milliseconds. Default value is 5000 ms.
   */
  enableStats(streamId) {
    var periodMs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 5000;
    if (this.remotePeerConnectionStats[streamId] == null) {
      this.remotePeerConnectionStats[streamId] = new PeerStats(streamId);
      this.remotePeerConnectionStats[streamId].timerId = setInterval(() => {
        this.getStats(streamId);
      }, periodMs);
    }
  }

  /**
   * Called to stop the periodic timer which is set by @enableStats
   *
   * @param {string} streamId : unique id for the stream
   */
  disableStats(streamId) {
    if (this.remotePeerConnectionStats[streamId] != null || typeof this.remotePeerConnectionStats[streamId] != 'undefined') {
      clearInterval(this.remotePeerConnectionStats[streamId].timerId);
      delete this.remotePeerConnectionStats[streamId];
    }
  }

  /**
   * Called to check and start Web Socket connection if it is not started
   */
  checkWebSocketConnection() {
    if (this.webSocketAdaptor == null || this.webSocketAdaptor.isConnected() == false && this.webSocketAdaptor.isConnecting() == false) {
      Logger$2.debug("websocket url : " + this.websocketURL);
      this.webSocketAdaptor = new WebSocketAdaptor({
        websocket_url: this.websocketURL,
        webrtcadaptor: this,
        callback: (info, obj) => {
          if (info == "closed") {
            this.reconnectIfRequired();
          }
          this.notifyEventListeners(info, obj);
        },
        callbackError: (error, message) => {
          this.notifyErrorEventListeners(error, message);
        },
        debug: this.debug
      });
    }
  }

  /**
   * Called to stop Web Socket connection
   * After calling this function, create new WebRTCAdaptor instance, don't use the the same object
   * Because all streams are closed on server side as well when websocket connection is closed.
   */
  closeWebSocket() {
    for (var key in this.remotePeerConnection) {
      this.closePeerConnection(key);
    }
    //free the remote peer connection by initializing again
    this.remotePeerConnection = new Array();
    this.webSocketAdaptor.close();
  }

  /**
   * @param {string} streamId Called to send a text message to other peer in the peer-to-peer sessionnnection is closed.
   * @param {*} definition
   * @param {*} data
   */
  peerMessage(streamId, definition, data) {
    var jsCmd = {
      command: "peerMessageCommand",
      streamId: streamId,
      definition: definition,
      data: data
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to force AMS to send the video with the specified resolution in case of Adaptive Streaming (ABR) enabled.
   * Normally the resolution is automatically determined by AMS according to the network condition.
   * @param {string}  streamId : unique id for the stream
   * @param {*}  resolution : default is auto. You can specify any height value from the ABR list.
   */
  forceStreamQuality(streamId, resolution) {
    var jsCmd = {
      command: "forceStreamQuality",
      streamId: streamId,
      streamHeight: resolution
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called to send data via DataChannel. DataChannel should be enabled on AMS settings.
   * @param {string} streamId : unique id for the stream
   * @param {*}  data : data that you want to send. It may be a text (may in Json format or not) or binary
   */
  sendData(streamId, data) {
    var CHUNK_SIZE = 16000;
    if (this.remotePeerConnection[streamId] !== undefined) {
      var dataChannel = this.remotePeerConnection[streamId].dataChannel;
      if (dataChannel === undefined || dataChannel === null || typeof dataChannel === 'undefined') {
        Logger$2.warn('dataChannel is null or undefined');
        return;
      } else if (dataChannel.readyState !== 'open') {
        Logger$2.warn('dataChannel.readyState is not open: ' + dataChannel.readyState);
        return;
      }
      var length = data.length || data.size || data.byteLength;
      var sent = 0;
      if (typeof data === 'string' || data instanceof String) {
        dataChannel.send(data);
      } else {
        var token = Math.floor(Math.random() * 999999);
        var header = new Int32Array(2);
        header[0] = token;
        header[1] = length;
        dataChannel.send(header);
        var sent = 0;
        while (sent < length) {
          var size = Math.min(length - sent, CHUNK_SIZE);
          var buffer = new Uint8Array(size + 4);
          var tokenArray = new Int32Array(1);
          tokenArray[0] = token;
          buffer.set(new Uint8Array(tokenArray.buffer, 0, 4), 0);
          var chunk = data.slice(sent, sent + size);
          buffer.set(new Uint8Array(chunk), 4);
          sent += size;
          dataChannel.send(buffer);
        }
      }
    } else {
      Logger$2.warn("Send data is called for undefined peer connection with stream id: " + streamId);
    }
  }

  /**
   * Called by user
   * to add SoundMeter to a stream (remote stream)
   * to measure audio level. This sound Meters are added to a map with the key of StreamId.
   * When user called @getSoundLevelList, the instant levels are provided.
   *
   * This list can be used to add a sign to talking participant
   * in conference room. And also to determine the dominant audio to focus that player.
   * @param {MediaStream} stream
   * @param {string} streamId
   */
  enableAudioLevel(stream, streamId) {
    var soundMeter = new SoundMeter(this.mediaManager.audioContext);

    // Put variables in global scope to make them available to the
    // browser console.
    // this function fetches getSoundLevelList and this list get instant levels from soundmeter directly
    // so we don't need to fill inside of levelCallback here, just pass an empty function
    soundMeter.connectToSource(stream, () => {}, function (e) {
      if (e) {
        alert(e);
        return;
      }
      Logger$2.debug("Added sound meter for stream: " + streamId + " = " + soundMeter.instant.toFixed(2));
    });
    this.soundMeters[streamId] = soundMeter;
  }

  /**
   * Called by the user
   * to get the audio levels for the streams for the provided StreamIds
   *
   * @param {*} streamsList
   */
  getSoundLevelList(streamsList) {
    for (var i = 0; i < streamsList.length; i++) {
      this.soundLevelList[streamsList[i]] = this.soundMeters[streamsList[i]].instant.toFixed(2);
    }
    this.notifyEventListeners("gotSoundList", this.soundLevelList);
  }

  /**
   * Called media manaher to get video/audio sender for the local peer connection
   *
   * @param {string} streamId :
   * @param {string} type : "video" or "audio"
   * @returns
   */
  getSender(streamId, type) {
    var sender = null;
    if (this.remotePeerConnection[streamId] != null) {
      sender = this.remotePeerConnection[streamId].getSenders().find(function (s) {
        return s.track.kind == type;
      });
    }
    return sender;
  }

  /**
   * Called by user
   *
   * @param {string} videoTrackId : track id associated with pinned video
   * @param {string} streamId : streamId of the pinned video
   * @param {boolean} enabled : true | false
   * @returns
   */
  assignVideoTrack(videoTrackId, streamId, enabled) {
    var jsCmd = {
      command: "assignVideoTrackCommand",
      streamId: streamId,
      videoTrackId: videoTrackId,
      enabled: enabled
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called by user
   * video tracks may be less than the participants count
   * so these parameters are used for assigning video tracks to participants.
   * This message is used to make pagination in conference.
   * @param {string} streamId
   * @param {number} offset : start index for participant list to play
   * @param {number} size : number of the participants to play
   * @returns
   */
  updateVideoTrackAssignments(streamId, offset, size) {
    var jsCmd = {
      streamId: streamId,
      command: "updateVideoTrackAssignmentsCommand",
      offset: offset,
      size: size
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called by user
   * This message is used to set max video track count in a conference.
   * @param {string} streamId
   * @param {number} maxTrackCount : maximum video track count
   * @returns
   */
  setMaxVideoTrackCount(streamId, maxTrackCount) {
    var jsCmd = {
      streamId: streamId,
      command: "setMaxVideoTrackCountCommand",
      maxTrackCount: maxTrackCount
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Called by user
   * This message is used to send audio level in a conference.
   *
  * IMPORTANT: AMS v2.7+ can get the audio level from the RTP header and sends audio level to the viewers the same way here.
   *  Just one difference, AMS sends the audio level in the range of 0 and 127. 0 is max, 127 is ms
    *  It means that likely you don't need to send UPDATE_AUDIO_LEVEL anymore
   *
   * @param {string} streamId
   * @param {*} value : audio level
   * @returns
   */
  updateAudioLevel(streamId, value) {
    var jsCmd = {
      streamId: streamId,
      eventType: "UPDATE_AUDIO_LEVEL",
      audioLevel: value
    };
    this.sendData(streamId, JSON.stringify(jsCmd));
  }

  /**
   * Called by user
   * This message is used to get debug data from server for debugging purposes in conference.
   * @param {string} streamId
   * @returns
   */
  getDebugInfo(streamId) {
    var jsCmd = {
      streamId: streamId,
      command: "getDebugInfo"
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
  * Register user push notification token to Ant Media Server according to subscriberId and authToken
  * @param {string} subscriberId: subscriber id it can be anything that defines the user
  * @param {string} authToken: JWT token with the issuer field is the subscriberId and secret is the application's subscriberAuthenticationKey, 
  * 							  It's used to authenticate the user - token should be obtained from Ant Media Server Push Notification REST Service
  * 							  or can be generated with JWT by using the secret and issuer fields
  * 
  * @param {string} pushNotificationToken: Push Notification Token that is obtained from the Firebase or APN
  * @param {string} tokenType: It can be "fcm" or "apn" for Firebase Cloud Messaging or Apple Push Notification
  * 
  * @returns Server responds this message with a result.
  * Result message is something like 
  * {
  * 	  "command":"notification",
  *    "success":true or false
  *    "definition":"If success is false, it gives the error message",
  * 	  "information":"If succeess is false, it gives more information to debug if available"
  * 
  * }	 
  *                            
  */
  registerPushNotificationToken(subscriberId, authToken, pushNotificationToken, tokenType) {
    var jsCmd = {
      command: "registerPushNotificationToken",
      subscriberId: subscriberId,
      token: authToken,
      pnsRegistrationToken: pushNotificationToken,
      pnsType: tokenType
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Send push notification to subscribers
   * @param {string} subscriberId: subscriber id it can be anything(email, username, id) that defines the user in your applicaiton
   * @param {string} authToken: JWT token with the issuer field is the subscriberId and secret is the application's subscriberAuthenticationKey,
   *                               It's used to authenticate the user - token should be obtained from Ant Media Server Push Notification REST Service
   *                              or can be generated with JWT by using the secret and issuer fields
   * @param {string} pushNotificationContent: JSON Format - Push Notification Content. If it's not JSON, it will not parsed
   * @param {Array} subscriberIdsToNotify: Array of subscriber ids to notify
   * 
   * @returns Server responds this message with a result.
   * Result message is something like 
   * {
   * 	  "command":"notification",
   *    "success":true or false
   *    "definition":"If success is false, it gives the error message",
   * 	  "information":"If succeess is false, it gives more information to debug if available"
   * 
   * }	 
   */
  sendPushNotification(subscriberId, authToken, pushNotificationContent, subscriberIdsToNotify) {
    //type check for pushNotificationContent if json
    if (typeof pushNotificationContent !== "object") {
      Logger$2.error("Push Notification Content is not JSON format");
      throw new Error("Push Notification Content is not JSON format");
    }

    //type check if subscriberIdsToNotify is array
    if (!Array.isArray(subscriberIdsToNotify)) {
      Logger$2.error("subscriberIdsToNotify is not an array. Please put the subscriber ids to notify in an array such as [user1], [user1, user2]");
      throw new Error("subscriberIdsToNotify is not an array. Please put the subscriber ids to notify in an array such as [user1], [user1, user2]");
    }
    var jsCmd = {
      command: "sendPushNotification",
      subscriberId: subscriberId,
      token: authToken,
      pushNotificationContent: pushNotificationContent,
      subscriberIdsToNotify: subscriberIdsToNotify
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * Send push notification to topic
   * @param {string} subscriberId: subscriber id it can be anything(email, username, id) that defines the user in your applicaiton
   * @param {string} authToken: JWT token with the issuer field is the subscriberId and secret is the application's subscriberAuthenticationKey,	
   *                              It's used to authenticate the user - token should be obtained from Ant Media Server Push Notification REST Service
   *                             or can be generated with JWT by using the secret and issuer fields
   * @param {string} pushNotificationContent:JSON Format - Push Notification Content. If it's not JSON, it will not parsed
   * @param {string} topic: Topic to send push notification
   * 
   * @returns Server responds this message with a result.
   * Result message is something like
   * {
   *     "command":"notification",
   *     "success":true or false
   *     "definition":"If success is false, it gives the error message",
   *     "information":"If succeess is false, it gives more information to debug if available"
   * }
   * 
   */
  sendPushNotificationToTopic(subscriberId, authToken, pushNotificationContent, topic) {
    //type check for pushNotificationContent if json
    if (typeof pushNotificationContent !== "object") {
      Logger$2.error("Push Notification Content is not JSON format");
      throw new Error("Push Notification Content is not JSON format");
    }
    var jsCmd = {
      command: "sendPushNotification",
      subscriberId: subscriberId,
      token: authToken,
      pushNotificationContent: pushNotificationContent,
      topic: topic
    };
    this.webSocketAdaptor.send(JSON.stringify(jsCmd));
  }

  /**
   * The following messages are forwarded to MediaManager. They are also kept here because of backward compatibility.
   * You can find the details about them in media_manager.js
   * @param {string} streamId
   * @returns 
   */
  turnOffLocalCamera(streamId) {
    return this.mediaManager.turnOffLocalCamera(streamId);
  }
  /**
   *
   * @param {string} streamId
   * @returns
   */
  turnOnLocalCamera(streamId) {
    return this.mediaManager.turnOnLocalCamera(streamId);
  }
  muteLocalMic() {
    this.mediaManager.muteLocalMic();
  }
  unmuteLocalMic() {
    this.mediaManager.unmuteLocalMic();
  }
  /**
   *
   * @param {string} streamId
   * @returns
   */
  switchDesktopCapture(streamId) {
    return this.mediaManager.switchDesktopCapture(streamId);
  }

  /**
   * Switch to Video camera capture again. Updates the video track on the fly as well.
   * @param {string} streamId
   * @param {string} deviceId
   * @returns {Promise}
   */
  switchVideoCameraCapture(streamId, deviceId, onEndedCallback) {
    return this.mediaManager.switchVideoCameraCapture(streamId, deviceId, onEndedCallback);
  }

  /**
   * Update video track of the stream. Updates the video track on the fly as well.
   * @param {string} stream
   * @param {string} streamId
   * @param {function} onEndedCallback
   * @param {boolean} stopDesktop
   * @returns {Promise}
   */
  updateVideoTrack(stream, streamId, onEndedCallback, stopDesktop) {
    return this.mediaManager.updateVideoTrack(stream, streamId, onEndedCallback, stopDesktop);
  }

  /**
   * Update audio track of the stream. Updates the audio track on the fly as well. It just replaces the audio track with the first one in the stream
   * @param {*} stream
   * @param {*} streamId
   * @param {*} onEndedCallback
   * @returns
   */
  updateAudioTrack(stream, streamId, onEndedCallback) {
    return this.mediaManager.updateAudioTrack(stream, streamId, onEndedCallback);
  }

  /**
   * Called by User
   * to switch between front and back camera on mobile devices
   *
   * @param {string} streamId Id of the stream to be changed.
   * @param {string} facingMode it can be ""user" or "environment"
   *
   * This method is used to switch front and back camera.
   */
  switchVideoCameraFacingMode(streamId, facingMode) {
    return this.mediaManager.switchVideoCameraFacingMode(streamId, facingMode);
  }
  /**
   *
   * @param {string} streamId
   * @returns
   */
  switchDesktopCaptureWithCamera(streamId) {
    return this.mediaManager.switchDesktopCaptureWithCamera(streamId);
  }
  /**
   *
   * @param {string} streamId
   * @param {string} deviceId
   * @returns
   */
  switchAudioInputSource(streamId, deviceId) {
    return this.mediaManager.switchAudioInputSource(streamId, deviceId);
  }
  /**
   *
   * @param {number} volumeLevel
   */
  setVolumeLevel(volumeLevel) {
    this.mediaManager.setVolumeLevel(volumeLevel);
  }
  /**
   *
   * Using sound meter in order to get audio level may cause audio distortion in Windows browsers
   * @param {Function} levelCallback
   * @param {number} period
   * @returns
   */
  enableAudioLevelForLocalStream(levelCallback, period) {
    return this.mediaManager.enableAudioLevelForLocalStream(levelCallback);
  }
  disableAudioLevelForLocalStream() {
    this.mediaManager.disableAudioLevelForLocalStream();
  }
  /**
   *
   * @param {object} constraints
   * @returns
   */
  applyConstraints(constraints) {
    return this.mediaManager.applyConstraints(constraints);
  }
  /**
   *
   * @param {number} bandwidth
   * @param {string} streamId
   */
  changeBandwidth(bandwidth, streamId) {
    this.mediaManager.changeBandwidth(bandwidth, streamId);
  }
  enableAudioLevelWhenMuted() {
    return this.mediaManager.enableAudioLevelWhenMuted();
  }
  disableAudioLevelWhenMuted() {
    this.mediaManager.disableAudioLevelWhenMuted();
  }
  /**
   *
   * @param {string} streamId
   * @returns
   */
  getVideoSender(streamId) {
    return this.mediaManager.getVideoSender(streamId);
  }
  /**
   *
   * @param {MediaStreamConstraints} mediaConstraints : media constraints to be used for opening the stream
   * @param {string} streamId : id of the stream to replace tracks with
   * @returns
   */
  openStream(mediaConstraints, streamId) {
    return this.mediaManager.openStream(mediaConstraints, streamId);
  }
  closeStream() {
    return this.mediaManager.closeStream();
  }
}

/* The Information Callbacks Called by This Class */
//TODO:

/* The Error Callbacks Called by This Class */
//TODO:
/**
 * @type {Array<Function>}
 */
_defineProperty(WebRTCAdaptor, "pluginInitMethods", new Array());
var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
(function () {
  var x;
  function aa(a) {
    var b = 0;
    return function () {
      return b < a.length ? {
        done: !1,
        value: a[b++]
      } : {
        done: !0
      };
    };
  }
  var ba = "function" == typeof Object.defineProperties ? Object.defineProperty : function (a, b, c) {
    if (a == Array.prototype || a == Object.prototype) return a;
    a[b] = c.value;
    return a;
  };
  function ca(a) {
    a = ["object" == typeof globalThis && globalThis, a, "object" == typeof window && window, "object" == typeof self && self, "object" == typeof commonjsGlobal && commonjsGlobal];
    for (var b = 0; b < a.length; ++b) {
      var c = a[b];
      if (c && c.Math == Math) return c;
    }
    throw Error("Cannot find global object");
  }
  var y = ca(this);
  function z(a, b) {
    if (b) a: {
      var c = y;
      a = a.split(".");
      for (var d = 0; d < a.length - 1; d++) {
        var e = a[d];
        if (!(e in c)) break a;
        c = c[e];
      }
      a = a[a.length - 1];
      d = c[a];
      b = b(d);
      b != d && null != b && ba(c, a, {
        configurable: !0,
        writable: !0,
        value: b
      });
    }
  }
  z("Symbol", function (a) {
    function b(g) {
      if (this instanceof b) throw new TypeError("Symbol is not a constructor");
      return new c(d + (g || "") + "_" + e++, g);
    }
    function c(g, f) {
      this.h = g;
      ba(this, "description", {
        configurable: !0,
        writable: !0,
        value: f
      });
    }
    if (a) return a;
    c.prototype.toString = function () {
      return this.h;
    };
    var d = "jscomp_symbol_" + (1E9 * Math.random() >>> 0) + "_",
      e = 0;
    return b;
  });
  z("Symbol.iterator", function (a) {
    if (a) return a;
    a = Symbol("Symbol.iterator");
    for (var b = "Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "), c = 0; c < b.length; c++) {
      var d = y[b[c]];
      "function" === typeof d && "function" != typeof d.prototype[a] && ba(d.prototype, a, {
        configurable: !0,
        writable: !0,
        value: function () {
          return da(aa(this));
        }
      });
    }
    return a;
  });
  function da(a) {
    a = {
      next: a
    };
    a[Symbol.iterator] = function () {
      return this;
    };
    return a;
  }
  function A(a) {
    var b = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
    return b ? b.call(a) : {
      next: aa(a)
    };
  }
  function ea(a) {
    if (!(a instanceof Array)) {
      a = A(a);
      for (var b, c = []; !(b = a.next()).done;) c.push(b.value);
      a = c;
    }
    return a;
  }
  var fa = "function" == typeof Object.assign ? Object.assign : function (a, b) {
    for (var c = 1; c < arguments.length; c++) {
      var d = arguments[c];
      if (d) for (var e in d) Object.prototype.hasOwnProperty.call(d, e) && (a[e] = d[e]);
    }
    return a;
  };
  z("Object.assign", function (a) {
    return a || fa;
  });
  var ha = "function" == typeof Object.create ? Object.create : function (a) {
      function b() {}
      b.prototype = a;
      return new b();
    },
    ia;
  if ("function" == typeof Object.setPrototypeOf) ia = Object.setPrototypeOf;else {
    var ja;
    a: {
      var ka = {
          a: !0
        },
        la = {};
      try {
        la.__proto__ = ka;
        ja = la.a;
        break a;
      } catch (a) {}
      ja = !1;
    }
    ia = ja ? function (a, b) {
      a.__proto__ = b;
      if (a.__proto__ !== b) throw new TypeError(a + " is not extensible");
      return a;
    } : null;
  }
  var ma = ia;
  function na(a, b) {
    a.prototype = ha(b.prototype);
    a.prototype.constructor = a;
    if (ma) ma(a, b);else for (var c in b) if ("prototype" != c) if (Object.defineProperties) {
      var d = Object.getOwnPropertyDescriptor(b, c);
      d && Object.defineProperty(a, c, d);
    } else a[c] = b[c];
    a.za = b.prototype;
  }
  function oa() {
    this.m = !1;
    this.j = null;
    this.i = void 0;
    this.h = 1;
    this.v = this.s = 0;
    this.l = null;
  }
  function pa(a) {
    if (a.m) throw new TypeError("Generator is already running");
    a.m = !0;
  }
  oa.prototype.u = function (a) {
    this.i = a;
  };
  function qa(a, b) {
    a.l = {
      ma: b,
      na: !0
    };
    a.h = a.s || a.v;
  }
  oa.prototype.return = function (a) {
    this.l = {
      return: a
    };
    this.h = this.v;
  };
  function D(a, b, c) {
    a.h = c;
    return {
      value: b
    };
  }
  function ra(a) {
    this.h = new oa();
    this.i = a;
  }
  function sa(a, b) {
    pa(a.h);
    var c = a.h.j;
    if (c) return ta(a, "return" in c ? c["return"] : function (d) {
      return {
        value: d,
        done: !0
      };
    }, b, a.h.return);
    a.h.return(b);
    return ua(a);
  }
  function ta(a, b, c, d) {
    try {
      var e = b.call(a.h.j, c);
      if (!(e instanceof Object)) throw new TypeError("Iterator result " + e + " is not an object");
      if (!e.done) return a.h.m = !1, e;
      var g = e.value;
    } catch (f) {
      return a.h.j = null, qa(a.h, f), ua(a);
    }
    a.h.j = null;
    d.call(a.h, g);
    return ua(a);
  }
  function ua(a) {
    for (; a.h.h;) try {
      var b = a.i(a.h);
      if (b) return a.h.m = !1, {
        value: b.value,
        done: !1
      };
    } catch (c) {
      a.h.i = void 0, qa(a.h, c);
    }
    a.h.m = !1;
    if (a.h.l) {
      b = a.h.l;
      a.h.l = null;
      if (b.na) throw b.ma;
      return {
        value: b.return,
        done: !0
      };
    }
    return {
      value: void 0,
      done: !0
    };
  }
  function va(a) {
    this.next = function (b) {
      pa(a.h);
      a.h.j ? b = ta(a, a.h.j.next, b, a.h.u) : (a.h.u(b), b = ua(a));
      return b;
    };
    this.throw = function (b) {
      pa(a.h);
      a.h.j ? b = ta(a, a.h.j["throw"], b, a.h.u) : (qa(a.h, b), b = ua(a));
      return b;
    };
    this.return = function (b) {
      return sa(a, b);
    };
    this[Symbol.iterator] = function () {
      return this;
    };
  }
  function wa(a) {
    function b(d) {
      return a.next(d);
    }
    function c(d) {
      return a.throw(d);
    }
    return new Promise(function (d, e) {
      function g(f) {
        f.done ? d(f.value) : Promise.resolve(f.value).then(b, c).then(g, e);
      }
      g(a.next());
    });
  }
  function E(a) {
    return wa(new va(new ra(a)));
  }
  z("Promise", function (a) {
    function b(f) {
      this.i = 0;
      this.j = void 0;
      this.h = [];
      this.u = !1;
      var h = this.l();
      try {
        f(h.resolve, h.reject);
      } catch (k) {
        h.reject(k);
      }
    }
    function c() {
      this.h = null;
    }
    function d(f) {
      return f instanceof b ? f : new b(function (h) {
        h(f);
      });
    }
    if (a) return a;
    c.prototype.i = function (f) {
      if (null == this.h) {
        this.h = [];
        var h = this;
        this.j(function () {
          h.m();
        });
      }
      this.h.push(f);
    };
    var e = y.setTimeout;
    c.prototype.j = function (f) {
      e(f, 0);
    };
    c.prototype.m = function () {
      for (; this.h && this.h.length;) {
        var f = this.h;
        this.h = [];
        for (var h = 0; h < f.length; ++h) {
          var k = f[h];
          f[h] = null;
          try {
            k();
          } catch (l) {
            this.l(l);
          }
        }
      }
      this.h = null;
    };
    c.prototype.l = function (f) {
      this.j(function () {
        throw f;
      });
    };
    b.prototype.l = function () {
      function f(l) {
        return function (m) {
          k || (k = !0, l.call(h, m));
        };
      }
      var h = this,
        k = !1;
      return {
        resolve: f(this.I),
        reject: f(this.m)
      };
    };
    b.prototype.I = function (f) {
      if (f === this) this.m(new TypeError("A Promise cannot resolve to itself"));else if (f instanceof b) this.L(f);else {
        a: switch (typeof f) {
          case "object":
            var h = null != f;
            break a;
          case "function":
            h = !0;
            break a;
          default:
            h = !1;
        }
        h ? this.F(f) : this.s(f);
      }
    };
    b.prototype.F = function (f) {
      var h = void 0;
      try {
        h = f.then;
      } catch (k) {
        this.m(k);
        return;
      }
      "function" == typeof h ? this.M(h, f) : this.s(f);
    };
    b.prototype.m = function (f) {
      this.v(2, f);
    };
    b.prototype.s = function (f) {
      this.v(1, f);
    };
    b.prototype.v = function (f, h) {
      if (0 != this.i) throw Error("Cannot settle(" + f + ", " + h + "): Promise already settled in state" + this.i);
      this.i = f;
      this.j = h;
      2 === this.i && this.K();
      this.H();
    };
    b.prototype.K = function () {
      var f = this;
      e(function () {
        if (f.D()) {
          var h = y.console;
          "undefined" !== typeof h && h.error(f.j);
        }
      }, 1);
    };
    b.prototype.D = function () {
      if (this.u) return !1;
      var f = y.CustomEvent,
        h = y.Event,
        k = y.dispatchEvent;
      if ("undefined" === typeof k) return !0;
      "function" === typeof f ? f = new f("unhandledrejection", {
        cancelable: !0
      }) : "function" === typeof h ? f = new h("unhandledrejection", {
        cancelable: !0
      }) : (f = y.document.createEvent("CustomEvent"), f.initCustomEvent("unhandledrejection", !1, !0, f));
      f.promise = this;
      f.reason = this.j;
      return k(f);
    };
    b.prototype.H = function () {
      if (null != this.h) {
        for (var f = 0; f < this.h.length; ++f) g.i(this.h[f]);
        this.h = null;
      }
    };
    var g = new c();
    b.prototype.L = function (f) {
      var h = this.l();
      f.T(h.resolve, h.reject);
    };
    b.prototype.M = function (f, h) {
      var k = this.l();
      try {
        f.call(h, k.resolve, k.reject);
      } catch (l) {
        k.reject(l);
      }
    };
    b.prototype.then = function (f, h) {
      function k(p, n) {
        return "function" == typeof p ? function (q) {
          try {
            l(p(q));
          } catch (t) {
            m(t);
          }
        } : n;
      }
      var l,
        m,
        r = new b(function (p, n) {
          l = p;
          m = n;
        });
      this.T(k(f, l), k(h, m));
      return r;
    };
    b.prototype.catch = function (f) {
      return this.then(void 0, f);
    };
    b.prototype.T = function (f, h) {
      function k() {
        switch (l.i) {
          case 1:
            f(l.j);
            break;
          case 2:
            h(l.j);
            break;
          default:
            throw Error("Unexpected state: " + l.i);
        }
      }
      var l = this;
      null == this.h ? g.i(k) : this.h.push(k);
      this.u = !0;
    };
    b.resolve = d;
    b.reject = function (f) {
      return new b(function (h, k) {
        k(f);
      });
    };
    b.race = function (f) {
      return new b(function (h, k) {
        for (var l = A(f), m = l.next(); !m.done; m = l.next()) d(m.value).T(h, k);
      });
    };
    b.all = function (f) {
      var h = A(f),
        k = h.next();
      return k.done ? d([]) : new b(function (l, m) {
        function r(q) {
          return function (t) {
            p[q] = t;
            n--;
            0 == n && l(p);
          };
        }
        var p = [],
          n = 0;
        do p.push(void 0), n++, d(k.value).T(r(p.length - 1), m), k = h.next(); while (!k.done);
      });
    };
    return b;
  });
  function xa(a, b) {
    a instanceof String && (a += "");
    var c = 0,
      d = !1,
      e = {
        next: function () {
          if (!d && c < a.length) {
            var g = c++;
            return {
              value: b(g, a[g]),
              done: !1
            };
          }
          d = !0;
          return {
            done: !0,
            value: void 0
          };
        }
      };
    e[Symbol.iterator] = function () {
      return e;
    };
    return e;
  }
  z("Array.prototype.keys", function (a) {
    return a ? a : function () {
      return xa(this, function (b) {
        return b;
      });
    };
  });
  z("Array.prototype.fill", function (a) {
    return a ? a : function (b, c, d) {
      var e = this.length || 0;
      0 > c && (c = Math.max(0, e + c));
      if (null == d || d > e) d = e;
      d = Number(d);
      0 > d && (d = Math.max(0, e + d));
      for (c = Number(c || 0); c < d; c++) this[c] = b;
      return this;
    };
  });
  function F(a) {
    return a ? a : Array.prototype.fill;
  }
  z("Int8Array.prototype.fill", F);
  z("Uint8Array.prototype.fill", F);
  z("Uint8ClampedArray.prototype.fill", F);
  z("Int16Array.prototype.fill", F);
  z("Uint16Array.prototype.fill", F);
  z("Int32Array.prototype.fill", F);
  z("Uint32Array.prototype.fill", F);
  z("Float32Array.prototype.fill", F);
  z("Float64Array.prototype.fill", F);
  z("Object.is", function (a) {
    return a ? a : function (b, c) {
      return b === c ? 0 !== b || 1 / b === 1 / c : b !== b && c !== c;
    };
  });
  z("Array.prototype.includes", function (a) {
    return a ? a : function (b, c) {
      var d = this;
      d instanceof String && (d = String(d));
      var e = d.length;
      c = c || 0;
      for (0 > c && (c = Math.max(c + e, 0)); c < e; c++) {
        var g = d[c];
        if (g === b || Object.is(g, b)) return !0;
      }
      return !1;
    };
  });
  z("String.prototype.includes", function (a) {
    return a ? a : function (b, c) {
      if (null == this) throw new TypeError("The 'this' value for String.prototype.includes must not be null or undefined");
      if (b instanceof RegExp) throw new TypeError("First argument to String.prototype.includes must not be a regular expression");
      return -1 !== this.indexOf(b, c || 0);
    };
  });
  var ya = this || self;
  function Aa(a, b) {
    a = a.split(".");
    var c = ya;
    a[0] in c || "undefined" == typeof c.execScript || c.execScript("var " + a[0]);
    for (var d; a.length && (d = a.shift());) a.length || void 0 === b ? c[d] && c[d] !== Object.prototype[d] ? c = c[d] : c = c[d] = {} : c[d] = b;
  }
  function Ba(a) {
    var b;
    a: {
      if (b = ya.navigator) if (b = b.userAgent) break a;
      b = "";
    }
    return -1 != b.indexOf(a);
  }
  var Ca = Array.prototype.map ? function (a, b) {
    return Array.prototype.map.call(a, b, void 0);
  } : function (a, b) {
    for (var c = a.length, d = Array(c), e = "string" === typeof a ? a.split("") : a, g = 0; g < c; g++) g in e && (d[g] = b.call(void 0, e[g], g, a));
    return d;
  };
  var Da = {},
    Ea = null;
  function Fa(a) {
    var b = a.length,
      c = 3 * b / 4;
    c % 3 ? c = Math.floor(c) : -1 != "=.".indexOf(a[b - 1]) && (c = -1 != "=.".indexOf(a[b - 2]) ? c - 2 : c - 1);
    var d = new Uint8Array(c),
      e = 0;
    Ga(a, function (g) {
      d[e++] = g;
    });
    return e !== c ? d.subarray(0, e) : d;
  }
  function Ga(a, b) {
    function c(k) {
      for (; d < a.length;) {
        var l = a.charAt(d++),
          m = Ea[l];
        if (null != m) return m;
        if (!/^[\s\xa0]*$/.test(l)) throw Error("Unknown base64 encoding at char: " + l);
      }
      return k;
    }
    Ha();
    for (var d = 0;;) {
      var e = c(-1),
        g = c(0),
        f = c(64),
        h = c(64);
      if (64 === h && -1 === e) break;
      b(e << 2 | g >> 4);
      64 != f && (b(g << 4 & 240 | f >> 2), 64 != h && b(f << 6 & 192 | h));
    }
  }
  function Ha() {
    if (!Ea) {
      Ea = {};
      for (var a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""), b = ["+/=", "+/", "-_=", "-_.", "-_"], c = 0; 5 > c; c++) {
        var d = a.concat(b[c].split(""));
        Da[c] = d;
        for (var e = 0; e < d.length; e++) {
          var g = d[e];
          void 0 === Ea[g] && (Ea[g] = e);
        }
      }
    }
  }
  var Ia = "undefined" !== typeof Uint8Array,
    Ja = !(Ba("Trident") || Ba("MSIE")) && "function" === typeof ya.btoa;
  function Ka(a) {
    if (!Ja) {
      var b;
      void 0 === b && (b = 0);
      Ha();
      b = Da[b];
      for (var c = Array(Math.floor(a.length / 3)), d = b[64] || "", e = 0, g = 0; e < a.length - 2; e += 3) {
        var f = a[e],
          h = a[e + 1],
          k = a[e + 2],
          l = b[f >> 2];
        f = b[(f & 3) << 4 | h >> 4];
        h = b[(h & 15) << 2 | k >> 6];
        k = b[k & 63];
        c[g++] = l + f + h + k;
      }
      l = 0;
      k = d;
      switch (a.length - e) {
        case 2:
          l = a[e + 1], k = b[(l & 15) << 2] || d;
        case 1:
          a = a[e], c[g] = b[a >> 2] + b[(a & 3) << 4 | l >> 4] + k + d;
      }
      return c.join("");
    }
    for (b = ""; 10240 < a.length;) b += String.fromCharCode.apply(null, a.subarray(0, 10240)), a = a.subarray(10240);
    b += String.fromCharCode.apply(null, a);
    return btoa(b);
  }
  var La = RegExp("[-_.]", "g");
  function Ma(a) {
    switch (a) {
      case "-":
        return "+";
      case "_":
        return "/";
      case ".":
        return "=";
      default:
        return "";
    }
  }
  function Na(a) {
    if (!Ja) return Fa(a);
    La.test(a) && (a = a.replace(La, Ma));
    a = atob(a);
    for (var b = new Uint8Array(a.length), c = 0; c < a.length; c++) b[c] = a.charCodeAt(c);
    return b;
  }
  var Oa;
  function Pa() {
    return Oa || (Oa = new Uint8Array(0));
  }
  var Qa = {};
  var Ra = "function" === typeof Uint8Array.prototype.slice,
    G = 0,
    H = 0;
  function Sa(a) {
    var b = 0 > a;
    a = Math.abs(a);
    var c = a >>> 0;
    a = Math.floor((a - c) / 4294967296);
    b && (c = A(Ta(c, a)), b = c.next().value, a = c.next().value, c = b);
    G = c >>> 0;
    H = a >>> 0;
  }
  var Ua = "function" === typeof BigInt;
  function Ta(a, b) {
    b = ~b;
    a ? a = ~a + 1 : b += 1;
    return [a, b];
  }
  function Va(a, b) {
    this.i = a >>> 0;
    this.h = b >>> 0;
  }
  function Wa(a) {
    if (!a) return Xa || (Xa = new Va(0, 0));
    if (!/^-?\d+$/.test(a)) return null;
    if (16 > a.length) Sa(Number(a));else if (Ua) a = BigInt(a), G = Number(a & BigInt(4294967295)) >>> 0, H = Number(a >> BigInt(32) & BigInt(4294967295));else {
      var b = +("-" === a[0]);
      H = G = 0;
      for (var c = a.length, d = b, e = (c - b) % 6 + b; e <= c; d = e, e += 6) d = Number(a.slice(d, e)), H *= 1E6, G = 1E6 * G + d, 4294967296 <= G && (H += G / 4294967296 | 0, G %= 4294967296);
      b && (b = A(Ta(G, H)), a = b.next().value, b = b.next().value, G = a, H = b);
    }
    return new Va(G, H);
  }
  var Xa;
  function Ya(a, b) {
    return Error("Invalid wire type: " + a + " (at position " + b + ")");
  }
  function Za() {
    return Error("Failed to read varint, encoding is invalid.");
  }
  function $a(a, b) {
    return Error("Tried to read past the end of the data " + b + " > " + a);
  }
  function K() {
    throw Error("Invalid UTF8");
  }
  function ab(a, b) {
    b = String.fromCharCode.apply(null, b);
    return null == a ? b : a + b;
  }
  var bb = void 0,
    cb,
    db = "undefined" !== typeof TextDecoder,
    eb,
    fb = "undefined" !== typeof TextEncoder;
  var gb;
  function hb(a) {
    if (a !== Qa) throw Error("illegal external caller");
  }
  function ib(a, b) {
    hb(b);
    this.V = a;
    if (null != a && 0 === a.length) throw Error("ByteString should be constructed with non-empty values");
  }
  function jb() {
    return gb || (gb = new ib(null, Qa));
  }
  function kb(a) {
    hb(Qa);
    var b = a.V;
    b = null == b || Ia && null != b && b instanceof Uint8Array ? b : "string" === typeof b ? Na(b) : null;
    return null == b ? b : a.V = b;
  }
  function lb(a) {
    if ("string" === typeof a) return {
      buffer: Na(a),
      C: !1
    };
    if (Array.isArray(a)) return {
      buffer: new Uint8Array(a),
      C: !1
    };
    if (a.constructor === Uint8Array) return {
      buffer: a,
      C: !1
    };
    if (a.constructor === ArrayBuffer) return {
      buffer: new Uint8Array(a),
      C: !1
    };
    if (a.constructor === ib) return {
      buffer: kb(a) || Pa(),
      C: !0
    };
    if (a instanceof Uint8Array) return {
      buffer: new Uint8Array(a.buffer, a.byteOffset, a.byteLength),
      C: !1
    };
    throw Error("Type not convertible to a Uint8Array, expected a Uint8Array, an ArrayBuffer, a base64 encoded string, a ByteString or an Array of numbers");
  }
  function mb(a, b) {
    this.i = null;
    this.m = !1;
    this.h = this.j = this.l = 0;
    nb(this, a, b);
  }
  function nb(a, b, c) {
    c = void 0 === c ? {} : c;
    a.S = void 0 === c.S ? !1 : c.S;
    b && (b = lb(b), a.i = b.buffer, a.m = b.C, a.l = 0, a.j = a.i.length, a.h = a.l);
  }
  mb.prototype.reset = function () {
    this.h = this.l;
  };
  function L(a, b) {
    a.h = b;
    if (b > a.j) throw $a(a.j, b);
  }
  function ob(a) {
    var b = a.i,
      c = a.h,
      d = b[c++],
      e = d & 127;
    if (d & 128 && (d = b[c++], e |= (d & 127) << 7, d & 128 && (d = b[c++], e |= (d & 127) << 14, d & 128 && (d = b[c++], e |= (d & 127) << 21, d & 128 && (d = b[c++], e |= d << 28, d & 128 && b[c++] & 128 && b[c++] & 128 && b[c++] & 128 && b[c++] & 128 && b[c++] & 128))))) throw Za();
    L(a, c);
    return e;
  }
  function pb(a, b) {
    if (0 > b) throw Error("Tried to read a negative byte length: " + b);
    var c = a.h,
      d = c + b;
    if (d > a.j) throw $a(b, a.j - c);
    a.h = d;
    return c;
  }
  var qb = [];
  function rb() {
    this.h = [];
  }
  rb.prototype.length = function () {
    return this.h.length;
  };
  rb.prototype.end = function () {
    var a = this.h;
    this.h = [];
    return a;
  };
  function sb(a, b, c) {
    for (; 0 < c || 127 < b;) a.h.push(b & 127 | 128), b = (b >>> 7 | c << 25) >>> 0, c >>>= 7;
    a.h.push(b);
  }
  function M(a, b) {
    for (; 127 < b;) a.h.push(b & 127 | 128), b >>>= 7;
    a.h.push(b);
  }
  function tb(a, b) {
    if (qb.length) {
      var c = qb.pop();
      nb(c, a, b);
      a = c;
    } else a = new mb(a, b);
    this.h = a;
    this.j = this.h.h;
    this.i = this.l = -1;
    this.setOptions(b);
  }
  tb.prototype.setOptions = function (a) {
    a = void 0 === a ? {} : a;
    this.ca = void 0 === a.ca ? !1 : a.ca;
  };
  tb.prototype.reset = function () {
    this.h.reset();
    this.j = this.h.h;
    this.i = this.l = -1;
  };
  function ub(a) {
    var b = a.h;
    if (b.h == b.j) return !1;
    a.j = a.h.h;
    var c = ob(a.h) >>> 0;
    b = c >>> 3;
    c &= 7;
    if (!(0 <= c && 5 >= c)) throw Ya(c, a.j);
    if (1 > b) throw Error("Invalid field number: " + b + " (at position " + a.j + ")");
    a.l = b;
    a.i = c;
    return !0;
  }
  function vb(a) {
    switch (a.i) {
      case 0:
        if (0 != a.i) vb(a);else a: {
          a = a.h;
          for (var b = a.h, c = b + 10, d = a.i; b < c;) if (0 === (d[b++] & 128)) {
            L(a, b);
            break a;
          }
          throw Za();
        }
        break;
      case 1:
        a = a.h;
        L(a, a.h + 8);
        break;
      case 2:
        2 != a.i ? vb(a) : (b = ob(a.h) >>> 0, a = a.h, L(a, a.h + b));
        break;
      case 5:
        a = a.h;
        L(a, a.h + 4);
        break;
      case 3:
        b = a.l;
        do {
          if (!ub(a)) throw Error("Unmatched start-group tag: stream EOF");
          if (4 == a.i) {
            if (a.l != b) throw Error("Unmatched end-group tag");
            break;
          }
          vb(a);
        } while (1);
        break;
      default:
        throw Ya(a.i, a.j);
    }
  }
  var wb = [];
  function xb() {
    this.j = [];
    this.i = 0;
    this.h = new rb();
  }
  function N(a, b) {
    0 !== b.length && (a.j.push(b), a.i += b.length);
  }
  function yb(a, b) {
    if (b = b.R) {
      N(a, a.h.end());
      for (var c = 0; c < b.length; c++) N(a, kb(b[c]) || Pa());
    }
  }
  var O = "function" === typeof Symbol && "symbol" === typeof Symbol() ? Symbol() : void 0;
  function P(a, b) {
    if (O) return a[O] |= b;
    if (void 0 !== a.A) return a.A |= b;
    Object.defineProperties(a, {
      A: {
        value: b,
        configurable: !0,
        writable: !0,
        enumerable: !1
      }
    });
    return b;
  }
  function zb(a, b) {
    O ? a[O] && (a[O] &= ~b) : void 0 !== a.A && (a.A &= ~b);
  }
  function Q(a) {
    var b;
    O ? b = a[O] : b = a.A;
    return null == b ? 0 : b;
  }
  function R(a, b) {
    O ? a[O] = b : void 0 !== a.A ? a.A = b : Object.defineProperties(a, {
      A: {
        value: b,
        configurable: !0,
        writable: !0,
        enumerable: !1
      }
    });
  }
  function Ab(a) {
    P(a, 1);
    return a;
  }
  function Bb(a, b) {
    R(b, (a | 0) & -51);
  }
  function Cb(a, b) {
    R(b, (a | 18) & -41);
  }
  var Db = {};
  function Eb(a) {
    return null !== a && "object" === typeof a && !Array.isArray(a) && a.constructor === Object;
  }
  var Fb,
    Gb = [];
  R(Gb, 23);
  Fb = Object.freeze(Gb);
  function Hb(a) {
    if (Q(a.o) & 2) throw Error("Cannot mutate an immutable Message");
  }
  function Ib(a) {
    var b = a.length;
    (b = b ? a[b - 1] : void 0) && Eb(b) ? b.g = 1 : (b = {}, a.push((b.g = 1, b)));
  }
  function Jb(a) {
    var b = a.i + a.G;
    return a.B || (a.B = a.o[b] = {});
  }
  function S(a, b) {
    return -1 === b ? null : b >= a.i ? a.B ? a.B[b] : void 0 : a.o[b + a.G];
  }
  function U(a, b, c, d) {
    Hb(a);
    Kb(a, b, c, d);
  }
  function Kb(a, b, c, d) {
    a.j && (a.j = void 0);
    b >= a.i || d ? Jb(a)[b] = c : (a.o[b + a.G] = c, (a = a.B) && b in a && delete a[b]);
  }
  function Lb(a, b, c, d) {
    var e = S(a, b);
    Array.isArray(e) || (e = Fb);
    var g = Q(e);
    g & 1 || Ab(e);
    if (d) g & 2 || P(e, 2), c & 1 || Object.freeze(e);else {
      d = !(c & 2);
      var f = g & 2;
      c & 1 || !f ? d && g & 16 && !f && zb(e, 16) : (e = Ab(Array.prototype.slice.call(e)), Kb(a, b, e));
    }
    return e;
  }
  function Mb(a, b) {
    var c = S(a, b);
    var d = null == c ? c : "number" === typeof c || "NaN" === c || "Infinity" === c || "-Infinity" === c ? Number(c) : void 0;
    null != d && d !== c && Kb(a, b, d);
    return d;
  }
  function Nb(a, b, c, d, e) {
    a.h || (a.h = {});
    var g = a.h[c],
      f = Lb(a, c, 3, e);
    if (!g) {
      var h = f;
      g = [];
      var k = !!(Q(a.o) & 16);
      f = !!(Q(h) & 2);
      var l = h;
      !e && f && (h = Array.prototype.slice.call(h));
      for (var m = f, r = 0; r < h.length; r++) {
        var p = h[r];
        var n = b,
          q = !1;
        q = void 0 === q ? !1 : q;
        p = Array.isArray(p) ? new n(p) : q ? new n() : void 0;
        if (void 0 !== p) {
          n = p.o;
          var t = q = Q(n);
          f && (t |= 2);
          k && (t |= 16);
          t != q && R(n, t);
          n = t;
          m = m || !!(2 & n);
          g.push(p);
        }
      }
      a.h[c] = g;
      k = Q(h);
      b = k | 33;
      b = m ? b & -9 : b | 8;
      k != b && (m = h, Object.isFrozen(m) && (m = Array.prototype.slice.call(m)), R(m, b), h = m);
      l !== h && Kb(a, c, h);
      (e || d && f) && P(g, 2);
      d && Object.freeze(g);
      return g;
    }
    e || (e = Object.isFrozen(g), d && !e ? Object.freeze(g) : !d && e && (g = Array.prototype.slice.call(g), a.h[c] = g));
    return g;
  }
  function Ob(a, b, c) {
    var d = !!(Q(a.o) & 2);
    b = Nb(a, b, c, d, d);
    a = Lb(a, c, 3, d);
    if (!(d || Q(a) & 8)) {
      for (d = 0; d < b.length; d++) {
        c = b[d];
        if (Q(c.o) & 2) {
          var e = Pb(c, !1);
          e.j = c;
        } else e = c;
        c !== e && (b[d] = e, a[d] = e.o);
      }
      P(a, 8);
    }
    return b;
  }
  function V(a, b, c) {
    if (null != c && "number" !== typeof c) throw Error("Value of float/double field must be a number|null|undefined, found " + typeof c + ": " + c);
    U(a, b, c);
  }
  function Qb(a, b, c, d, e) {
    Hb(a);
    var g = Nb(a, c, b, !1, !1);
    c = null != d ? d : new c();
    a = Lb(a, b, 2, !1);
    void 0 != e ? (g.splice(e, 0, c), a.splice(e, 0, c.o)) : (g.push(c), a.push(c.o));
    c.C() && zb(a, 8);
    return c;
  }
  function Rb(a, b) {
    return null == a ? b : a;
  }
  function W(a, b, c) {
    c = void 0 === c ? 0 : c;
    return Rb(Mb(a, b), c);
  }
  var Sb;
  function Tb(a) {
    switch (typeof a) {
      case "number":
        return isFinite(a) ? a : String(a);
      case "object":
        if (a) if (Array.isArray(a)) {
          if (0 !== (Q(a) & 128)) return a = Array.prototype.slice.call(a), Ib(a), a;
        } else {
          if (Ia && null != a && a instanceof Uint8Array) return Ka(a);
          if (a instanceof ib) {
            var b = a.V;
            return null == b ? "" : "string" === typeof b ? b : a.V = Ka(b);
          }
        }
    }
    return a;
  }
  function Ub(a, b, c, d) {
    if (null != a) {
      if (Array.isArray(a)) a = Vb(a, b, c, void 0 !== d);else if (Eb(a)) {
        var e = {},
          g;
        for (g in a) e[g] = Ub(a[g], b, c, d);
        a = e;
      } else a = b(a, d);
      return a;
    }
  }
  function Vb(a, b, c, d) {
    var e = Q(a);
    d = d ? !!(e & 16) : void 0;
    a = Array.prototype.slice.call(a);
    for (var g = 0; g < a.length; g++) a[g] = Ub(a[g], b, c, d);
    c(e, a);
    return a;
  }
  function Wb(a) {
    return a.ja === Db ? a.toJSON() : Tb(a);
  }
  function Xb(a, b) {
    a & 128 && Ib(b);
  }
  function Yb(a, b, c) {
    c = void 0 === c ? Cb : c;
    if (null != a) {
      if (Ia && a instanceof Uint8Array) return a.length ? new ib(new Uint8Array(a), Qa) : jb();
      if (Array.isArray(a)) {
        var d = Q(a);
        if (d & 2) return a;
        if (b && !(d & 32) && (d & 16 || 0 === d)) return R(a, d | 2), a;
        a = Vb(a, Yb, d & 4 ? Cb : c, !0);
        b = Q(a);
        b & 4 && b & 2 && Object.freeze(a);
        return a;
      }
      return a.ja === Db ? Zb(a) : a;
    }
  }
  function $b(a, b, c, d, e, g, f) {
    if (a = a.h && a.h[c]) {
      d = Q(a);
      d & 2 ? d = a : (g = Ca(a, Zb), Cb(d, g), Object.freeze(g), d = g);
      Hb(b);
      f = null == d ? Fb : Ab([]);
      if (null != d) {
        g = !!d.length;
        for (a = 0; a < d.length; a++) {
          var h = d[a];
          g = g && !(Q(h.o) & 2);
          f[a] = h.o;
        }
        g = (g ? 8 : 0) | 1;
        a = Q(f);
        (a & g) !== g && (Object.isFrozen(f) && (f = Array.prototype.slice.call(f)), R(f, a | g));
        b.h || (b.h = {});
        b.h[c] = d;
      } else b.h && (b.h[c] = void 0);
      Kb(b, c, f, e);
    } else U(b, c, Yb(d, g, f), e);
  }
  function Zb(a) {
    if (Q(a.o) & 2) return a;
    a = Pb(a, !0);
    P(a.o, 2);
    return a;
  }
  function Pb(a, b) {
    var c = a.o,
      d = [];
    P(d, 16);
    var e = a.constructor.h;
    e && d.push(e);
    e = a.B;
    if (e) {
      d.length = c.length;
      d.fill(void 0, d.length, c.length);
      var g = {};
      d[d.length - 1] = g;
    }
    0 !== (Q(c) & 128) && Ib(d);
    b = b || a.C() ? Cb : Bb;
    g = a.constructor;
    Sb = d;
    d = new g(d);
    Sb = void 0;
    a.R && (d.R = a.R.slice());
    g = !!(Q(c) & 16);
    for (var f = e ? c.length - 1 : c.length, h = 0; h < f; h++) $b(a, d, h - a.G, c[h], !1, g, b);
    if (e) for (var k in e) $b(a, d, +k, e[k], !0, g, b);
    return d;
  }
  function X(a, b, c) {
    null == a && (a = Sb);
    Sb = void 0;
    var d = this.constructor.i || 0,
      e = 0 < d,
      g = this.constructor.h,
      f = !1;
    if (null == a) {
      a = g ? [g] : [];
      var h = 48;
      var k = !0;
      e && (d = 0, h |= 128);
      R(a, h);
    } else {
      if (!Array.isArray(a)) throw Error();
      if (g && g !== a[0]) throw Error();
      var l = h = P(a, 0);
      if (k = 0 !== (16 & l)) (f = 0 !== (32 & l)) || (l |= 32);
      if (e) {
        if (128 & l) d = 0;else {
          if (0 < a.length) {
            var m = a[a.length - 1];
            if (Eb(m) && "g" in m) {
              d = 0;
              l |= 128;
              delete m.g;
              var r = !0,
                p;
              for (p in m) {
                r = !1;
                break;
              }
              r && a.pop();
            }
          }
        }
      } else if (128 & l) throw Error();
      h !== l && R(a, l);
    }
    this.G = (g ? 0 : -1) - d;
    this.h = void 0;
    this.o = a;
    a: {
      g = this.o.length;
      d = g - 1;
      if (g && (g = this.o[d], Eb(g))) {
        this.B = g;
        this.i = d - this.G;
        break a;
      }
      void 0 !== b && -1 < b ? (this.i = Math.max(b, d + 1 - this.G), this.B = void 0) : this.i = Number.MAX_VALUE;
    }
    if (!e && this.B && "g" in this.B) throw Error('Unexpected "g" flag in sparse object of message that is not a group type.');
    if (c) {
      b = k && !f && !0;
      e = this.i;
      var n;
      for (k = 0; k < c.length; k++) f = c[k], f < e ? (f += this.G, (d = a[f]) ? ac(d, b) : a[f] = Fb) : (n || (n = Jb(this)), (d = n[f]) ? ac(d, b) : n[f] = Fb);
    }
  }
  X.prototype.toJSON = function () {
    return Vb(this.o, Wb, Xb);
  };
  X.prototype.C = function () {
    return !!(Q(this.o) & 2);
  };
  function ac(a, b) {
    if (Array.isArray(a)) {
      var c = Q(a),
        d = 1;
      !b || c & 2 || (d |= 16);
      (c & d) !== d && R(a, c | d);
    }
  }
  X.prototype.ja = Db;
  X.prototype.toString = function () {
    return this.o.toString();
  };
  function bc(a, b, c) {
    if (c) {
      var d = {},
        e;
      for (e in c) {
        var g = c[e],
          f = g.ra;
        f || (d.J = g.xa || g.oa.W, g.ia ? (d.aa = cc(g.ia), f = function (h) {
          return function (k, l, m) {
            return h.J(k, l, m, h.aa);
          };
        }(d)) : g.ka ? (d.Z = dc(g.da.P, g.ka), f = function (h) {
          return function (k, l, m) {
            return h.J(k, l, m, h.Z);
          };
        }(d)) : f = d.J, g.ra = f);
        f(b, a, g.da);
        d = {
          J: d.J,
          aa: d.aa,
          Z: d.Z
        };
      }
    }
    yb(b, a);
  }
  var ec = Symbol();
  function fc(a, b, c) {
    return a[ec] || (a[ec] = function (d, e) {
      return b(d, e, c);
    });
  }
  function gc(a) {
    var b = a[ec];
    if (!b) {
      var c = hc(a);
      b = function (d, e) {
        return ic(d, e, c);
      };
      a[ec] = b;
    }
    return b;
  }
  function jc(a) {
    var b = a.ia;
    if (b) return gc(b);
    if (b = a.wa) return fc(a.da.P, b, a.ka);
  }
  function kc(a) {
    var b = jc(a),
      c = a.da,
      d = a.oa.U;
    return b ? function (e, g) {
      return d(e, g, c, b);
    } : function (e, g) {
      return d(e, g, c);
    };
  }
  function lc(a, b) {
    var c = a[b];
    "function" == typeof c && 0 === c.length && (c = c(), a[b] = c);
    return Array.isArray(c) && (mc in c || nc in c || 0 < c.length && "function" == typeof c[0]) ? c : void 0;
  }
  function oc(a, b, c, d, e, g) {
    b.P = a[0];
    var f = 1;
    if (a.length > f && "number" !== typeof a[f]) {
      var h = a[f++];
      c(b, h);
    }
    for (; f < a.length;) {
      c = a[f++];
      for (var k = f + 1; k < a.length && "number" !== typeof a[k];) k++;
      h = a[f++];
      k -= f;
      switch (k) {
        case 0:
          d(b, c, h);
          break;
        case 1:
          (k = lc(a, f)) ? (f++, e(b, c, h, k)) : d(b, c, h, a[f++]);
          break;
        case 2:
          k = f++;
          k = lc(a, k);
          e(b, c, h, k, a[f++]);
          break;
        case 3:
          g(b, c, h, a[f++], a[f++], a[f++]);
          break;
        case 4:
          g(b, c, h, a[f++], a[f++], a[f++], a[f++]);
          break;
        default:
          throw Error("unexpected number of binary field arguments: " + k);
      }
    }
    return b;
  }
  var pc = Symbol();
  function cc(a) {
    var b = a[pc];
    if (!b) {
      var c = qc(a);
      b = function (d, e) {
        return rc(d, e, c);
      };
      a[pc] = b;
    }
    return b;
  }
  function dc(a, b) {
    var c = a[pc];
    c || (c = function (d, e) {
      return bc(d, e, b);
    }, a[pc] = c);
    return c;
  }
  var nc = Symbol();
  function sc(a, b) {
    a.push(b);
  }
  function tc(a, b, c) {
    a.push(b, c.W);
  }
  function uc(a, b, c, d) {
    var e = cc(d),
      g = qc(d).P,
      f = c.W;
    a.push(b, function (h, k, l) {
      return f(h, k, l, g, e);
    });
  }
  function vc(a, b, c, d, e, g) {
    var f = dc(d, g),
      h = c.W;
    a.push(b, function (k, l, m) {
      return h(k, l, m, d, f);
    });
  }
  function qc(a) {
    var b = a[nc];
    if (b) return b;
    b = oc(a, a[nc] = [], sc, tc, uc, vc);
    mc in a && nc in a && (a.length = 0);
    return b;
  }
  var mc = Symbol();
  function wc(a, b) {
    a[0] = b;
  }
  function xc(a, b, c, d) {
    var e = c.U;
    a[b] = d ? function (g, f, h) {
      return e(g, f, h, d);
    } : e;
  }
  function yc(a, b, c, d, e) {
    var g = c.U,
      f = gc(d),
      h = hc(d).P;
    a[b] = function (k, l, m) {
      return g(k, l, m, h, f, e);
    };
  }
  function zc(a, b, c, d, e, g, f) {
    var h = c.U,
      k = fc(d, e, g);
    a[b] = function (l, m, r) {
      return h(l, m, r, d, k, f);
    };
  }
  function hc(a) {
    var b = a[mc];
    if (b) return b;
    b = oc(a, a[mc] = {}, wc, xc, yc, zc);
    mc in a && nc in a && (a.length = 0);
    return b;
  }
  function ic(a, b, c) {
    for (; ub(b) && 4 != b.i;) {
      var d = b.l,
        e = c[d];
      if (!e) {
        var g = c[0];
        g && (g = g[d]) && (e = c[d] = kc(g));
      }
      if (!e || !e(b, a, d)) {
        e = b;
        d = a;
        g = e.j;
        vb(e);
        var f = e;
        if (!f.ca) {
          e = f.h.h - g;
          f.h.h = g;
          f = f.h;
          if (0 == e) e = jb();else {
            g = pb(f, e);
            if (f.S && f.m) e = f.i.subarray(g, g + e);else {
              f = f.i;
              var h = g;
              e = g + e;
              e = h === e ? Pa() : Ra ? f.slice(h, e) : new Uint8Array(f.subarray(h, e));
            }
            e = 0 == e.length ? jb() : new ib(e, Qa);
          }
          (g = d.R) ? g.push(e) : d.R = [e];
        }
      }
    }
    return a;
  }
  function rc(a, b, c) {
    for (var d = c.length, e = 1 == d % 2, g = e ? 1 : 0; g < d; g += 2) (0, c[g + 1])(b, a, c[g]);
    bc(a, b, e ? c[0] : void 0);
  }
  function Ac(a, b) {
    return {
      U: a,
      W: b
    };
  }
  var Y = Ac(function (a, b, c) {
      if (5 !== a.i) return !1;
      a = a.h;
      var d = a.i,
        e = a.h,
        g = d[e];
      var f = d[e + 1];
      var h = d[e + 2];
      d = d[e + 3];
      L(a, a.h + 4);
      f = (g << 0 | f << 8 | h << 16 | d << 24) >>> 0;
      a = 2 * (f >> 31) + 1;
      g = f >>> 23 & 255;
      f &= 8388607;
      U(b, c, 255 == g ? f ? NaN : Infinity * a : 0 == g ? a * Math.pow(2, -149) * f : a * Math.pow(2, g - 150) * (f + Math.pow(2, 23)));
      return !0;
    }, function (a, b, c) {
      b = Mb(b, c);
      if (null != b) {
        M(a.h, 8 * c + 5);
        a = a.h;
        var d = +b;
        0 === d ? 0 < 1 / d ? G = H = 0 : (H = 0, G = 2147483648) : isNaN(d) ? (H = 0, G = 2147483647) : (d = (c = 0 > d ? -2147483648 : 0) ? -d : d, 3.4028234663852886E38 < d ? (H = 0, G = (c | 2139095040) >>> 0) : 1.1754943508222875E-38 > d ? (d = Math.round(d / Math.pow(2, -149)), H = 0, G = (c | d) >>> 0) : (b = Math.floor(Math.log(d) / Math.LN2), d *= Math.pow(2, -b), d = Math.round(8388608 * d), 16777216 <= d && ++b, H = 0, G = (c | b + 127 << 23 | d & 8388607) >>> 0));
        c = G;
        a.h.push(c >>> 0 & 255);
        a.h.push(c >>> 8 & 255);
        a.h.push(c >>> 16 & 255);
        a.h.push(c >>> 24 & 255);
      }
    }),
    Bc = Ac(function (a, b, c) {
      if (0 !== a.i) return !1;
      var d = a.h,
        e = 0,
        g = a = 0,
        f = d.i,
        h = d.h;
      do {
        var k = f[h++];
        e |= (k & 127) << g;
        g += 7;
      } while (32 > g && k & 128);
      32 < g && (a |= (k & 127) >> 4);
      for (g = 3; 32 > g && k & 128; g += 7) k = f[h++], a |= (k & 127) << g;
      L(d, h);
      if (128 > k) {
        d = e >>> 0;
        k = a >>> 0;
        if (a = k & 2147483648) d = ~d + 1 >>> 0, k = ~k >>> 0, 0 == d && (k = k + 1 >>> 0);
        d = 4294967296 * k + (d >>> 0);
      } else throw Za();
      U(b, c, a ? -d : d);
      return !0;
    }, function (a, b, c) {
      b = S(b, c);
      null != b && ("string" === typeof b && Wa(b), null != b && (M(a.h, 8 * c), "number" === typeof b ? (a = a.h, Sa(b), sb(a, G, H)) : (c = Wa(b), sb(a.h, c.i, c.h))));
    }),
    Cc = Ac(function (a, b, c) {
      if (0 !== a.i) return !1;
      U(b, c, ob(a.h));
      return !0;
    }, function (a, b, c) {
      b = S(b, c);
      if (null != b && null != b) if (M(a.h, 8 * c), a = a.h, c = b, 0 <= c) M(a, c);else {
        for (b = 0; 9 > b; b++) a.h.push(c & 127 | 128), c >>= 7;
        a.h.push(1);
      }
    }),
    Dc = Ac(function (a, b, c) {
      if (2 !== a.i) return !1;
      var d = ob(a.h) >>> 0;
      a = a.h;
      var e = pb(a, d);
      a = a.i;
      if (db) {
        var g = a,
          f;
        (f = cb) || (f = cb = new TextDecoder("utf-8", {
          fatal: !0
        }));
        a = e + d;
        g = 0 === e && a === g.length ? g : g.subarray(e, a);
        try {
          var h = f.decode(g);
        } catch (r) {
          if (void 0 === bb) {
            try {
              f.decode(new Uint8Array([128]));
            } catch (p) {}
            try {
              f.decode(new Uint8Array([97])), bb = !0;
            } catch (p) {
              bb = !1;
            }
          }
          !bb && (cb = void 0);
          throw r;
        }
      } else {
        h = e;
        d = h + d;
        e = [];
        for (var k = null, l, m; h < d;) l = a[h++], 128 > l ? e.push(l) : 224 > l ? h >= d ? K() : (m = a[h++], 194 > l || 128 !== (m & 192) ? (h--, K()) : e.push((l & 31) << 6 | m & 63)) : 240 > l ? h >= d - 1 ? K() : (m = a[h++], 128 !== (m & 192) || 224 === l && 160 > m || 237 === l && 160 <= m || 128 !== ((g = a[h++]) & 192) ? (h--, K()) : e.push((l & 15) << 12 | (m & 63) << 6 | g & 63)) : 244 >= l ? h >= d - 2 ? K() : (m = a[h++], 128 !== (m & 192) || 0 !== (l << 28) + (m - 144) >> 30 || 128 !== ((g = a[h++]) & 192) || 128 !== ((f = a[h++]) & 192) ? (h--, K()) : (l = (l & 7) << 18 | (m & 63) << 12 | (g & 63) << 6 | f & 63, l -= 65536, e.push((l >> 10 & 1023) + 55296, (l & 1023) + 56320))) : K(), 8192 <= e.length && (k = ab(k, e), e.length = 0);
        h = ab(k, e);
      }
      U(b, c, h);
      return !0;
    }, function (a, b, c) {
      b = S(b, c);
      if (null != b) {
        var d = !1;
        d = void 0 === d ? !1 : d;
        if (fb) {
          if (d && /(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(b)) throw Error("Found an unpaired surrogate");
          b = (eb || (eb = new TextEncoder())).encode(b);
        } else {
          for (var e = 0, g = new Uint8Array(3 * b.length), f = 0; f < b.length; f++) {
            var h = b.charCodeAt(f);
            if (128 > h) g[e++] = h;else {
              if (2048 > h) g[e++] = h >> 6 | 192;else {
                if (55296 <= h && 57343 >= h) {
                  if (56319 >= h && f < b.length) {
                    var k = b.charCodeAt(++f);
                    if (56320 <= k && 57343 >= k) {
                      h = 1024 * (h - 55296) + k - 56320 + 65536;
                      g[e++] = h >> 18 | 240;
                      g[e++] = h >> 12 & 63 | 128;
                      g[e++] = h >> 6 & 63 | 128;
                      g[e++] = h & 63 | 128;
                      continue;
                    } else f--;
                  }
                  if (d) throw Error("Found an unpaired surrogate");
                  h = 65533;
                }
                g[e++] = h >> 12 | 224;
                g[e++] = h >> 6 & 63 | 128;
              }
              g[e++] = h & 63 | 128;
            }
          }
          b = e === g.length ? g : g.subarray(0, e);
        }
        M(a.h, 8 * c + 2);
        M(a.h, b.length);
        N(a, a.h.end());
        N(a, b);
      }
    }),
    Ec = Ac(function (a, b, c, d, e) {
      if (2 !== a.i) return !1;
      b = Qb(b, c, d);
      c = a.h.j;
      d = ob(a.h) >>> 0;
      var g = a.h.h + d,
        f = g - c;
      0 >= f && (a.h.j = g, e(b, a, void 0, void 0, void 0), f = g - a.h.h);
      if (f) throw Error("Message parsing ended unexpectedly. Expected to read " + (d + " bytes, instead read " + (d - f) + " bytes, either the data ended unexpectedly or the message misreported its own length"));
      a.h.h = g;
      a.h.j = c;
      return !0;
    }, function (a, b, c, d, e) {
      b = Ob(b, d, c);
      if (null != b) for (d = 0; d < b.length; d++) {
        var g = a;
        M(g.h, 8 * c + 2);
        var f = g.h.end();
        N(g, f);
        f.push(g.i);
        g = f;
        e(b[d], a);
        f = a;
        var h = g.pop();
        for (h = f.i + f.h.length() - h; 127 < h;) g.push(h & 127 | 128), h >>>= 7, f.i++;
        g.push(h);
        f.i++;
      }
    });
  function Fc(a) {
    return function (b, c) {
      a: {
        if (wb.length) {
          var d = wb.pop();
          d.setOptions(c);
          nb(d.h, b, c);
          b = d;
        } else b = new tb(b, c);
        try {
          var e = hc(a);
          var g = ic(new e.P(), b, e);
          break a;
        } finally {
          e = b.h, e.i = null, e.m = !1, e.l = 0, e.j = 0, e.h = 0, e.S = !1, b.l = -1, b.i = -1, 100 > wb.length && wb.push(b);
        }
        g = void 0;
      }
      return g;
    };
  }
  function Gc(a) {
    return function () {
      var b = new xb();
      rc(this, b, qc(a));
      N(b, b.h.end());
      for (var c = new Uint8Array(b.i), d = b.j, e = d.length, g = 0, f = 0; f < e; f++) {
        var h = d[f];
        c.set(h, g);
        g += h.length;
      }
      b.j = [c];
      return c;
    };
  }
  function Z(a) {
    X.call(this, a);
  }
  na(Z, X);
  var Hc = [Z, 1, Cc, 2, Y, 3, Dc, 4, Dc];
  Z.prototype.l = Gc(Hc);
  function Ic(a) {
    X.call(this, a, -1, Jc);
  }
  na(Ic, X);
  Ic.prototype.addClassification = function (a, b) {
    Qb(this, 1, Z, a, b);
    return this;
  };
  var Jc = [1],
    Kc = Fc([Ic, 1, Ec, Hc]);
  function Lc(a) {
    X.call(this, a);
  }
  na(Lc, X);
  var Mc = [Lc, 1, Y, 2, Y, 3, Y, 4, Y, 5, Y];
  Lc.prototype.l = Gc(Mc);
  function Nc(a) {
    X.call(this, a, -1, Oc);
  }
  na(Nc, X);
  var Oc = [1],
    Pc = Fc([Nc, 1, Ec, Mc]);
  function Qc(a) {
    X.call(this, a);
  }
  na(Qc, X);
  var Rc = [Qc, 1, Y, 2, Y, 3, Y, 4, Y, 5, Y, 6, Bc],
    Sc = Fc(Rc);
  Qc.prototype.l = Gc(Rc);
  function Tc(a, b, c) {
    c = a.createShader(0 === c ? a.VERTEX_SHADER : a.FRAGMENT_SHADER);
    a.shaderSource(c, b);
    a.compileShader(c);
    if (!a.getShaderParameter(c, a.COMPILE_STATUS)) throw Error("Could not compile WebGL shader.\n\n" + a.getShaderInfoLog(c));
    return c;
  }
  function Uc(a) {
    return Ob(a, Z, 1).map(function (b) {
      var c = S(b, 1);
      return {
        index: null == c ? 0 : c,
        qa: W(b, 2),
        label: null != S(b, 3) ? Rb(S(b, 3), "") : void 0,
        displayName: null != S(b, 4) ? Rb(S(b, 4), "") : void 0
      };
    });
  }
  function Vc(a) {
    return {
      x: W(a, 1),
      y: W(a, 2),
      z: W(a, 3),
      visibility: null != Mb(a, 4) ? W(a, 4) : void 0
    };
  }
  function Wc(a, b) {
    this.i = a;
    this.h = b;
    this.m = 0;
  }
  function Xc(a, b, c) {
    Yc(a, b);
    if ("function" === typeof a.h.canvas.transferToImageBitmap) return Promise.resolve(a.h.canvas.transferToImageBitmap());
    if (c) return Promise.resolve(a.h.canvas);
    if ("function" === typeof createImageBitmap) return createImageBitmap(a.h.canvas);
    void 0 === a.j && (a.j = document.createElement("canvas"));
    return new Promise(function (d) {
      a.j.height = a.h.canvas.height;
      a.j.width = a.h.canvas.width;
      a.j.getContext("2d", {}).drawImage(a.h.canvas, 0, 0, a.h.canvas.width, a.h.canvas.height);
      d(a.j);
    });
  }
  function Yc(a, b) {
    var c = a.h;
    if (void 0 === a.s) {
      var d = Tc(c, "\n  attribute vec2 aVertex;\n  attribute vec2 aTex;\n  varying vec2 vTex;\n  void main(void) {\n    gl_Position = vec4(aVertex, 0.0, 1.0);\n    vTex = aTex;\n  }", 0),
        e = Tc(c, "\n  precision mediump float;\n  varying vec2 vTex;\n  uniform sampler2D sampler0;\n  void main(){\n    gl_FragColor = texture2D(sampler0, vTex);\n  }", 1),
        g = c.createProgram();
      c.attachShader(g, d);
      c.attachShader(g, e);
      c.linkProgram(g);
      if (!c.getProgramParameter(g, c.LINK_STATUS)) throw Error("Could not compile WebGL program.\n\n" + c.getProgramInfoLog(g));
      d = a.s = g;
      c.useProgram(d);
      e = c.getUniformLocation(d, "sampler0");
      a.l = {
        O: c.getAttribLocation(d, "aVertex"),
        N: c.getAttribLocation(d, "aTex"),
        ya: e
      };
      a.v = c.createBuffer();
      c.bindBuffer(c.ARRAY_BUFFER, a.v);
      c.enableVertexAttribArray(a.l.O);
      c.vertexAttribPointer(a.l.O, 2, c.FLOAT, !1, 0, 0);
      c.bufferData(c.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), c.STATIC_DRAW);
      c.bindBuffer(c.ARRAY_BUFFER, null);
      a.u = c.createBuffer();
      c.bindBuffer(c.ARRAY_BUFFER, a.u);
      c.enableVertexAttribArray(a.l.N);
      c.vertexAttribPointer(a.l.N, 2, c.FLOAT, !1, 0, 0);
      c.bufferData(c.ARRAY_BUFFER, new Float32Array([0, 1, 0, 0, 1, 0, 1, 1]), c.STATIC_DRAW);
      c.bindBuffer(c.ARRAY_BUFFER, null);
      c.uniform1i(e, 0);
    }
    d = a.l;
    c.useProgram(a.s);
    c.canvas.width = b.width;
    c.canvas.height = b.height;
    c.viewport(0, 0, b.width, b.height);
    c.activeTexture(c.TEXTURE0);
    a.i.bindTexture2d(b.glName);
    c.enableVertexAttribArray(d.O);
    c.bindBuffer(c.ARRAY_BUFFER, a.v);
    c.vertexAttribPointer(d.O, 2, c.FLOAT, !1, 0, 0);
    c.enableVertexAttribArray(d.N);
    c.bindBuffer(c.ARRAY_BUFFER, a.u);
    c.vertexAttribPointer(d.N, 2, c.FLOAT, !1, 0, 0);
    c.bindFramebuffer(c.DRAW_FRAMEBUFFER ? c.DRAW_FRAMEBUFFER : c.FRAMEBUFFER, null);
    c.clearColor(0, 0, 0, 0);
    c.clear(c.COLOR_BUFFER_BIT);
    c.colorMask(!0, !0, !0, !0);
    c.drawArrays(c.TRIANGLE_FAN, 0, 4);
    c.disableVertexAttribArray(d.O);
    c.disableVertexAttribArray(d.N);
    c.bindBuffer(c.ARRAY_BUFFER, null);
    a.i.bindTexture2d(0);
  }
  function Zc(a) {
    this.h = a;
  }
  var $c = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 9, 1, 7, 0, 65, 0, 253, 15, 26, 11]);
  function ad(a, b) {
    return b + a;
  }
  function bd(a, b) {
    window[a] = b;
  }
  function cd(a) {
    var b = document.createElement("script");
    b.setAttribute("src", a);
    b.setAttribute("crossorigin", "anonymous");
    return new Promise(function (c) {
      b.addEventListener("load", function () {
        c();
      }, !1);
      b.addEventListener("error", function () {
        c();
      }, !1);
      document.body.appendChild(b);
    });
  }
  function dd() {
    return E(function (a) {
      switch (a.h) {
        case 1:
          return a.s = 2, D(a, WebAssembly.instantiate($c), 4);
        case 4:
          a.h = 3;
          a.s = 0;
          break;
        case 2:
          return a.s = 0, a.l = null, a.return(!1);
        case 3:
          return a.return(!0);
      }
    });
  }
  function ed(a) {
    this.h = a;
    this.listeners = {};
    this.l = {};
    this.L = {};
    this.s = {};
    this.v = {};
    this.M = this.u = this.ga = !0;
    this.I = Promise.resolve();
    this.fa = "";
    this.D = {};
    this.locateFile = a && a.locateFile || ad;
    if ("object" === typeof window) var b = window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf("/")) + "/";else if ("undefined" !== typeof location) b = location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf("/")) + "/";else throw Error("solutions can only be loaded on a web page or in a web worker");
    this.ha = b;
    if (a.options) {
      b = A(Object.keys(a.options));
      for (var c = b.next(); !c.done; c = b.next()) {
        c = c.value;
        var d = a.options[c].default;
        void 0 !== d && (this.l[c] = "function" === typeof d ? d() : d);
      }
    }
  }
  x = ed.prototype;
  x.close = function () {
    this.j && this.j.delete();
    return Promise.resolve();
  };
  function fd(a) {
    var b, c, d, e, g, f, h, k, l, m, r;
    return E(function (p) {
      switch (p.h) {
        case 1:
          if (!a.ga) return p.return();
          b = void 0 === a.h.files ? [] : "function" === typeof a.h.files ? a.h.files(a.l) : a.h.files;
          return D(p, dd(), 2);
        case 2:
          c = p.i;
          if ("object" === typeof window) return bd("createMediapipeSolutionsWasm", {
            locateFile: a.locateFile
          }), bd("createMediapipeSolutionsPackedAssets", {
            locateFile: a.locateFile
          }), f = b.filter(function (n) {
            return void 0 !== n.data;
          }), h = b.filter(function (n) {
            return void 0 === n.data;
          }), k = Promise.all(f.map(function (n) {
            var q = gd(a, n.url);
            if (void 0 !== n.path) {
              var t = n.path;
              q = q.then(function (w) {
                a.overrideFile(t, w);
                return Promise.resolve(w);
              });
            }
            return q;
          })), l = Promise.all(h.map(function (n) {
            return void 0 === n.simd || n.simd && c || !n.simd && !c ? cd(a.locateFile(n.url, a.ha)) : Promise.resolve();
          })).then(function () {
            var n, q, t;
            return E(function (w) {
              if (1 == w.h) return n = window.createMediapipeSolutionsWasm, q = window.createMediapipeSolutionsPackedAssets, t = a, D(w, n(q), 2);
              t.i = w.i;
              w.h = 0;
            });
          }), m = function () {
            return E(function (n) {
              a.h.graph && a.h.graph.url ? n = D(n, gd(a, a.h.graph.url), 0) : (n.h = 0, n = void 0);
              return n;
            });
          }(), D(p, Promise.all([l, k, m]), 7);
          if ("function" !== typeof importScripts) throw Error("solutions can only be loaded on a web page or in a web worker");
          d = b.filter(function (n) {
            return void 0 === n.simd || n.simd && c || !n.simd && !c;
          }).map(function (n) {
            return a.locateFile(n.url, a.ha);
          });
          importScripts.apply(null, ea(d));
          e = a;
          return D(p, createMediapipeSolutionsWasm(Module), 6);
        case 6:
          e.i = p.i;
          a.m = new OffscreenCanvas(1, 1);
          a.i.canvas = a.m;
          g = a.i.GL.createContext(a.m, {
            antialias: !1,
            alpha: !1,
            va: "undefined" !== typeof WebGL2RenderingContext ? 2 : 1
          });
          a.i.GL.makeContextCurrent(g);
          p.h = 4;
          break;
        case 7:
          a.m = document.createElement("canvas");
          r = a.m.getContext("webgl2", {});
          if (!r && (r = a.m.getContext("webgl", {}), !r)) return alert("Failed to create WebGL canvas context when passing video frame."), p.return();
          a.K = r;
          a.i.canvas = a.m;
          a.i.createContext(a.m, !0, !0, {});
        case 4:
          a.j = new a.i.SolutionWasm(), a.ga = !1, p.h = 0;
      }
    });
  }
  function hd(a) {
    var b, c, d, e, g, f, h, k;
    return E(function (l) {
      if (1 == l.h) {
        if (a.h.graph && a.h.graph.url && a.fa === a.h.graph.url) return l.return();
        a.u = !0;
        if (!a.h.graph || !a.h.graph.url) {
          l.h = 2;
          return;
        }
        a.fa = a.h.graph.url;
        return D(l, gd(a, a.h.graph.url), 3);
      }
      2 != l.h && (b = l.i, a.j.loadGraph(b));
      c = A(Object.keys(a.D));
      for (d = c.next(); !d.done; d = c.next()) e = d.value, a.j.overrideFile(e, a.D[e]);
      a.D = {};
      if (a.h.listeners) for (g = A(a.h.listeners), f = g.next(); !f.done; f = g.next()) h = f.value, id(a, h);
      k = a.l;
      a.l = {};
      a.setOptions(k);
      l.h = 0;
    });
  }
  x.reset = function () {
    var a = this;
    return E(function (b) {
      a.j && (a.j.reset(), a.s = {}, a.v = {});
      b.h = 0;
    });
  };
  x.setOptions = function (a, b) {
    var c = this;
    if (b = b || this.h.options) {
      for (var d = [], e = [], g = {}, f = A(Object.keys(a)), h = f.next(); !h.done; g = {
        X: g.X,
        Y: g.Y
      }, h = f.next()) if (h = h.value, !(h in this.l && this.l[h] === a[h])) {
        this.l[h] = a[h];
        var k = b[h];
        void 0 !== k && (k.onChange && (g.X = k.onChange, g.Y = a[h], d.push(function (l) {
          return function () {
            var m;
            return E(function (r) {
              if (1 == r.h) return D(r, l.X(l.Y), 2);
              m = r.i;
              !0 === m && (c.u = !0);
              r.h = 0;
            });
          };
        }(g))), k.graphOptionXref && (h = _extends$3({}, {
          calculatorName: "",
          calculatorIndex: 0
        }, k.graphOptionXref, {
          valueNumber: 1 === k.type ? a[h] : 0,
          valueBoolean: 0 === k.type ? a[h] : !1,
          valueString: 2 === k.type ? a[h] : ""
        }), e.push(h)));
      }
      if (0 !== d.length || 0 !== e.length) this.u = !0, this.H = (void 0 === this.H ? [] : this.H).concat(e), this.F = (void 0 === this.F ? [] : this.F).concat(d);
    }
  };
  function jd(a) {
    var b, c, d, e, g, f, h;
    return E(function (k) {
      switch (k.h) {
        case 1:
          if (!a.u) return k.return();
          if (!a.F) {
            k.h = 2;
            break;
          }
          b = A(a.F);
          c = b.next();
        case 3:
          if (c.done) {
            k.h = 5;
            break;
          }
          d = c.value;
          return D(k, d(), 4);
        case 4:
          c = b.next();
          k.h = 3;
          break;
        case 5:
          a.F = void 0;
        case 2:
          if (a.H) {
            e = new a.i.GraphOptionChangeRequestList();
            g = A(a.H);
            for (f = g.next(); !f.done; f = g.next()) h = f.value, e.push_back(h);
            a.j.changeOptions(e);
            e.delete();
            a.H = void 0;
          }
          a.u = !1;
          k.h = 0;
      }
    });
  }
  x.initialize = function () {
    var a = this;
    return E(function (b) {
      return 1 == b.h ? D(b, fd(a), 2) : 3 != b.h ? D(b, hd(a), 3) : D(b, jd(a), 0);
    });
  };
  function gd(a, b) {
    var c, d;
    return E(function (e) {
      if (b in a.L) return e.return(a.L[b]);
      c = a.locateFile(b, "");
      d = fetch(c).then(function (g) {
        return g.arrayBuffer();
      });
      a.L[b] = d;
      return e.return(d);
    });
  }
  x.overrideFile = function (a, b) {
    this.j ? this.j.overrideFile(a, b) : this.D[a] = b;
  };
  x.clearOverriddenFiles = function () {
    this.D = {};
    this.j && this.j.clearOverriddenFiles();
  };
  x.send = function (a, b) {
    var c = this,
      d,
      e,
      g,
      f,
      h,
      k,
      l,
      m,
      r;
    return E(function (p) {
      switch (p.h) {
        case 1:
          if (!c.h.inputs) return p.return();
          d = 1E3 * (void 0 === b || null === b ? performance.now() : b);
          return D(p, c.I, 2);
        case 2:
          return D(p, c.initialize(), 3);
        case 3:
          e = new c.i.PacketDataList();
          g = A(Object.keys(a));
          for (f = g.next(); !f.done; f = g.next()) if (h = f.value, k = c.h.inputs[h]) {
            a: {
              var n = a[h];
              switch (k.type) {
                case "video":
                  var q = c.s[k.stream];
                  q || (q = new Wc(c.i, c.K), c.s[k.stream] = q);
                  0 === q.m && (q.m = q.i.createTexture());
                  if ("undefined" !== typeof HTMLVideoElement && n instanceof HTMLVideoElement) {
                    var t = n.videoWidth;
                    var w = n.videoHeight;
                  } else "undefined" !== typeof HTMLImageElement && n instanceof HTMLImageElement ? (t = n.naturalWidth, w = n.naturalHeight) : (t = n.width, w = n.height);
                  w = {
                    glName: q.m,
                    width: t,
                    height: w
                  };
                  t = q.h;
                  t.canvas.width = w.width;
                  t.canvas.height = w.height;
                  t.activeTexture(t.TEXTURE0);
                  q.i.bindTexture2d(q.m);
                  t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, t.RGBA, t.UNSIGNED_BYTE, n);
                  q.i.bindTexture2d(0);
                  q = w;
                  break a;
                case "detections":
                  q = c.s[k.stream];
                  q || (q = new Zc(c.i), c.s[k.stream] = q);
                  q.data || (q.data = new q.h.DetectionListData());
                  q.data.reset(n.length);
                  for (w = 0; w < n.length; ++w) {
                    t = n[w];
                    var v = q.data,
                      B = v.setBoundingBox,
                      J = w;
                    var I = t.la;
                    var u = new Qc();
                    V(u, 1, I.sa);
                    V(u, 2, I.ta);
                    V(u, 3, I.height);
                    V(u, 4, I.width);
                    V(u, 5, I.rotation);
                    U(u, 6, I.pa);
                    I = u.l();
                    B.call(v, J, I);
                    if (t.ea) for (v = 0; v < t.ea.length; ++v) {
                      u = t.ea[v];
                      B = q.data;
                      J = B.addNormalizedLandmark;
                      I = w;
                      u = _extends$3({}, u, {
                        visibility: u.visibility ? u.visibility : 0
                      });
                      var C = new Lc();
                      V(C, 1, u.x);
                      V(C, 2, u.y);
                      V(C, 3, u.z);
                      u.visibility && V(C, 4, u.visibility);
                      u = C.l();
                      J.call(B, I, u);
                    }
                    if (t.ba) for (v = 0; v < t.ba.length; ++v) B = q.data, J = B.addClassification, I = w, u = t.ba[v], C = new Z(), V(C, 2, u.qa), u.index && U(C, 1, u.index), u.label && U(C, 3, u.label), u.displayName && U(C, 4, u.displayName), u = C.l(), J.call(B, I, u);
                  }
                  q = q.data;
                  break a;
                default:
                  q = {};
              }
            }
            l = q;
            m = k.stream;
            switch (k.type) {
              case "video":
                e.pushTexture2d(_extends$3({}, l, {
                  stream: m,
                  timestamp: d
                }));
                break;
              case "detections":
                r = l;
                r.stream = m;
                r.timestamp = d;
                e.pushDetectionList(r);
                break;
              default:
                throw Error("Unknown input config type: '" + k.type + "'");
            }
          }
          c.j.send(e);
          return D(p, c.I, 4);
        case 4:
          e.delete(), p.h = 0;
      }
    });
  };
  function kd(a, b, c) {
    var d, e, g, f, h, k, l, m, r, p, n, q, t, w;
    return E(function (v) {
      switch (v.h) {
        case 1:
          if (!c) return v.return(b);
          d = {};
          e = 0;
          g = A(Object.keys(c));
          for (f = g.next(); !f.done; f = g.next()) h = f.value, k = c[h], "string" !== typeof k && "texture" === k.type && void 0 !== b[k.stream] && ++e;
          1 < e && (a.M = !1);
          l = A(Object.keys(c));
          f = l.next();
        case 2:
          if (f.done) {
            v.h = 4;
            break;
          }
          m = f.value;
          r = c[m];
          if ("string" === typeof r) return t = d, w = m, D(v, ld(a, m, b[r]), 14);
          p = b[r.stream];
          if ("detection_list" === r.type) {
            if (p) {
              var B = p.getRectList();
              for (var J = p.getLandmarksList(), I = p.getClassificationsList(), u = [], C = 0; C < B.size(); ++C) {
                var T = Sc(B.get(C)),
                  od = W(T, 1),
                  pd = W(T, 2),
                  qd = W(T, 3),
                  rd = W(T, 4),
                  sd = W(T, 5, 0),
                  za = void 0;
                za = void 0 === za ? 0 : za;
                T = {
                  la: {
                    sa: od,
                    ta: pd,
                    height: qd,
                    width: rd,
                    rotation: sd,
                    pa: Rb(S(T, 6), za)
                  },
                  ea: Ob(Pc(J.get(C)), Lc, 1).map(Vc),
                  ba: Uc(Kc(I.get(C)))
                };
                u.push(T);
              }
              B = u;
            } else B = [];
            d[m] = B;
            v.h = 7;
            break;
          }
          if ("proto_list" === r.type) {
            if (p) {
              B = Array(p.size());
              for (J = 0; J < p.size(); J++) B[J] = p.get(J);
              p.delete();
            } else B = [];
            d[m] = B;
            v.h = 7;
            break;
          }
          if (void 0 === p) {
            v.h = 3;
            break;
          }
          if ("float_list" === r.type) {
            d[m] = p;
            v.h = 7;
            break;
          }
          if ("proto" === r.type) {
            d[m] = p;
            v.h = 7;
            break;
          }
          if ("texture" !== r.type) throw Error("Unknown output config type: '" + r.type + "'");
          n = a.v[m];
          n || (n = new Wc(a.i, a.K), a.v[m] = n);
          return D(v, Xc(n, p, a.M), 13);
        case 13:
          q = v.i, d[m] = q;
        case 7:
          r.transform && d[m] && (d[m] = r.transform(d[m]));
          v.h = 3;
          break;
        case 14:
          t[w] = v.i;
        case 3:
          f = l.next();
          v.h = 2;
          break;
        case 4:
          return v.return(d);
      }
    });
  }
  function ld(a, b, c) {
    var d;
    return E(function (e) {
      return "number" === typeof c || c instanceof Uint8Array || c instanceof a.i.Uint8BlobList ? e.return(c) : c instanceof a.i.Texture2dDataOut ? (d = a.v[b], d || (d = new Wc(a.i, a.K), a.v[b] = d), e.return(Xc(d, c, a.M))) : e.return(void 0);
    });
  }
  function id(a, b) {
    for (var c = b.name || "$", d = [].concat(ea(b.wants)), e = new a.i.StringList(), g = A(b.wants), f = g.next(); !f.done; f = g.next()) e.push_back(f.value);
    g = a.i.PacketListener.implement({
      onResults: function (h) {
        for (var k = {}, l = 0; l < b.wants.length; ++l) k[d[l]] = h.get(l);
        var m = a.listeners[c];
        m && (a.I = kd(a, k, b.outs).then(function (r) {
          r = m(r);
          for (var p = 0; p < b.wants.length; ++p) {
            var n = k[d[p]];
            "object" === typeof n && n.hasOwnProperty && n.hasOwnProperty("delete") && n.delete();
          }
          r && (a.I = r);
        }));
      }
    });
    a.j.attachMultiListener(e, g);
    e.delete();
  }
  x.onResults = function (a, b) {
    this.listeners[b || "$"] = a;
  };
  Aa("Solution", ed);
  Aa("OptionType", {
    BOOL: 0,
    NUMBER: 1,
    ua: 2,
    0: "BOOL",
    1: "NUMBER",
    2: "STRING"
  });
  function md(a) {
    void 0 === a && (a = 0);
    switch (a) {
      case 1:
        return "selfie_segmentation_landscape.tflite";
      default:
        return "selfie_segmentation.tflite";
    }
  }
  function nd(a) {
    var b = this;
    a = a || {};
    this.h = new ed({
      locateFile: a.locateFile,
      files: function (c) {
        return [{
          simd: !0,
          url: "selfie_segmentation_solution_simd_wasm_bin.js"
        }, {
          simd: !1,
          url: "selfie_segmentation_solution_wasm_bin.js"
        }, {
          data: !0,
          url: md(c.modelSelection)
        }];
      },
      graph: {
        url: "selfie_segmentation.binarypb"
      },
      listeners: [{
        wants: ["segmentation_mask", "image_transformed"],
        outs: {
          image: {
            type: "texture",
            stream: "image_transformed"
          },
          segmentationMask: {
            type: "texture",
            stream: "segmentation_mask"
          }
        }
      }],
      inputs: {
        image: {
          type: "video",
          stream: "input_frames_gpu"
        }
      },
      options: {
        useCpuInference: {
          type: 0,
          graphOptionXref: {
            calculatorType: "InferenceCalculator",
            fieldName: "use_cpu_inference"
          },
          default: "object" !== typeof window || void 0 === window.navigator ? !1 : "iPad Simulator;iPhone Simulator;iPod Simulator;iPad;iPhone;iPod".split(";").includes(navigator.platform) || navigator.userAgent.includes("Mac") && "ontouchend" in document
        },
        selfieMode: {
          type: 0,
          graphOptionXref: {
            calculatorType: "GlScalerCalculator",
            calculatorIndex: 1,
            fieldName: "flip_horizontal"
          }
        },
        modelSelection: {
          type: 1,
          graphOptionXref: {
            calculatorType: "ConstantSidePacketCalculator",
            calculatorName: "ConstantSidePacketCalculatorModelSelection",
            fieldName: "int_value"
          },
          onChange: function (c) {
            var d, e, g;
            return E(function (f) {
              if (1 == f.h) return d = md(c), e = "third_party/mediapipe/modules/selfie_segmentation/" + d, D(f, gd(b.h, d), 2);
              g = f.i;
              b.h.overrideFile(e, g);
              return f.return(!0);
            });
          }
        }
      }
    });
  }
  x = nd.prototype;
  x.close = function () {
    this.h.close();
    return Promise.resolve();
  };
  x.onResults = function (a) {
    this.h.onResults(a);
  };
  x.initialize = function () {
    var a = this;
    return E(function (b) {
      return D(b, a.h.initialize(), 0);
    });
  };
  x.reset = function () {
    this.h.reset();
  };
  x.send = function (a) {
    var b = this;
    return E(function (c) {
      return D(c, b.h.send(a), 0);
    });
  };
  x.setOptions = function (a) {
    this.h.setOptions(a);
  };
  Aa("SelfieSegmentation", nd);
  Aa("VERSION", "0.1.1675465747");
}).call(commonjsGlobal);
var Logger = window.log;
/**
 * This class is used to apply a video effect to the video stream.
 * It's compatible with Ant Media Server JavaScript SDK v2.5.2+
 *
 */
var _virtualBackgroundImage = /*#__PURE__*/new WeakMap();
var _noEffect = /*#__PURE__*/new WeakSet();
class VideoEffect {
  /**
   *
   * @param {WebRTCAdaptor} webRTCAdaptor
   */
  constructor(webRTCAdaptor) {
    /**
     * This method is used to disable the virtual background and blur effects.
     */
    _classPrivateMethodInitSpec(this, _noEffect);
    _classPrivateFieldInitSpec(this, _virtualBackgroundImage, {
      writable: true,
      value: null
    });
    this.webRTCAdaptor = webRTCAdaptor;
    this.selfieSegmentation = null;
    this.effectCanvas = null;
    this.ctx = null;
    this.rawLocalVideo = document.createElement('video');
    this.deepAR = null;
    this.backgroundBlurRange = 3;
    this.edgeBlurRange = 4;
    this.effectName = VideoEffect.NO_EFFECT;
    this.startTime = 0;
    this.statTimerId = -1;
    this.renderedFrameCount = 0;
    this.lastRenderedFrameCount = 0;
    this.effectCanvasFPS = 0;
    this.videoCallbackPeriodMs = 0;
    this.initializeSelfieSegmentation();
    this.isInitialized = true;
  }

  /**
   * This method is used to initialize the video effect.
   * @param {MediaStream} stream - Original stream to be manipulated.
   * @returns {Promise<void>}
   */
  init(stream) {
    var _this = this;
    return _asyncToGenerator(function* () {
      yield _this.setRawLocalVideo(stream);
      var trackSettings = stream.getVideoTracks()[0].getSettings();
      _this.effectCanvasFPS = trackSettings.frameRate;
      _this.videoCallbackPeriodMs = 1000 / _this.effectCanvasFPS;
      _this.effectCanvas = _this.createEffectCanvas(trackSettings.width, trackSettings.height);
      _this.ctx = _this.effectCanvas.getContext("2d");
      if (_this.canvasStream) {
        _this.canvasStream.getTracks().forEach(track => track.stop());
        _this.canvasStream = null;
      }
      _this.canvasStream = _this.effectCanvas.captureStream(_this.effectCanvasFPS);
      return new Promise((resolve, reject) => {
        resolve(_this.canvasStream);
      });
    })();
  }

  /**
   * This method is used to set raw local video.
   * @param {MediaStream} stream
   * @returns {Promise<void>}
   */
  setRawLocalVideo(stream) {
    this.rawLocalVideo.srcObject = stream;
    this.rawLocalVideo.muted = true;
    this.rawLocalVideo.autoplay = true;
    return this.rawLocalVideo.play();
  }

  /**
   * This method is used to create the canvas element which is used to apply the video effect.
   * @param {number} height
   * @param {number} width
   */
  createEffectCanvas(width, height) {
    var effectCanvas = document.createElement('canvas');
    effectCanvas.id = "effectCanvas";
    effectCanvas.width = width;
    effectCanvas.height = height;
    return effectCanvas;
  }

  /**
   * This method is used to initialize the selfie segmentation.
   */
  initializeSelfieSegmentation() {
    this.selfieSegmentation = new SelfieSegmentation({
      locateFile: file => {
        return VideoEffect.LOCATE_FILE_URL + "/" + file;
      }
    });
    this.selfieSegmentation.setOptions({
      selfieMode: false,
      // true: selfie mode, false: portrait mode
      modelSelection: 1 // 0: General Model, 1: Landscape Model - We use Landscape Model for better performance
    });
    this.selfieSegmentation.onResults(results => {
      this.onResults(results);
    });
  }
  /**
   * @param {HTMLElement} imageElement
   */
  set virtualBackgroundImage(imageElement) {
    _classPrivateFieldSet(this, _virtualBackgroundImage, imageElement);
  }
  startFpsCalculation() {
    this.statTimerId = setInterval(() => {
      var currentTime = new Date().getTime();
      var deltaTime = (currentTime - this.startTime) / 1000;
      this.startTime = currentTime;
      var fps = (this.renderedFrameCount - this.lastRenderedFrameCount) / deltaTime;
      this.renderedFrameCount = this.lastRenderedFrameCount;
      Logger.warn("Fps: " + fps + "fps");
    }, 1000);
  }
  stopFpsCalculation() {
    if (this.statTimerId !== -1) {
      clearInterval(this.statTimerId);
      this.statTimerId = -1;
    }
  }
  processFrame() {
    var _this2 = this;
    return _asyncToGenerator(function* () {
      yield _this2.selfieSegmentation.send({
        image: _this2.rawLocalVideo
      });

      //call if the effect name is not NO_EFFECT
      if (_this2.effectName !== VideoEffect.NO_EFFECT) {
        setTimeout(() => {
          _this2.processFrame();
        }, _this2.videoCallbackPeriodMs);
      }
    })();
  }

  /**
   * Set blur effect range
   * @param {number} backgroundBlurRange
   * @param {number} edgeBlurRange
   */
  setBlurEffectRange(backgroundBlurRange, edgeBlurRange) {
    this.backgroundBlurRange = backgroundBlurRange;
    this.edgeBlurRange = edgeBlurRange;
  }

  /**
   * Enable effect
   * @param {string} effectName
   * @param {string} deepARApiKey
   * @param {*} deepARModel
   */
  enableEffect(effectName, deepARApiKey, deepARModel) {
    var _this3 = this;
    return _asyncToGenerator(function* () {
      if (!_this3.isInitialized) {
        Logger.error("VideoEffect is not initialized!");
        return;
      }
      switch (effectName) {
        case VideoEffect.DEEPAR:
        case VideoEffect.VIRTUAL_BACKGROUND:
        case VideoEffect.BLUR_BACKGROUND:
        case VideoEffect.NO_EFFECT:
          break;
        default:
          Logger.warn("Unknown effect name please use the constants VideoEffect.VIRTUAL_BACKGROUND,VideoEffect.BLUR_BACKGROUND or VideoEffect.NO_EFFECT ");
          return;
      }
      var currentEffectName = _this3.effectName;
      _this3.effectName = effectName;
      if (currentEffectName === VideoEffect.DEEPAR && effectName !== VideoEffect.DEEPAR) {
        _this3.deepAR.shutdown();
        _this3.deepAR = null;
      }
      if (effectName === VideoEffect.VIRTUAL_BACKGROUND || effectName === VideoEffect.BLUR_BACKGROUND) {
        //check old effect name. If it's no effect, start the process
        if (currentEffectName === VideoEffect.NO_EFFECT || currentEffectName === VideoEffect.DEEPAR) {
          if (VideoEffect.DEBUG) {
            _this3.startFpsCalculation();
          }
          //We cannot use the localStream of the webrtc adaptor because it's gets stopped when updateVideoTrack is called
          //get the video stream with current constraints and stop it when effects are disabled

          //audio:true makes the trick to play the video in the background as well otherwise it stops playing
          return navigator.mediaDevices.getUserMedia({
            video: _this3.webRTCAdaptor.mediaConstraints.video,
            audio: true
          }).then(localStream => {
            return _this3.init(localStream).then(processedStream => {
              return _this3.webRTCAdaptor.updateVideoTrack(processedStream, _this3.webRTCAdaptor.publishStreamId, null, true).then(() => {
                setTimeout(() => {
                  _this3.processFrame();
                }, _this3.videoCallbackPeriodMs);
              });
            }).catch(err => {
              //log and throw again to let the catch in the chain it
              Logger.error(err);
              throw err;
            });
          });
        } else {
          return new Promise((resolve, reject) => {
            resolve();
          });
        }
      } else if (effectName === VideoEffect.DEEPAR) {
        if (deepARApiKey === undefined || deepARApiKey === null || deepARApiKey === "" || deepARModel === undefined || deepARModel === null || deepARModel === "") {
          Logger.error("DeepAR API key or DeepAR Model is not set!");
          return;
        }
        if (currentEffectName === VideoEffect.DEEPAR) {
          _this3.deepAR.switchEffect(0, 'slot', VideoEffect.DEEP_AR_EFFECTS_URL + deepARModel + VideoEffect.DEEP_AR_EXTENSION);
          return;
        } else if (currentEffectName === VideoEffect.BLUR_BACKGROUND || currentEffectName === VideoEffect.VIRTUAL_BACKGROUND) {
          //Stop timer
          _this3.stopFpsCalculation();
          yield _classPrivateMethodGet(_this3, _noEffect, _noEffect2).call(_this3);
        }
        var canvas = _this3.createEffectCanvas(500, 500);
        var deepAR = new DeepAR({
          licenseKey: deepARApiKey,
          canvas: canvas,
          deeparWasmPath: VideoEffect.DEEP_AR_FOLDER_ROOT_URL + '/wasm/deepar.wasm',
          callbacks: {
            onInitialize: function onInitialize() {
              deepAR.startVideo(true);
            }
          }
        });
        _this3.deepAR = deepAR;
        _this3.deepAR.callbacks.onVideoStarted = () => {
          _this3.canvasStream = canvas.captureStream(30);
          _this3.webRTCAdaptor.updateVideoTrack(_this3.canvasStream, _this3.webRTCAdaptor.publishStreamId, null, true);
          _this3.deepAR.switchEffect(0, 'slot', VideoEffect.DEEP_AR_EFFECTS_URL + deepARModel + VideoEffect.DEEP_AR_EXTENSION);
        };
        _this3.deepAR.downloadFaceTrackingModel(VideoEffect.DEEP_AR_FOLDER_ROOT_URL + "/models/face/models-68-extreme.bin");
        _this3.deepAR.setVideoElement(_this3.rawLocalVideo, true);
      } else {
        if (currentEffectName === VideoEffect.DEEPAR) {
          var localStream = yield navigator.mediaDevices.getUserMedia({
            video: _this3.webRTCAdaptor.mediaConstraints.video,
            audio: true
          });
          yield _this3.setRawLocalVideo(localStream);
        }
        return new Promise((resolve, reject) => {
          //Stop timer
          _this3.stopFpsCalculation();
          _classPrivateMethodGet(_this3, _noEffect, _noEffect2).call(_this3);
          resolve();
        });
      }
    })();
  }
  /**
   * This method is used to draw the segmentation mask.
   * @param {*} segmentation
   */
  drawSegmentationMask(segmentation) {
    this.ctx.drawImage(segmentation, 0, 0, this.effectCanvas.width, this.effectCanvas.height);
  }

  /**
   * This method is called by mediapipe when the segmentation mask is ready.
   * @param {*} results
   */
  onResults(results) {
    this.renderedFrameCount++;
    if (this.effectName == VideoEffect.BLUR_BACKGROUND) {
      this.drawBlurBackground(results.image, results.segmentationMask, this.backgroundBlurRange);
    } else if (this.effectName == VideoEffect.VIRTUAL_BACKGROUND) {
      this.drawVirtualBackground(results.image, results.segmentationMask, _classPrivateFieldGet(this, _virtualBackgroundImage));
    } else {
      this.drawImageDirectly(results.image);
    }
  }

  /**
   * This method is used to draw the raw frame directly to the canvas.
   * @param {*} image
   */
  drawImageDirectly(image) {
    this.ctx.save();
    this.ctx.globalCompositeOperation = "source-over";
    this.ctx.filter = "none";
    this.ctx.drawImage(image, 0, 0, image.width, image.height);
    this.ctx.restore();
  }

  /**
   * This method is used to draw the frame with virtual background effect to the canvas.
   * @param {*} image
   * @param {*} segmentation
   * @param {*} virtualBackgroundImage
   */
  drawVirtualBackground(image, segmentation, virtualBackgroundImage) {
    this.ctx.save();
    this.ctx.filter = "none";
    this.ctx.clearRect(0, 0, this.effectCanvas.width, this.effectCanvas.height);
    this.ctx.drawImage(segmentation, 0, 0, this.effectCanvas.width, this.effectCanvas.height);
    this.ctx.globalCompositeOperation = 'source-out';
    this.ctx.drawImage(virtualBackgroundImage, 0, 0, virtualBackgroundImage.naturalWidth, virtualBackgroundImage.naturalHeight, 0, 0, this.effectCanvas.width, this.effectCanvas.height);
    this.ctx.globalCompositeOperation = 'destination-atop';
    this.ctx.drawImage(image, 0, 0, this.effectCanvas.width, this.effectCanvas.height);
    this.ctx.restore();
  }

  /**
   * This method is used to draw frame with background blur effect to the canvas.
   * @param {*} image
   * @param {*} segmentation
   * @param {*} blurAmount
   */
  drawBlurBackground(image, segmentation, blurAmount) {
    this.ctx.clearRect(0, 0, this.effectCanvas.width, this.effectCanvas.height);
    this.ctx.globalCompositeOperation = "copy";
    this.ctx.filter = "none";
    this.ctx.filter = "blur(" + this.edgeBlurRange + "px)";
    this.drawSegmentationMask(segmentation);
    this.ctx.globalCompositeOperation = "source-in";
    this.ctx.filter = "none";
    this.ctx.drawImage(image, 0, 0, this.effectCanvas.width, this.effectCanvas.height);
    this.ctx.globalCompositeOperation = "destination-over";
    this.ctx.filter = "blur(" + blurAmount + "px)";
    this.ctx.drawImage(image, 0, 0, this.effectCanvas.width, this.effectCanvas.height);
    this.ctx.restore();
  }
}
function _noEffect2() {
  this.rawLocalVideo.pause();
  if (this.canvasStream != null) {
    this.canvasStream.getVideoTracks().forEach(track => track.stop());
  }
  return this.webRTCAdaptor.switchVideoCameraCapture(this.webRTCAdaptor.publishStreamId);
}
_defineProperty(VideoEffect, "DEEPAR", "deepar");
_defineProperty(VideoEffect, "VIRTUAL_BACKGROUND", "virtual-background");
_defineProperty(VideoEffect, "BLUR_BACKGROUND", "blur-background");
_defineProperty(VideoEffect, "NO_EFFECT", "no-effect");
_defineProperty(VideoEffect, "deepARModelList", ['flower_face', 'Ping_Pong']);
/**
 * @type {boolean}
 */
_defineProperty(VideoEffect, "DEBUG", false);
/**
 * LOCATE_FILE_URL is optional, it's to give locate url of selfie segmentation
 * If you would like to use CDN,
 * Give "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/"
 * or give local file relative path "./js/external/selfie-segmentation" according to your file
 */
//static LOCATE_FILE_URL = "./js/external/selfie-segmentation";
_defineProperty(VideoEffect, "LOCATE_FILE_URL", "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation");
_defineProperty(VideoEffect, "DEEP_AR_FOLDER_ROOT_URL", "https://cdn.jsdelivr.net/npm/deepar@4.0.3");
_defineProperty(VideoEffect, "DEEP_AR_EFFECTS_URL", "../js/external/deepar-effects/");
_defineProperty(VideoEffect, "DEEP_AR_EXTENSION", ".deepar");
WebRTCAdaptor.register(webrtcAdaptorInstance => {
  var videoEffect = new VideoEffect(webrtcAdaptorInstance);
  Object.defineProperty(webrtcAdaptorInstance, "setBlurEffectRange", {
    value: function value(backgroundBlurRange, edgeBlurRange) {
      videoEffect.setBlurEffectRange(backgroundBlurRange, edgeBlurRange);
    }
  });
  Object.defineProperty(webrtcAdaptorInstance, "enableEffect", {
    value: function value(effectName, deepARApiKey, deepARModel) {
      return videoEffect.enableEffect(effectName, deepARApiKey, deepARModel);
    }
  });
  Object.defineProperty(webrtcAdaptorInstance, "setBackgroundImage", {
    value: function value(imageElement) {
      videoEffect.virtualBackgroundImage = imageElement;
    }
  });
});

// Default options for the plugin.
const defaults = {
  sdpConstraints: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
  },
  mediaConstraints: {
    video: false,
    audio: false
  }
};

// const Component = videojs.getComponent('Component');
/**
 * An advanced Video.js plugin for playing WebRTC stream from Ant Media Server
 *
 * Test Scenario #1
 * 1. Publish a stream from a WebRTC endpoint to Ant Media Server
 * 2. Play the stream with WebRTC
 * 3. Restart publishing the stream
 * 4. It should play automatically
 *
 * Test Scenario #2
 * 1. Publish a stream from a WebRTC endpoint to Ant Media Server
 * 2. Let the server return error(highresourceusage, etc.)
 * 3. WebSocket should be disconnected and play should try again
 *
 * Test Scenario #3
 * 1. Show error message if packet lost and jitter and RTT is high
 */
class WebRTCHandler {
  /**
   * Create a WebRTC source handler instance.
   *
   * @param  {Object} source
   *         Source object that is given in the DOM, includes the stream URL
   *
   * @param  {Object} [options]
   *         Options include:
   *            ICE Server
   *            Tokens
   *            Subscriber ID
   *            Subscriber code
   */
  constructor(source, tech, options) {
    this.player = videojs(options.playerId);
    if (!this.player.hasOwnProperty('sendDataViaWebRTC')) {
      Object.defineProperty(this.player, 'sendDataViaWebRTC', {
        value: data => {
          this.webRTCAdaptor.sendData(this.source.streamName, data);
        }
      });
    }
    this.isPlaying = false;
    this.disposed = false;
    this.initiateWebRTCAdaptor(source, options);
    this.player.ready(() => {
      this.player.addClass('videojs-webrtc-plugin');
    });
    this.player.on('playing', () => {
      if (this.player.el().getElementsByClassName('vjs-custom-spinner').length) {
        this.player.el().removeChild(this.player.spinner);
      }
    });
    videojs.registerComponent('ResolutionMenuButton', ResolutionMenuButton);
    videojs.registerComponent('ResolutionMenuItem', ResolutionMenuItem);
  }
  /**
   * Initiate WebRTCAdaptor.
   *
   * @param  {Object} [options]
   * An optional options object.
   *
   */
  initiateWebRTCAdaptor(source, options) {
    this.options = videojs.mergeOptions(defaults, options);
    this.source = source;
    if (typeof source.iceServers === 'object') {
      this.source.pcConfig = {
        iceServers: source.iceServers
      };
    } else if (typeof source.iceServers === 'string') {
      this.source.pcConfig = {
        iceServers: JSON.parse(source.iceServers)
      };
    }

    // replace the stream name with websocket url
    this.source.mediaServerUrl = source.src.replace(source.src.split('/').at(-1), 'websocket');
    // get the stream name from the url
    this.source.streamName = source.src.split('/').at(-1).split('.webrtc')[0];
    this.source.token = this.getUrlParameter('token');
    this.source.subscriberId = this.getUrlParameter('subscriberId');
    this.source.subscriberCode = this.getUrlParameter('subscriberCode');
    this.source.reconnect = this.source.reconnect === undefined ? true : this.source.reconnect;
    const config = {
      websocketURL: this.source.mediaServerUrl,
      mediaConstraints: this.source.mediaConstraints,
      isPlayMode: true,
      sdpConstraints: this.source.sdpConstraints,
      reconnectIfRequiredFlag: this.source.reconnect,
      callback: (info, obj) => {
        if (this.disposed) {
          return;
        }
        this.player.trigger('webrtc-info', {
          obj,
          info
        });
        switch (info) {
          case ANT_CALLBACKS.INITIALIZED:
            {
              this.play();
              break;
            }
          case ANT_CALLBACKS.ICE_CONNECTION_STATE_CHANGED:
            {
              break;
            }
          case ANT_CALLBACKS.PLAY_STARTED:
            {
              this.joinStreamHandler(obj);
              this.isPlaying = true;
              this.player.trigger('play');
              break;
            }
          case ANT_CALLBACKS.PLAY_FINISHED:
            {
              this.leaveStreamHandler(obj);
              this.isPlaying = false;
              this.player.trigger('ended');
              break;
            }
          case ANT_CALLBACKS.STREAM_INFORMATION:
            {
              this.streamInformationHandler(obj);
              break;
            }
          case ANT_CALLBACKS.RESOLUTION_CHANGE_INFO:
            {
              this.resolutionChangeHandler(obj);
              break;
            }
          case ANT_CALLBACKS.DATA_RECEIVED:
            {
              this.player.trigger('webrtc-data-received', {
                obj
              });
              break;
            }
          case ANT_CALLBACKS.DATACHANNEL_NOT_OPEN:
            {
              break;
            }
          case ANT_CALLBACKS.NEW_TRACK_AVAILABLE:
            {
              const vid = this.player.tech().el();
              if (vid.srcObject !== obj.stream) {
                vid.srcObject = obj.stream;
              }
              break;
            }
        }
      },
      callbackError: (error, message) => {
        if (this.disposed) {
          return;
        }
        // some of the possible errors, NotFoundError, SecurityError,PermissionDeniedError
        const ModalDialog = videojs.getComponent('ModalDialog');
        if (this.errorModal) {
          this.errorModal.close();
        }
        this.errorModal = new ModalDialog(this.player, {
          content: `ERROR: ${JSON.stringify(error)}`,
          temporary: true,
          pauseOnOpen: false,
          uncloseable: true
        });
        this.player.addChild(this.errorModal);
        this.errorModal.open();
        this.errorModal.setTimeout(() => this.errorModal.close(), 3000);
        this.player.trigger('webrtc-error', {
          error,
          message
        });
      }
    };
    if (this.source.pcConfig) {
      /* eslint-disable camelcase */
      const peerconnection_config = {};
      _extends$3(peerconnection_config, this.source.pcConfig);
      _extends$3(config, {
        peerconnection_config
      });
    }
    this.webRTCAdaptor = new WebRTCAdaptor(config);
  }

  /**
   * after websocket success connection.
   */
  play() {
    this.webRTCAdaptor.play(this.source.streamName, this.source.token, null, null, this.source.subscriberId, this.source.subscriberCode, null);
  }
  /**
   * after joined stream handler
   *
   * @param {Object} obj callback artefacts
   */
  joinStreamHandler(obj) {
    this.webRTCAdaptor.getStreamInfo(this.source.streamName);
  }
  /**
   * after left stream.
   */
  leaveStreamHandler() {
    // reset stream resolutions in dropdown
    this.player.resolutions = [];
    // eslint-disable-next-line newline-after-var
    const resolutionButton = this.player.controlBar.getChild('ResolutionMenuButton');
    if (resolutionButton) {
      resolutionButton.update();
    }
  }
  /**
   * stream information handler.
   *
   * @param {Object} obj callback artefacts
   */
  streamInformationHandler(obj) {
    const streamResolutions = obj.streamInfo.reduce((unique, item) => unique.includes(item.streamHeight) ? unique : [...unique, item.streamHeight], []).sort((a, b) => b - a);
    this.player.resolutions = streamResolutions.map(resolution => ({
      label: resolution,
      value: resolution
    }));
    this.player.selectedResolution = 0;
    this.addResolutionButton();
  }
  addResolutionButton() {
    const controlBar = this.player.controlBar;
    const fullscreenToggle = controlBar.getChild('fullscreenToggle').el();
    if (controlBar.getChild('ResolutionMenuButton')) {
      controlBar.removeChild('ResolutionMenuButton');
    }
    controlBar.el().insertBefore(controlBar.addChild('ResolutionMenuButton', {
      plugin: this,
      streamName: this.source.streamName
    }).el(), fullscreenToggle);
  }
  /**
   * change resolution handler.
   *
   * @param {Object} obj callback artefacts
   */
  resolutionChangeHandler(obj) {
    // eslint-disable-next-line no-undef
    this.player.spinner = document.createElement('div');
    this.player.spinner.className = 'vjs-custom-spinner';
    this.player.el().appendChild(this.player.spinner);
    this.player.pause();
    this.player.setTimeout(() => {
      if (this.player.el().getElementsByClassName('vjs-custom-spinner').length) {
        this.player.el().removeChild(this.player.spinner);
        this.player.play();
      }
    }, 2000);
  }
  changeStreamQuality(value) {
    this.webRTCAdaptor.forceStreamQuality(this.source.streamName, value);
    this.player.selectedResolution = value;
    this.player.controlBar.getChild('ResolutionMenuButton').update();
  }

  /**
   * get url parameter
   *
   * @param {string} param callback event info
   */
  getUrlParameter(param) {
    if (this.source.src.includes('?')) {
      const urlParams = this.source.src.split('?')[1].split('&').reduce((p, e) => {
        const a = e.split('=');
        p[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
        return p;
      }, {}) || {};
      return urlParams[param];
    }
    return null;
  }
  dispose() {
    this.disposed = true;
    if (this.webRTCAdaptor) {
      this.webRTCAdaptor.stop(this.source.streamName);
      this.webRTCAdaptor.closeWebSocket();
      this.webRTCAdaptor = null;
    }
  }
}
const webRTCSourceHandler = {
  name: 'videojs-webrtc-plugin',
  VERSION: '1.3.1',
  canHandleSource(srcObj, options = {}) {
    const localOptions = videojs.mergeOptions(videojs.options, options);
    localOptions.source = srcObj.src;
    return webRTCSourceHandler.canPlayType(srcObj.type, localOptions);
  },
  handleSource(source, tech, options = {}) {
    const localOptions = videojs.mergeOptions(videojs.options, options);

    // setting the src already dispose the component, no need to dispose it again
    tech.webrtc = new WebRTCHandler(source, tech, localOptions);
    return tech.webrtc;
  },
  canPlayType(type, options = {}) {
    const mediaUrl = options.source;
    const regex = /\.webrtc.*$/;
    const isMatch = regex.test(mediaUrl);
    if (isMatch) {
      return 'maybe';
    }
    return '';
  }
};

// register source handlers with the appropriate techs
videojs.getTech('Html5').registerSourceHandler(webRTCSourceHandler, 0);
var plugin = {
  WebRTCHandler,
  webRTCSourceHandler
};

export { plugin as default };
