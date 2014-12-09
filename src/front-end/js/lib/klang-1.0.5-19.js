(function (root, factory) {
if (typeof define === "function" && define.amd) {
    define( function(){ return root.Klang; }); //hack to preserve backward compatibility
} else if (typeof exports === "object") {
    module.exports = function(){ return root.Klang; };
}
    root.Klang = factory();

}(this, function () {
if (navigator.userAgent.indexOf('MSIE') != -1) {
    var ie = true;
    var ua = navigator.userAgent;
    var re = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");
    var ieVersion;
    if (re.exec(ua) != null) {
        ieVersion = parseInt(RegExp.$1);
    }
    // IE8 temporarily bypasses defineProperty when Klang is loaded.
    if (ieVersion < 9) {
        Object.oldDefineProperty = Object.defineProperty;
        Object.defineProperty = function() {};
    }
}

( function (){

    "use strict";

    var AudioContext = window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;


    function fixSetTarget(param) {
      if ( !param ) {
        return;
      }
      if ( !param.setTargetValueAtTime ) {
        param.setTargetValueAtTime = param.setTargetAtTime;
      }
    }

    if ( AudioContext ) {

        /**
        * Polyfill AudioContext
        **/

        var acProto     = AudioContext.prototype;
        var tmpContext  = new AudioContext();

        if (!acProto.hasOwnProperty('createGain')) acProto.createGain = acProto.createGainNode;


        //acProto.createGain = acProto.createGain || acProto.createGainNode;
        // monkeypatch
        if ( ! acProto.hasOwnProperty( 'internal_createBiquadFilter' ) ){
            acProto.internal_createBiquadFilter = acProto.createBiquadFilter;
            acProto.createBiquadFilter = function() { 
            var node = this.internal_createBiquadFilter();
            fixSetTarget(node.frequency);
            fixSetTarget(node.detune);
            fixSetTarget(node.Q);
            fixSetTarget(node.gain);
            var enumValues = ['LOWPASS', 'HIGHPASS', 'BANDPASS', 'LOWSHELF', 'HIGHSHELF', 'PEAKING', 'NOTCH', 'ALLPASS'];
            for (var i = 0; i < enumValues.length; ++i) {
              var enumValue = enumValues[i];
              var newEnumValue = enumValue.toLowerCase();
              if (!node.hasOwnProperty(enumValue)) {
                node[enumValue] = newEnumValue;
              }
            }
            return node;
            };
        }

          if (!acProto.hasOwnProperty('createDelay')) acProto.createDelay = acProto.createDelayNode;
          //acProto.createDelay = acProto.createDelay || acProto.createDelayNode;


          // Support alternate names
          // start (noteOn), stop (noteOff), createGain (createGainNode), etc.
          var isStillOld = function( normative, old ) {
            return normative === undefined && old !== undefined;
          };

          var bufferProto = tmpContext.createBufferSource().constructor.prototype;

          if ( isStillOld( bufferProto.start, bufferProto.noteOn ) || isStillOld( bufferProto.stop, bufferProto.noteOff ) ) {
            var nativeCreateBufferSource = acProto.createBufferSource;

            acProto.createBufferSource = function createBufferSource() {
              var returnNode = nativeCreateBufferSource.call(this);
              returnNode.start = returnNode.start || returnNode.noteOn;
              returnNode.stop = returnNode.stop || returnNode.noteOff;

              return returnNode;
            };
          }

          // Firefox 24 doesn't support OscillatorNode
          if ( typeof tmpContext.createOscillator === 'function' ) {
            var oscPraoto = tmpContext.createOscillator().constructor.prototype;

            if ( isStillOld( oscPraoto.start, oscPraoto.noteOn ) || isStillOld(oscPraoto.stop, oscPraoto.noteOff ) ) {
              var nativeCreateOscillator = acProto.createOscillator;

              acProto.createOscillator = function createOscillator() {
                var returnNode = nativeCreateOscillator.call(this);
                returnNode.start = returnNode.start || function () {
                    if ( returnNode.noteOn ) {
                        if ( arguments.length > 1 ) {
                            returnNode.noteGrainOn.apply( returnNode, arguments );
                        } else {
                            returnNode.noteOn.apply( returnNode, arguments );
                        }
                    } else {
                        console.warn( 'WebAudio polyfill failed' )
                    }
                    
                };
                returnNode.stop = returnNode.stop || returnNode.noteOff;

                return returnNode;
              };
            }
          }

          // Simple name changes
          if ( acProto.createGain === undefined && acProto.createGainNode !== undefined ) {
            acProto.createGain = acProto.createGainNode;
          }

          if ( acProto.createDelay === undefined && acProto.createDelayNode !== undefined ) {
            acProto.createDelay = acProto.createDelayNode;
          }

          if ( acProto.createScriptProcessor === undefined && acProto.createJavaScriptNode !== undefined ) {
            acProto.createScriptProcessor = acProto.createJavaScriptNode;
          }




          /**
          * Polyfill AudioParam
          **/ 
          var AudioParam = window.AudioParam = window.AudioParam || window.webkitAudioParam;
    
          if ( AudioParam ) {
            var audioParamProto = window.AudioParam.prototype;

            // rename setTargetValueAtTime -> setTargetAtTime 
            audioParamProto.setTargetAtTime = audioParamProto.setTargetAtTime || audioParamProto.setTargetValueAtTime;
          } else {
            
            if ( !AudioContext.prototype.internal_createGain ) {
              AudioContext.prototype.internal_createGain = AudioContext.prototype.createGain;
              AudioContext.prototype.createGain = function() {
                var node = this.internal_createGain();
                fixSetTarget(node.gain);
                return node;
              };
            }

          }


          /**
          * Polyfill AudioBufferSource.playbackState
          **/

          var AudioBufferSourceNode = window.AudioBufferSourceNode;

          if ( AudioBufferSourceNode ) {
            
            var audioBufferSourceNodeProto = AudioBufferSourceNode.prototype;

            var tmpAudioBufferSourceNode = tmpContext.createBufferSource();

            /**
            * Polyfill depricated playbackState, only playing and finished state polyfilled for now
            */
            if ( tmpAudioBufferSourceNode.playbackState === undefined ) {

              var UNSCHEDULED_STATE = 0;
              var SCHEDULED_STATE   = 1;
              var PLAYING_STATE     = 2;
              var FINISHED_STATE    = 3;

              if ( !audioBufferSourceNodeProto.internal_start ) {
                audioBufferSourceNodeProto.internal_start = audioBufferSourceNodeProto.start;
                audioBufferSourceNodeProto.start = function () {
                  var _this = this;
                  this.playbackState = PLAYING_STATE;
                  this.addEventListener( 'ended', function () {
                    _this.playbackState = FINISHED_STATE;
                  });
                  this.internal_start.apply( this, arguments );

                }
              }
            }
          }

    } // end if AudioContext

    
} ());
/**
*   Klang AudioSprite
*   @author ?
*/
var AudioSprite = ( function () {

    "use strict";

    var FADE_OUT_TIME    = 80; // ms
    var LAG_MAX_CEILING  = 2;  // secs
    var lagAccum         = 0;

    //var audioSpritePool  = [];
    var MAX_VOICE_COUNT  = 40; // 40 is about as much as IE9 can handle
    var currentVoiceCount = 0;

    var AudioSpriteVoice = function ( src, data, lodingCallback ) {

        //this.audio      = new Audio();
        this.playing    = false;
        this.loaded     = false;
        this.inited     = false;

        this.srcUrl         = src;
        this.loadedCallback = null;
        this.lodingCallback = lodingCallback;
        this.volume         = 1;
        this._released      = true;

    };

    /////////////////////////////////////////////////////////////////////////////
    // PUBLIC
    /////////////////////////////////////////////////////////////////////////////


    /**
    *
    */
    AudioSpriteVoice.prototype.init = function() {
        var _this   = this;
        var audio   = this.audio = new Audio();
         currentVoiceCount ++;
        if ( currentVoiceCount >= MAX_VOICE_COUNT ) {
            Klang.warn( 'More than ' + MAX_VOICE_COUNT + ' audio elements created, future AudioElements instantiations will be ignored by IE' );
        }
        this.inited = true;

        audio.src          = this.srcUrl;
        audio.autoplay     = false;
        audio.preload      = "auto";

        var forcePauseOnLoad = function () {
            audio.pause();
            audio.removeEventListener( 'play', forcePauseOnLoad, false );

            if ( _this.lodingCallback && !_this.loaded ) {
                _this.lodingCallback();
            }

            _this.loaded = true;
        };

        var canPlayThroughCallback = function() {
            if ( _this.loadedCallback ) {
                _this.loadedCallback();
            }
            if ( !Klang.isMobile ) {
                audio.volume = 0;
            }
            // @ifdef DEBUG
            Klang.log( 'canplaythrough ', _this.srcUrl );
            audio.removeEventListener( 'canplaythrough', canPlayThroughCallback );
            // @endif
        };

        audio.addEventListener( 'canplaythrough', canPlayThroughCallback );
        audio.addEventListener( 'play', forcePauseOnLoad, false );

        if ( !Klang.isMobile ) {
            audio.volume = 0;
        }

        audio.play();


        return this;
    };

    /**
    *
    */
    AudioSpriteVoice.prototype.setLoop = function ( state ) {
        this.audio.loop = state;
        return this;
    };

    /**
    *
    */
    AudioSpriteVoice.prototype.setVolume = function ( vol ) {
        vol = Math.max( 0, Math.min( 1, vol ) );
        if ( !Klang.isMobile ) {
            this.audio.volume = vol;
        }
        this.volume = vol;
        return this;
    };

    AudioSpriteVoice.prototype.fadeOut = function( dur, onComplete ) {
        var audio       = this.audio;
        var startVol    = audio.volume;
        var startTime   = Date.now();
        var _this       = this;

        ( function fadeOut(){
            var deltaTime   = Date.now() - startTime;
            var fadeBasis   = 1 - ( deltaTime / dur );
            fadeBasis       = fadeBasis < 0.1 ? 0 : fadeBasis;
            audio.volume    = Math.max( 0, Math.min( 1, startVol * fadeBasis ) );

            if ( audio.volume > 0 && ! _this.playing ) { // abort if playing
                setTimeout( fadeOut, 20 );
            } else {
                onComplete();
            }
        } ());
        return this;
    };

    /**
     * Immedietly stop and release audio element, this will cause a pop/click in IE in most cases
     * @param seekTime (optional) seeking to next sound directly after pause (if
     *                            you know what it will be) can reduce time to
     *                            play next sound and make it feel more responsive
     */
    AudioSpriteVoice.prototype.stop = function ( seekTime ) {
        this.audio.pause();
        if ( seekTime ) {
            this.audio.currentTime = seekTime;
        }
        this.playing = false;
        this._released = true;

        clearInterval( this._timer );
        clearTimeout( this._backupTimeout );

        return this;
    };

    /**
     * Pause audio sprute at current position
     * @param seekTime (optional) seeking to next sound directly after pause (if
     *                            you know what it will be) can reduce time to
     *                            play next sound and make it feel more responsive
     */
    AudioSpriteVoice.prototype.fadeOutAndStop = function ( duration, seekTime ) {
        var _this = this;
        if ( !duration ) {
            this.stop( seekTime );
        }
        if ( this.playing ) {
           this.playing = false;
           this.fadeOut( duration || FADE_OUT_TIME, function () {
                _this.stop( seekTime );
           } );
        }
        return this;
    };

    /**
     * Triggers loading of sprite source
     */
    AudioSpriteVoice.prototype.load = function ( callback ) {

        this.loadedCallback = callback;

        if ( ! this.inited ) {
            this.init();
        }



    };

    /**
    *
    */
    AudioSpriteVoice.prototype.play = function ( startTime, duration ) {

        if (!this.inited) {
            return;
        }


        if (startTime === undefined) {
            startTime = 0;
        }

        var _this       = this;
        var audio       = this.audio;                           //this._aquireVoice();
        var nextTime    = startTime + duration;
        var startTime   = Math.floor( startTime * 100 ) / 100;  // seeking to time with too many decimals sometimes ignored by audio tag

        // Consider adding something like this to skip sound if frame rate drops
        // if (Global.LAST_FRAME > 1000) {
        //   return;
        // }

        //this.setVolume( this.volume );

        var progress = function () {
            audio.removeEventListener( 'progress', progress, false );
            if ( _this.updateCallback !== null && _this.playing ) {
                _this.updateCallback();
            }
        };

        var delayPlay = function () {
            _this.updateCallback = function () {
                _this.updateCallback = null;

                if (waitForDuration() || !audio.duration) {
                    // still no duration - server probably doesn't send "Accept-Ranges" headers - aborting');
                    return;
                }

                audio.currentTime = startTime;
                audio.play();
            };
            audio.addEventListener('progress', progress, false);
        };

        // Check if audio tag is missing duration
        // missing audio.duration is NaN in Firefox
        // missing audio.duration is Infinity in Mobile Safari
        // missing audio.duration is 100 in Chrome on Android
        var waitForDuration = function () {
            return !isFinite( audio.duration ) || audio.duration === 100;
        };

        this.playing = true;
        this.updateCallback = null;
        audio.removeEventListener('progress', progress, false);

        clearTimeout( this._backupTimeout );
        clearInterval( this._timer ); //Render.stopRender(_this._checkCurrentTime);

        audio.pause();

        try {
            // try seeking to sound to play
            if ( startTime == 0) startTime = 0.01; // http://remysharp.com/2010/12/23/audio-sprites/
            if ( audio.currentTime !== startTime ) audio.currentTime = startTime;

            // make sure we can read duration of audio tag, otherwise we can't seek
            if ( waitForDuration() || Math.round( audio.currentTime * 100 ) / 100 < startTime ) {
                delayPlay();
            } else {
                audio.play();
            }
        } catch ( e ) {
            delayPlay();
        }

        this._released = false;

        // Don't create timers if duration is not specified (to play the entire audio)
        if ( duration === undefined ) {
            return;
        }

        // checks if audio tag has played past current sound and should pause
        this._checkCurrentTime = function () {

            if ( audio.currentTime >= nextTime ) {


                _this.stop();

                clearTimeout( _this._backupTimeout );
            }

            // if ( audio.currentTime >= nextTime - FADE_OUT_TIME * 0.001 ) {
            //     var deltaLag =  audio.currentTime - nextTime;

            //     // disable fade out if we're lagging too much
            //     if ( FADE_OUT_TIME && audio.currentTime > nextTime ) {


            //         Klang.warn( 'AudioSprite lagging behind with: ', deltaLag, ' sec. LagAccum: ', lagAccum );
            //         lagAccum+= deltaLag;
            //         if ( lagAccum > LAG_MAX_CEILING ) {
            //             Klang.warn( 'Lag time has reashed threshold, disabling fade out' );
            //             // disable fade out
            //             FADE_OUT_TIME = 0;
            //         }

            //     }

            //     //_this.stop();
            //     _this.fadeOutAndStop( deltaLag );
            //     clearTimeout( _this._checkCurrentTime );
            //     clearTimeout( _this._backupTimeout );
            // }

        }


        // In some cases on Android the audio tag's currentTime doesn't update though the audio is still playing.
        // We setup a fallback timeout to pause 1 second after the current sprite's end time
        // Space sounds more than 1s apart in sprite to be make sure no extra sounds are played
        // Normally this backup timeout is cancelled by _checkCurrentTime()
        this._backupTimeout = setTimeout( function () {
            _this.stop();
        }, ( duration * 1000 ) + 1000 );

        // Consider using requestAnimationFrame instead and hook into your app's
        // render looop, e.g. Render.startRender(_this._checkCurrentTime);
        this._timer = setInterval( _this._checkCurrentTime, 10 );
    };


    var AudioSprite = function ( src, data, loadCallback ) {
        this.data       = data;
        this.srcUrl     = src;
        this.playing    = false;
        this.loaded     = false;

        this._maxPolyphony      = data.maxPolyphony || 4;

        this._currentVoiceIndex = 0;
        this._aquiredVoices     = 0;

        this._voiceMap = [];
        this._voicePool = [];
        this._baseVoice = new AudioSpriteVoice( src, data, loadCallback );

        // for ( var i = 0; i < this._maxPolyphony; i++ ) {
        //     this._voices.push( new AudioSpriteVoice( src, data, i === 0 ? loadCallback : null ) );
        // }
    }

    AudioSprite.prototype.init = function() {
        this._baseVoice.init();
        this.inited = true;
        return this;
    };

    AudioSprite.prototype.load = function ( cb ) {
        var _this = this;


        this._baseVoice.load( function() {
            // make copied for polyphony
            _this._voicePool.push( _this._baseVoice );
            for ( var i = 0; i < _this._maxPolyphony; i++ ) {
                var spriteVoice = new AudioSpriteVoice( _this.srcUrl, _this.data ).init();
                _this._voicePool.push( spriteVoice );
                spriteVoice._polyId = i;
                _this._voiceMap[ i ] = -1;

            }
            cb && cb();
        } );
        Klang.log('Load Audio Sprite ', this.srcUrl );
    };

    /**
    *
    */
    AudioSprite.prototype.setLoop = function ( state ) {
        for ( var i = 0; i < this._voices.length; i++ ) {
            this._voices[ i ].setLoop( state );
        }
    };

    /**
    *
    */
    AudioSprite.prototype.setVolume = function ( vol ) {

        for ( var i = 0; i < this._voices.length; i++ ) {
            this._voices[ i ].setVolume( vol );

        }
    };

    /**
    *
    */
    AudioSprite.prototype._aquireVoice = function () {
        var voice;

        for (var i = this._voicePool.length - 1; i >= 0; i--) {
            if ( this._voicePool[ i ]._released ) {
                voice = this._voicePool[ i ];
                break;
            }
        }

        // if we can't find a released voice, we need to steal one
        if ( !voice ) {
            var stealIndex = this._currentVoiceIndex + 1; // + 1 is the voice that's been playing the longest
            stealIndex = stealIndex > this._maxPolyphony - 1 ? 0 : stealIndex;
            voice = this._voicePool[ stealIndex ].stop();
        }

        this._currentVoiceIndex ++;
        this._currentVoiceIndex %= this._maxPolyphony;

        return voice;
    };


    /**
    *
    */
    AudioSprite.prototype.play = function ( voiceId, volume, startTime, duration ) {
        var spriteVoice = this._aquireVoice();
        if ( spriteVoice ) {
            this._voiceMap[ spriteVoice._polyId ] = voiceId;
            spriteVoice.setVolume( volume );
            spriteVoice.play( startTime, duration );
            this.playing = true;
        }
    };

    /**
     * Pause audio sprute at current position
     * @param seekTime (optional) seeking to next sound directly after pause (if
     *                            you know what it will be) can reduce time to
     *                            play next sound and make it feel more responsive
     */

    AudioSprite.prototype.stop = function ( index ) {
        var i;
        if ( index !== undefined ) {
            for (  i = this._voiceMap.length - 1; i >= 0; i-- ) {
                var voiceIndex = this._voiceMap[ i ];
                if ( voiceIndex === index && this._voicePool[ voiceIndex ] !== undefined ) {
                    this._voicePool[ voiceIndex ].fadeOutAndStop();
                    break;
                }
            };
        } else {
            for ( i = 0; i < this._voicePool.length; i++ ) {
                this._voicePool[ i ].fadeOutAndStop();
            }
        }
    };



    return AudioSprite;

} ());
var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path="../../lib/webaudio.d.ts" />
/// <reference path="../../lib/js.d.ts" />
/** @namespace Klang */ var Klang;
(function (Klang) {
    (function (detector) {
        /**
        * As a worst case for browser specific fixes
        */
        function detectBrowser() {
            var ua = navigator.userAgent;
            var temp;
            var match = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if(/trident/i.test(match[1])) {
                temp = /\brv[ :]+(\d+)/g.exec(ua) || [];
                return {
                    name: 'IE',
                    version: temp[1] || 'unknown'
                };
            }
            if(match[1] === 'Chrome') {
                temp = ua.match(/\bOPR\/(\d+)/);
                if(temp !== null) {
                    return {
                        name: 'Opera',
                        version: temp[1]
                    };
                }
            }
            match = match[2] ? [
                match[1], 
                match[2]
            ] : [
                navigator.appName, 
                navigator.appVersion, 
                '-?'
            ];
            if((temp = ua.match(/version\/(\d+)/i)) !== null) {
                match.splice(1, 1, temp[1]);
            }
            return {
                name: match[0],
                version: match[1]
            };
        }
        detector.browser = detectBrowser();
    })(Klang.detector || (Klang.detector = {}));
    var detector = Klang.detector;
    (function (network) {
        function isCrossDomain(url) {
            // window.location.hostname = "" when running from file or phantomjs
            return !!(url.indexOf('://') !== -1 && (window.location.hostname && url.indexOf(window.location.hostname) === -1));
        }
        network.isCrossDomain = isCrossDomain;
        function request(options, onDone, onProgress, onError) {
            var request;
            options.type = options.type || 'GET';
            if(window['XDomainRequest'] && isCrossDomain(options.url)) {
                request = new window['XDomainRequest']();
                request.onload = function () {
                    onDone && onDone(request.responseText);
                };
                request.onprogress = onProgress;
                request.onerror = onError;
                request.open(options.type, options.url, true);
            } else if(window['XMLHttpRequest']) {
                request = new XMLHttpRequest();
                request.open(options.type, options.url, true);
                request.onreadystatechange = function () {
                    try  {
                        if(request.readyState == 4 && request.status == 200) {
                            if(onDone) {
                                var response = request.responseText;
                                onDone(response);
                            }
                        } else if(request.status != 0 && request.status != 200) {
                            if(onError) {
                                onError({
                                    status: request.status
                                });
                            }
                        }
                    } catch (e) {
                        if(onError) {
                            onError({
                                status: "aborted"
                            });
                        }
                    }
                };
            }
            if(request) {
                request.send(null);
            }
        }
        network.request = request;
    })(Klang.network || (Klang.network = {}));
    var network = Klang.network;
    Klang.audioTagHandler;
    function touchLoad(e) {
        Klang.audioTagHandler.loadSoundFiles();
    }
    /**
    * Represents an audio source for audio tag fallback.
    * @param {Object} data Configuration data.
    * @param {Object} sprite Audiosprite that this source uses.
    * @constructor
    * @extends {Klang.ATAudioSource}
    */
    var ATAudioSource = (function () {
        function ATAudioSource(data, sprite) {
            this._data = data;
            this._sprite = sprite;
            if(!this._sprite) {
                return;
            }
            this._priority = this._sprite.data.audio_tag;
            if(this._data.loop) {
                var url = this._sprite.srcUrl;
                if(this._data.loop_start == undefined) {
                    this._data.loop_start = 0;
                }
                if(this._data.loop_end != undefined) {
                    //this._data.offset = this._data.loop_start;
                    this._data.duration = this._data.loop_end// - this._data.loop_start;
                    ;
                }
            }
            // this._gain = new ATGainNode(data.volume, this);
                    }
        ATAudioSource.prototype.play = function (when, offset, resume, keepVolume, loopTrigg) {
            // if (when) {
            //     var _this = this;
            //     clearInterval(this._loopTimer);
            //     this._loopTimer = setTimeout(function() {
            //         _this.play(0, offset, resume, keepVolume, true );
            //     }, Math.round(when*1000));
            // } else if (this._sprite) {
            //     if ( this._data.loop && this._playing && !this._fadingOut && !loopTrigg ) {
            //         return this;
            //     }
            //     this._playing = false;
            //     //this._sprite.pause();
            //     //clearInterval(this._loopTimer);
            //     if (Klang.audioTagHandler.getLimitSounds()) {
            //         if (this._priority == 1) {
            //             //Klang.audioTagHandler.stopAll();
            //         }
            //         else {
            //             return this;
            //         }
            //     }
            //     if (!offset) {
            //         offset = 0;
            //     }
            //     if (!this._data.offset) {
            //         this._data.offset = 0;
            //     }
            //     if (!this._data.duration) {
            //         this._data.duration = this._sprite.audio.duration;
            //     }
            //     this._playing = true;
            //     //clearInterval(this._loopTimer);
            //     if ( !loopTrigg ) {
            //         this._gain.resetVolume(keepVolume);
            //     }
            //     var undef;
            //     this._sprite.play(this._data.offset+offset, ( this._data.duration - offset ) || undef );
            //     if (this._data.loop && this._data.duration) {
            //         this.play(this._data.duration-offset, this._data.loop_start, false, true);
            //     }
            // }
            return this;
        };
        ATAudioSource.prototype.fadeInAndPlay = function (targetValue, duration, when, offset) {
            // if (!this._sprite) {
            //     return this;
            // }
            // when = when || 0;
            // // if (!this._fadingOut && this._data.loop  && this._playing) return this;
            // offset = offset || 0;
            // this._fadingIn  = true;
            // this._fadingOut = false;
            // var output = this.getOutput();
            // if ( !this._playing ) {
            //     output.setVolume(0);
            //     output.resetVolume(true);
            //     this.play(when, offset, false, false);
            // } else {
            //     output.resetVolume(false);
            // }
            // var _this = this;
            // output.fadeVolume( targetValue, duration, function () {
            //     _this._fadingIn = false;
            // });
            return this;
        };
        ATAudioSource.prototype.stop = function (when) {
            // if (when) {
            //     var _this = this;
            //     if ( this._loopTimer ) {
            //         clearInterval(this._loopTimer);
            //     }
            //     this._loopTimer = setTimeout(function() {
            //         _this.stop(0);
            //     }, Math.round(when*1000));
            // }
            // else if (this._sprite) {
            //     if ( !this._playing && !this._fadingIn ) {
            //         return this;
            //     }
            //     this._playing = false;
            //     this._sprite.pause( 0 );
            //     if ( this._loopTimer ) {
            //         clearInterval(this._loopTimer);
            //     }
            // }
            return this;
        };
        ATAudioSource.prototype.fadeOutAndStop = function (duration, when) {
            // if (when) {
            //     var _this = this;
            //     if ( this._loopTimer ) {
            //         clearInterval( this._loopTimer );
            //     }
            //     this._loopTimer = setTimeout(function() {
            //         _this.fadeOutAndStop(duration, 0);
            //     }, Math.round(when*1000));
            // } else if ( this._sprite ) {
            //     if ( !this._playing ) {
            //         return this;
            //     }
            //     this._fadingOut = true;
            //     this._fadingIn  = false;
            //     var _this = this;
            //     this.getOutput().fadeVolume( 0, duration, function() {
            //         this._fadingOut = false;
            //         _this.stop();
            //     });
            // }
            return this;
        };
        ATAudioSource.prototype.setVolume = function (value) {
            // if (!this._sprite) {
            //     return this;
            // }
            // var value = Math.max( 0, Math.min( 1, value * Klang.audioTagHandler.getGlobalVolume() ) );
            // this._sprite.setVolume( value );
            return this;
        };
        ATAudioSource.prototype.getOutput = function () {
            return this._gain;
        };
        Object.defineProperty(ATAudioSource.prototype, "position", {
            get: function () {
                // changed in AudioSprite for US Open Project
                // if (!this._sprite || !this._playing) return -1;
                return this._sprite.audio.currentTime;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(ATAudioSource.prototype, "playing", {
            get: function () {
                return this._playing;
            },
            enumerable: true,
            configurable: true
        });
        return ATAudioSource;
    })();
    Klang.ATAudioSource = ATAudioSource;    
    // export class ATPolyAudioSource extends ATAudioSource {
    //     private _polySources : number = 2;
    //     private _voices      : any[];
    //     private _voiceCount  : number = 0;
    //     private newVoice(){
    //         this._voices.push( new new AudioSprite( this.sprite.srcUrl, this.sprite.data ) );
    //     }
    //     public play(when, offset, resume, keepVolume, loopTrigg? ): ATAudioSource {
    //     }
    // }
    /**
    * Represents an audio group for audio tag fallback.
    * @param {Object} data Configuration data.
    * @constructor
    * @extends {Klang.ATAudioSource}
    */
    var ATAudioGroup = (function () {
        function ATAudioGroup(data) {
            this._data = data;
            this._content = [];
            for(var c = 0; c < this._data.content.length; c++) {
                var audio = Klang.audioTagHandler.getObject(this._data.content[c]);
                if(audio) {
                    this._content.push(audio);
                }
            }
            if(!this._data.content.length) {
                Klang.log('Loading empty AudioGroup');
            }
        }
        ATAudioGroup.prototype.play = function (when, index, velocity) {
            if(Klang.audioTagHandler.muted) {
                return this;
            }
            // var index = typeof audioSource === 'number' ? audioSource :  Util.random(this._content.length-1, 0);
            if(isFinite(index)) {
                index = Math.floor(index);
                if(this._content[index]) {
                    var audioSource = this._content[index];
                    var volume = velocity === undefined ? 1 : velocity / 127;
                    if(audioSource._sprite) {
                        audioSource._sprite.play(index, volume, audioSource._data.offset, audioSource._data.duration);
                    }
                } else {
                    if(this._content.length) {
                        Klang.log('ATAudioGroup ', this._content[0]._sprite._baseVoice.srcUrl.replace(/^.*[\\\/]/, ''), ' no matching index - ', index);
                    } else {
                        Klang.log('ATAudioGroup: no content');
                    }
                }
            }
            return this;
        };
        ATAudioGroup.prototype.stop = function (index) {
            var audioSource;
            //var index = typeof audioSource === 'number' ? audioSource :  Util.random(this._content.length-1, 0);
            if(isFinite(index)) {
                audioSource = this._content[index];
                if(audioSource) {
                    if(audioSource._sprite) {
                        audioSource._sprite.stop(index);
                    }
                }
            } else {
                audioSource = this._content[0];
                if(audioSource && audioSource._sprite) {
                    // stop all
                    audioSource._sprite.stop();
                }
                for(var c = 0; c < this._data.content.length; c++) {
                    if(this._content[c]) {
                        this._content[c].stop();
                    }
                }
            }
            return this;
        };
        Object.defineProperty(ATAudioGroup.prototype, "playing", {
            get: function () {
                var playing = false;
                for(var c in this._content) {
                    if(this._content[c]._playing) {
                        playing = true;
                        ;
                    }
                }
                return playing;
            },
            enumerable: true,
            configurable: true
        });
        return ATAudioGroup;
    })();
    Klang.ATAudioGroup = ATAudioGroup;    
    /**
    * Simulates a gain node for audio tags.
    * @param {number} volume Starting volume.
    * @constructor
    * @extends {Klang.ATGainNode}
    */
    var ATGainNode = (function () {
        // obejct to update when the volume changes
        function ATGainNode(volume, owner) {
            this._currentVolume = this._volume = volume != undefined ? volume : 1;
            this._currentVolume = Math.max(0, Math.min(this._currentVolume, 1));
            this._owner = owner;
        }
        ATGainNode.prototype.getVolume = function () {
            return this._volume;
        };
        ATGainNode.prototype.setVolume = function (value) {
            value = Math.max(0, Math.min(1, value));
            this._currentVolume = this._volume = value;
            if(this._owner && this._owner.setVolume) {
                this._owner.setVolume(this._currentVolume);
            }
            return this;
        };
        ATGainNode.prototype.fadeVolume = function (targetValue, duration, callback) {
            if(this._fadeTimer) {
                clearInterval(this._fadeTimer);
            }
            var _this = this;
            this._fadeSteps = Math.round(duration * 1000) / 10;
            this._volumeStep = (this._currentVolume - targetValue) / this._fadeSteps;
            this._fadeTimer = setInterval(function () {
                _this.setVolume(_this._currentVolume - _this._volumeStep);
                _this._fadeSteps--;
                if(_this._fadeSteps <= 0) {
                    clearInterval(_this._fadeTimer);
                    if(callback) {
                        callback();
                    }
                }
            }, 10);
            return this;
        };
        ATGainNode.prototype.resetVolume = function (keepVolume) {
            var volumeToSet = keepVolume ? this._currentVolume : this._volume;
            clearInterval(this._fadeTimer);
            this.setVolume(volumeToSet);
            return this;
        };
        return ATGainNode;
    })();
    Klang.ATGainNode = ATGainNode;    
    /**
    * Represents a process for audio tag fallback.
    * @param {Object} data Configuration data.
    * @param {string} name Name of the process.
    * @param {Object} vars The variables that this process needs.
    * @constructor
    * @extends {Klang.ATProcess}
    */
    var ATProcess = (function () {
        function ATProcess(data, name, vars) {
            this._data = data;
            this._name = name;
            this._vars = vars;
            if(this._data.at_action === "copy") {
                this._data.at_action = this._data.action;
            }
        }
        ATProcess.prototype.start = function (args) {
            try  {
                new Function("Util", "me", "args", this._data.at_action)(Util, this._vars, args);
            } catch (ex) {
                Klang.err("Klang: error in process '" + this._name + "': " + ex.name + ": " + ex.message);
            }
        };
        return ATProcess;
    })();
    Klang.ATProcess = ATProcess;    
    /**
    * Handles fallback to using audio tag for browsers that do not support web audio.
    * @param {string} baseUrl Base url for the config file.
    * @param {Function} readyCallback Function to call when the engine is ready and auto sounds are loaded.
    * @param {Function} progressCallback Function to call while loading audio sounds.
    * @constructor
    * @extends {Klang.AudioTagHandles}
    */
    var AudioTagHandler = (function () {
        function AudioTagHandler(config, readyCallback, progressCallback) {
            // om endast ett ljud spelas samtidigt
            this.muted = false;
            this._loadedFiles = 0;
            this._audioSprites = {
            };
            this._limitSounds = Klang.isMobile || Klang.browser == "Opera";
            if(typeof config == "string") {
                var _this = this;
                network.request({
                    url: config
                }, function (data) {
                    try  {
                        _this.init(JSON.parse(data), readyCallback, progressCallback, config);
                    } catch (ex) {
                        Klang.version = "n/a";
                        if(readyCallback) {
                            readyCallback(false);
                        }
                    }
                }, null, function (error) {
                    Klang.log('Klang.network.request error:', error.msg);
                    Klang.err(error);
                });
            } else if(typeof config == "object") {
                this.init(config);
            } else {
                Klang.err("Klang exception: unrecognized config type: " + typeof config);
            }
        }
        AudioTagHandler.prototype.init = function (data, readyCallback, progressCallback, configURL) {
            var _this = this;
            this._globalVolume = 1;
            this._readyCallback = readyCallback;
            this._progressCallback = progressCallback;
            this._events = data.events;
            var relativePath = data.settings.relative_path;
            var baseURL;
            var filePath = data.settings.file_path || "";
            if(relativePath) {
                if(configURL.lastIndexOf("/") != -1) {
                    baseURL = configURL.substring(0, configURL.lastIndexOf("/"));
                    if(baseURL.charAt(baseURL.length - 1) !== "/") {
                        baseURL += "/";
                    }
                    baseURL += filePath;
                } else {
                    baseURL = filePath;
                }
            } else {
                baseURL = filePath;
            }
            var format = (Klang.browser == "Opera" || Klang.browser == "Firefox" || Klang.browser == "Chrome") ? ".ogg" : ".mp3";
            // Create audio sprites
            for(var p in data.files) {
                if(data.files.hasOwnProperty(p)) {
                    var fileData = data.files[p];
                    // Ladda inte in filer som inte har markerats för användning i audio tag
                    var prio = fileData.audio_tag;
                    if(prio && (!this._limitSounds || prio == 1)) {
                        // ladda inte in filer utan prio 1 på mobil
                        this._audioSprites[fileData.id] = new AudioSprite(baseURL + fileData.url + format, fileData, function () {
                            //_this.loadProgress();
                                                    });
                    }
                }
            }
            // Create sources
            this._audio = {
            };
            for(var a in data.audio) {
                if(data.audio.hasOwnProperty(a)) {
                    var audioData = data.audio[a];
                    if(audioData.type == "AudioSource") {
                        var sprite = this._audioSprites[audioData.file_id];
                        // Skapa inte audio sources som använder filer som inte används
                        //if (sprite) {
                        this._audio[a] = new ATAudioSource(audioData, this._audioSprites[audioData.file_id]);
                        //}
                                            }
                }
            }
            // Create groups
            for(a in data.audio) {
                if(data.audio.hasOwnProperty(a)) {
                    audioData = data.audio[a];
                    if(audioData.type == "AudioGroup") {
                        var sprite = this._audioSprites[audioData.file_id];
                        this._audio[a] = new ATAudioGroup(audioData);
                    }
                }
            }
            // Create processes
            this._processes = {
            };
            for(var p in data.processes) {
                if(data.processes.hasOwnProperty(p)) {
                    var processData = data.processes[p];
                    // skapa inte processer som itne används i audiotag
                    if(processData.at_action) {
                        var processArgs = {
                        };
                        for(var v in processData.vars) {
                            var processVarName = processData.vars[v];
                            processArgs[processVarName] = this._audio[processVarName];
                        }
                        this._processes[p] = new ATProcess(processData, p, processArgs);
                    }
                }
            }
            this.loadSoundFiles([
                "auto", 
                "autotag"
            ]);
        };
        AudioTagHandler.prototype.initIOS = function () {
            if(Klang.isIOS || Klang.isMobile) {
                for(var p in this._audioSprites) {
                    this._audioSprites[p].load();
                }
            }
        };
        AudioTagHandler.prototype.soundOff = function () {
            for(var i in this._audioSprites) {
                if(this._audioSprites.hasOwnProperty(i)) {
                    var sprite = this._audioSprites[i];
                    sprite.stop();
                }
            }
            this.muted = true;
        };
        AudioTagHandler.prototype.soundOn = function () {
            this.muted = false;
            //
                    };
        AudioTagHandler.prototype.loadSoundFiles = /**
        * Starts loading a group of sounds.
        * @param {string} group Which group to load, loads all sounds if not specified.
        * @param {Function} readyCallback Function to call when the engine is ready and auto sounds are loaded.
        * @param {Function} progressCallback Function to call while loading audio sounds.
        */
        function (group, readyCallback, progressCallback, loadFailedCallback) {
            if(readyCallback) {
                this._readyCallback = readyCallback;
            }
            if(progressCallback) {
                this._progressCallback = progressCallback;
            }
            this._loadedFiles = 0;
            this._numFiles = 0;
            var _this = this;
            for(var p in this._audioSprites) {
                if(this._audioSprites.hasOwnProperty(p)) {
                    var spriteGroup = this._audioSprites[p].data.load_group;
                    if(group == undefined || spriteGroup == group || group.indexOf(spriteGroup) != -1) {
                        this._numFiles++;
                        this._audioSprites[p].load(function () {
                            _this.loadProgress();
                        });
                    }
                }
            }
            // Nothing to load, call ready
            if(this._numFiles == 0 && this._readyCallback) {
                // load progress of audio tags is unreliable
                this._readyCallback(true);
            }
        };
        AudioTagHandler.prototype.getLoadGroups = /**
        * Get a list of loadgroups
        * @return {string[]} List of availible load groups (excluding the "auto" load group)
        */
        function () {
            var i;
            var fileInfoArr = this._audioSprites || [];
            var groupTable = {
            };
            var listOfGroups = [];
            for(i in fileInfoArr) {
                if(fileInfoArr.hasOwnProperty(i)) {
                    var fileInfo = fileInfoArr[i];
                    groupTable[fileInfo.data.load_group] = fileInfo.data.load_group;
                }
            }
            for(i in groupTable) {
                if(groupTable.hasOwnProperty(i)) {
                    listOfGroups.push(i);
                }
            }
            return listOfGroups;
        };
        AudioTagHandler.prototype.loadProgress = /**
        * Updates load progress.
        */
        function () {
            this._loadedFiles++;
            if(this._progressCallback) {
                this._progressCallback((this._loadedFiles / this._numFiles) * 100);
            }
            if(this._readyCallback && this._loadedFiles == this._numFiles) {
                // Timeout för att audio tagen ska hinna bli redo att spelas. Behövdes för HM.
                var _this = this;
                setTimeout(function () {
                    _this._readyCallback(true);
                }, 2000);
            }
        };
        AudioTagHandler.prototype.triggerEvent = /**
        * Triggers an event.
        * @param {string} name Which event to trigger.
        * @param {Object} args Arguments to pass to the process.
        */
        function (name, args) {
            var str = "";
            for(var i = 0; i < args.length; i++) {
                str += args[i] + ", ";
            }
            if(name != "sound_position") {
                var arg = "";
                if(args) {
                    arg = args[0];
                }
            }
            if(!this._events) {
                // not initialized
                return;
            }
            try  {
                var eventTarget = this._events[name];
                if(typeof eventTarget == "string") {
                    var process = this._processes[eventTarget];
                    if(process) {
                        process.start(args);
                    }
                } else if(eventTarget) {
                    for(var ix = 0, len = eventTarget.length; ix < len; ix++) {
                        var processName = eventTarget[ix];
                        var process = this._processes[processName];
                        if(process) {
                            process.start(args);
                        }
                    }
                } else {
                    Klang.warn('No target for event ', name);
                }
            } catch (ex) {
                Klang.err("Klang: error when triggering event '" + name + "': " + ex.name + ": " + ex.message);
            }
        };
        AudioTagHandler.prototype.getGlobalVolume = function () {
            return this._globalVolume;
        };
        AudioTagHandler.prototype.setGlobalVolume = function (value) {
            value = Math.max(0, Math.min(value, 1));
            this._globalVolume = value;
            for(var a in this._audio) {
                var audio = this._audio[a];
                if(audio && audio.setVolume && audio.getOutput) {
                    var audioOut = audio.getOutput();
                    if(audioOut) {
                        audio.setVolume(audioOut.getVolume());
                    }
                }
            }
        };
        AudioTagHandler.prototype.getLimitSounds = function () {
            return this._limitSounds;
        };
        AudioTagHandler.prototype.stopAll = function (priority) {
            for(var a in this._audio) {
                if(priority == undefined || this._audio[a]._priority == priority) {
                    this._audio[a].stop();
                }
            }
            this.stopPeriodic();
            return this;
        };
        AudioTagHandler.prototype.getObject = function (name) {
            return this._audioSprites[name] || this._audio[name];
        };
        AudioTagHandler.prototype.playPeriodic = function (obj, maxSec, minSec) {
            clearTimeout(this._periodicTimer);
            var _this = this;
            this._periodicTimer = setTimeout(function () {
                obj.play();
                _this.playPeriodic(obj, maxSec, minSec);
            }, Util.random(maxSec * 1000, minSec * 1000));
        };
        AudioTagHandler.prototype.stopPeriodic = function () {
            clearTimeout(this._periodicTimer);
        };
        return AudioTagHandler;
    })();
    Klang.AudioTagHandler = AudioTagHandler;    
    Klang.versionNumber = 2;
    Klang.context;
    Klang.version;
    //export var safari: bool;
    Klang.progressCallback;
    Klang.readyCallback;
    Klang.browser;
    Klang.os;
    Klang.isMobile;
    Klang.isIOS;
    Klang.fallback;
    Klang.loggingEnabled = false;
    Klang.useMonoBuffers = false;
    Klang.Panner;
    /**
    * Handles loading of the config file, initialization of objects and triggering of events.
    * @constructor
    */
    var Core = (function () {
        function Core() {
            this._initComplete = false;
            this._eventTable = {
            };
            this._blurFadeOut = false;
            // Om super master out ska fadas ut vid blur
            this._masterBusId = null;
            this._objectTable = {
            };
            this._preLoadInitStack = [];
            this._postLoadInitStack = [];
            this._connectStack = [];
            this._superMasterOutput = Klang.context ? Klang.context.createGain() : null;
            Klang.Panner = Model.Panner;
            if(Util.getParameterByName("klang_log")) {
                Klang.loggingEnabled = true;
            }
        }
        Core.inst = null;
        Core.isInited = function isInited() {
            if(Core.inst == null) {
                return false;
            }
            return Core.inst._initComplete;
        };
        Object.defineProperty(Core.prototype, "initComplete", {
            get: /**
            * Whether or not the core is initialized.
            * @return {boolean}  If the core is inited.
            */
            function () {
                /*if (inst == null) {
                return false;
                }*/
                return this._initComplete;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Core, "instance", {
            get: /**
            * The single instance.
            * @return {Klang.Model.Core}
            */
            function () {
                if(Core.inst == null) {
                    Core.inst = new Core();
                }
                return Core.inst;
            },
            enumerable: true,
            configurable: true
        });
        Core.deinit = function deinit() {
            Core.inst = null;
        };
        Core.prototype.stopAll = function () {
            window.removeEventListener("focus", this._focusFunction);
            window.removeEventListener("blur", this._blurFunction);
            for(var p in this._objectTable) {
                if(this._objectTable[p].stop) {
                    try  {
                        this._objectTable[p].stop();
                    } catch (ex) {
                    }
                }
            }
        };
        Core.prototype.parseLoadGroups = function (json) {
            var file, i, loadGroup, loadGroupName, entry;
            // find loadgroups from files
            var loadGroups = {
                auto: {
                }
            };
            var fileMap = {
            };
            // clone everything except audio and files into the auto load group
            for(i in json) {
                if(json.hasOwnProperty(i) && i !== 'audio' && i !== 'files' && i !== 'synths') {
                    loadGroups['auto'][i] = Util.clone(json[i]);
                }
            }
            for(i = 0; i < json['files'].length; i++) {
                file = json['files'][i];
                loadGroupName = file['load_group'];
                loadGroups[loadGroupName] = loadGroups[loadGroupName] || {
                    files: []
                };
                loadGroups[loadGroupName].files.push(file);
                file['load_group'] = file['load_group'] || 'auto';
                fileMap[file['id']] = file;
                if(file['load_group'] === 'auto') {
                    loadGroups['auto']['files'] = loadGroups['auto']['files'] || [];
                    loadGroups['auto']['files'].push(file);
                }
            }
            var audioSourceMap = {
            };
            // AudioSources (and groups?)
            for(i in json['audio']) {
                if(json['audio'].hasOwnProperty(i)) {
                    entry = json['audio'][i];
                    if(entry.file_id) {
                        file = fileMap[entry.file_id];
                        loadGroupName = file['load_group'];
                        loadGroups[loadGroupName] = loadGroups[loadGroupName] || {
                            audio: {
                            }
                        };
                        loadGroup = loadGroups[loadGroupName];
                        loadGroup['audio'] = loadGroup['audio'] || {
                        };
                        loadGroup['audio'][i] = entry;
                        audioSourceMap[i] = loadGroupName;
                    }
                }
            }
            // Sample players
            for(i in json['synths']) {
                if(json['synths'].hasOwnProperty(i)) {
                    entry = json['synths'][i];
                    var singleLoadGroup = false;
                    var lastLoadGroup = null;
                    if(entry.type === 'SamplePlayer') {
                        singleLoadGroup = true;
                        for(var j = 0; j < entry['content'].length; j++) {
                            var velGroup = entry['content'][j];
                            for(var k = 0; k < velGroup.samples.length; k++) {
                                var sample = velGroup.samples[k];
                                var srcId = sample.source;
                                var srcLoadGroup = audioSourceMap[srcId];
                                if(lastLoadGroup && lastLoadGroup !== srcLoadGroup) {
                                    singleLoadGroup = false;
                                    break;
                                }
                                lastLoadGroup = srcLoadGroup;
                            }
                            if(!singleLoadGroup) {
                                break;
                            }
                        }
                    }
                    if(!singleLoadGroup) {
                        lastLoadGroup = 'auto';
                    }
                    loadGroups[lastLoadGroup]['synths'] = loadGroups[lastLoadGroup]['synths'] || {
                    };
                    loadGroups[lastLoadGroup]['synths'][i] = entry;
                }
            }
            return loadGroups;
        };
        Core.prototype.loadJSON = /**
        * Asynchronously loads a JSON config file.
        * @param {Object} options URL to the config-file to load. vafan heter den options för...?
        * @param {Function} readyCallback Function to call when auto-load sounds have loaded.
        * @param {Function} progressCallback Function to call as loading of sounds progresses.
        */
        function (options, readyCallback, progressCallback) {
            this._readyCallback = readyCallback;
            this._progressCallback = progressCallback || function () {
            };
            if(typeof options === "object") {
                var data = this.createConfigNode(options);
                Core.settings = data.settings;
                Core.instance.initContent(data);
                // Parsa JSON-filen
                //var data = this.parseConfigJSON(options.config);
                // Initiera klang
                //Core.instance.initContent(data, options.files);
                            } else if(typeof options === "string") {
                //
                var request = new XMLHttpRequest();
                request.open("GET", options, true);
                var _this = this;
                request.onreadystatechange = function () {
                    if(request.readyState == 4 && request.status == 200) {
                        // Parsa JSON-filen
                        var configText = request.responseText;
                        var data = JSON.parse(configText);
                        //var data = _this.parseConfigJSON(configText);
                        _this._loadGroups = _this.parseLoadGroups(data);
                        // Initiera klang
                        Core.settings = data.settings;
                        Core.instance.initContent(data, null, options);
                        _this.initLoadGroup('auto');
                    } else if(request.status == 404) {
                        throw "Klang exception: config file not found: '" + options + "'";
                    } else if(request.status != 200) {
                        throw "Klang exception: unable to load config file: '" + options + "'";
                    }
                };
                request.send(null);
            } else {
                throw "Klang exception: unrecognized options: '" + options + "'";
            }
        };
        Core.prototype.createEntity = /**
        * Parses a config file and creates objects.
        * @param {string} jsonString Content of the config file as a string.
        * @return {Object} The parsed config data.
        * @private
        */
        // private parseConfigJSON(jsonString: string): any {
        //     // this.parseLoadGroups( JSON.parse(jsonString) );
        //     return JSON.parse(jsonString, function(key, value) {
        //         // Skapa rätt objekt om objektet har en typ
        //         if (value && typeof value === 'object' && typeof value.type === 'string') {
        //
        //             return new Model[value.type](value, key);
        //         }
        //         return value;
        //     });
        // }
        function (id, data) {
            // Skapa rätt objekt om objektet har en typ
            if(data && typeof data === 'object' && typeof data.type === 'string') {
                var initData = this.createConfigNode(data);
                return new Model[data.type](initData, id);
            }
            return data;
        };
        Core.prototype.createConfigNode = /**
        * Recursively creates the correct object types for an already parsed config node.
        * @param {Object} node Node in parsed JSON config.
        * @return {Object} Node with types created.
        * @private
        */
        function (node) {
            // parse properties
            if(typeof node === "object") {
                for(var key in node) {
                    var prop = node[key];
                    if(typeof prop === "object" && typeof prop.type === "string") {
                        node[key] = this.createConfigNode(prop);
                        node[key] = new Model[prop.type](prop, key);
                    } else {
                        node[key] = this.createConfigNode(prop);
                    }
                }
            }
            return node;
        };
        Core.prototype.initLoadGroup = function (groupName, readycallback, progressCallback, loadFailedCallback) {
            var data = this._loadGroups[groupName];
            if(!data) {
                Klang.warn('No loadgroup matching ', groupName);
                loadFailedCallback && loadFailedCallback();
                return;
            }
            if(data._isLoaded) {
                readycallback && readycallback();
                return;
            }
            data._isLoaded = true;
            this.loadSoundFiles(groupName, function () {
                if(data.audio) {
                    for(var p in data.audio) {
                        this._objectTable[p] = this.createEntity(p, data.audio[p]);
                    }
                }
                if(data.busses) {
                    for(var p in data.busses) {
                        this._objectTable[p] = this.createEntity(p, data.busses[p]);
                    }
                }
                if(data.sequencers) {
                    for(var p in data.sequencers) {
                        this._objectTable[p] = this.createEntity(p, data.sequencers[p]);
                    }
                }
                if(data.processes) {
                    for(var p in data.processes) {
                        this._objectTable[p] = this.createEntity(p, data.processes[p]);
                    }
                }
                if(data.synths) {
                    for(var p in data.synths) {
                        this._objectTable[p] = this.createEntity(p, data.synths[p]);
                    }
                }
                if(data.lfos) {
                    for(var p in data.lfos) {
                        this._objectTable[p] = this.createEntity(p, data.lfos[p]);
                    }
                }
                if(data.automations) {
                    for(var p in data.automations) {
                        this._objectTable[p] = this.createEntity(p, data.automations[p]);
                    }
                }
                this.updateConnections();
                if(readycallback) {
                    readycallback();
                }
                var retain = [];
                // Initiera de objekt som inte kunde skapas klart
                for(var ix = 0, len = this._preLoadInitStack.length; ix < len; ix++) {
                    var element = this._preLoadInitStack[ix];
                    // Om elementet har en initmetod initieras elementet
                    if(element.init && !element.init()) {
                        retain.push(element);
                    }
                }
                this._preLoadInitStack = retain;
                // Empty initialization and preload stack
                //this._preLoadInitStack  = [];
                            }.bind(this), progressCallback, loadFailedCallback);
        };
        Core.prototype.updateConnections = function () {
            Klang.log("Connecting nodes");
            // Koppla ihop alla audio nodes
            this._superMasterOutput.connect(Klang.context.destination);
            for(var ix = 0, len = this._connectStack.length; ix < len; ix++) {
                var element = this._connectStack[ix];
                // Om elementet ska kopplas till en audionode
                // Kolla om elementet ska kopplas till output eller en bus
                switch(element.destinationName) {
                    case "$OUT":
                        element.connect(this._superMasterOutput);
                        break;
                    case "$PARENT":
                        break;
                    default: {
                        var destination = this.findInstance(element.destinationName);
                        element.connect(destination.input);
                        break;
                    }
                }
            }
            this._connectStack = [];
        };
        Core.prototype.initContent = /**
        * Initializes data loaded from a JSON config file.
        * @private
        * @param {Object} data Object containing the loaded JSON data.
        * @param {Array} files Files to load.
        * @param {string} url Base url.
        */
        function (data, files, url) {
            var relativePath = data.settings.relative_path;
            var baseURL;
            var filePath = data.settings.file_path || "";
            if(relativePath) {
                if(url.lastIndexOf("/") != -1) {
                    baseURL = url.substring(0, url.lastIndexOf("/"));
                    if(baseURL.charAt(baseURL.length - 1) !== "/") {
                        baseURL += "/";
                    }
                    baseURL += filePath;
                } else {
                    baseURL = filePath;
                }
            } else {
                baseURL = filePath;
            }
            // Init fade out on blur
            if(data.settings.blur_fade_time != -1) {
                this._blurFadeOut = true;
                var fadeTime = data.settings.blur_fade_time || 0.5;
                var _this = this;
                // // när tabben får fokus
                // window.addEventListener('focus', function() {
                //            //     Util.curveParamLin(_this._superMasterOutput.gain, 1.0, fadeTime);
                // });
                // // när tabben får fokus
                // window.addEventListener('pageshow', function() {
                //     Util.curveParamLin(_this._superMasterOutput.gain, 1.0, fadeTime);
                // });
                // // när tabben tappar fokus
                // window.addEventListener('blur', function() {
                //            //     if (_this._blurFadeOut) {
                //         Util.curveParamLin(_this._superMasterOutput.gain, 0.0, fadeTime);
                //     }
                // });
                // // när tabben tappar fokus
                // window.addEventListener('pagehide', function() {
                //     if (_this._blurFadeOut) {
                //         Util.curveParamLin(_this._superMasterOutput.gain, 0.0, fadeTime);
                //     }
                // });
                function visChange() {
                    if(_this.isHidden()) {
                        if(_this._blurFadeOut) {
                            Util.curveParamLin(_this._superMasterOutput.gain, 0.0, fadeTime);
                        }
                    } else {
                        Util.curveParamLin(_this._superMasterOutput.gain, 1.0, fadeTime);
                    }
                }
                var visProp = this.getHiddenProp();
                if(visProp) {
                    var evtname = visProp.replace(/[H|h]idden/, '') + 'visibilitychange';
                    document.addEventListener(evtname, visChange);
                }
            }
            // om filarrayen skickas med används den, annars används filer från configen
            Model.FileHandler.instance.fileInfo = (files != undefined ? files : data.files) || [];
            this._eventTable = data.events || {
            };
            this.setVars(data.vars);
            this._masterBusId = data.masterBus;
            // Sätt lyssnarens startposition för 3d-ljud
            Model.Panner.setListenerData(data.settings.listener);
            // Skapa egna kurvor
            Util.createCurves(data.curves);
            this._timeHandler = new Model.TimeHandler();
            this._initComplete = true;
            // Börja ladda in alla autoload-ljud
            // Kör readycallback när alla ljud är laddade
            Model.FileHandler.instance.baseURL = baseURL;
            Model.FileHandler.instance.loadFiles("auto", Core.soundsLoaded, this._progressCallback);
        };
        Core.prototype.isHidden = //
        function () {
            var prop = this.getHiddenProp();
            if(!prop) {
                return false;
            }
            return document[prop];
        };
        Core.prototype.getHiddenProp = function () {
            var prefixes = [
                'webkit', 
                'moz', 
                'ms', 
                'o'
            ];
            // if 'hidden' is natively supported just return it
            if('hidden' in document) {
                return 'hidden';
            }
            // otherwise loop over all the known prefixes until we find one
            for(var i = 0; i < prefixes.length; i++) {
                if((prefixes[i] + 'Hidden') in document) {
                    return prefixes[i] + 'Hidden';
                }
            }
            // otherwise it's not supported
            return null;
        };
        Core.prototype.setVars = function (vars) {
            if(vars) {
                for(var key in vars) {
                    if(typeof vars[key] == "string" && vars[key].indexOf("me.") > -1) {
                        vars[key] = this.findInstance(vars[key].split('me.')[1]);
                    } else if(typeof vars[key] == "object") {
                        var obj = vars[key];
                        for(var prop in obj) {
                            if(obj.hasOwnProperty(prop)) {
                                if(typeof obj[prop] == "string" && obj[prop].indexOf("me.") > -1) {
                                    obj[prop] = this.findInstance(obj[prop].split('me.')[1]);
                                }
                            }
                        }
                    }
                }
                Util.vars = vars;
            }
        };
        Core.prototype.loadSoundFiles = /**
        * Loads the sound files contained in a specific pack of sound file URLs.
        * @param {string} name Name of the pack of sound file URLs to load.
        * @param {Function} callback Function to call when all sounds from the sound pack have been loaded.
        */
        function (name, callback, progressCallback, loadFailedCallback) {
            if(progressCallback) {
                this._progressCallback = progressCallback;
            }
            Model.FileHandler.instance.loadFiles(name, callback, this._progressCallback, loadFailedCallback);
        };
        Core.prototype.freeSoundFiles = /**
        * Releases the buffers for all audio files in a load group, allowing the memory to be garbage collected.
        * @param {string} name Name of the pack of sound files to free.
        */
        function (name) {
            Model.FileHandler.instance.freeSoundFiles(name);
            for(var p in this._objectTable) {
                var obj = this._objectTable[p];
                if(obj._type == "AudioSource") {
                    var fileInfo = Model.FileHandler.instance.getFileInfo(obj._fileId);
                    if(fileInfo && fileInfo.load_group == name) {
                        obj.freeBuffer();
                    }
                }
            }
        };
        Core.soundsLoaded = /**
        * Called when auto load sound files have been loaded.
        * @private
        */
        function soundsLoaded() {
            var _this = Core.instance;
            for(var i = 0, len = _this._postLoadInitStack.length; i < len; i++) {
                _this._postLoadInitStack[i].init();
            }
            // PostLoad-stacken behövs inte längre
            _this._postLoadInitStack = null;
            if(_this._readyCallback) {
                _this._readyCallback(true);
            }
        };
        Core.prototype.pushToPreLoadInitStack = /**
        * Adds an object to be initialized immediately after the config have loaded.
        * @param {Object} instance Object to be initialized.
        * @return {boolean} If the object was pushed to the stack or not.
        */
        function (instance) {
            if(this._preLoadInitStack) {
                this._preLoadInitStack.push(instance);
                return true;
            }
            return false;
        };
        Core.prototype.pushToPostLoadInitStack = /**
        * Adds an object to be initialized after auto-load sounds have loaded.
        * @param {Object} instance Object to be initialized.
        * @return {boolean} If the object was pushed to the stack or not.
        */
        function (instance) {
            if(this._postLoadInitStack) {
                this._postLoadInitStack.push(instance);
                return true;
            }
            return false;
        };
        Core.prototype.pushToConnectStack = /**
        * Adds an object to be connected to an audio node after nodes have been created.
        * @param {Object} instance Object to be connected.
        * @return {boolean} If the object was pushed to the stack or not.
        */
        function (instance) {
            if(this._connectStack) {
                this._connectStack.push(instance);
                return true;
            }
            return false;
        };
        Core.prototype.findInstance = /**
        * Finds audio / bus / sequencer object by it's name.
        * @param name Identifying name of the object.
        * @return Object identified by name or null if not found.
        */
        function (name) {
            var instance = this._objectTable[name];
            return instance;
        };
        Core.prototype.triggerEvent = /**
        * Triggers an event and starts the {@link Process} that is associated with the event.
        * @param {string} id Name of the event to trigger.
        * @param {Array} eventArgs Arguments to pass to the event.
        */
        function (id) {
            var eventArgs = [];
            for (var _i = 0; _i < (arguments.length - 1); _i++) {
                eventArgs[_i] = arguments[_i + 1];
            }
            Util.lastEvent = id;
            var process = this._eventTable[id];
            if(typeof process == "string") {
                this._objectTable[process].start(eventArgs[0])// eventArgs[0] är hela arrayen
                ;
            } else if(process instanceof Array) {
                for(var ix = 0, len = process.length; ix < len; ix++) {
                    this._objectTable[process[ix]].start(eventArgs[0])// eventArgs[0] är hela arrayen
                    ;
                }
            }
        };
        Core.prototype.initIOS = /**
        * Creates a silent audio buffer and plays it back to initialize web audio for iOS devices.
        */
        function () {
            var src = Klang.context.createBufferSource();
            src.start(0);
        };
        Object.defineProperty(Core.prototype, "timeHandler", {
            get: /**
            * Get the timehandler.
            * @type {TimeHandler}
            */
            function () {
                return this._timeHandler;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Core.prototype, "output", {
            get: /**
            * The master output node.
            * @type {GainNode}
            */
            function () {
                return this._superMasterOutput;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Core.prototype, "blurFadeOut", {
            get: /**
            * Whether to fade out on blur.
            * @type {boolean}
            */
            function () {
                return this._blurFadeOut;
            },
            set: function (state) {
                this._blurFadeOut = state;
            },
            enumerable: true,
            configurable: true
        });
        return Core;
    })();    
    /***
    * public.ts
    * Innehåller de funktioner som är tillgängliga utifrån motorn.
    */
    /**
    * Whether or not Klang has been initialized.
    * @type {boolean}
    */
    Klang.klangInited = false;
    /**
    * Triggers an event.
    * @param {string} name Name of the event to run.
    * @param {Array} args Arguments to pass to the event.
    */
    function triggerEvent(name) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        if(!Core.isInited) {
            return;
        }
        try  {
            if(Klang.version === "webaudio") {
                if(!Klang.context) {
                    return;
                }
                Core.instance.triggerEvent(name, args);
            } else if(Klang.version === "audiotag") {
                if(Klang.audioTagHandler) {
                    Klang.audioTagHandler.triggerEvent(name, args);
                }
            }
        } catch (ex) {
            Klang.err("Klang exception: unable to trigger event: '" + name + "'");
        }
    }
    Klang.triggerEvent = triggerEvent;
    function getDestinationForEvent(eventName) {
        var process = Core.instance.findInstance(Klang.getEvents()[eventName]);
        if(process) {
            return process.destination();
        }
        return null;
    }
    Klang.getDestinationForEvent = getDestinationForEvent;
    function autoSelectEngine() {
        if(window.AudioContext) {
            return 'webaudio';
        }
        if(window['swfobject'] && swfobject.hasFlashPlayerVersion("9.0.0")) {
            return 'flash';
        }
        return 'audiotag';
    }
    /**
    * Initializes the Klang Core using a JSON config file.
    * @param {string} json Path on the server to the config file.
    * @param {Function} readyCallback Function to call when all auto-load sounds are loaded.
    * @param {Function} progressCallback Function with sound loading progress.
    */
    function init(json, readyCallback, progressCallback, loadFailedCallback, options) {
        if(navigator.userAgent.indexOf('Firefox') != -1) {
            //Firefox
            Klang.browser = "Firefox";
        } else if(navigator.userAgent.indexOf('Chrome') != -1) {
            //Chrome
            Klang.browser = "Chrome";
        } else if(navigator.userAgent.indexOf('Safari') != -1) {
            //Safari
            Klang.browser = "Safari";
        } else if(navigator.userAgent.indexOf('Opera') != -1) {
            //Opera
            Klang.browser = "Opera";
        } else if(navigator.userAgent.indexOf('MSIE') != -1) {
            // IE
            Klang.browser = "IE";
        }
        Klang.isMobile = Util.checkMobile();
        Klang.isIOS = Util.checkIOS();
        if(Klang.klangInited) {
            Klang.warn("Klang already initialized");
            return;
        }
        Klang.klangInited = true;
        var engineVersion = (options && options['engine']) || autoSelectEngine();
        if(engineVersion === 'auto') {
            engineVersion = autoSelectEngine();
        }
        // WebAudio first
        if(engineVersion === 'webaudio') {
            if(!Klang.context) {
                Klang.context = new AudioContext();
            }
            try  {
                Klang.version = "webaudio";
                if(Core.isInited()) {
                    Klang.warn("Klang already initialized");
                }
                //Används för att själv styra om till fallback json fil i jfk
                /*if (Klang.fallback) {
                json = json.substring(0, json.indexOf("config.json"))+Klang.fallback;
                }*/
                Core.instance.loadJSON(json, readyCallback, progressCallback);
                return true;
            } catch (ex) {
                Klang.err("Klang exception: unable to parse config file: '" + json + "'");
                Klang.version = "failed web audio";
                readyCallback(false);
                return false;
            }
        } else {
            Klang.version = "audiotag";
            try  {
                Klang.audioTagHandler = new AudioTagHandler(json, readyCallback, progressCallback);
            } catch (ex) {
                Klang.err("Klang exception: unable to initialize audio tag fallback");
                Klang.version = "failed audiotag";
                readyCallback(false);
                return false;
            }
            return true;
            Klang.version = "n/a";
            //"Flash not available"
            readyCallback(false);
            return false;
        }
    }
    Klang.init = init;
    /**
    * Initializes web audio for iOS devices, should be called on a touch event.
    */
    function initIOS() {
        if(Klang.version == "webaudio") {
            try  {
                Core.instance.initIOS();
            } catch (ex) {
            }
        } else if(Klang.version == "audiotag" && Klang.isMobile) {
            Klang.audioTagHandler.initIOS();
        }
    }
    Klang.initIOS = initIOS;
    /**
    * Get a list of loadgroups
    * @return {string[]} List of availible load groups (excluding the "auto" load group)
    */
    function getLoadGroups() {
        var listOfGroups = [];
        var fileHandler;
        if(Klang.version === 'webaudio') {
            fileHandler = Model.FileHandler.instance;
        } else if(Klang.version === 'audiotag') {
            fileHandler = Klang.audioTagHandler;
        }
        listOfGroups = fileHandler.getLoadGroups();
        var autoIndex = listOfGroups.indexOf('auto');
        if(autoIndex !== -1) {
            listOfGroups.splice(autoIndex, 1);
        }
        return listOfGroups;
    }
    Klang.getLoadGroups = getLoadGroups;
    /**
    * Start loading a pack of sounds defined in the JSON config file.
    * @param {string} name Name of the load group to load.
    * @param {function} readyCallback Function to call when all sounds are loaded.
    * @param {function} progressCallback Function to call while loading files.
    */
    function load(name, readyCallback, progressCallback, loadFailedCallback) {
        try  {
            Klang.logc("Klang: Loading: '" + name + "'", Util.LOG_LOAD_COLOR);
            if(Klang.version == "webaudio") {
                Core.instance.initLoadGroup(name, readyCallback, progressCallback, loadFailedCallback);
            } else if(Klang.version == "audiotag") {
                Klang.audioTagHandler.loadSoundFiles(name, readyCallback, progressCallback, loadFailedCallback);
            } else {
                if(progressCallback) {
                    progressCallback(1);
                }
                if(readyCallback) {
                    readyCallback(false);
                }
            }
        } catch (ex) {
            Klang.err("Klang exception: unable to load file group: '" + name + "'");
        }
    }
    Klang.load = load;
    /**
    * Releases the buffers for all audio files in a load group, allowing the memory to be garbage collected.
    * @param {string} name Name of the pack to free.
    */
    function free(name) {
        try  {
            Klang.logc("Klang: Freeing: '" + name + "'", Util.LOG_LOAD_COLOR);
            if(Klang.version == "webaudio") {
                Core.instance.freeSoundFiles(name);
            } else if(Klang.version == "audiotag") {
            }
        } catch (ex) {
            Klang.err("Klang exception: unable to free file group: '" + name + "'");
        }
    }
    Klang.free = free;
    /**
    * Gets progress on the number of loaded audio files.
    * @returns {Object} Object containing two properties: loaded- number of loaded audio files and total: total number of audio files to be loaded.
    */
    function getLoadProgress() {
        return Model.FileHandler.instance.progress;
    }
    Klang.getLoadProgress = getLoadProgress;
    function stopAll() {
        if(Klang.version == "webaudio") {
            if(Core.isInited()) {
                Core.instance.stopAll();
            }
        } else if(Klang.version == "audiotag") {
            Klang.audioTagHandler.stopAll();
        }
    }
    Klang.stopAll = stopAll;
    function getCoreInstance() {
        return Core.instance;
    }
    Klang.getCoreInstance = getCoreInstance;
    function getFileHandlerInstance() {
        return Model.FileHandler.instance;
    }
    Klang.getFileHandlerInstance = getFileHandlerInstance;
    function getUtil() {
        return Util;
    }
    Klang.getUtil = getUtil;
    function getModel() {
        return Model;
    }
    Klang.getModel = getModel;
    function logToConsole(args) {
        if(console.log.apply) {
            console.log.apply(console, args);
        } else {
            console.log(args.join());
        }
    }
    function warnToConsole(args) {
        if(console.warn.apply) {
            console.warn.apply(console, args);
        } else {
            console.warn(args.join());
        }
    }
    function errorToconsole(args) {
        if(console.error.apply) {
            console.error.apply(console, args);
        } else {
            console.error(args.join());
        }
    }
    function log() {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            args[_i] = arguments[_i + 0];
        }
        if(Klang.loggingEnabled) {
            if(Klang.browser == "Chrome") {
                console.log("%c[" + getTimeString() + "] " + args.join(), "color:" + Util.LOG_TIME_COLOR);
            } else {
                logToConsole(args);
            }
        }
    }
    Klang.log = log;
    function logc(message, color) {
        if(Klang.loggingEnabled) {
            if(Klang.browser == "Chrome") {
                if(!color) {
                    color = "gray";
                }
                console.log("%c[" + getTimeString() + "] " + message, "color:" + color);
            } else {
                console.log(message);
            }
        }
    }
    Klang.logc = logc;
    function warn() {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            args[_i] = arguments[_i + 0];
        }
        if(Klang.loggingEnabled) {
            if(Klang.browser == "Chrome") {
                console.warn("%c[" + Klang.getTimeString() + "] " + args.join(), "color:" + Util.LOG_WARN_COLOR);
            } else {
                warnToConsole(args);
            }
        }
    }
    Klang.warn = warn;
    function err() {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            args[_i] = arguments[_i + 0];
        }
        if(Klang.loggingEnabled) {
            if(Klang.browser == "Chrome") {
                console.warn("%c[" + Klang.getTimeString() + "] " + args.join(), "color:" + Util.LOG_ERROR_COLOR);
            } else {
                warnToConsole(args);
            }
        }
    }
    Klang.err = err;
    function zeropad(num, digits) {
        var str = num.toString();
        while(str.length < digits) {
            str = "0" + str;
        }
        return str;
    }
    Klang.zeropad = zeropad;
    function getTimeStamp(time) {
        return zeropad(time.getUTCMinutes(), 2) + ":" + zeropad(time.getUTCSeconds(), 2) + "." + zeropad(time.getUTCMilliseconds(), 3);
    }
    Klang.getTimeStamp = getTimeStamp;
    function getTimeString(t) {
        if(t == undefined) {
            t = Klang.context.currentTime;
        }
        var ms = Math.round(t * 1000);
        var s = Math.floor((ms / 1000) % 60);
        var m = Math.floor((ms / (1000 * 60)) % 60);
        var h = Math.floor((ms / (1000 * 60 * 60)) % 24);
        return zeropad(h, 2) + ":" + zeropad(m, 2) + ":" + zeropad(s, 2) + "." + zeropad(ms % 1000, 3);
    }
    Klang.getTimeString = getTimeString;
    function getEvents() {
        if(Klang.version === "flash") {
            return null;
        } else // preprocess klarar inte nästlade direktiv så audiotag-klausulen måste gå igenom kompilering utan audiotag...
        if(Klang.version == "audiotag") {
            return Klang["audioTagHandler"]._events;
        }
        return Core.instance._eventTable;
    }
    Klang.getEvents = getEvents;
    Klang.debugData = {
        ignoredEvents: {
        },
        logToConsole: true
    };
    Klang.visualWindow;
    // Tar bort alla objekt, men behåller alla filer som laddats in
    function deinit(url, readyCallback) {
        Klang.klangInited = false;
        if(Klang.version == "webaudio") {
            if(Core.isInited()) {
                Core.instance.stopAll();
                Core.deinit();
            }
        } else if(Klang.version == "audiotag") {
            Klang.audioTagHandler.stopAll();
        }
        Klang.version = "n/a";
    }
    Klang.deinit = deinit;
    var Model;
    (function (Model) {
        /** @namespace Klang.Model */ /*
        * Source: src/model/FileHandler.ts
        */
        /**
        * Handles loading and access of files.
        * @constructor
        */
        var FileHandler = (function () {
            // om laddning har misslyckats av fil som inte hittats/cors etc
            function FileHandler() {
                this._files = {
                };
                this._groups = {
                };
                this._lastSentPercent = -1;
            }
            FileHandler.inst = null;
            Object.defineProperty(FileHandler, "instance", {
                get: /**
                * The single instance.
                * @type {Klang.Model.FileHandler}
                */
                function () {
                    if(FileHandler.inst == null) {
                        FileHandler.inst = new FileHandler();
                    }
                    return FileHandler.inst;
                },
                enumerable: true,
                configurable: true
            });
            FileHandler.prototype.sendProgressCallback = /**
            * Calls the callback function for progress of file loading.
            * @private
            */
            function (group) {
                if(this._groups[group].progressCallback && !this._groups[group].loadInterrupted) {
                    var percent = 0;
                    // uppdatera endast procent om alla filers filstorlek har hämtats
                    if(this._groups[group].progress.readyAudioFiles >= this._groups[group].progress.totalAudioFiles) {
                        percent = Math.floor(((this._groups[group].progress.loadedBytes + this._groups[group].progress.bufferedFiles) / (this._groups[group].progress.totalBytes + this._groups[group].progress.totalFiles)) * 100);
                    }
                    this._lastSentPercent = percent;
                    this._groups[group].progressCallback(percent);
                }
            };
            FileHandler.prototype.updateProgress = /**
            * Updates the load progress.
            * @param {Object} request What request's progress to update.
            * @param {Object} e Progress event.
            * @private
            */
            function (request, e) {
                var group = request["load_group"];
                if(!request["sizeReceived"]) {
                    request["sizeReceived"] = true;
                    var totalBytes = 1;// 1 om längden inte finns tillgänglig
                    
                    if(e.lengthComputable) {
                        totalBytes = e.total;
                        request["loadedBytes"] = 0;
                    }
                    request["totalBytes"] = totalBytes;
                    this._groups[group].progress.totalBytes += totalBytes;
                    this._groups[group].progress.readyAudioFiles++;
                }
                // Lägg på antal nya inladdade bytes om det finns tillgängligt
                if(request["loadedBytes"] != undefined) {
                    var deltaBytes = e.loaded - request["loadedBytes"];
                    request["loadedBytes"] = e.loaded;
                    //this.progress.loadedBytes += deltaBytes;
                    this._groups[group].progress.loadedBytes += deltaBytes;
                    this.sendProgressCallback(group);
                }
            };
            FileHandler.prototype.loadAudioBuffer = /**
            * Loads one audio file into memory.
            * @param {Object} info Data about the file to load.
            * @param {Function} callback Function to call when the file has loaded.
            */
            function (info, callback) {
                var _this = this;
                var request = new XMLHttpRequest();
                var format = ".ogg";
                if(Klang.browser === "Safari") {
                    format = ".mp3";
                }
                var url = (info.external ? '' : this._baseURL) + info.url + format;
                request.open('GET', url, true);
                request.responseType = 'arraybuffer';
                request["sizeReceived"] = false;
                request["load_group"] = info.load_group;
                request.onprogress = function (e) {
                    _this.updateProgress(request, e);
                };
                request.onload = function (e) {
                    Klang.context.decodeAudioData(request.response, function (buf) {
                        if(request["loadedBytes"]) {
                            var deltaBytes = request["totalBytes"] - request["loadedBytes"];
                            _this._groups[info.load_group].progress.loadedBytes += deltaBytes;
                        } else {
                            _this._groups[info.load_group].progress.loadedBytes += 1;
                        }
                        // Gör om till mono i iOS
                        if(Klang.useMonoBuffers) {
                            var bufferLength = buf.length;
                            // Skapa ny buffer
                            var monoBuffer = Klang.context.createBuffer(1, bufferLength, Klang.context.sampleRate);
                            // Kopiera samples från vänster till monobuffern (finns det bättre sätt än loopa igenom alla?)
                            var leftChannelData = buf.getChannelData(0);
                            var monoChannelData = monoBuffer.getChannelData(0);
                            for(var ix = 0; ix < bufferLength; ix++) {
                                monoChannelData[ix] = leftChannelData[ix];
                            }
                            buf = monoBuffer;
                        }
                        _this.addFile(info, buf);
                        if(callback) {
                            callback();
                        }
                        buf = null;
                        request = null;
                    }, function (ex) {
                        console.log("Klang warning: unable to load file '" + (this._baseURL || "") + info.url + "'");
                    });
                    request.response = null;
                };
                request.onreadystatechange = function () {
                    if(request.readyState == 4 && request.status == 200) {
                    } else if(request.status != 200) {
                        _this._groups[info.load_group].loadInterrupted = true;
                        if(_this._groups[info.load_group].loadFailedCallback) {
                            _this._groups[info.load_group].loadFailedCallback();
                        }
                    }
                };
                request.send();
                this._groups[info.load_group].progress.totalAudioFiles++;
            };
            FileHandler.prototype.loadMidiFile = /**
            * Loads one midi file into memory.
            * @param {Object} info Data about the file to load.
            * @param {Function} callback Function to call when the file has loaded.
            */
            function (info, callback) {
                var _this = this;
                loadRemote(this._baseURL + info.url, function (request, e) {
                    _this.updateProgress(request, e);
                }, function (data) {
                    _this.addFile(info, readMidiFile(data))// Läser igenom midifilen och skapar tracks, events osv
                    ;
                    if(callback) {
                        callback();
                    }
                });
            };
            FileHandler.prototype.loadMidiString = /**
            * Loads one midi file into memory from a string.
            * @param {Object} info Data about the file to load.
            */
            function (info) {
                var _this = this;
                var request = new XMLHttpRequest();
                request.open('GET', this._baseURL + info.url);
                //request.overrideMimeType("text/plain; charset=x-user-defined");
                request.onprogress = function (e) {
                    _this.updateProgress(request, e);
                };
                request.onreadystatechange = function () {
                    if(this.readyState == 4 && this.status == 200) {
                        _this.addFile(info, readMidiString(request.response));
                    }
                };
                request.send();
            };
            FileHandler.prototype.loadFiles = /**
            * Loads an array of files into memory.
            * @param {Object} group Which file group(s) to load
            * @param {function} filesLoadedCallback callback function when files are loaded.
            * @param {function} progressCallback callback function for progress.
            */
            function (group, filesLoadedCallback, progressCallback, loadFailedCallback) {
                if(typeof group == "string") {
                    group = [
                        group
                    ];
                }
                for(var ix = 0, len = group.length; ix < len; ix++) {
                    this._groups[group[ix]] = {
                    };
                    this._groups[group[ix]].filesLoadedCallback = filesLoadedCallback;
                    this._groups[group[ix]].progressCallback = progressCallback;
                    this._groups[group[ix]].loadFailedCallback = loadFailedCallback;
                    this._groups[group[ix]].loadInterrupted = false;
                    this._groups[group[ix]].progress = {
                        totalBytes: 0,
                        loadedBytes: 0,
                        totalFiles: 0,
                        totalAudioFiles: 0,
                        readyAudioFiles: 0,
                        bufferedFiles: 0
                    };
                }
                // Börja ladda in alla filer
                for(var ix = 0, len = this._fileInfo.length; ix < len; ix++) {
                    var info = this._fileInfo[ix];
                    // Ladda inte in filen om den redan laddats in
                    var groupIx = group.indexOf(info.load_group);
                    if(groupIx != -1 && !this._files[info.id] && !info.only_audio_tag) {
                        switch(info.file_type) {
                            case "audio":
                                this.loadAudioBuffer(info);
                                break;
                            case "midi":
                                this.loadMidiFile(info);
                                break;
                            case "midistring":
                                this.loadMidiString(info);
                                break;
                        }
                        //this.progress.totalFiles++;
                        this._groups[group[groupIx]].progress.totalFiles++;
                    }
                }
                // kalla callback direkt om inget ska laddas
                for(var ix = 0, len = group.length; ix < len; ix++) {
                    if(this._groups[group[ix]].progress.totalFiles == 0) {
                        if(this._groups[group[ix]].filesLoadedCallback && !this._groups[group[ix]]._loadInterrupted) {
                            this._groups[group[ix]].filesLoadedCallback(true);
                        }
                    }
                }
            };
            FileHandler.prototype.prepareFile = function (fileInfo) {
                this._fileInfo.push(fileInfo);
            };
            FileHandler.prototype.prepareFiles = function (fileInfo) {
                var i, len;
                for(i = 0 , len = fileInfo.length; i < len; i++) {
                    this.prepareFile(fileInfo[i]);
                }
            };
            FileHandler.prototype.addFile = /**
            * Adds a file to the FileHandler.
            * @param {Object} info File-info object representing the file
            * @param {Object} file The file to add.
            */
            function (info, file) {
                this._files[info.id] = file;
                this._groups[info.load_group].progress.bufferedFiles++;
                this.sendProgressCallback(info.load_group);
                if(this._groups[info.load_group].progress.bufferedFiles == this._groups[info.load_group].progress.totalFiles && !this._groups[info.load_group].loadInterrupted) {
                    if(this._groups[info.load_group].filesLoadedCallback) {
                        this._groups[info.load_group].filesLoadedCallback(true);
                    }
                }
            };
            FileHandler.prototype.freeSoundFiles = function (group) {
                if(typeof group == "string") {
                    group = [
                        group
                    ];
                }
                for(var ix = 0, len = this._fileInfo.length; ix < len; ix++) {
                    var info = this._fileInfo[ix];
                    if(group.indexOf(info.load_group) != -1) {
                        this._files[info.id] = null;
                    }
                }
            };
            FileHandler.prototype.getLoadGroups = /**
            * Get a list of loadgroups
            * @return {string[]} List of availible load groups (excluding the "auto" load group)
            */
            function () {
                var i;
                var fileInfoArr = this._fileInfo || [];
                var groupTable = {
                };
                var listOfGroups = [];
                for(i = 0; i < fileInfoArr.length; i++) {
                    var fileInfo = fileInfoArr[i];
                    groupTable[fileInfo.load_group] = fileInfo.load_group;
                }
                for(i in groupTable) {
                    listOfGroups.push(i);
                }
                return listOfGroups;
            };
            FileHandler.prototype.getFile = /**
            * Gets the file that corresponds to the audio pointed to by a url.
            * @param {string} id The file's id
            * @returns {Object} The file corresponding to the ID.
            */
            function (id) {
                return this._files[id] || null;
            };
            FileHandler.prototype.getFilesForLoadgroup = function (loadGroup) {
                var ret = [];
                for(var ix = 0, len = this._fileInfo.length; ix < len; ix++) {
                    if(this._fileInfo[ix].load_group == loadGroup) {
                        ret.push(this._fileInfo[ix]);
                    }
                }
                return ret;
            };
            FileHandler.prototype.getFileInfo = function (fileId) {
                for(var ix = 0, len = this._fileInfo.length; ix < len; ix++) {
                    if(this._fileInfo[ix].id == fileId) {
                        return this._fileInfo[ix];
                    }
                }
                return undefined;
            };
            Object.defineProperty(FileHandler.prototype, "progress", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * Object containing load progress data.
                * @type {Object}
                */
                function () {
                    return this._groups;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FileHandler.prototype, "baseURL", {
                set: /**
                * Base URL to load files from.
                * @type {string}
                */
                function (url) {
                    this._baseURL = url;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(FileHandler.prototype, "fileInfo", {
                set: /**
                * The file handler fiel info.
                * @type {Array.<Object>}
                */
                function (fileInfo) {
                    this._fileInfo = fileInfo;
                },
                enumerable: true,
                configurable: true
            });
            return FileHandler;
        })();
        Model.FileHandler = FileHandler;        
        /*
        * Source: src/model/audio/Audio.ts
        */
        /**
        * Represents any type of audio that can be played through a bus.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        */
        var Audio = (function () {
            function Audio(data, name) {
                this._name = name;
                this._type = data.type;
                this._output = Klang.context.createGain();
                this._volume = data.volume != undefined ? data.volume : 1.0;
                this._output.gain.value = this._volume;
                // Spara destination och lägg på ihopkopplingskön om destination är definierad
                if(data.destination_name) {
                    this.destinationName = data.destination_name;
                    if(!Core.instance.initComplete) {
                        Core.instance.pushToConnectStack(this);
                    }
                }
            }
            Audio.prototype.connect = /**
            * Sets the destination for this audio's output.
            * @param {AudioNode} destination Where to route this audio's output.
            * @return {Klang.Model.Audio} Self
            */
            function (destination) {
                return this;
            };
            Audio.prototype.disconnect = /**
            * Removes all previous connections.
            * @return {Klang.Model.Audio} Self
            */
            function () {
                return this;
            };
            Audio.prototype.play = /**
            * Schedules this audio to start playing.
            * @param {number} when When in web audio context time to start playing.
            * @return {Klang.Model.Audio} Self
            */
            function (when, offset) {
                return this;
            };
            Audio.prototype.stop = /**
            * Stops playing back this audio.
            * @param {number} when When in web audio context time to stop playing.
            */
            function (when) {
                return this;
            };
            Audio.prototype.pause = /**
            * Pauses playback.
            * @return {Klang.Model.Audio} Self
            */
            function () {
                return this;
            };
            Audio.prototype.unpause = /**
            * Resumes playback.
            * @return {Klang.Model.Audio} Self
            */
            function () {
                return this;
            };
            Audio.prototype.curvePlaybackRate = /**
            *   Exponentially changes the playbackrate.
            *   @param {number} value PlaybackRate to change to.
            *   @param {number} duration Duration in seconds for the curve change.
            *   @return {Klang.Model.Audio} Self
            */
            function (value, duration) {
                return this;
            };
            Audio.prototype.fadeInAndPlay = /**
            * Starts playing the audio and fades it's volume from 0 to 1.
            * @param {number} duration Time in seconds to reach full volume.
            * @param {number} when When in web audio context time to start playing.
            * @return {Klang.Model.Audio} Self
            */
            function (duration, when) {
                return this;
            };
            Audio.prototype.fadeOutAndStop = /**
            * Starts fading out the volume of the audio and stops playback when the volume reaches 0.
            * @param {number} duration Time in seconds to reach zero volume
            * @param {number} [when] When in Web Audio Context time to start fading out.
            * @return {Klang.Model.Audio} Self
            */
            function (duration, when) {
                return this;
            };
            Audio.prototype.deschedule = /**
            * Deschedules everything that has been scheduled but has not started playing.
            * @return {Klang.Model.Audio} Self
            */
            function () {
                return this;
            };
            Object.defineProperty(Audio.prototype, "playbackRate", {
                set: /***
                * GETTERS / SETTERS
                *********************/
                /**
                * The playback speed of the buffer where 2 means double speed.
                * @member {number}
                */
                function (value) {
                    return this;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Audio.prototype, "playing", {
                get: /**
                * Whether or not this AudioSource is currently playing.
                * @type {boolean}
                */
                function () {
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Audio.prototype, "duration", {
                get: /**
                * The length of the audio in seconds.
                * @type {number}
                */
                function () {
                    return 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Audio.prototype, "output", {
                get: /**
                * The audio's output.
                * @type {GainNode}
                */
                function () {
                    return this._output;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Audio.prototype, "playbackState", {
                get: /**
                * The state of the playback of this AudioSource. Valid states:
                * 0: not started
                * 1: scheduled
                * 2: playing
                * 3: stopped
                * @type {number}
                */
                function () {
                    return 0;
                },
                enumerable: true,
                configurable: true
            });
            Audio.prototype.destroy = function () {
                // make sure we free up memory, seem to be leaky in FF 32 under windows
                this.disconnect();
                this._output = null;
            };
            return Audio;
        })();
        Model.Audio = Audio;        
        /*
        * Source: src/model/audio/AudioSource.ts
        */
        /**
        * Represents a buffer for one audio file and how to play it back.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        * @extends {Klang.Model.Audio}
        */
        var AudioSource = (function (_super) {
            __extends(AudioSource, _super);
            function AudioSource(data, name) {
                        _super.call(this, data, name);
                this._sources = [];
                this._startTime = 0;
                // När play kördes senast
                this._loopStartTime = 0;
                this._scheduleAhead = 0.2;
                this._stopping = false;
                this._fading = false;
                this._paused = false;
                this._pauseTime = -1;
                // Hur lång tid av ljudet som spelats
                this._pauseStartTime = -1;
                this.data = data;
                this._fileId = data.file_id;
                this._playbackRate = data.playback_rate || 1.0;
                this._endTime = 0;
                this._loop = data.loop != undefined ? data.loop : false;
                this._loopStart = data.loop_start;
                this._loopEnd = data.loop_end;
                this._offset = (data.offset) || 0;
                this._duration = data.duration || 0;
                this._reverse = data.reverse;
                this._retrig = data.retrig != undefined ? data.retrig : true;
                this._lockPlaybackrate = data.lock_playback_rate != undefined ? data.lock_playback_rate : false;
                this._volumeStartRange = data.volume_start_range;
                this._volumeEndRange = data.volume_end_range;
                this._pitchStartRange = data.pitch_start_range;
                this._pitchEndRange = data.pitch_end_range;
                if(data.panner) {
                    this._panner = data.panner;
                }
                if(data.granular) {
                    this._granular = {
                        bufferDuration: 0,
                        speed: data.granular.speed || 0.3333,
                        pitch: data.granular.pitch || 0,
                        pitchRandomization: data.granular.pitch_randomization || 0,
                        timeRandomization: data.granular.time_randomization || 0,
                        realTime: 0,
                        grainTime: 0,
                        grainDuration: data.granular.grain_duration || 0.09,
                        grainSpacing: data.granular.grain_spacing || 0.5 * 0.09,
                        grainWindow: null
                    };
                    var grainWindowLength = 16384;
                    this._granular.grainWindow = new Float32Array(grainWindowLength);
                    for(var i = 0; i < grainWindowLength; ++i) {
                        this._granular.grainWindow[i] = Math.sin(Math.PI * i / grainWindowLength);
                    }
                }
                // initiera direkt om initieringen redan gjorts
                if(!Core.instance.pushToPostLoadInitStack(this)) {
                    this.init();
                }
            }
            AudioSource.prototype.init = /**
            * Initializes the AudioSouce.
            */
            function () {
                if(typeof this._fileId == "string") {
                    this._buffer = FileHandler.instance.getFile(this._fileId);
                } else if(this._fileId.sampleRate) {
                    this._buffer = this._fileId;
                }
                if(!this._buffer) {
                    return;
                }
                if(!this._duration) {
                    this._duration = this._buffer.duration;
                }
                if(this._granular) {
                    this._granular.bufferDuration = this._buffer.duration - 0.050;
                }
                /*
                TAR BORT SAMPLES I BÖRJAN AV FILEN
                
                if (Klang.browser == "Safari") {
                
                var framesToRemove = 3008;
                var newBuffer = context.createBuffer(this._buffer.numberOfChannels, this._buffer.length-framesToRemove, context.sampleRate);
                
                for (var c = 0; c < this._buffer.numberOfChannels; c++) {
                var channelBuffer = this._buffer.getChannelData(c);
                
                var newChannelBuffer = newBuffer.getChannelData(c);
                for (var ix = framesToRemove, len = this._buffer.length; ix < len; ix++) {
                newChannelBuffer[ix-framesToRemove] = channelBuffer[ix];
                }
                console.log(channelBuffer.length, newChannelBuffer.length);
                }
                //console.log(this._buffer.getChannelData(0), newBuffer.getChannelData(0));
                this._buffer = newBuffer;
                }*/
                // Om en del av buffern ska användas skapas en ny buffer som endast innehåller den delen
                // detta görs endast i release (för att kunna ändra vilken region som används on the fly i en editor)
                // Bortkommenterat eftersom den satte duration till 0.
                /*if (this._offset || this._duration) {
                var length = Math.round(this._duration * context.sampleRate);
                var offset = Math.round(this._offset*context.sampleRate);
                
                var spriteBuffer = context.createBuffer(this._buffer.numberOfChannels, length, context.sampleRate);
                
                for (var c = 0; c < this._buffer.numberOfChannels; c++) {
                var channelData = this._buffer.getChannelData(c);
                var spriteChannelData = spriteBuffer.getChannelData(c);
                
                for (var ix = offset; ix < offset+length; ix++) {
                spriteChannelData[ix-offset] = channelData[ix];
                }
                }
                
                this._buffer = spriteBuffer;
                
                if (this._loopStart) {
                this._loopStart -= this._duration;
                }
                if (this._loopEnd) {
                this._loopEnd -= this._duration;
                }
                
                this._offset = 0;
                this._duration = 0;
                }*/
                if(this._reverse) {
                    /*if (this._loop) {
                    var start = this._buffer.duration - this._loopEnd;
                    this._loopEnd = this._buffer.duration - this._loopStart;
                    this._loopStart = start;
                    }*/
                    var reverseBuffer = Klang.context.createBuffer(this._buffer.numberOfChannels, this._buffer.length, Klang.context.sampleRate);
                    for(var c = 0; c < this._buffer.numberOfChannels; c++) {
                        var channelBuffer = this._buffer.getChannelData(c);
                        // vänd på buffern
                        var reverseChannelBuffer = reverseBuffer.getChannelData(c);
                        for(var len = channelBuffer.length, ix = len - 1; ix >= 0; ix--) {
                            reverseChannelBuffer[len - ix] = channelBuffer[ix];
                        }
                    }
                    // använd reversad buffer
                    this._buffer = reverseBuffer;
                }
                if(this.data.xfade) {
                    var sampleRate = Klang.context.sampleRate;
                    var fadeLength = this.data.xfade === true ? 11025 : this.data.xfade * sampleRate;
                    var loopStart = this._loopStart == undefined ? fadeLength : Math.round(this._loopStart * sampleRate);
                    var loopEnd = this._loopEnd == undefined ? this._buffer.length : Math.round(this._loopEnd * sampleRate);
                    crossfade(this._buffer, loopStart, loopEnd, fadeLength);
                }
            };
            AudioSource.prototype.setLoopRegion = /**
            * Sets what part of the audio buffer to loop if looping is turned on.
            * @param {number} loopStart Timestamp in seconds where in the buffer the loop starts.
            * @param {number} loopEnd Timestamp in seconds where in the buffer the loop ends.
            */
            function (loopStart, loopEnd) {
                this._loopStart = loopStart || this._loopStart;
                this._loopEnd = loopEnd || this._loopEnd;
                for(var ix = 0, len = this._sources.length; ix < len; ix++) {
                    var source = this._sources[ix];
                    source.loopStart = this._loopStart;
                    source.loopEnd = this._loopEnd;
                }
                return this;
            };
            AudioSource.prototype.connect = /**
            * Sets the destination for this AudioSource's audio output.
            * @param {AudioNode} destination Where to route this AudioSource's output.
            * @param {boolean} forceConnect Enables connecting to more than 1 destination.
            * @return {Klang.Model.AudioSource} Self
            */
            function (destination, forceConnect) {
                // Only do the connection if it's not already connected
                if(!this._destination || forceConnect) {
                    this._destination = destination;
                    if(this._panner) {
                        this._output.connect(this._panner.input);
                        this._panner.output.connect(destination);
                        //this._pannerOut.connect(destination);
                                            } else {
                        this._output.connect(destination);
                    }
                }
                return this;
            };
            AudioSource.prototype.disconnect = /**
            * Removes all previous connections.
            * @return {Klang.Model.AudioSource} Self
            */
            function () {
                this._output.disconnect();
                this._destination = null;
                if(this._panner) {
                    this._panner.output.disconnect();
                }
                return this;
            };
            AudioSource.prototype.scheduleGrain = function () {
                if(!this._buffer) {
                    return;
                }
                var g = this._granular;
                var source = Klang.context.createBufferSource();
                source.buffer = this._buffer;
                var r1 = Math.random();
                var r2 = Math.random();
                var r3 = Math.random();
                var r4 = Math.random();
                var r5 = Math.random();
                r1 = (r1 - 0.5) * 2.0;
                r2 = (r2 - 0.5) * 2.0;
                r3 = (r3 - 0.5) * 2.0;
                r4 = (r4 - 0.5) * 2.0;
                var grainWindowNode = Klang.context.createGain();
                source.connect(grainWindowNode);
                grainWindowNode.connect(this._output);
                // Pitch
                var totalPitch = this._granular.pitch + r1 * g.pitchRandomization;
                var pitchRate = Math.pow(2.0, totalPitch / 1200.0);
                source.playbackRate.value = pitchRate;
                // Time randomization
                var randomGrainOffset = r2 * g.timeRandomization;
                // Schedule sound grain
                source.start(g.realTime, g.grainTime + randomGrainOffset, g.grainDuration);
                // Schedule the grain window.
                // This applies a time-varying gain change for smooth fade-in / fade-out.
                var windowDuration = g.grainDuration / pitchRate;
                grainWindowNode.gain.value = 0.0// make default value 0
                ;
                grainWindowNode.gain.setValueCurveAtTime(g.grainWindow, g.realTime, windowDuration);
                var lastGrainTime = g.grainTime;
                // Update time params
                g.realTime += g.grainSpacing;
                g.grainTime += g.speed * g.grainSpacing;
                if(g.grainTime > g.bufferDuration) {
                    g.grainTime = 0.0;
                    if(!this._loop) {
                        this.stop();
                    }
                }
                if(g.grainTime < 0.0) {
                    g.grainTime += g.bufferDuration// backwards wrap-around
                    ;
                    if(!this._loop) {
                        this.stop();
                    }
                }
            };
            AudioSource.prototype.granularSchedule = function (when) {
                while(this._granular.realTime < when + 0.100) {
                    this.scheduleGrain();
                }
                var _this = this;
                this._granular.scheduleId = setTimeout(function () {
                    _this.granularSchedule(Klang.context.currentTime);
                }, 20);
            };
            AudioSource.prototype.play = /**
            * Schedules this AudioSource to start playing.
            * @param {number} when When in web audio context time to start playing.
            * @param {bool} resume Whether to resume previous playback, if the AudioSource has been paused.
            * @return {Klang.Model.AudioSource} Self
            */
            function (when, offset, resume) {
                if (typeof when === "undefined") { when = 0; }
                if (typeof offset === "undefined") { offset = 0; }
                if (typeof resume === "undefined") { resume = false; }
                this.removeUnusedSources();
                if(!this._buffer) {
                    this.init();
                    //this._buffer = FileHandler.instance.getFile(this._fileId);
                    if(!this._buffer) {
                        return;
                    }
                }
                when = when || 0;
                if(this._granular) {
                    this.granularSchedule(when);
                } else {
                    //console.log(this._name, "s", when, "c", context.currentTime);
                    // spela inte om tiden har passerat (för att inte klumpa ihop massa ljud vid scroll på ios)
                    if(when != 0 && when + 0.01 <= Klang.context.currentTime) {
                        return this;
                    } else if(when == 0) {
                        when = Klang.context.currentTime;
                    }
                    //Util.lastPlayedSourceTime = when;
                    this.output.gain.cancelScheduledValues(when);
                    if(this._volumeStartRange != undefined) {
                        this.output.gain.setValueAtTime(this._volume * (Math.random() * (this._volumeEndRange - this._volumeStartRange) + this._volumeStartRange), when);
                    } else {
                        this.output.gain.setValueAtTime(this._volume, when);
                    }
                    if(!this.paused) {
                        this._pauseStartTime = when;
                    }
                    //  Resets _pauseTime if not started from unpause()
                    if(!resume) {
                        this._pauseTime = 0;
                    }
                    this._startTime = when;
                    this._loopStartTime = when + this.duration;
                    this._paused = false;
                    if(this._stopping) {
                        this.output.gain.cancelScheduledValues(when);
                        this.output.gain.setValueAtTime(this.output.gain.value, when);
                        this.output.gain.linearRampToValueAtTime(this._volume, when + 0.25);
                        clearTimeout(this._stoppingId);
                        this._stopping = false;
                        return;
                    } else if(!this._fading) {
                        //this.output.gain.value = this._volume;
                                            }
                    this._fading = false;
                    // Used to check if AudioSource is playing if not looping.
                    if(!this._retrig && !this.loop) {
                        if(when < this._endTime) {
                            return;
                        }
                    } else if(this.loop) {
                        if(this._endTime == -1 || when < this._endTime) {
                            return;
                        }
                        // Used to check if AudioSource is playing if looping.
                        /*if (this._loopPlaying) return;
                        this._loopPlaying = true;
                        clearTimeout(this._endedTimeout);*/
                                            } else if(Math.round(this._endTime * 1000) / 1000 == Math.round((when + this._buffer.duration) * 1000) / 1000) {
                        return this;
                    }
                    this._endTime = this.loop ? -1 : when + this._buffer.duration;
                    /*if (!this._source || this._source.buffer) {
                    this.createBufferSource();
                    }*/
                    var source = this.createBufferSource();
                    source.buffer = this._buffer;
                    if(this._loop) {
                        source.loop = true;
                        source.loopStart = this._loopStart ? this._loopStart : 0;
                        source.loopEnd = this._loopEnd ? this._loopEnd : this._buffer.duration;
                        // Fixar hacket i mp3-filer encodade med lame från wav... men funkar inte i iOS-safari
                        /*if (Klang.browser == "Safari") {
                        source.loopEnd -= 1056/context.sampleRate;
                        }*/
                                            }
                    source.connect(this._output);
                    if(offset > this._duration) {
                        offset = offset % this._duration;
                    }
                    this._startOffset = this._offset + offset;
                    var duration = this._duration;
                    // Fix for Firefox Audiosprite
                    /*if (Klang.browser == "Firefox" && this._offset) {
                    offset -= 0.2;
                    duration -= 0.2;
                    }*/
                    if(this._pitchStartRange != undefined) {
                        source.playbackRate.value = this._playbackRate * (Math.random() * (this._pitchEndRange - this._pitchStartRange) + this._pitchStartRange);
                    }
                    source["startTime"] = when;
                    // ###safaripolyfill
                    //if (safari) { source.noteGrainOn(when, this._startOffset, (duration || source.buffer.duration)-this._startOffset); }
                    // else { source.start(when, this._startOffset, duration || source.buffer.duration); }
                    source.start(when, this._startOffset, duration || source.buffer.duration);
                }
                //Klang.log("play:"+this._name, "offset", this._offset, "duration", this._duration);
                return this;
            };
            AudioSource.prototype.getNumberOfSamples = function () {
                return this._buffer.length;
            };
            AudioSource.prototype.stop = /**
            * Stops all currently playing instances of this AudioSource's buffer.
            * @param {number} when When in web audio context time to stop playing.
            */
            function (when) {
                if (typeof when === "undefined") { when = 0; }
                if(this._granular) {
                    clearTimeout(this._granular.scheduleId);
                } else {
                    if(this._stopping) {
                        this._stopping = false;
                        clearTimeout(this._stoppingId);
                    }
                    var numSources = this._sources.length;
                    //if (!this.playing) return;
                    if(numSources > 0) {
                        var contextTime = Util.now();
                        when = when || contextTime;
                        var deltaTimeMs = (when - contextTime) * 1000;
                        if(this._loop) {
                            /*var _this = this;
                            clearTimeout(this._endedTimeout);
                            var loopEndInMs = (when-Util.now())/0.001;
                            
                            this._endedTimeout = setTimeout(function() {
                            _this._loopPlaying = false;
                            }, loopEndInMs);*/
                            this._endTime = when;
                        } else {
                            this._endTime = when;
                        }
                        var _this = this;
                        setTimeout(function () {
                            _this.clearSources(when);
                        }, deltaTimeMs || 1);
                    } else {
                        this._loopPlaying = false;
                    }
                }
                return this;
            };
            AudioSource.prototype.clearSources = function (when, disconnect) {
                if (typeof disconnect === "undefined") { disconnect = false; }
                when = when || Util.now();
                var numSources = this._sources.length;
                // stop all AudioBufferSourceNodes and clear sources array
                for(var ix = 0; ix < numSources; ix++) {
                    var source = this._sources[ix];
                    source.stop(when);
                    if(disconnect) {
                        source.disconnect();
                    }
                }
                this._sources = [];
            };
            AudioSource.prototype.deschedule = /**
            * Deschedules everything that has been scheduled but has not started playing.
            * @return {Klang.Model.AudioSource} Self
            */
            function () {
                for(var ix = 0; ix < this._sources.length; ix++) {
                    var source = this._sources[ix];
                    if(source["startTime"] > Klang.context.currentTime) {
                        source.stop(0);
                        this._sources[ix].disconnect();
                        source.disconnect();
                        this._sources.splice(ix, 1);
                        ix--;
                    }
                }
                return this;
            };
            AudioSource.prototype.pause = /**
            * Pauses the playback of this AudioSource.
            * @return {Klang.Model.AudioSource} Self
            */
            function () {
                if(this._endTime > Util.now()) {
                    this._paused = true;
                    var pauseDelta = Util.now() - this._startTime;// Tid som spelats sedan senaste start/unpause
                    
                    this._pauseTime += pauseDelta;
                    this.stop();
                }
                return this;
            };
            AudioSource.prototype.unpause = /**
            * Resumes the playback of this AudioSource.
            * @return {Klang.Model.AudioSource} Self
            */
            function () {
                if(this.paused) {
                    // Spara vanlig offset
                    var realOffset = this._offset;
                    // Ändra offset för att endast spela vad som är kvar av buffern
                    this._offset += this._pauseTime;
                    // Spela upp och ändra tillbaka offset
                    this.play(0, 0, true);
                    this._offset = realOffset;
                    this._paused = false;
                }
                return this;
            };
            AudioSource.prototype.createBufferSource = /**
            * Creates a new source node for playing back this AudioSource.
            * @private
            * @return {AudioBufferSourceNode} The source node that was created.
            */
            function () {
                var source = Klang.context.createBufferSource();
                source.playbackRate.value = this._playbackRate;
                this._sources.push(source);
                /*source.onended = onEnded;
                function onEnded() {
                console.log('playback finished');
                }*/
                return source;
            };
            AudioSource.prototype.fadeInAndPlay = /**
            * Starts playing the audio and fades it's volume from 0 to 1.
            * @param {number} duration Time in seconds to reach full volume.
            * @param {number} when When in web audio context time to start playing.
            * @return {Klang.Model.AudioSource} Self
            */
            function (duration, when, offset) {
                if (typeof offset === "undefined") { offset = 0; }
                var now = Klang.context.currentTime;
                if(!when) {
                    when = now;
                }
                if(this.loop && (this._endTime == -1 || when < this._endTime) && !this._stopping) {
                    return;
                }
                this.output.gain.cancelScheduledValues(when);
                if(this._stopping) {
                    clearTimeout(this._stoppingId);
                    this.output.gain.setValueAtTime(this.output.gain.value, when);
                } else {
                    this._fading = true;
                    this.play(when == now ? 0 : when, offset);
                    this.output.gain.setValueAtTime(0, when);
                }
                this._stopping = false;
                this.output.gain.linearRampToValueAtTime(this._volume, when + duration);
                return this;
            };
            AudioSource.prototype.fadeOutAndStop = /**
            * Starts fading out the volume of the audio and stops playback when the volume reaches 0.
            * @param {number} duration Time in seconds to reach zero volume
            * @param {number} [when] When in Web Audio Context time to start fading out.
            * @return {Klang.Model.AudioSource} Self
            */
            function (duration, when) {
                if(!this.playing) {
                    return;
                }
                if(when == undefined) {
                    when = Klang.context.currentTime;
                }
                if(this._stopping) {
                    clearTimeout(this._stoppingId);
                }
                this.output.gain.cancelScheduledValues(when);
                this.output.gain.setValueAtTime(this.output.gain.value || this._volume, when);
                this.output.gain.linearRampToValueAtTime(0, when + duration);
                var _this = this;
                this._stopping = true;
                this._stoppingId = setTimeout(function () {
                    _this._stopping = false;
                    if(_this.loop) {
                        _this._loopPlaying = false;
                    }
                    _this.stop(when + duration);
                    //resets to original volume
                    //Util.setParam(_this.output.gain, _this._volume, when+duration+0.5);
                                    }, (duration + (when - Util.now()) - _this._scheduleAhead) / 0.001);
                return this;
            };
            AudioSource.prototype.removeUnusedSources = /**
            * Removes any stopped or finished source nodes.
            * @private
            */
            function () {
                for(var ix = 0; ix < this._sources.length; ix++) {
                    var source = this._sources[ix];
                    if(source.playbackState == 3 || !source.buffer || source["startTime"] + source.buffer.duration < Klang.context.currentTime) {
                        this._sources[ix].disconnect();
                        this._sources.splice(ix, 1);
                        ix--;
                    }
                }
            };
            AudioSource.prototype.curvePlaybackRate = /**
            *   Exponentially changes the playbackrate.
            *   @param {number} value PlaybackRate to change to.
            *   @param {number} duration Duration in seconds for the curve change.
            *   @return {Klang.Model.AudioSource} Self
            */
            function (value, duration) {
                if(this._lockPlaybackrate) {
                    return;
                }
                var node = this.playbackRateNode;
                node.cancelScheduledValues(Util.now());
                node.setValueAtTime(node.value == 0 ? Util.EXP_MIN_VALUE : node.value, Util.now());
                node.exponentialRampToValueAtTime(value, Util.now() + duration);
                this._playbackRate = value;
                return this;
            };
            Object.defineProperty(AudioSource.prototype, "lastSource", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * The last source node that was created.
                * @type {AudioBufferSourceNode}
                */
                function () {
                    var numSources = this._sources.length;
                    if(numSources == 0) {
                        return null;
                    }
                    return this._sources[numSources - 1];
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "loop", {
                get: /**
                * Whether playback of the buffer should loop or not.
                * @type {boolean}
                */
                function () {
                    return this._loop;
                },
                set: function (value) {
                    this._loop = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "offset", {
                get: /**
                * Where in the buffer to start playing, in seconds.
                * @type {number}
                */
                function () {
                    return this._offset;
                },
                set: function (value) {
                    this._offset = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "position", {
                get: function () {
                    if(!this.playing || !this._duration) {
                        return 0;
                    }
                    var duration = this._duration;
                    if(this._loopStart || this._loopEnd) {
                        duration = (this._loopEnd || duration) - (this._loopStart || 0);
                    }
                    var timePlayed = Util.now() - this._startTime;
                    var loopTimePlayed = Util.now() + this._startOffset - this._loopStartTime;
                    if(this._startOffset + timePlayed > this._duration) {
                        return this._loopStart + loopTimePlayed % duration;
                    } else {
                        return this._startOffset + timePlayed;
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "duration", {
                get: /**
                * Number of seconds after the offset to stop playing the buffer.
                * @member {number}
                */
                function () {
                    return this._duration;
                    //return this._buffer.duration - this._offset;
                                    },
                set: function (value) {
                    this._duration = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "paused", {
                get: /**
                * Whether this AudioSource has been paused or not.
                * @type {boolean}
                */
                function () {
                    return this._paused;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "playbackRate", {
                get: /**
                * The playback speed of the buffer where 2 means double speed.
                * @member {number}
                */
                function () {
                    return this._playbackRate;
                },
                set: function (value) {
                    if(this._lockPlaybackrate) {
                        return;
                    }
                    var node = this.playbackRateNode;
                    node.cancelScheduledValues(Util.now());
                    this._playbackRate = value;
                    for(var ix = 0, len = this._sources.length; ix < len; ix++) {
                        this._sources[ix].playbackRate.value = this._playbackRate;
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "nextPlaybackRate", {
                set: /**
                *   The playbackrate for the next source node that is created, NOT the currently playing sources.
                *   Used by SamplePlayer
                *   @type {number}
                */
                function (value) {
                    if(this._lockPlaybackrate) {
                        return;
                    }
                    this._playbackRate = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "playbackRateNode", {
                get: /**
                * Node for manipulating the playback rate.
                * @type {AudioParam}
                */
                function () {
                    var source = this.lastSource;
                    if(!source || source.playbackState === 3) {
                        source = this.createBufferSource();
                    }
                    return source.playbackRate;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "buffer", {
                get: /**
                * The audio buffer that this AudioSource plays.
                * @type {AudioBuffer}
                */
                function () {
                    if(!this._buffer) {
                        this._buffer = FileHandler.instance.getFile(this._fileId);
                    }
                    return this._buffer;
                },
                set: function (buffer) {
                    this._buffer = buffer;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "playing", {
                get: /**
                * Whether or not this AudioSource is currently playing.
                * @type {boolean}
                */
                function () {
                    return this._endTime == -1 || this._endTime > Util.now();
                    /*var playing = false;
                    if (this._loop) {
                    //playing = this._loopPlaying;
                    if (this._endTime > Util.now()) {
                    playing = true;
                    }else {
                    playing = false;
                    }
                    }else {
                    if (this._endTime > Util.now()) {
                    playing = true;
                    }else {
                    playing = false;
                    }
                    }
                    return playing;*/
                                    },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "playbackState", {
                get: /**
                * The state of the playback of this AudioSource. Valid states:
                * 0: not started
                * 1: scheduled
                * 2: playing
                * 3: stopped
                * @type {number}
                */
                function () {
                    var source = this.lastSource;
                    if(source) {
                        return source.playbackState;
                    }
                    return 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "output", {
                get: /**
                * The audio's output.
                * @type {GainNode}
                */
                function () {
                    if(this._panner) {
                        return this._panner.output;
                    } else {
                        return this._output;
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioSource.prototype, "panner", {
                get: /**
                * The audio's 3d panner.
                * @type {Model.Panner}
                */
                function () {
                    return this._panner;
                },
                enumerable: true,
                configurable: true
            });
            AudioSource.prototype.freeBuffer = function () {
                this._buffer = null;
                for(var ix = 0, len = this._sources.length; ix < len; ix++) {
                    try  {
                        this._sources[ix].stop(0);
                    } catch (ex) {
                    }
                    this._sources[ix].disconnect();
                    this._sources[ix] = null;
                }
                this._sources = [];
            };
            AudioSource.prototype.destroy = function () {
                // call super
                Audio.prototype.destroy.call(this);
                if(this._panner) {
                    this._panner.destroy();
                }
                this._panner = null;
                this._output = null;
                this.clearSources(null, true);
            };
            return AudioSource;
        })(Audio);
        Model.AudioSource = AudioSource;        
        function crossfade(buf, loopStart, loopEnd, length, type) {
            if (typeof type === "undefined") { type = "linear"; }
            var funA;
            var funB;
            if(type == "linear") {
                funA = function (x) {
                    return 1 - x;
                };
                funB = function (x) {
                    return x;
                };
            } else if(type == "equalpower") {
                funA = function (x) {
                    return Math.pow(1 - x, 0.5);
                };
                funB = function (x) {
                    return Math.pow(x, 0.5);
                };
            } else {
                return;
            }
            loopEnd = Math.min(loopEnd, buf.length);
            length = Math.min(length, loopStart);
            for(var c = 0; c < buf.numberOfChannels; c++) {
                var data = buf.getChannelData(c);
                var a = loopEnd - 1;
                var b = loopStart - 1;
                for(var i = length - 1; i >= 0; i--) {
                    var ratio = (i + 1) / (length + 1);
                    data[a] = data[a] * funA(ratio) + data[b] * funB(ratio);
                    a--;
                    b--;
                }
                // fix extra due to interpolation in playback
                var le = loopEnd;
                var ls = loopStart;
                while(le < buf.length) {
                    data[le++] = data[ls++];
                }
            }
        }
        Model.crossfade = crossfade;
        /*
        * Source: src/model/audio/AudioGroup.ts
        */
        /**
        * Enum for group types, represents how an AudioGroup is played back.
        * @enum {number}
        */
        var GroupType = {
            CONCURRENT: 0,
            STEP: 1,
            RANDOM: 2,
            SHUFFLE: 3,
            BACKWARDS: 4
        };
        var QueueType = {
            NONE: 0,
            ONE: 1,
            INFINITE: 2
        };
        /**
        * A group of multiple audio objects.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        * @extends Klang.Model.Audio
        */
        var AudioGroup = (function (_super) {
            __extends(AudioGroup, _super);
            function AudioGroup(data, name) {
                        _super.call(this, data, name);
                this._adder = 0;
                this._currentId = 0;
                this._paused = false;
                this._groupType = data.group_type != undefined ? data.group_type : GroupType.STEP;
                this._retrig = data.retrig != undefined ? data.retrig : true;
                this._queue = data.queue != undefined ? data.queue : QueueType.NONE;
                this._content = data.content || [];
                Core.instance.pushToPreLoadInitStack(this);
            }
            AudioGroup.prototype.init = /**
            * Fills the content array according to the names specified in the config for this group.
            */
            function () {
                var newContent = [];
                for(var ix = 0, len = this._content.length; ix < len; ix++) {
                    newContent.push(Core.instance.findInstance(this._content[ix]));
                }
                this._content = newContent;
            };
            AudioGroup.prototype.connect = /**
            * Sets the destination for this group's output.
            * @param {AudioNode} destination Where to route this group's output.
            * @return {Klang.Model.AudioGroup} Self
            */
            function (destination) {
                for(var ix = 0, len = this._content.length; ix < len; ix++) {
                    var a = this._content[ix];
                    //if (!a.destinationName || a.destinationName == "$PARENT") {
                    a.disconnect();
                    a.connect(this._output);
                    //}
                                    }
                this._output.connect(destination);
                return this;
            };
            AudioGroup.prototype.disconnect = /**
            * Removes all previous connections.
            * @return {Klang.Model.AudioGroup} Self
            */
            function () {
                this._output.disconnect();
                return this;
            };
            AudioGroup.prototype.play = /**
            * Schedules playback of the group.
            * @param {number} when When in web audio context time to start playing.
            * @return {Klang.Model.AudioGroup} Self
            */
            function (when, audioSource, forcePlay) {
                if(!this._content.length) {
                    return;
                }
                // Spela inte om retrig är avstängt och senaste ljudet fortfarande spelas
                var latestPlaying = this.latestPlayed ? this.latestPlayed.playing : false;
                if(!forcePlay && !this._retrig && latestPlaying) {
                    if(this._queue != QueueType.NONE) {
                        if(this._queue == QueueType.ONE && this._latestStartTime > Klang.context.currentTime) {
                            this.latestPlayed.stop();
                            this.play(this._latestStartTime, audioSource, true);
                        } else {
                            this.play(this._latestStartTime + this.latestPlayed.duration, audioSource, true);
                        }
                    }
                    return this;
                }
                this._paused = false;
                if(audioSource != undefined) {
                    var asId;
                    if(typeof audioSource == "number") {
                        asId = audioSource;
                    } else if(typeof audioSource == "string") {
                        asId = this.getIdFromString(audioSource);
                    } else if(audioSource._name) {
                        asId = this.getIdFromString(audioSource._name);
                    }
                    this._content[asId].play(when);
                    this._latestPlayed = this._content[asId];
                } else {
                    if(this._groupType == GroupType.STEP) {
                        if(this._adder < 0) {
                            this._currentId = this._content.length - 1 + (this._adder % this._content.length);
                        } else {
                            this._currentId = this._adder % this._content.length;
                        }
                        this._adder++;
                        this._content[this._currentId].play(when);
                    } else if(this._groupType == GroupType.RANDOM) {
                        var random = Math.floor(Math.random() * (this._content.length - 1));
                        if(this._content.length > 1 && random == this._adder) {
                            random = (random + 1) % this._content.length;
                        }
                        this._currentId = this._adder = random;
                        this._content[this._currentId].play(when);
                    } else if(this._groupType == GroupType.SHUFFLE) {
                        if(this._adder % this._content.length == 0) {
                            Util.shuffle(this._content);
                        }
                        this._currentId = this._adder % this._content.length;
                        this._adder++;
                        this._content[this._currentId].play(when);
                    } else if(this._groupType == GroupType.CONCURRENT) {
                        for(var ix = 0, len = this._content.length; ix < len; ix++) {
                            this._content[ix].play(when);
                        }
                    } else if(this._groupType == GroupType.BACKWARDS) {
                        if(this._adder < 0) {
                            this._currentId = this._content.length - 1 + (this._adder % this._content.length);
                        } else {
                            this._currentId = this._adder % this._content.length;
                        }
                        this._adder--;
                        this._content[this._currentId].play(when);
                    }
                    if(this._groupType === GroupType.CONCURRENT) {
                        // Utgår från första om concurrent, skulle kunna utgå från längsta istället.
                        this._latestPlayed = this._content[0];
                    } else {
                        this._latestPlayed = this._content[this._currentId];
                    }
                }
                this._latestStartTime = (when || Klang.context.currentTime);
                return this;
            };
            AudioGroup.prototype.stop = /**
            * Stops playing back this group.
            * @param {number} when When in web audio context time to stop playing.
            */
            function (when) {
                this._content[this._currentId].stop(when);
                return this;
            };
            AudioGroup.prototype.pause = /**
            * Pauses playback.
            * @return {Klang.Model.AudioGroup} Self
            */
            function () {
                this._paused = true;
                if(this._latestPlayed) {
                    this._latestPlayed.pause();
                }
                return this;
            };
            AudioGroup.prototype.unpause = /**
            * Resumes playback.
            * @return {Klang.Model.AudioGroup} Self
            */
            function () {
                this._paused = false;
                if(this._latestPlayed) {
                    this._latestPlayed.unpause();
                }
                return this;
            };
            AudioGroup.prototype.fadeInAndPlay = /**
            * Starts playing the audio and fades it's volume from 0 to 1.
            * @param {number} duration Time in seconds to reach full volume.
            * @param {number} when When in web audio context time to start playing.
            * @return {Klang.Model.AudioGroup} Self
            */
            function (duration, when) {
                this.play(when);
                this.output.gain.value = 0;
                Util.curveParamLin(this.output.gain, 1, duration, when);
                return this;
            };
            AudioGroup.prototype.fadeOutAndStop = /**
            * Starts fading out the volume of the audio and stops playback when the volume reaches 0.
            * @param {number} duration Time in seconds to reach zero volume
            * @param {number} [when] When in Web Audio Context time to start fading out.
            * @return {Klang.Model.AudioGroup} Self
            */
            function (duration, when) {
                if(when == undefined) {
                    when = Klang.context.currentTime;
                }
                this.output.gain.cancelScheduledValues(when);
                Util.curveParamLin(this.output.gain, 0, duration, when);
                //resets to original volume
                Util.setParam(this.output.gain, this._volume, when + duration);
                this.stop(when + duration);
                return this;
            };
            AudioGroup.prototype.curvePlaybackRate = /**
            *   Exponentially changes the playbackrate.
            *   @param {number} value PlaybackRate to change to.
            *   @param {number} duration Duration in seconds for the curve change.
            *   @return {Klang.Model.AudioGroup} Self
            */
            function (value, duration) {
                for(var ix = 0, len = this._content.length; ix < len; ix++) {
                    this._content[ix].curvePlaybackRate(value, duration);
                }
                return this;
            };
            AudioGroup.prototype.deschedule = /**
            * Deschedules everything that has been scheduled but has not started playing.
            * @return {Klang.Model.AudioGroup} Self
            */
            function () {
                for(var ix = 0, len = this._content.length; ix < len; ix++) {
                    this._content[ix].deschedule();
                }
                return this;
            };
            AudioGroup.prototype.getIdFromString = function (str) {
                for(var ix = 0, len = this._content.length; ix < len; ix++) {
                    if(this._content[ix]._name == str) {
                        return ix;
                    }
                }
            };
            Object.defineProperty(AudioGroup.prototype, "playbackRate", {
                set: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * The playback speed of the buffer where 2 means double speed.
                * @member {number}
                */
                function (value) {
                    for(var ix = 0, len = this._content.length; ix < len; ix++) {
                        this._content[ix].playbackRate = value;
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioGroup.prototype, "groupType", {
                get: /**
                * The group's type, determines how the content is played.
                * @type {Klang.Model.GroupType}
                */
                function () {
                    return this._groupType;
                },
                set: function (value) {
                    this._groupType = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioGroup.prototype, "content", {
                get: /**
                * The group's audio content.
                * @type {Array.<Audio>}
                */
                function () {
                    return this._content;
                },
                set: function (value) {
                    this._content = value;
                    this.init();
                },
                enumerable: true,
                configurable: true
            });
            AudioGroup.prototype.addContent = function (audio) {
                this._content.push(audio);
            };
            AudioGroup.prototype.removeContent = function (name) {
                for(var i = 0; i < this._content.length; i++) {
                    if(this._content[i]._name === name) {
                        this._content.splice(i, 1);
                    }
                }
            };
            Object.defineProperty(AudioGroup.prototype, "playing", {
                get: /**
                * Whether or not this AudioSource is currently playing.
                * @type {boolean}
                */
                function () {
                    return this._latestPlayed ? this._latestPlayed.playing : false;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioGroup.prototype, "duration", {
                get: /**
                * The length of the audio in seconds.
                * @type {number}
                */
                function () {
                    return this._latestPlayed ? this._latestPlayed.duration : this._content[0].duration;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioGroup.prototype, "playbackState", {
                get: /**
                * The state of the playback of this AudioSource. Valid states:
                * 0: not started
                * 1: scheduled
                * 2: playing
                * 3: stopped
                * @type {number}
                */
                function () {
                    return this._content[this._currentId].playbackState;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AudioGroup.prototype, "latestPlayed", {
                get: /**
                * The latest audio that was played.
                * @type {Klang.Model.Audio}
                */
                function () {
                    return this._latestPlayed;
                },
                enumerable: true,
                configurable: true
            });
            return AudioGroup;
        })(Audio);
        Model.AudioGroup = AudioGroup;        
        /*
        * Source: src/model/audio/Automation.ts
        */
        /**
        * An automation of a parameter.
        * @param {Object} data Configuration data.
        * @class
        */
        var Automation = (function () {
            function Automation(data) {
                this._startValue = data.start_value || 0;
                this._points = data.points || [];
            }
            Automation.prototype.automate = /**
            * Starts the automation.
            * @param {AudioParam} param What parameter to automate.
            * @param {number} when When to start the automation, in web audio context time.
            */
            function (param, when) {
                when = when || Klang.context.currentTime;
                param.cancelScheduledValues(when);
                param.setValueAtTime(this._startValue, when);
                var lastEndTime = 0;
                for(var ix = 0, len = this._points.length; ix < len; ix++) {
                    var p = this._points[ix];
                    switch(p.curve) {
                        case "lin":
                            param.linearRampToValueAtTime(p.value, when + p.time);
                            break;
                        case "exp":
                            param.exponentialRampToValueAtTime(p.value, when + p.time);
                            break;
                        default:
                            param.setValueCurveAtTime(Util.CUSTOM_CURVES[p.curve], when + lastEndTime, p.time - lastEndTime);
                            break;
                    }
                    lastEndTime = p.time;
                }
            };
            return Automation;
        })();
        Model.Automation = Automation;        
        /*
        * Source: src/model/audio/Bus.ts
        */
        /**
        * Represents a bus for routing audio and effects.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @class
        */
        var Bus = (function () {
            function Bus(data, name) {
                this._name = name;
                this._type = data.type;
                this._input = Klang.context.createGain();
                this._output = Klang.context.createGain();
                this._effects = data.effects || [];
                for(var i = 0, len = this._effects.length; i < len; i++) {
                    if(data.effects[i].active === false) {
                        this._effects[i].setActive(false);
                    }
                }
                this._input.gain.value = data.input_vol !== undefined ? data.input_vol : 1;
                this._output.gain.value = data.output_vol !== undefined ? data.output_vol : 1;
                // Spara destination och lägg på ihopkopplingskön om destination är definierad
                if(data.destination_name) {
                    this.destinationName = data.destination_name;
                    Core.instance.pushToConnectStack(this);
                }
                Core.instance.pushToPreLoadInitStack(this);
            }
            Bus.prototype.init = /**
            * Sets up the routing of the bus' effects.
            * @method init
            */
            function () {
                var success = true;
                var lastNode = this._input;
                for(var i = 0, len = this._effects.length; i < len; i++) {
                    lastNode.disconnect();
                    lastNode.connect(this._effects[i].input);
                    lastNode = this._effects[i];
                }
                lastNode.connect(this._output);
                return success;
            };
            Bus.prototype.connect = /**
            * Connects audio from this bus to a Web Audio node.
            * @param {AudioNode} destination Which node to route audio to.
            */
            function (destination) {
                this._output.connect(destination);
                return this;
            };
            Bus.prototype.disconnect = /**
            * Removes all previous connections.
            * @return {Klang.Model.Bus} Self
            */
            function () {
                this._output.disconnect();
                return this;
            };
            Object.defineProperty(Bus.prototype, "input", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * The bus' input.
                * @type {GainNode}
                */
                function () {
                    return this._input;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Bus.prototype, "output", {
                get: /**
                * The bus' output.
                * @type {GainNode}
                */
                function () {
                    return this._output;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Bus.prototype, "effects", {
                get: /**
                * This bus' effect chain.
                * @type {Array.<Klang.Model.Effect>}
                */
                function () {
                    return this._effects;
                },
                enumerable: true,
                configurable: true
            });
            return Bus;
        })();
        Model.Bus = Bus;        
        /**
        * Handles playback of midi files.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        * @extends {Klang.Model.Audio}
        */
        var MidiPattern = (function (_super) {
            __extends(MidiPattern, _super);
            //private _stopCount: number;
            function MidiPattern(data, name) {
                        _super.call(this, data, name);
                this._startStep = 0;
                this._totalStep = 0;
                this._currentStep = 0;
                this._syncStep = 0;
                this._stepCount = 0;
                this._fadeTime = 0;
                this._transpose = 0;
                this._scales = {
                    diatonic: [
                        0, 
                        -1, 
                        0, 
                        -1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        -1, 
                        0, 
                        -1, 
                        0
                    ],
                    dorian: [
                        0, 
                        1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        1, 
                        0, 
                        1, 
                        0, 
                        0, 
                        -1
                    ],
                    phrygian: [
                        0, 
                        0, 
                        -1, 
                        0, 
                        -1, 
                        0, 
                        1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        -1
                    ],
                    lydian: [
                        0, 
                        1, 
                        0, 
                        1, 
                        0, 
                        1, 
                        0, 
                        0, 
                        1, 
                        0, 
                        1, 
                        0
                    ],
                    mixolydian: [
                        0, 
                        1, 
                        0, 
                        1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        -1, 
                        0, 
                        0, 
                        -1
                    ],
                    aeolian: [
                        0, 
                        -1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        -1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        -1
                    ],
                    locrian: [
                        0, 
                        0, 
                        -1, 
                        0, 
                        -1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        -1, 
                        0, 
                        -1
                    ],
                    harmonicMinor: [
                        0, 
                        1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        1, 
                        0, 
                        0, 
                        -1, 
                        1, 
                        0
                    ],
                    melodicMinor: [
                        0, 
                        1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        1, 
                        0, 
                        -1, 
                        0, 
                        1, 
                        0
                    ],
                    majorPentatonic: [
                        0, 
                        1, 
                        0, 
                        1, 
                        0, 
                        -1, 
                        1, 
                        0, 
                        1, 
                        0, 
                        -1, 
                        1
                    ],
                    minorPentatonic: [
                        0, 
                        -1, 
                        1, 
                        0, 
                        -1, 
                        0, 
                        1, 
                        0, 
                        -1, 
                        1, 
                        0, 
                        -1
                    ],
                    doubleHarmonic: [
                        0, 
                        0, 
                        -1, 
                        1, 
                        0, 
                        0, 
                        1, 
                        0, 
                        0, 
                        -1, 
                        1, 
                        0
                    ],
                    halfDim: [
                        0, 
                        1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        0, 
                        -1, 
                        0, 
                        -1, 
                        0, 
                        -1
                    ],
                    chromatic: [
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0
                    ],
                    custom: [
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0
                    ]
                };
                this._state = PatternState.Stopped;
                this._beatSubscription = data.beat_subscription || 0.25;
                this._midiFileId = data.file_id;
                this._midiTrackIx = data.midi_track || 0;
                this._sequencerName = data.sequencer;
                this._synthName = data.synth;
                this._loop = data.loop != undefined ? data.loop : true;
                this._length = data.length || 0;
                this._nextClip = 0;
                this._startStep = data.start_step || 0;
                this._root = data.root || 0;
                this._transpose = this._orgTranspose = data.transpose || 0;
                this._scale = this._orgScale = data.scale;
                this._rootNote = data.root_note || 36;
                this._activeUpbeat = -1;
                if(data.upbeats) {
                    this._upbeats = [];
                    this._upbeatLoopOffset = 0;
                    for(var ix = 0, len = data.upbeats.length; ix < len; ix++) {
                        this._upbeats.push({
                            length: data.upbeats[ix].length,
                            step: data.upbeats[ix].step,
                            targetStep: data.upbeats[ix].target_step,
                            playInLoop: data.upbeats[ix].play_in_loop
                        });
                    }
                }
                Core.instance.pushToPostLoadInitStack(this);
            }
            MidiPattern.prototype.init = /**
            * Initializes the pattern.
            */
            function () {
                // Hämta sequencern
                this._sequencer = Core.instance.findInstance(this._sequencerName);
                this._sequencer.registerPattern(this);
                // Hämta synten som ska spelas
                if(this._synthName === "progression") {
                    this._synth = "progression";
                    this._progression = true;
                    this._currentChord = [];
                } else {
                    this._synth = Core.instance.findInstance(this._synthName);
                }
                this._midiFile = FileHandler.instance.getFile(this._midiFileId);
                if(this._midiFile) {
                    this.setupFile();
                }
            };
            MidiPattern.prototype.setupFile = /**
            * Creates clips for the midi events in the file.
            * @private
            * @return {Klang.Model.MidiPattern} Self
            */
            function () {
                this._midiTrack = this._midiFile.tracks[this._midiTrackIx];
                this.recalculateBPM(this._sequencer.bpm);
                var ticksPerBeat = this._midiFile.header.ticksPerBeat;
                // Gå igenom midifilen och skapa clips för varje event
                var step = 0;
                var ticks = 0;
                this._clips = [];
                for(var ix = 0, len = this._midiTrack.length; ix < len; ix++) {
                    var ev = this._midiTrack[ix];
                    ticks += ev.deltaTime;
                    var of = (ticks / ticksPerBeat) % this._sequencer.resolution;
                    var st = ticks / ticksPerBeat - of;
                    this._clips.push({
                        event: ev,
                        step: st,
                        offset: ticks % (ticksPerBeat * this._sequencer.resolution)
                    });
                }
                return this;
            };
            MidiPattern.prototype.connect = /**
            * Sets the destination for this audio's output.
            * @param {AudioNode} destination Where to route this audio's output.
            * @return {Klang.Model.Audio} Self
            */
            function (destination) {
                this._output.connect(destination);
                return this;
            };
            MidiPattern.prototype.disconnect = /**
            * Removes all previous connections.
            * @return {Klang.Model.Audio} Self
            */
            function () {
                this._output.disconnect();
                return this;
            };
            MidiPattern.prototype.changeState = /**
            * Sets what state this pattern is in.
            * @param {number} state State to change to.
            */
            function (state) {
                this._state = state;
            };
            MidiPattern.prototype.prePlaySchedule = /**
            * Schedules this pattern to start playing at the specified step.
            * If this pattern includes any upbeats, the longest upbeat that fits in the remaining steps will be played.
            * @param {number} steps number of steps until starting the pattern.
            * @param {number} syncStep At what step to start playing the pattern.
            * @param {bool} restart Force start from the beginning if already playing.
            * @return {Klang.Model.MidiPattern}
            */
            function (steps, syncStep, restart) {
                if(!this._midiFile) {
                    this._midiFile = FileHandler.instance.getFile(this._midiFileId);
                    if(!this._midiFile) {
                        return;
                    }
                    this.setupFile();
                }
                restart = restart || false;
                // inget händer om det redan spelas
                if(this._state == PatternState.Playing) {
                    if(restart) {
                        this._syncStep = syncStep;
                        this.stop(steps, true);
                    } else {
                        return this;
                    }
                }
                this._syncStep = syncStep % this._length;
                this._currentStep = this._startStep;
                this.findNextClip(this._currentStep);
                if(steps > 0) {
                    this._stepCount = steps;
                    this._currentStep += this._syncStep;
                    this._syncStep = 0;
                    this._totalStep = 0;
                    this.changeState(PatternState.PrePlaying);
                    if(this._upbeats) {
                        this._activeUpbeat = -1;
                        // hitta den upptakt som passar bäst (den längsta som får plats i antalet steps)
                        for(var ix = 0, len = this._upbeats.length; ix < len; ix++) {
                            var upbeat = this._upbeats[ix];
                            if(upbeat.length <= steps) {
                                if(this._activeUpbeat == -1 || this._upbeats[this._activeUpbeat].length < upbeat.length) {
                                    this._activeUpbeat = ix;
                                }
                            }
                        }
                        if(this._activeUpbeat != -1 && this._upbeats[this._activeUpbeat].playInLoop) {
                            this._upbeatLoopOffset = this._upbeats[this._activeUpbeat].length;
                        }
                    }
                    //  hitta vilket clip att börja på
                    this.findNextClip(this._activeUpbeat == -1 ? this._currentStep : this._upbeats[this._activeUpbeat].step);
                } else {
                    this.changeState(PatternState.Playing);
                }
                return this;
            };
            MidiPattern.prototype.play = /**
            * Schedules this pattern to start playing.
            * @param {number} when When in web audio context time to start playing.
            * @return {Klang.Model.MidiPattern} Self
            */
            function (when) {
                if(!this._midiFile) {
                    this._midiFile = FileHandler.instance.getFile(this._midiFileId);
                    if(!this._midiFile) {
                        return;
                    }
                    this.setupFile();
                }
                // inget händer om det redan spelas
                if(this._state == PatternState.Playing) {
                    return this;
                }
                // Schemalägg volym om en tidpunkt anges
                if(when && when != 0) {
                    var targetVol = this._output.gain.value;
                    this._output.gain.setValueAtTime(0, 0);
                    this._output.gain.setValueAtTime(targetVol, when);
                }
                this._currentStep = (this._sequencer.currentStep % this._length) + this._startStep// Synka denna patterns step mot sequencerns step
                ;
                this.changeState(PatternState.Playing);
                this.findNextClip(this._currentStep);
                // Starta sequencern om den inte är igång
                if(!this._sequencer.started) {
                    this._sequencer.start();
                }
                return this;
            };
            MidiPattern.prototype.restart = /**
            * Resets the pattern so that it will restart from the beginning.
            * @return {Klang.Model.MidiPattern} Self
            */
            function () {
                this._currentStep = this._startStep;
                this._nextClip = 0;
                return this;
            };
            MidiPattern.prototype.stop = /**
            * Stops playing this pattern.
            * @param {number} when When to stop playing.
            * @param {boolean} beat Whether to stop on a beat or at a specific time.
            * @return {Klang.Model.MidiPattern} Self
            */
            function (when, beat) {
                if(this._synth.deschedule && this._sequencer._scheduleAheadTime > 0.5) {
                    this._synth.deschedule();
                }
                // utan argument stoppas det direkt, eller om det redan är stoppat
                if(when == undefined || this._state == PatternState.Stopped) {
                    this.changeState(PatternState.Stopped);
                    return this;
                }
                // Om man inte anger beat är true default, eftersom det är vanligast
                if(beat == undefined) {
                    beat = true;
                }
                // börja stega ned tills pattern ska sluta spela
                if(beat) {
                    this._stepCount = this._sequencer.getStepsToNext(this._sequencer.beatLength * when);
                    this.changeState(PatternState.PreStopping);
                } else {
                    this.changeState(PatternState.Stopped);
                    if(this._synth !== "progression" && this._synth._loopedSamples) {
                        this._synth.stop(when);
                    }
                }
                return this;
            };
            MidiPattern.prototype.pause = /**
            * Pauses playback.
            * @return {Klang.Model.Audio} Self
            */
            function () {
                return this;
            };
            MidiPattern.prototype.unpause = /**
            * Resumes playback.
            * @return {Klang.Model.Audio} Self
            */
            function () {
                return this;
            };
            MidiPattern.prototype.sendMidiEvents = /**
            * Sends midi events to the synth that is specified for this midi pattern.
            * @param {number} step What step to send midi events for.
            * @param {number} scheduleTime Time when the event should be triggered.
            * @param {boolean} bypassNoteOn Whether to skip handling noteOn events or not.
            * @private
            */
            function (step, scheduleTime, bypassNoteOn) {
                var startClip = this._nextClip;
                while(this._clips[this._nextClip].step == step) {
                    var nextClip = this._clips[this._nextClip];
                    if(!this._progression) {
                        //transpose
                        var transpose = 0;
                        if(nextClip.event.noteNumber) {
                            if(this._scale) {
                                var orgNote = nextClip.event.noteNumber;
                                var scaleStep = (orgNote % 12) - this._root;
                                if(scaleStep < 0) {
                                    scaleStep += 12;
                                }
                                transpose = this._scales[this._scale][scaleStep];
                            }
                            if(this._transpose != 0) {
                                transpose += this._transpose;
                            }
                        }
                        if(!(bypassNoteOn && nextClip.event.subtype === "noteOn")) {
                            this._synth.handleMidiEvent(nextClip.event, scheduleTime + nextClip.offset * this._secPerTick, transpose);
                        }
                    } else {
                        // if progression
                        // saves current notes in _currentChord array.
                        if(nextClip.event.subtype === "noteOn") {
                            this._currentChord.push(nextClip.event.noteNumber);
                        } else if(nextClip.event.subtype === "noteOff") {
                            var id = this._currentChord.indexOf(nextClip.event.noteNumber);
                            if(id > -1) {
                                this._currentChord.splice(id, 1);
                            }
                        }
                    }
                    this._nextClip++;
                    if(this._nextClip == this._clips.length) {
                        this._nextClip = 0;
                    }
                    if(this._nextClip === startClip) {
                        break;
                    }
                }
                if(this._progression && this._currentChord.length) {
                    this._currentChord.sort(function (a, b) {
                        return a - b;
                    });
                    var chordRootMidiNote = this._currentChord[0];// root note in chord = lowest note
                    
                    var root = chordRootMidiNote % 12;
                    var transpose = 0;
                    // if chord root is not the same as pattern root
                    if(root != this._root) {
                        // transpose = chord root midi note number - pattern root midi note number.
                        transpose = chordRootMidiNote - this._rootNote;
                    }
                    var scale = [
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0, 
                        0
                    ];
                    var chordNormalized = [];
                    // loop through scale. Normailzed chord based on 0 = chord root.
                    for(var j = 0; j < this._currentChord.length; j++) {
                        var n = (this._currentChord[j] % 12) - root;
                        if(n < 0) {
                            n += 12;
                        }
                        chordNormalized.push(n);
                    }
                    chordNormalized.sort(function (a, b) {
                        return a - b;
                    });
                    // if note exists in chord adds 0 else finds closest note in chord and adds the diff to that note.
                    for(var i = 0; i < scale.length; i++) {
                        var closest = this.getClosestValues(chordNormalized, i);
                        if(closest !== undefined) {
                            scale[i] = closest - i;
                        }
                    }
                    // sets scale and transpose to all MidiPatterns in sequencer
                    this._sequencer.customScale = scale;
                    this._sequencer.transpose = transpose;
                    this._rootNote = chordRootMidiNote;
                }
            };
            MidiPattern.prototype.getClosestValues = /**
            * Returns the item closest to an index from an array.
            * @param {Array} a Array to search.
            * @param {number} x Index to search for.
            * @private
            */
            function (a, x) {
                var lo = -1, hi = a.length;
                while(hi - lo > 1) {
                    var mid = Math.round((lo + hi) / 2);
                    if(a[mid] <= x) {
                        lo = mid;
                    } else {
                        hi = mid;
                    }
                }
                var closest;
                if(a[lo] == x) {
                    closest = hi = lo;
                }
                if(Math.abs(x - hi) > Math.abs(x - lo)) {
                    closest = lo;
                } else if(Math.abs(x - hi) < Math.abs(x - lo)) {
                    closest = hi;
                } else {
                    closest = lo;
                }
                return a[closest];
            };
            MidiPattern.prototype.findNextClip = // Hittar det clip som ska spelas tidigast utifrån ett visst steg
            /**
            * Finds the index of the closest clip following a certain step.
            * Also sets the next clip to be the found index.
            * @private
            * @param {number} step What step to search from.
            * @return Index of the clip that was found.
            */
            function (step) {
                for(var ix = 0, len = this._clips.length; ix < len; ix++) {
                    if(this._clips[ix].step >= step) {
                        this._nextClip = ix;
                        return ix;
                        break;
                    }
                }
            };
            MidiPattern.prototype.playStep = /**
            * Handles events at a certain step.
            * @private
            * @param {number} currentStep Step to handle.
            * @param {number} scheduleTime Time to schedule events at this step.
            */
            function (currentStep, scheduleTime) {
                var playThisStep = true;
                if(this._currentStep >= this._length + this._startStep) {
                    // Vi måste gå igenom de clip som ligger precis på slutet innan vi går tillbaka till början
                    this.sendMidiEvents(this._length, scheduleTime, true);
                    this._currentStep = this._startStep;
                    // kolla vilket som ska vara nästa clip igen
                    this.findNextClip(this._currentStep);
                    // Sluta lyssna om den inte ska loopa
                    if(!this._loop) {
                        this.changeState(PatternState.Stopped);
                        playThisStep = false;
                    }
                }
                if(playThisStep) {
                    this.sendMidiEvents(this._currentStep, scheduleTime, false);
                }
                this._totalStep += this._beatSubscription;
                this._currentStep += this._beatSubscription;
            };
            MidiPattern.prototype.update = /**
            * Handles updates from the sequencer.
            * @param {number} currentStep Step to handle.
            * @param {number} scheduleTime Time to schedule events at this step.
            * @return {Klang.Model.MidiPattern}
            */
            function (currentStep, scheduleTime) {
                // Räkna fram och köa upp endast om denna pattern lyssnar
                if(this._state != PatternState.Stopped && currentStep % this._beatSubscription == 0) {
                    // den här if-satsen är ganska ful, kollar om nån upptakt finns och isf om den ska spelas i loopen
                    if(this._upbeats && this._activeUpbeat != -1 && this._upbeats[this._activeUpbeat].playInLoop && this._state == PatternState.Playing) {
                        if(this._currentStep >= this._length + this._startStep - this._upbeatLoopOffset) {
                            if(this._upbeatLoopOffset > 0) {
                                this._stepCount = this._upbeatLoopOffset;
                                this.changeState(PatternState.PrePlaying);
                            }
                            this.sendMidiEvents(this._currentStep, scheduleTime, true);
                            this._currentStep = this._startStep;
                            this.findNextClip(this._upbeats[this._activeUpbeat].step);
                        }
                    }
                    switch(this._state) {
                        case PatternState.PrePlaying: {
                            if(this._activeUpbeat != -1) {
                                var upbeat = this._upbeats[this._activeUpbeat];
                                var currentUpbeatStep = upbeat.length - this._stepCount;
                                // Skicka inte events om nuvarande preplayStep är innan upptakten har börjat
                                if(currentUpbeatStep >= 0) {
                                    this.sendMidiEvents(upbeat.step + currentUpbeatStep, scheduleTime, false);
                                }
                            }
                            this._stepCount -= this._beatSubscription;
                            if(this._stepCount <= 0) {
                                if(this._activeUpbeat != -1 && upbeat.targetStep) {
                                    this._currentStep = upbeat.targetStep;
                                }
                                this.findNextClip(this._currentStep);
                                this.changeState(PatternState.Playing);
                            }
                            break;
                        }
                        case PatternState.Playing: {
                            this.playStep(currentStep, scheduleTime);
                            break;
                        }
                        case PatternState.PreStopping: {
                            this._stepCount -= this._beatSubscription;
                            if(this._stepCount <= 0) {
                                this.stop(scheduleTime, false);
                            } else {
                                this.playStep(currentStep, scheduleTime);
                            }
                            break;
                        }
                        case PatternState.PostStop: {
                            // inte implementerat
                            break;
                        }
                    }
                }
                return this;
            };
            MidiPattern.prototype.recalculateBPM = /**
            * Calculates the length of a quarter note according to the tick data of the midi file.
            * @param {number} bpm
            */
            function (bpm) {
                // Räkna ut tid att vänta för varje 'tick'
                var ticksPerBeat = this._midiFile.header.ticksPerBeat;// Ticks per fjärdedelsnot
                
                var microsecPerQuarterNote = 60000000 / bpm;// Mikrosekunder per fjärdeldelsnot
                
                var secPerQuarterNote = microsecPerQuarterNote / 1000000;// Sekunder per fjärdedelvsnot
                
                this._secPerTick = secPerQuarterNote / ticksPerBeat// Sekunder per tick
                ;
            };
            MidiPattern.prototype.getNextBar = /**
            *   Calculates next bar based on beat modifier.
            *   @param {number} x Beat modifier = bar length to count with.
            *   @return Next bar
            */
            function (x) {
                var nextBar = Math.ceil(this._currentStep / x);
                if(this._currentStep > this._length - x) {
                    nextBar = 0;
                }
                return nextBar;
            };
            MidiPattern.prototype.fadeInAndPlay = /**
            * Starts playing the audio and fades it's volume from 0 to 1.
            * @param {number} duration Time in seconds to reach full volume.
            * @param {number} when When in web audio context time to start playing.
            * @return {Klang.Model.Audio} Self
            */
            function (duration, when) {
                this.play(when);
                this.output.gain.value = 0;
                Util.curveParamLin(this.output.gain, 1, duration, when);
                return this;
            };
            MidiPattern.prototype.fadeOutAndStop = /**
            * Starts fading out the volume of the audio and stops playback when the volume reaches 0.
            * @param {number} duration Time in seconds to reach zero volume
            * @param {number} [when] When in Web Audio Context time to start fading out.
            * @return {Klang.Model.Audio} Self
            */
            function (duration, when) {
                if(when == undefined) {
                    when = Klang.context.currentTime;
                }
                this.output.gain.cancelScheduledValues(when);
                Util.curveParamLin(this.output.gain, 0, duration, when);
                //resets to original volume
                Util.setParam(this.output.gain, this._volume, when + duration);
                this.stop(when + duration);
                return this;
            };
            MidiPattern.prototype.deschedule = /**
            * Deschedules everything that has been scheduled but has not started playing.
            * @return {Klang.Model.MidiPattern} Self
            */
            function (steps) {
                if(steps == undefined) {
                    steps = this._length;
                }
                if(this._synth.deschedule) {
                    this._synth.deschedule();
                }
                if(this._state != PatternState.Stopped) {
                    steps = steps % this._length;
                    this._currentStep = this._currentStep - steps// återställ nuvarande steg
                    ;
                    //this._stepCount += steps;
                    // om vi gick förbi startsteget går vi till slutet av patternet istället
                    if(this._currentStep < this._startStep) {
                        var stepDelta = this._startStep - this._currentStep;
                        this._currentStep = this._startStep + this._length - stepDelta;
                    }
                    // sätt rätt nextClip
                    for(var ix = 0, len = this._clips.length; ix < len; ix++) {
                        if(this._clips[ix].step >= this._currentStep) {
                            this._nextClip = ix;
                            break;
                        }
                    }
                    console.log(this._name, "current", this._currentStep - this._startStep);
                }
                return this;
            };
            MidiPattern.prototype.resetTranspose = /**
            * Resets transposition to it's original state.
            */
            function () {
                this._transpose = this._orgTranspose;
            };
            Object.defineProperty(MidiPattern.prototype, "length", {
                get: /**
                * The length of the pattern in steps.
                * @type {number}
                */
                function () {
                    return this._length;
                },
                set: function (length) {
                    this._length = length;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MidiPattern.prototype, "startStep", {
                set: /**
                * What step the pattern should start from.
                * @type {number}
                */
                function (step) {
                    //synten måste stoppas här. på rätt tid. i synk.
                    //Klang.log(this._sequencer.getNoteTime(this._sequencer.getStepsToNext(4)));
                    //this._synth.stop(context.currentTime+this._sequencer.getNoteTime(this._sequencer.getStepsToNext(4)));
                    this._startStep = step;
                    this._currentStep = (this._sequencer.currentStep % this._length) + this._startStep;
                    for(var ix = 0, len = this._clips.length; ix < len; ix++) {
                        if(this._clips[ix].step >= this._currentStep) {
                            this._nextClip = ix;
                            break;
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MidiPattern.prototype, "scale", {
                set: /**
                * The scale that midi data is transposed to.
                * @type {Array.<number>}
                */
                function (scale) {
                    if(!this._progression) {
                        if(scale === "reset") {
                            this._scale = this._orgScale;
                        } else {
                            this._scale = scale;
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MidiPattern.prototype, "customScale", {
                set: /**
                * A custom scale to use.
                * @type {Array.<number>}
                */
                function (obj) {
                    if(!this._progression) {
                        this._scales["custom"] = obj;
                        this._scale = "custom";
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MidiPattern.prototype, "transpose", {
                get: function () {
                    return this._transpose;
                },
                set: /**
                * Transposition of midi notes.
                * @type {number}
                */
                function (transpose) {
                    this._transpose = transpose;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MidiPattern.prototype, "loop", {
                get: /**
                * Whether this pattern loops or not.
                * @type {bool}
                */
                function () {
                    return this._loop;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MidiPattern.prototype, "state", {
                get: /**
                * Playing state
                * @type {number}
                */
                function () {
                    return this._state;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MidiPattern.prototype, "playing", {
                get: /**
                * Whether or not this pattern is playing.
                * @type {boolean}
                */
                function () {
                    var _playing = false;
                    if(this._state === 1 || this._state === 1) {
                        _playing = true;
                    }
                    return _playing;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(MidiPattern.prototype, "duration", {
                get: /**
                * The length of the audio in seconds.
                * @type {number}
                */
                function () {
                    return this._length * this._sequencer.getNoteTime(1);
                },
                enumerable: true,
                configurable: true
            });
            return MidiPattern;
        })(Audio);
        Model.MidiPattern = MidiPattern;        
        (function (PatternState) {
            PatternState._map = [];
            PatternState._map[0] = "PrePlaying";
            PatternState.PrePlaying = 0;// innan mainloopen börjar, ev upptakt spelas
            
            PatternState._map[1] = "Playing";
            PatternState.Playing = 1;// mainloopen
            
            PatternState._map[2] = "PreStopping";
            PatternState.PreStopping = 2;// räknar ned tills mainloopen ska sluta
            
            PatternState._map[3] = "PostStop";
            PatternState.PostStop = 3;// fortsättar att spela tills fade ut är klar
            
            PatternState._map[4] = "Stopped";
            PatternState.Stopped = 4;// inget spelas
            
        })(Model.PatternState || (Model.PatternState = {}));
        var PatternState = Model.PatternState;
        /**
        * A sequence of audio objects to be played back synced with to a sequencer.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        * @extends {Klang.Model.Audio}
        */
        var Pattern = (function (_super) {
            __extends(Pattern, _super);
            function Pattern(data, name) {
                        _super.call(this, data, name);
                this._startStep = 0;
                this._totalStep = 0;
                this._currentStep = 0;
                this._syncStep = 0;
                this._stepCount = 0;
                this._fadeTime = 0;
                this._length = 2;
                this._loop = true;
                this._tail = false;
                this._forceFade = false;
                this._activeUpbeat = -1;
                this._startOffset = 0;
                this._state = PatternState.Stopped;
                this._beatSubscription = data.beat_subscription || 0.25;
                this._length = data.length || 0;
                this._startStep = data.start_step || 0;
                this._loop = data.loop != undefined ? data.loop : true;
                this._tail = data.tail != undefined ? data.tail : false;
                this._clips = [];
                this._upbeats = [];
                this._sequencerName = data.sequencer;
                this._initData = {
                    dummyClips: data.content,
                    dummyUpbeats: data.upbeats
                };
                Core.instance.pushToPreLoadInitStack(this);
            }
            Pattern.prototype.init = /**
            * Fills the content array according to the names specified in the config for this pattern.
            * @memberof Klang.Model.Pattern
            * @method init
            * @instance
            */
            function () {
                // Hitta instanser för alla ljud i clippen
                if(this._initData.dummyClips) {
                    for(var ix = 0, len = this._initData.dummyClips.length; ix < len; ix++) {
                        var dummy = this._initData.dummyClips[ix];
                        // Hitta rätt ljud om ett ljud ska spelas upp
                        if(dummy.audio) {
                            this._clips.push({
                                audio: Core.instance.findInstance(dummy.audio),
                                process: null,
                                args: null,
                                step: dummy.step
                            });
                        } else// Hitta processen om en process ska köras
                         {
                            this._clips.push({
                                audio: null,
                                process: Core.instance.findInstance(dummy.process),
                                args: dummy.args,
                                step: dummy.step
                            });
                        }
                    }
                }
                // Hitta instanser för alla ljud i upbeats
                if(this._initData.dummyUpbeats) {
                    for(var ix = 0, ilen = this._initData.dummyUpbeats.length; ix < ilen; ix++) {
                        var dummyUpbeat = this._initData.dummyUpbeats[ix];
                        var upbeatClips = [];
                        for(var jx = 0, jlen = dummyUpbeat.content.length; jx < jlen; jx++) {
                            var dummyClip = dummyUpbeat.content[jx];
                            // Copy-pasta från första initieringen....
                            if(dummyClip.audio) {
                                upbeatClips.push({
                                    audio: Core.instance.findInstance(dummyClip.audio),
                                    process: null,
                                    args: null,
                                    step: dummyClip.step
                                });
                            } else// Hitta processen om en process ska köras
                             {
                                upbeatClips.push({
                                    audio: null,
                                    process: Core.instance.findInstance(dummyClip.process),
                                    args: dummyClip.args,
                                    step: dummyClip.step
                                });
                            }
                        }
                        dummyUpbeat.clips = upbeatClips;
                        this._upbeats.push({
                            length: dummyUpbeat.length,
                            clips: upbeatClips
                        });
                    }
                    // Sortera upptakterna så att den längsta ligger först
                    this._upbeats.sort(function (a, b) {
                        return b.length - a.length;
                    });
                }
                // Hämta sequencern
                this._sequencer = Core.instance.findInstance(this._sequencerName);
                this._sequencer.registerPattern(this);
                this._initData = null;
            };
            Pattern.prototype.connect = /**
            * Sets the destination for this audio's output.
            * @param {AudioNode} destination Where to route this audio's output.
            * @return {Klang.Model.Audio} Self
            */
            function (destination) {
                for(var ix = 0, len = this._clips.length; ix < len; ix++) {
                    var a = this._clips[ix].audio;
                    // Kopplar in audioSourcen bara om den är kopplad till mastern
                    if(a && (!a.destinationName || Core.instance.findInstance(a.destinationName).destinationName == "$OUT")) {
                        a.disconnect();
                        a.connect(this._output);
                    }
                }
                this._output.connect(destination);
                return this;
            };
            Pattern.prototype.disconnect = /**
            * Removes all previous connections.
            * @return {Klang.Model.Audio} Self
            */
            function () {
                this._output.disconnect();
                return this;
            };
            Pattern.prototype.changeState = /**
            * Sets what state this pattern is in.
            * @param {number} state State to change to.
            */
            function (state) {
                //console.log(this._name, "change from", getPatternStateString(this._state), "to", getPatternStateString(state), "step", this._currentStep);
                this._state = state;
            };
            Pattern.prototype.prePlaySchedule = /**
            * Schedules this pattern to start playing at the specified step.
            * If this pattern includes any upbeats, the longest upbeat that fits in the remaining steps will be played.
            * @param {number} steps number of steps until starting the pattern.
            * @param {number} syncStep At what step to start playing the pattern.
            * @param {boolean} restart Force start from the beginning if already playing.
            * @param {boolean} fadeIn Whether to fade in the pattern.
            * @param {number} duration
            * @return {Klang.Model.Pattern}
            */
            function (steps, syncStep, restart, fadeIn, duration, offset) {
                restart = restart || false;
                var t = Klang.context.currentTime;
                //var t = this._sequencer.getBeatTime(steps);
                // Övergå till att fortsätta om vi håller på att avsluta
                if(this._state == PatternState.PreStopping || this._state == PatternState.PostStop) {
                    this._output.gain.cancelScheduledValues(t);
                    this._output.gain.setValueAtTime(this._output.gain.value, t);
                    this._output.gain.linearRampToValueAtTime(this._volume, t + 0.5);
                    this.changeState(PatternState.Playing);
                    clearTimeout(this._stoppingId);
                    return this;
                } else if(this._output.gain.value != this._volume || PatternState.Stopped) {
                    var v;
                    if(this._state === PatternState.Stopped && fadeIn) {
                        v = 0;
                    } else {
                        v = this._output.gain.value;
                    }
                    this._output.gain.cancelScheduledValues(t);
                    this._output.gain.setValueAtTime(v, t);
                    this._output.gain.linearRampToValueAtTime(this._volume, t + duration);
                } else if(fadeIn) {
                    var playTime = this._sequencer.getBeatTime(steps);
                    this._output.gain.cancelScheduledValues(playTime);
                    this._output.gain.setValueAtTime(0, playTime);
                    this._output.gain.linearRampToValueAtTime(this._volume, playTime + duration);
                }
                // inget händer om det redan spelas
                if(this._state == PatternState.Playing || this._state == PatternState.PrePlaying) {
                    if(restart) {
                        this._syncStep = syncStep;
                        this.stop(steps, true, 0);
                    } else {
                        return this;
                    }
                }
                // hoppa in i filen om offset
                if(offset != undefined) {
                    this._startOffset = offset;
                }
                this._syncStep = (syncStep % this._length) + this._startStep;
                if(steps > 0 || restart) {
                    this._stepCount = steps;
                    this._currentStep = this._startStep;
                    this._totalStep = 0;
                    this._activeUpbeat = -1;
                    for(var ix = 0, len = this._upbeats.length; ix < len; ix++) {
                        var upbeat = this._upbeats[ix];
                        if(upbeat.length <= steps) {
                            if(this._activeUpbeat == -1 || this._upbeats[this._activeUpbeat].length < upbeat.length) {
                                this._activeUpbeat = ix;
                            }
                        }
                    }
                    this.changeState(PatternState.PrePlaying);
                } else {
                    this.changeState(PatternState.Playing);
                }
                return this;
            };
            Pattern.prototype.play = /**
            * Schedules this pattern to start playing.
            * @param {number} when When in web audio context time to start playing.
            * @return {Klang.Model.Audio} Self
            */
            function (when) {
                // inget händer om det redan spelas
                if(this._state == PatternState.Playing || this._state == PatternState.PrePlaying) {
                    return this;
                } else if(this._state == PatternState.PreStopping || this._state == PatternState.PostStop) {
                    clearTimeout(this._stoppingId);
                }
                // Schemalägg volym om en tidpunkt anges
                /*if (when && when != 0) {
                var targetVol = this._output.gain.value;
                this._output.gain.setValueAtTime(0, 0);
                this._output.gain.setValueAtTime(targetVol, when);
                }*/
                this._currentStep = (this._sequencer.currentStep % this._length) + this._startStep// Synka denna patterns step mot sequencerns step
                ;
                this.changeState(PatternState.Playing);
                // Starta sequencern om den inte är igång
                if(!this._sequencer.started) {
                    this._sequencer.start();
                }
                return this;
            };
            Pattern.prototype.stop = /**
            * Stops playing this pattern.
            * @param {number} when When to stop playing.
            * @param {boolean} beat Whether to stop on a beat or at a specific time.
            * @param {number} fadeTime Over how long to fade out.
            * @param {number} wait Number of steps to wait before stopping.
            * @return {Klang.Model.MidiPattern} Self
            */
            function (when, beat, fadeTime, wait) {
                // Stoppa endast om den spelar
                if(this._state == PatternState.Stopped) {
                    return this;
                } else if(this._state === PatternState.PrePlaying) {
                    // Stoppar direkt om den inte börjat spela än.
                    // OBS Kan bli problem med upptakter eftersom dom ju spelar i PrePlaying läge och då kommer stoppas direkt.
                    this.changeState(PatternState.Stopped);
                    return;
                }
                // utan argument stoppas det direkt
                if(when == undefined) {
                    this.changeState(PatternState.Stopped);
                    this._currentStep = 0;
                    return this;
                }
                // Om man inte anger beat är true default, eftersom det är vanligast.
                if(beat == undefined) {
                    beat = true;
                }
                // börja stega ned tills pattern ska sluta spela
                if(beat) {
                    this._stepCount = this._sequencer.getStepsToNext(this._sequencer.beatLength * when) || 0;
                    this._fadeTime = fadeTime;
                    this.changeState(PatternState.PreStopping);
                    if(wait > 0) {
                        this._stepCount += wait;
                    }
                } else// fortsätt spela tills den fadat ut helt och hållet
                 {
                    if(fadeTime) {
                        var fadeBeats = fadeTime / this._sequencer.getNoteTime(1);// antal beats att fada ut över
                        
                        this._stepCount = Math.ceil(fadeBeats);
                        this.changeState(PatternState.PostStop);
                        var t = Klang.context.currentTime;//context.currentTime;
                        
                        //console.log(this._name, "volume", this._output.gain.value, "start fade", "t", t, "done", (t-context.currentTime+fadeTime)/0.001);
                        this._output.gain.cancelScheduledValues(t);
                        this._output.gain.setValueAtTime(this._output.gain.value, t);
                        this._output.gain.linearRampToValueAtTime(0.0, t + fadeTime);
                        var _this = this;
                        this._stoppingId = setTimeout(function () {
                            //console.log(_this._name, "fade done", context.currentTime, this._clips);
                            for(var i = 0; i < _this._clips.length; i++) {
                                if(_this._clips[i].audio) {
                                    _this._clips[i].audio.stop(0);
                                }
                            }
                        }, (t - Klang.context.currentTime + fadeTime) / 0.001);
                    } else {
                        this.changeState(PatternState.Stopped);
                        this._currentStep = 0;
                    }
                }
                return this;
            };
            Pattern.prototype.pause = /**
            * Pauses playback.
            * @return {Klang.Model.Audio} Self
            */
            function () {
                for(var ix = 0, len = this._clips.length; ix < len; ix++) {
                    if(this._clips[ix].audio) {
                        this._clips[ix].audio.pause();
                    }
                }
                return this;
            };
            Pattern.prototype.unpause = /**
            * Resumes playback.
            * @return {Klang.Model.Audio} Self
            */
            function () {
                for(var ix = 0, len = this._clips.length; ix < len; ix++) {
                    if(this._clips[ix].audio) {
                        this._clips[ix].audio.unpause();
                    }
                }
                return this;
            };
            Pattern.prototype.playStep = /**
            * Handles events at a certain step.
            * @private
            * @param {number} currentStep Step to handle.
            * @param {number} scheduleTime Time to schedule events at this step.
            */
            function (currentStep, scheduleTime) {
                if(this._currentStep >= this._length + this._startStep) {
                    if(this._loop) {
                        this._currentStep = this._startStep;
                    } else if(!this._loop) {
                        // Sluta lyssna om den inte ska loopa
                        this.changeState(PatternState.Stopped);
                    }
                }
                // Hitta på ett sätt att inte loopa igenom alla clips varje gång??
                for(var ix = 0, len = this._clips.length; ix < len; ix++) {
                    if(this._clips[ix].step == this._currentStep) {
                        var clip = this._clips[ix];
                        // spela ljud
                        if(clip.audio) {
                            clip.audio.play(scheduleTime, this._startOffset);
                        } else// kör process
                         {
                            clip.process.start(clip.args);
                        }
                    }
                }
                this._totalStep += this._beatSubscription;
                this._currentStep += this._beatSubscription;
            };
            Pattern.prototype.update = /**
            * Handles updates from the sequencer.
            * @param {number} currentStep Step to handle.
            * @param {number} scheduleTime Time to schedule events at this step.
            * @return {Klang.Model.Pattern}
            */
            function (currentStep, scheduleTime) {
                // Räkna fram och köa upp endast om denna pattern lyssnar
                if(this._state != PatternState.Stopped && currentStep % this._beatSubscription == 0) {
                    //console.log("pattern:", this._name, "state", this._state, "this._stepCount", this._stepCount);
                    switch(this._state) {
                        case PatternState.PrePlaying: {
                            if(this._activeUpbeat != -1) {
                                var upbeat = this._upbeats[this._activeUpbeat];
                                for(var ix = 0, len = upbeat.clips.length; ix < len; ix++) {
                                    var clip = upbeat.clips[ix];
                                    if(clip.step == upbeat.length - this._stepCount) {
                                        // spela ljud
                                        if(clip.audio) {
                                            clip.audio.play(scheduleTime);
                                        } else// kör process
                                         {
                                            clip.process.start(clip.args);
                                        }
                                    }
                                }
                            }
                            this._stepCount -= this._beatSubscription;
                            if(this._stepCount <= 0) {
                                this._currentStep = this._startStep + this._syncStep % this._length;
                                this._syncStep = 0;
                                this.changeState(PatternState.Playing);
                            }
                            break;
                        }
                        case PatternState.Playing: {
                            // När vi nått slutet av denna pattern
                            this.playStep(currentStep, scheduleTime);
                            break;
                        }
                        case PatternState.PreStopping: {
                            this._stepCount -= this._beatSubscription;
                            if(this._stepCount <= 0) {
                                if(!this._tail || this._forceFade) {
                                    this.stop(scheduleTime, false, this._fadeTime);
                                } else {
                                    this.changeState(PatternState.Stopped);
                                    // Resets _currentStep so pattern starts from beginning next time it's played.
                                    this._currentStep = 0;
                                }
                            } else {
                                this.playStep(currentStep, scheduleTime);
                            }
                            break;
                        }
                        case PatternState.PostStop: {
                            // Den här (playStep) borde inte köras om patternet inte spelar, alltså stoppas innan det har börjat spela.
                            this.playStep(currentStep, scheduleTime);
                            this._stepCount -= this._beatSubscription;
                            if(this._stepCount <= 0) {
                                this._forceFade = false;
                                this.changeState(PatternState.Stopped);
                                // Resets _currentStep so pattern starts from beginning next time it's played.
                                this._currentStep = 0;
                            }
                            break;
                        }
                    }
                }
                return this;
            };
            Pattern.prototype.deschedule = /**
            * Deschedules everything that has been scheduled but has not started playing.
            * @return {Klang.Model.Pattern} Self
            */
            function (steps) {
                if(steps == undefined) {
                    steps = this._length;
                }
                if(this._state != PatternState.Stopped) {
                    steps = steps % this._length;
                    for(var ix = 0, len = this._clips.length; ix < len; ix++) {
                        var clip = this._clips[ix];
                        if(clip.audio) {
                            clip.audio.deschedule();
                        }
                    }
                    clearTimeout(this._stoppingId);
                    this._output.gain.cancelScheduledValues(Util.now());
                    this._currentStep = this._currentStep - steps// återställ nuvarande steg
                    ;
                    // om vi gick förbi startsteget går vi till slutet av patternet istället
                    if(this._currentStep < this._startStep) {
                        var stepDelta = this._startStep - this._currentStep;
                        this._currentStep = this._startStep + this._length - stepDelta;
                    }
                }
                return this;
            };
            Pattern.prototype.fadeInAndPlay = /**
            * Starts playing the audio and fades it's volume from 0 to 1.
            * @param {number} duration Time in seconds to reach full volume.
            * @param {number} when When in web audio context time to start playing.
            * @return {Klang.Model.Audio} Self
            */
            function (duration, when) {
                return this;
            };
            Pattern.prototype.fadeOutAndStop = /**
            * Starts fading out the volume of the audio and stops playback when the volume reaches 0.
            * @param {number} duration Time in seconds to reach zero volume
            * @param {number} [when] When in Web Audio Context time to start fading out.
            * @return {Klang.Model.Audio} Self
            */
            function (duration, when) {
                when = when || Util.now();
                this.stop(when, false, duration);
                return this;
            };
            Pattern.prototype.curvePlaybackRate = /**
            *   Exponentially changes the playbackrate.
            *   @param {number} value PlaybackRate to change to.
            *   @param {number} duration Duration in seconds for the curve change.
            *   @return {Klang.Model.Audio} Self
            */
            function (value, duration) {
                for(var i = 0, l = this._clips.length; i < l; i++) {
                    this._clips[i].audio.curvePlaybackRate(value, duration);
                }
                return this;
            };
            Pattern.prototype.getNextBar = /**
            *   Calculates next bar based on beat modifier.
            *   @param {number} x Beat modifier = bar length to count with.
            *   @return Next bar
            */
            function (x) {
                var nextBar = Math.ceil(this._currentStep / x);
                if(this._currentStep > this._length - x) {
                    nextBar = 0;
                }
                return nextBar;
            };
            Object.defineProperty(Pattern.prototype, "forceFade", {
                set: /**
                * GETTERS / SETTERS
                *********************/
                /**
                *   Whether to force fade when stopped.
                *   If all patterns should fade when stopped, overrides _tail = true;
                *   @type {boolean} value
                */
                function (value) {
                    this._forceFade = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Pattern.prototype, "playbackRate", {
                set: /**
                * The playback speed of the buffer where 2 means double speed.
                * @member {number}
                */
                function (value) {
                    for(var ix = 0, len = this._clips.length; ix < len; ix++) {
                        this._clips[ix].audio.playbackRate = value;
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Pattern.prototype, "length", {
                get: /**
                * The length of the pattern in steps.
                * @type {number}
                */
                function () {
                    return this._length;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Pattern.prototype, "loop", {
                get: /**
                * Whether this pattern loops or not.
                * @type {bool}
                */
                function () {
                    return this._loop;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Pattern.prototype, "state", {
                get: /**
                * Playing state
                * @type {number}
                */
                function () {
                    return this._state;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Pattern.prototype, "playing", {
                get: /**
                * Whether or not this pattern is playing.
                * @type {boolean}
                */
                function () {
                    var _playing = false;
                    if(this._state === 1 || this._state === 1) {
                        _playing = true;
                    }
                    return _playing;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Pattern.prototype, "duration", {
                get: /**
                * The length of the audio in seconds.
                * @type {number}
                */
                function () {
                    return this._length * this._sequencer.getNoteTime(1);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Pattern.prototype, "playbackState", {
                get: /**
                * The state of the playback of this AudioSource. Valid states:
                * 0: not started
                * 1: scheduled
                * 2: playing
                * 3: stopped
                * @type {number}
                */
                function () {
                    return 0;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Pattern.prototype, "currentStep", {
                get: function () {
                    return this._currentStep;
                },
                enumerable: true,
                configurable: true
            });
            return Pattern;
        })(Audio);
        Model.Pattern = Pattern;        
        /*
        * Source: src/model/audio/effects/Effect.ts
        */
        /**
        * Superclass for all effects. Contains one input and one output node.
        * @param {Object} data Configuration data.
        * @constructor
        */
        var Effect = (function () {
            function Effect(data) {
                this.active = true;
                this._type = data.type;
                this._input = Klang.context.createGain != undefined ? Klang.context.createGain() : Klang.context.createGainNode();
                this._output = Klang.context.createGain != undefined ? Klang.context.createGain() : Klang.context.createGainNode();
                if(data.active === false) {
                    this.active = false;
                }
            }
            Effect.prototype.connect = /**
            * Connects the output of the effect to an Audio Node.
            * @param {AudioNode} destination Where to route the audio.
            */
            function (destination) {
                this._output.connect(destination);
                return this;
            };
            Effect.prototype.disconnect = /**
            * Disconnects the effect.
            */
            function () {
                this._output.disconnect();
                return this;
            };
            Effect.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                return this;
            };
            Object.defineProperty(Effect.prototype, "input", {
                get: /***
                * GETTERS / SETTERS
                *********************/
                /**
                * The effect's input node. Connect an Audio Node to this node have it's output be affected by the effect.
                * @type {GainNode}
                */
                function () {
                    return this._input;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Effect.prototype, "output", {
                get: /**
                * The effect's output.
                * @type {GainNode}
                */
                function () {
                    return this._output;
                },
                enumerable: true,
                configurable: true
            });
            Effect.prototype.destroy = function () {
                this.disconnect();
                this._output = null;
                this._input.disconnect();
                this._input = null;
            };
            return Effect;
        })();
        Model.Effect = Effect;        
        /*
        * Source: src/model/audio/effects/EffectSend.ts
        */
        /**
        * Sends audio signal to a bus.
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var EffectSend = (function (_super) {
            __extends(EffectSend, _super);
            function EffectSend(data) {
                        _super.call(this, data);
                this._wet = Klang.context.createGain();
                this._wet.gain.value = data.wet;
                this._input.connect(this._wet);
                this._input.connect(this._output);
                this.destinationName = data.destination_name;
                Core.instance.pushToPreLoadInitStack(this);
            }
            EffectSend.prototype.init = /**
            * Finds the bus to send to.
            */
            function () {
                var destination = Core.instance.findInstance(this.destinationName);
                if(destination) {
                    this._wet.connect(destination.input);
                }
            };
            EffectSend.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._wet);
                    this._input.connect(this._output);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            Object.defineProperty(EffectSend.prototype, "wet", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * Wet amount
                * @type {AudioParam}
                */
                function () {
                    return this._wet.gain;
                },
                enumerable: true,
                configurable: true
            });
            return EffectSend;
        })(Effect);
        Model.EffectSend = EffectSend;        
        /*
        * Source: src/model/audio/effects/Equalizer.ts
        */
        /**
        * Eigth band EQ
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var Equalizer = (function (_super) {
            __extends(Equalizer, _super);
            function Equalizer(data) {
                        _super.call(this, data);
                this._filters = [];
                if(Klang.browser == "Firefox") {
                    this._input.connect(this._output);
                    return;
                }
                if(data.bands.length == 0) {
                    this._input.connect(this.output);
                } else {
                    for(var ix = 0, len = data.bands.length; ix < len; ix++) {
                        var band = data.bands[ix];
                        var filter = Klang.context.createBiquadFilter();
                        if(band.filter_type) {
                            filter.type = Util.safeFilterType(band.filter_type);
                        }
                        if(band.frequency) {
                            filter.frequency.value = band.frequency;
                        }
                        if(band.gain) {
                            filter.gain.value = band.gain;
                        }
                        if(band.Q) {
                            filter.Q.value = band.Q;
                        }
                        if(ix == 0) {
                            this._input.connect(filter);
                        } else {
                            this._filters[ix - 1].connect(filter);
                        }
                        this._filters.push(filter);
                    }
                    this._filters[this._filters.length - 1].connect(this._output);
                }
            }
            Equalizer.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    if(this._filters.length == 0) {
                        this._input.connect(this._output);
                    } else {
                        this._input.connect(this._filters[0]);
                    }
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            Object.defineProperty(Equalizer.prototype, "filters", {
                get: /**
                * Active filters.
                * @type {Array}
                */
                function () {
                    return this._filters;
                },
                enumerable: true,
                configurable: true
            });
            return Equalizer;
        })(Effect);
        Model.Equalizer = Equalizer;        
        /*
        * Source: src/model/audio/effects/BiquadFilter.ts
        */
        /**
        * Implementation of the Web Audio API Biquad Filter.
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var BiquadFilter = (function (_super) {
            __extends(BiquadFilter, _super);
            function BiquadFilter(data) {
                        _super.call(this, data);
                this._filter = Klang.context.createBiquadFilter();
                this._filter.type = Util.safeFilterType(data.filter_type);
                this._input.connect(this._filter);
                this._filter.connect(this._output);
                this._filter.frequency.value = data.frequency != undefined ? data.frequency : 1000;
                this._filter.Q.value = data.Q != undefined ? data.Q : 1;
                this._filter.gain.value = data.gain != undefined ? data.gain : 0;
            }
            BiquadFilter.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._filter);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            Object.defineProperty(BiquadFilter.prototype, "frequency", {
                get: /***
                * GETTERS / SETTERS
                *********************/
                /**
                * Filter frequency
                * @type {AudioParam}
                */
                function () {
                    return this._filter.frequency;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BiquadFilter.prototype, "Q", {
                get: /**
                * Filter Q
                * @type {AudioParam}
                */
                function () {
                    return this._filter.Q;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(BiquadFilter.prototype, "gain", {
                get: /**
                * Filter gain
                * @type {AudioParam}
                */
                function () {
                    return this._filter.gain;
                },
                enumerable: true,
                configurable: true
            });
            return BiquadFilter;
        })(Effect);
        Model.BiquadFilter = BiquadFilter;        
        /*
        * Source: src/model/audio/effects/Bitcrusher.ts
        */
        /**
        * Bitcrusher and sample rate reducer.
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var Bitcrusher = (function (_super) {
            __extends(Bitcrusher, _super);
            function Bitcrusher(data) {
                        _super.call(this, data);
                this._pro = Klang.context.createScriptProcessor(data.buffer_size || 4096, 2, 2);
                var _this = this;
                this._pro.onaudioprocess = function (e) {
                    var inp = e.inputBuffer, out = e.outputBuffer, iL = inp.getChannelData(0), iR = inp.getChannelData(1), oL = out.getChannelData(0), oR = out.getChannelData(1), step = Math.pow(0.5, _this._bits), len = inp.length, sample = 0, lastL = 0, lastR = 0, i = 0;
                    for(; i < len; ++i) {
                        if((sample += _this._reduction) >= 1) {
                            sample--;
                            lastL = step * Math.floor(iL[i] / step);
                            lastR = step * Math.floor(iR[i] / step);
                        }
                        oL[i] = lastL;
                        oR[i] = lastR;
                    }
                };
                this._bits = data.bits || 4;
                this._reduction = data.reduction || 0.2;
                this._input.connect(this._pro);
                this._pro.connect(this._output);
            }
            Bitcrusher.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._pro);
                    this._input.connect(this._output);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            Object.defineProperty(Bitcrusher.prototype, "bits", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * Bits
                * @type {AudioParam}
                */
                function () {
                    return this._bits;
                },
                set: function (value) {
                    this._bits = value;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Bitcrusher.prototype, "reduction", {
                get: /**
                * Sample rate reduction.
                * @type {AudioParam}
                */
                function () {
                    return this._reduction;
                },
                set: function (value) {
                    this._reduction = value;
                },
                enumerable: true,
                configurable: true
            });
            return Bitcrusher;
        })(Effect);
        Model.Bitcrusher = Bitcrusher;        
        /*
        * Source: src/model/audio/effects/Compressor.ts
        */
        /**
        * Compressor effect that can be connected to a bus.
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var Compressor = (function (_super) {
            __extends(Compressor, _super);
            // för att dölja kompressionen när den används till sidechain
            function Compressor(data) {
                        _super.call(this, data);
                this._bypass = data.bypass;
                if(Klang.isMobile) {
                    this._input.connect(this._output);
                    return;
                }
                this._dynamicsCompressor = Klang.context.createDynamicsCompressor();
                this._makeUpGain = Klang.context.createGain();
                this._input.connect(this._dynamicsCompressor);
                this._dynamicsCompressor.connect(this._makeUpGain);
                this._makeUpGain.connect(this._output);
                if(this._bypass) {
                    this._input.connect(this._output);
                    this._makeUpGain.gain.value = 0;
                }
                this._dynamicsCompressor.threshold.value = data.threshold || this._dynamicsCompressor.threshold.value;
                this._dynamicsCompressor.knee.value = data.knee || this._dynamicsCompressor.knee.value;
                this._dynamicsCompressor.ratio.value = data.ratio || this._dynamicsCompressor.ratio.value;
                this._dynamicsCompressor.attack.value = data.attack || this._dynamicsCompressor.attack.value;
                this._dynamicsCompressor.release.value = data.release || this._dynamicsCompressor.release.value;
                this._makeUpGain.gain.value = data.make_up_gain || this._makeUpGain.gain.value;
            }
            Compressor.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._dynamicsCompressor);
                    if(this._bypass) {
                        this._input.connect(this._output);
                    }
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            Object.defineProperty(Compressor.prototype, "threshold", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * Threshold
                * @type {AudioParam}
                */
                function () {
                    return this._dynamicsCompressor.threshold;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Compressor.prototype, "knee", {
                get: /**
                * Knee
                * @type {AudioParam}
                */
                function () {
                    return this._dynamicsCompressor.knee;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Compressor.prototype, "ratio", {
                get: /**
                * Ratio
                * @type {AudioParam}
                */
                function () {
                    return this._dynamicsCompressor.ratio;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Compressor.prototype, "attack", {
                get: /**
                * Attack
                * @type {AudioParam}
                */
                function () {
                    return this._dynamicsCompressor.attack;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Compressor.prototype, "release", {
                get: /**
                * Release
                * @type {AudioParam}
                */
                function () {
                    return this._dynamicsCompressor.release;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Compressor.prototype, "reduction", {
                get: /**
                * Reduction in db
                * @type {AudioParam}
                */
                function () {
                    return this._dynamicsCompressor.reduction;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Compressor.prototype, "makeUpGain", {
                get: /**
                * Make up gain
                * @type {AudioParam}
                */
                function () {
                    return this._makeUpGain.gain;
                },
                enumerable: true,
                configurable: true
            });
            return Compressor;
        })(Effect);
        Model.Compressor = Compressor;        
        /*
        * Source: src/model/audio/effects/Convolver.ts
        */
        /**
        * Convolver effect that can be connected to a bus or send
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var Convolver = (function (_super) {
            __extends(Convolver, _super);
            function Convolver(data) {
                        _super.call(this, data);
                if(Klang.isMobile) {
                    this._input.connect(this._output);
                    return;
                }
                this._soundName = data.sound;
                this._convolver = Klang.context.createConvolver();
                this._input.connect(this._convolver);
                this._convolver.connect(this._output);
                Core.instance.pushToPostLoadInitStack(this);
            }
            Convolver.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._convolver);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            Convolver.prototype.init = /**
            * Grabs the audio buffer for the plate.
            */
            function () {
                var soundInstance = Core.instance.findInstance(this._soundName);
                this._convolver.buffer = soundInstance.buffer;
            };
            return Convolver;
        })(Effect);
        Model.Convolver = Convolver;        
        /*
        * Source: src/model/audio/effects/Delay.ts
        */
        // Olika typer av delays
        /**
        * Base class for all delay effects, handles syncing to a sequencer.
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var DelayBase = (function (_super) {
            __extends(DelayBase, _super);
            function DelayBase(data) {
                        _super.call(this, data);
                this._sync = data.sync// namn på en sequencer. Om man lägger till sync i json så är delay_time uplösningen av synkningen där 1 = 1 fjärdedel, 0.5 = åttondel osv
                ;
            }
            DelayBase.prototype.init = /**
            * Inits syncing to sequencer.
            */
            function () {
                if(this._sync) {
                    var seq = Core.instance.findInstance(this._sync);
                    this.updateSync(seq.bpm);
                    seq.registerBPMSync(this);
                }
            };
            DelayBase.prototype.updateSync = /**
            * Updates the BPM.
            * @param {number} bpm New BPM.
            */
            function (bpm) {
                return this;
            };
            Object.defineProperty(DelayBase.prototype, "sync", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * The name of the sequencer that this delay effect is synced to or undefined if it is not synced.
                * @type {string}
                */
                function () {
                    return this._sync;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DelayBase.prototype, "syncResolution", {
                get: /**
                * What resolution to sync to.
                * @type {number}
                */
                function () {
                    return this._syncResolution;
                },
                set: function (value) {
                    this._syncResolution = value;
                },
                enumerable: true,
                configurable: true
            });
            return DelayBase;
        })(Effect);
        Model.DelayBase = DelayBase;        
        /**
        * Simple delay effect.
        * input -> filter -> delay -> output
        *                 -> feedback -> filter
        *
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.DelayBase}
        */
        var Delay = (function (_super) {
            __extends(Delay, _super);
            function Delay(data) {
                        _super.call(this, data);
                this._feedback = Klang.context.createGain();
                this._delay = Klang.context.createDelay();
                if(data.filter) {
                    this._filter = Klang.context.createBiquadFilter();
                    this._input.connect(this._filter);
                    this._filter.connect(this._delay);
                    this._filter.type = Util.safeFilterType(data.filter.filter_type);
                    this._filter.frequency.value = data.filter.frequency || 1000;
                    this._filter.Q.value = data.filter.Q || 4.0;
                    this._filter.gain.value = data.filter.gain || 1.0;
                } else {
                    this._input.connect(this._delay);
                }
                this._delay.connect(this._feedback);
                this._delay.connect(this._output);
                this._feedback.connect(this._delay);
                if(this.sync) {
                    Core.instance.pushToPreLoadInitStack(this);
                    this.syncResolution = data.delay_time || 1;
                } else {
                    this._delay.delayTime.value = data.delay_time || 0.125;
                }
                this._feedback.gain.value = data.feedback || 0.3;
                this._output.gain.value = data.output_vol || data.wet || 1.0;
            }
            Delay.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._delay);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            Delay.prototype.updateSync = /**
            * Updates the BPM.
            * @param {number} bpm New BPM.
            */
            function (bpm) {
                this._delay.delayTime.value = (60 / bpm) * this.syncResolution;
                return this;
            };
            Object.defineProperty(Delay.prototype, "delayTime", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * Delay time in seconds.
                * @type {AudioParam}
                */
                function () {
                    return this._delay.delayTime;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Delay.prototype, "feedback", {
                get: /**
                * Feedback amount
                * @type {AudioParam}
                */
                function () {
                    return this._feedback.gain;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Delay.prototype, "filter", {
                get: /**
                * Filter
                * @type {BiquadFilterNode}
                */
                function () {
                    return this._filter;
                },
                enumerable: true,
                configurable: true
            });
            return Delay;
        })(DelayBase);
        Model.Delay = Delay;        
        /**
        * Ping pong delay
        * input -> filter -> leftDelay -> output
        *                              -> rightDelay -> output
        *                                            -> feedback -> filter
        *
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var PingPongDelay = (function (_super) {
            __extends(PingPongDelay, _super);
            function PingPongDelay(data) {
                        _super.call(this, data);
                if(Klang.browser == "Firefox") {
                    this._input.connect(this._output);
                    return;
                }
                this._splitter = Klang.context.createChannelSplitter(2);
                this._merger = Klang.context.createChannelMerger(2);
                this._mono = Klang.context.createGain();
                this._leftDelay = Klang.context.createDelay();
                this._rightDelay = Klang.context.createDelay();
                this._feedback = Klang.context.createGain();
                if(data.filter) {
                    this._filter = Klang.context.createBiquadFilter();
                    this._mono.connect(this._filter);
                    this._filter.connect(this._leftDelay);
                    this._feedback.connect(this._filter);
                    this._filter.type = Util.safeFilterType(data.filter.filter_type);
                    this._filter.frequency.value = data.filter.frequency || 1000;
                    this._filter.Q.value = data.filter.Q || 4.0;
                    this._filter.gain.value = data.filter.gain || 1.0;
                } else {
                    this._mono.connect(this._leftDelay);
                    this._feedback.connect(this._leftDelay);
                }
                this._input.connect(this._splitter);
                this._splitter.connect(this._mono, 0, 0);
                this._splitter.connect(this._mono, 1, 0);
                this._leftDelay.connect(this._rightDelay);
                this._rightDelay.connect(this._feedback);
                this._leftDelay.connect(this._merger, 0, 0);
                this._rightDelay.connect(this._merger, 0, 1);
                this._merger.connect(this._output);
                if(this.sync) {
                    Core.instance.pushToPreLoadInitStack(this);
                    this.syncResolution = data.delay_time || 1;
                } else {
                    this._leftDelay.delayTime.value = data.delay_time || 0.125;
                    this._rightDelay.delayTime.value = this._leftDelay.delayTime.value;
                }
                this._feedback.gain.value = data.feedback || 0.3;
                this._output.gain.value = data.output_vol || data.wet || 1.0;
            }
            PingPongDelay.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._splitter);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            PingPongDelay.prototype.updateSync = /**
            * Updates the BPM.
            * @param {number} bpm New BPM.
            */
            function (bpm) {
                this._leftDelay.delayTime.value = (60 / bpm) * this.syncResolution;
                this._rightDelay.delayTime.value = this._leftDelay.delayTime.value;
                return this;
            };
            Object.defineProperty(PingPongDelay.prototype, "delay_time", {
                set: /**
                * GETTERS / SETTERS
                *********************/
                function (val) {
                    this._leftDelay.delayTime.value = val;
                    this._rightDelay.delayTime.value = val;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PingPongDelay.prototype, "feedback", {
                get: /**
                * Feedback amount
                * @type {AudioParam}
                */
                function () {
                    return this._feedback.gain;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(PingPongDelay.prototype, "filter", {
                get: /**
                * Filter
                * @type {BiquadFilterNode}
                */
                function () {
                    return this._filter;
                },
                enumerable: true,
                configurable: true
            });
            return PingPongDelay;
        })(DelayBase);
        Model.PingPongDelay = PingPongDelay;        
        /**
        * Includes to separate delays for the left and right channel.
        * input -> leftFilter  -> leftDelay  -> output
        *                                    -> leftFeedback  -> leftFilter
        *       -> rightFilter -> rightDelay -> output
        *                                    -> rightFeedback -> filter
        *
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var StereoDelay = (function (_super) {
            __extends(StereoDelay, _super);
            function StereoDelay(data) {
                        _super.call(this, data);
                if(this.sync) {
                    data.left.sync = this.sync;
                    data.right.sync = this.sync;
                }
                this._splitter = Klang.context.createChannelSplitter(2);
                this._merger = Klang.context.createChannelMerger(2);
                this._leftDelay = new Delay(data.left || {
                });
                this._rightDelay = new Delay(data.right || {
                });
                this._input.connect(this._splitter);
                this._splitter.connect(this._leftDelay.input, 0, 0);
                this._splitter.connect(this._rightDelay.input, 0, 0);
                this._splitter.connect(this._rightDelay.input, 1, 0);
                this._leftDelay.output.connect(this._merger, 0, 0);
                this._rightDelay.output.connect(this._merger, 0, 1);
                this._merger.connect(this._output);
            }
            StereoDelay.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._splitter);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            StereoDelay.prototype.updateSync = /**
            * Updates the BPM.
            * @param {number} bpm New BPM.
            */
            function (bpm) {
                this._leftDelay.updateSync(bpm);
                this._rightDelay.updateSync(bpm);
                return this;
            };
            Object.defineProperty(StereoDelay.prototype, "leftDelay", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * Left delay
                * @type {Klang.Model.Delay}
                */
                function () {
                    return this._leftDelay;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(StereoDelay.prototype, "rightDelay", {
                get: /**
                * Right delay
                * @type {Klang.Model.Delay}
                */
                function () {
                    return this._rightDelay;
                },
                enumerable: true,
                configurable: true
            });
            return StereoDelay;
        })(DelayBase);
        Model.StereoDelay = StereoDelay;        
        /*
        * Source: src/model/audio/effects/Limiter.ts
        */
        /**
        * Limiter effect that can be connected to a bus.
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var Limiter = (function (_super) {
            __extends(Limiter, _super);
            function Limiter(data) {
                        _super.call(this, data);
                this._compressor = Klang.context.createDynamicsCompressor();
                this._preGain = Klang.context.createGain();
                this._postGain = Klang.context.createGain();
                this._input.connect(this._preGain);
                this._preGain.connect(this._compressor);
                this._compressor.connect(this._postGain);
                this._postGain.connect(this._output);
                this._compressor.threshold.value = data.threshold || 0;
                this._compressor.knee.value = 0;
                this._compressor.ratio.value = 100;
                this._compressor.attack.value = 0;
                this._compressor.release.value = 0;
                this._preGain.gain.value = data.pre_gain == undefined ? 1 : data.pre_gain;
                this._postGain.gain.value = data.post_gain == undefined ? 1 : data.post_gain;
            }
            Limiter.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._preGain);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            Object.defineProperty(Limiter.prototype, "threshold", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * Threhsold
                * @type {AudioParam}
                */
                function () {
                    return this._compressor.threshold;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Limiter.prototype, "preGain", {
                get: /**
                * Gain before limiter.
                * @type {AudioParam}
                */
                function () {
                    return this._preGain.gain;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Limiter.prototype, "postGain", {
                get: /**
                * Gain after limiter
                * @type {AudioParam}
                */
                function () {
                    return this._postGain.gain;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Limiter.prototype, "reduction", {
                get: /**
                * Reduction in db
                * @member {AudioParam}
                */
                function () {
                    return this._compressor.reduction;
                },
                enumerable: true,
                configurable: true
            });
            return Limiter;
        })(Effect);
        Model.Limiter = Limiter;        
        /*
        * Source: src/model/audio/effects/Panner.ts
        */
        /**
        * Panner that can be connected to a bus or effect.
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var Panner = (function (_super) {
            __extends(Panner, _super);
            function Panner(data) {
                        _super.call(this, data);
                this._name = data.name;
                this._panner = Klang.context.createPanner();
                this._input.connect(this._panner);
                this._panner.connect(this._output);
                if(data.panning_model != undefined) {
                    this._panner.panningModel = data.panning_model;
                }
                if(data.distance_model != undefined) {
                    this._panner.distanceModel = data.distance_model;
                }
                if(data.ref_distance != undefined) {
                    this._panner.refDistance = data.ref_distance;
                }
                if(data.max_distance != undefined) {
                    this._panner.maxDistance = data.max_distance;
                }
                if(data.rolloff_factor != undefined) {
                    this._panner.rolloffFactor = data.rolloff_factor;
                }
                if(data.cone_inner_angle != undefined) {
                    this._panner.coneInnerAngle = data.cone_inner_angle;
                }
                if(data.cone_outer_angle != undefined) {
                    this._panner.coneOuterAngle = data.cone_outer_angle;
                }
                if(data.cone_outer_gain != undefined) {
                    this._panner.coneOuterGain = data.cone_outer_gain;
                }
                if(data.position != undefined) {
                    this._panner.setPosition(data.position[0], data.position[1], data.position[2]);
                }
                if(data.velocity != undefined) {
                    this._panner.setVelocity(data.position[0], data.position[1], data.position[2]);
                }
                if(data.orientation != undefined) {
                    this._panner.setOrientation(data.position[0], data.position[1], data.position[2]);
                }
                Panner.panners[this._name] = this;
            }
            Panner.panners = {
            };
            Panner._scale = 1;
            Panner.prototype.destroy = function () {
                this._panner.disconnect();
                this._output.disconnect();
                Effect.prototype.destroy.call(this);
            };
            Panner.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._panner);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            Panner.prototype.setPosition = /**
            * Sets panner position in relation to the AudioContextListener
            * @param {number} x x-pos.
            * @param {number} y y-pos.
            * @param {number} z z-pos.
            */
            function (x, y, z) {
                this._panner.setPosition(x * Panner.scale, y * Panner.scale, z * Panner.scale);
            };
            Panner.prototype.setOrientation = /**
            * Describes which direction the audio source is pointing in the 3D cartesian coordinate space.
            * @param {number} x x-pos.
            * @param {number} y y-pos.
            * @param {number} z z-pos.
            */
            function (x, y, z) {
                this._panner.setOrientation(x, y, z);
            };
            Panner.prototype.setVelocity = /**
            * Sets the velocity vector of the audio source.
            * @param {number} x x-pos.
            * @param {number} y y-pos.
            * @param {number} z z-pos.
            */
            function (x, y, z) {
                this._panner.setVelocity(x, y, z);
            };
            Object.defineProperty(Panner, "listener", {
                get: // STATISKA METODER
                /**
                * The position of the listener, this position is global and affects all 3D panners.
                * @param {number} x x-pos (optional).
                * @param {number} y y-pos (optional).
                * @param {number} z z-pos (optional).
                */
                function () {
                    return Klang.context.listener;
                },
                enumerable: true,
                configurable: true
            });
            Panner.setListenerPosition = function setListenerPosition(x, y, z) {
                Klang.context.listener.setPosition(x * Panner.scale, y * Panner.scale, z * Panner.scale);
            };
            Panner.setListenerOrientation = function setListenerOrientation(x, y, z, xUp, yUp, zUp) {
                Klang.context.listener.setOrientation(x, y, z, xUp, yUp, zUp);
            };
            Panner.setListenerVelocity = function setListenerVelocity(x, y, z) {
                Klang.context.listener.setVelocity(x, y, z);
            };
            Panner.setDopplerFactor = function setDopplerFactor(factor) {
                Klang.context.listener.dopplerFactor = factor;
            };
            Panner.setSpeedOfSound = function setSpeedOfSound(speed) {
                Klang.context.listener.speed = speed;
            };
            Panner.setListenerData = function setListenerData(data) {
                if(!data) {
                    return;
                }
                Panner.scale = data.scale;
                Panner.setListenerPosition(data.position[0], data.position[1], data.position[2]);
                Panner.setListenerOrientation(data.orientation[0], data.orientation[1], data.orientation[2], data.orientation_up[0], data.orientation_up[1], data.orientation_up[2]);
                Panner.setListenerVelocity(data.velocity[0], data.velocity[1], data.velocity[2]);
                Panner.setDopplerFactor(data.doppler_factor);
                Panner.setSpeedOfSound(data.speed_of_sound);
            };
            Panner.get = function get(name) {
                return Panner.panners[name];
            };
            Object.defineProperty(Panner, "scale", {
                get: function () {
                    return Panner._scale;
                },
                set: function (scale) {
                    Panner._scale = scale;
                },
                enumerable: true,
                configurable: true
            });
            return Panner;
        })(Effect);
        Model.Panner = Panner;        
        /*
        * Source: src/model/audio/effects/Sidechain.ts
        */
        /**
        * Sidechain effect
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var Sidechain = (function (_super) {
            __extends(Sidechain, _super);
            function Sidechain(data) {
                        _super.call(this, data);
                this._source = data.source;
                this._gain = Klang.context.createGain();
                this._processor = Klang.context.createScriptProcessor(data.buffer_size || 0);
                var _this = this;
                this._processor.onaudioprocess = function () {
                    var reduction = _this._source.reduction.value;
                    // för att det är onödigt att räkna pow för mycket
                    _this._gain.gain.value = reduction == 0 ? 1 : Math.pow(10, reduction / 20);
                };
                this._input.connect(this._gain);
                this._input.connect(this._processor);
                this._processor.connect(Klang.context.destination);
                this._gain.connect(this._output);
                Core.instance.pushToPreLoadInitStack(this);
            }
            Sidechain.prototype.init = /**
            * Finds the compressor effect that reduces gain
            */
            function () {
                var bus = Core.instance.findInstance(this._source.bus);
                this._source = bus._effects[this._source.index];
            };
            Sidechain.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._gain);
                    this._input.connect(this._processor);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            return Sidechain;
        })(Effect);
        Model.Sidechain = Sidechain;        
        /*
        * Source: src/model/audio/effects/StereoPanner.ts
        */
        /**
        * Panner that only pans between the left and right channels. Does NOT use a 3D panner.
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var StereoPanner = (function (_super) {
            __extends(StereoPanner, _super);
            function StereoPanner(data) {
                        _super.call(this, data);
                this._splitter = Klang.context.createChannelSplitter(2);
                this._merger = Klang.context.createChannelMerger(2);
                this._left = Klang.context.createGain();
                this._right = Klang.context.createGain();
                // Dela upp input i två kanaler med separata gains
                this._input.connect(this._splitter);
                /*this._splitter.connect(this._mono, 0, 0);
                this._splitter.connect(this._mono, 1, 0);
                this._mono.connect(this._left);
                this._mono.connect(this._right);*/
                this._splitter.connect(this._left, 0, 0);
                this._splitter.connect(this._right, 1, 0);
                // Koppla ihop de två kanalerna till output
                this._left.connect(this._merger, 0, 0);
                this._right.connect(this._merger, 0, 1);
                this._merger.connect(this._output);
                this.pan = data.pan;
            }
            StereoPanner.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._splitter);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            StereoPanner.prototype.getGainValue = function (value) {
                return (value + 1) / 2;
            };
            StereoPanner.prototype.setPanTo = /**
            * Instantly sets panning at a given time.
            * @param {float} value A value between 0 and 1 where 0 represents all the way left and 1 represents all the way right.
            * @param {float} when When in Web Audio Context time to set the value.
            */
            function (value, when) {
                var gainValue = this.getGainValue(value);
                this._left.gain.setValueAtTime(1 - gainValue, when || 0);
                this._right.gain.setValueAtTime(gainValue, when || 0);
                return this;
            };
            StereoPanner.prototype.linPanTo = /**
            * Pans linearily to a specific value over a perid of time.
            * @param {float} value Target panning value.
            * @param {float} duration Time in seconds to reach the target value.
            * @param {float} when When in Web Audio Context time to start changing the value.
            */
            function (value, duration, when) {
                when = when || Klang.context.currentTime;
                var gainValue = this.getGainValue(value);
                this._left.gain.setValueAtTime(this._left.gain.value, when);
                this._left.gain.linearRampToValueAtTime(1 - gainValue, Klang.context.currentTime + duration);
                this._right.gain.setValueAtTime(this._right.gain.value, when);
                this._right.gain.linearRampToValueAtTime(gainValue, Klang.context.currentTime + duration);
                return this;
            };
            StereoPanner.prototype.expPanTo = /**
            * Pans exponentially to a specific value over a perid of time.
            * @param {float} value Target panning value.
            * @param {float} duration Time in seconds to reach the target value.
            * @param {float} when When in Web Audio Context time to start changing the value.
            */
            function (value, duration, when) {
                when = when || Klang.context.currentTime;
                var gainValue = this.getGainValue(value);
                this._left.gain.setValueAtTime(this._left.gain.value == 0 ? Util.EXP_MIN_VALUE : this._left.gain.value, when);
                this._left.gain.exponentialRampToValueAtTime(1 - gainValue, Klang.context.currentTime + duration);
                this._right.gain.setValueAtTime(this._right.gain.value == 0 ? Util.EXP_MIN_VALUE : this._right.gain.value, when);
                this._right.gain.exponentialRampToValueAtTime(gainValue, Klang.context.currentTime + duration);
                return this;
            };
            Object.defineProperty(StereoPanner.prototype, "pan", {
                get: /***
                * GETTERS / SETTERS
                *********************/
                /**
                * Current panning value, a floating point number between -1 and 1
                * where -1 represents all the way left, 1 represents all the way right and 0 is center.
                * @member {number}
                */
                function () {
                    return this._right.gain.value;
                },
                set: function (value) {
                    var gainValue = this.getGainValue(value);
                    this._left.gain.value = 1 - gainValue;
                    this._right.gain.value = gainValue;
                },
                enumerable: true,
                configurable: true
            });
            return StereoPanner;
        })(Effect);
        Model.StereoPanner = StereoPanner;        
        /*
        * Source: src/model/audio/effects/Tremolo.ts
        */
        /**
        * Tremolo effect implemented by having an oscillator to modulate the output gain.
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var Tremolo = (function (_super) {
            __extends(Tremolo, _super);
            function Tremolo(data, startTime) {
                        _super.call(this, data);
                if(data.sync) {
                    this._sync = data.sync;
                    this._rate = data.rate || 0.25;
                }
                this._oscillator = Klang.context.createOscillator();
                this._amplitude = Klang.context.createGain();
                this._input.connect(this._output);
                this._oscillator.connect(this._amplitude);
                this._amplitude.connect(this._output.gain);
                this._oscillator.frequency.value = data.frequency || 10;
                this._oscillator.type = data.wave || 0// Sinusvåg
                ;
                this._amplitude.gain.value = data.amplitude || 1.0;
                this._oscillator.start(startTime);
                Core.instance.pushToPreLoadInitStack(this);
            }
            Tremolo.prototype.init = /**
            * Initializes syncing to sequencer.
            */
            function () {
                if(this._sync) {
                    var seq = Core.instance.findInstance(this._sync);
                    this.updateSync(seq.bpm);
                    seq.registerBPMSync(this);
                }
            };
            Tremolo.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                if(state) {
                    this._amplitude.connect(this._output.gain);
                } else {
                    this._amplitude.disconnect();
                }
                return this;
            };
            Tremolo.prototype.updateSync = /**
            * Updates the syncing from sequencer.
            * @param {number} bpm New BPM.
            */
            function (bpm) {
                this._oscillator.frequency.value = (bpm / 60) / this._rate;
                return this;
            };
            Object.defineProperty(Tremolo.prototype, "frequency", {
                get: /***
                * GETTERS / SETTERS
                *********************/
                /**
                * Tremolo rate
                * @type {AudioParam}
                */
                function () {
                    return this._oscillator.frequency;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Tremolo.prototype, "amplitude", {
                get: /**
                * Tremolo amplitude
                * @type {AudioParam}
                */
                function () {
                    return this._amplitude.gain;
                },
                enumerable: true,
                configurable: true
            });
            return Tremolo;
        })(Effect);
        Model.Tremolo = Tremolo;        
        /*
        * Source: src/model/audio/effects/Distortion.ts
        */
        /**
        * Distortion effect.
        * @param {Object} data Configuration data.
        * @constructor
        * @extends {Klang.Model.Effect}
        */
        var Distortion = (function (_super) {
            __extends(Distortion, _super);
            function Distortion(data) {
                        _super.call(this, data);
                this._samples = 8192;
                this._type = data.distortion_type || 0;
                this._amount = data.amount || 0.7;
                this._samples = 8192;
                this._waveshaper = Klang.context.createWaveShaper();
                this._inputDrive = Klang.context.createGain();
                this._outputDrive = Klang.context.createGain();
                this._input.connect(this._inputDrive);
                this._inputDrive.connect(this._waveshaper);
                this._waveshaper.connect(this._outputDrive);
                this._outputDrive.connect(this._output);
                this._ws_table = new Float32Array(this._samples);
                this.createWSCurve(this._type, 0.7);
            }
            Distortion.prototype.createWSCurve = //TODO: lägg till fler WaveShaper algoritmer.
            function (type, amount) {
                switch(type) {
                    case 0:
                        var amount = Math.min(amount, 0.9999);
                        var k = 2 * amount / (1 - amount), i, x;
                        for(i = 0; i < this._samples; i++) {
                            x = i * 2 / this._samples - 1;
                            this._ws_table[i] = (1 + k) * x / (1 + k * Math.abs(x));
                        }
                        break;
                    case 1:
                        var i, x, y;
                        for(i = 0; i < this._samples; i++) {
                            x = i * 2 / this._samples - 1;
                            y = ((0.5 * Math.pow((x + 1.4), 2)) - 1) * y >= 0 ? 5.8 : 1.2;
                            this._ws_table[i] = this.tanh(y);
                        }
                        break;
                    case 2:
                        var i, x, y, a = 1 - amount;
                        for(i = 0; i < this._samples; i++) {
                            x = i * 2 / this._samples - 1;
                            y = x < 0 ? -Math.pow(Math.abs(x), a + 0.04) : Math.pow(x, a);
                            this._ws_table[i] = this.tanh(y * 2);
                        }
                        break;
                    case 3:
                        var i, x, y, abx, a = 1 - amount > 0.99 ? 0.99 : 1 - amount;
                        for(i = 0; i < this._samples; i++) {
                            x = i * 2 / this._samples - 1;
                            abx = Math.abs(x);
                            if(abx < a) {
                                y = abx;
                            } else if(abx > a) {
                                y = a + (abx - a) / (1 + Math.pow((abx - a) / (1 - a), 2));
                            } else if(abx > 1) {
                                y = abx;
                            }
                            this._ws_table[i] = this.sign(x) * y * (1 / ((a + 1) / 2));
                        }
                        break;
                    case 4:
                        var i, x;
                        for(i = 0; i < this._samples; i++) {
                            x = i * 2 / this._samples - 1;
                            if(x < -0.08905) {
                                this._ws_table[i] = (-3 / 4) * (1 - (Math.pow((1 - (Math.abs(x) - 0.032857)), 12)) + (1 / 3) * (Math.abs(x) - 0.032847)) + 0.01;
                            } else if(x >= -0.08905 && x < 0.320018) {
                                this._ws_table[i] = (-6.153 * (x * x)) + 3.9375 * x;
                            } else {
                                this._ws_table[i] = 0.630035;
                            }
                        }
                        break;
                    case 5:
                        var a = 2 + Math.round(amount * 14), bits = // we go from 2 to 16 bits, keep in mind for the UI
                        Math.round(Math.pow(2, a - 1)), i, x;
                        // real number of quantization steps divided by 2
                        for(i = 0; i < this._samples; i++) {
                            x = i * 2 / this._samples - 1;
                            this._ws_table[i] = Math.round(x * bits) / bits;
                        }
                        break;
                }
                this._waveshaper.curve = this._ws_table;
            };
            Distortion.prototype.tanh = function (n) {
                return (Math.exp(n) - Math.exp(-n)) / (Math.exp(n) + Math.exp(-n));
            };
            Distortion.prototype.sign = function (x) {
                if(x === 0) {
                    return 1;
                } else {
                    return Math.abs(x) / x;
                }
            };
            Distortion.prototype.setActive = /**
            * Activates or deactives the effect. An inactive effet is bypassed.
            * @param {boolean} state
            */
            function (state) {
                this._input.disconnect();
                if(state) {
                    this._input.connect(this._inputDrive);
                } else {
                    this._input.connect(this._output);
                }
                return this;
            };
            Object.defineProperty(Distortion.prototype, "amount", {
                get: /***
                * GETTERS / SETTERS
                *********************/
                /**
                * Distortion amount
                * @type {number}
                */
                function () {
                    return this._amount;
                },
                set: function (val) {
                    this._amount = val;
                    this.createWSCurve(this._type, this._amount);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Distortion.prototype, "type", {
                get: /**
                * Distortion type
                * @type {number}
                */
                function () {
                    return this._type;
                },
                set: function (val) {
                    this._type = val;
                    this.createWSCurve(this._type, this._amount);
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Distortion.prototype, "drive", {
                get: function () {
                    return this._inputDrive.gain;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Distortion.prototype, "outputGain", {
                get: function () {
                    return this._outputDrive.gain;
                },
                enumerable: true,
                configurable: true
            });
            return Distortion;
        })(Effect);
        Model.Distortion = Distortion;        
        /*
        * Source: src/model/audio/synths/LFO.ts
        */
        /**
        * Modulates an audio param over time.
        * @param {Object} data Configuration data.
        * @param {number} startTime When to start the LFO
        * @constructor
        */
        var LFO = (function () {
            function LFO(data, startTime) {
                startTime = startTime || 0;
                this._targets = data.targets;
                this._sync = data.sync;
                this._rate = data.rate || 1;
                this._phaseVal = data.phase || 0;
                this._oscillator = Klang.context.createOscillator();
                this._oscillator.type = data.wave || 0;
                this._oscillator.frequency.value = this._rate;
                this._amplitude = Klang.context.createGain();
                this._amplitude.gain.value = data.amplitude || 1;
                this._phase = Klang.context.createDelay();
                this._phase.delayTime.value = this._phaseVal * (1 / this._oscillator.frequency.value);
                this._oscillator.connect(this._phase);
                this._phase.connect(this._amplitude);
                this._oscillator.start(startTime);
                Core.instance.pushToPreLoadInitStack(this);
            }
            LFO.prototype.init = /**
            * Initializes syncing
            */
            function () {
                if(this._sync) {
                    var seq = Core.instance.findInstance(this._sync);
                    this.updateSync(seq.bpm);
                    seq.registerBPMSync(this);
                }
                for(var ix = 0, len = this._targets.length; ix < len; ix++) {
                    var t = this._targets[ix];
                    var bus = Core.instance.findInstance(t.bus);
                    var effect = bus.effects[t.effect];
                    this._amplitude.connect(effect[t.param]);
                }
            };
            LFO.prototype.updateSync = /**
            * Updates sync from sequencer
            * @param {number} bpm New BPM
            */
            function (bpm) {
                this._oscillator.frequency.value = (bpm / 60) / this._rate;
                this._phase.delayTime.value = this._phaseVal * (1 / this._oscillator.frequency.value);
                return this;
            };
            return LFO;
        })();
        Model.LFO = LFO;        
        /**
        * Synth that maps midi events to playback.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        */
        var Synth = (function () {
            //specialare om man vill ha fixedVelocity på arpeggiot.
            function Synth(data, name) {
                this._arpCounter = 0;
                this._arpNoteLength = 0.5;
                this._arpPattern = [];
                this._arpPatternStep = 0;
                this._name = name;
                this._type = data.type;
                this._output = Klang.context.createGain();
                this._output.gain.value = data.volume || 1.0;
                // Spara destination och lägg på ihopkopplingskön om destination är definierad
                if(data.destination_name) {
                    this.destinationName = data.destination_name;
                    if(!Core.instance.initComplete) {
                        Core.instance.pushToConnectStack(this);
                    }
                }
                if(data.arp) {
                    this._arpMode = data.arp.arp_mode || 'off';
                    this._octaves = data.arp.octaves || 1;
                    this._sync = data.arp.sync;
                    this._arpPattern = data.arp.arp_pattern || [];
                } else {
                    this._arpMode = 'off';
                }
                this._activeVoices = [];
                this._arpVoices = [];
                this._beatSubscription = data.beat_subscription || 0.25;
                this.data = data;
            }
            Synth.prototype.connect = /**
            * Connects the synth's output to a Web Audio Node.
            * @param {AudioNode} destination Which node to route audio to.
            */
            function (destination) {
                this._output.connect(destination);
                return this;
            };
            Synth.prototype.disconnect = /**
            * Disconnects the synth from currently connected Web Audio node.
            */
            function () {
                this._output.disconnect();
                return this;
            };
            Synth.prototype.handleMidiEvent = /**
            * Handles a midi event.
            * @param {any} event Midi event to handle.
            * @param {number} when Time when the event should be handled, in Web Audio context time.
            */
            function (event, when, transpose, bypassArp) {
                return this;
            };
            Synth.prototype.stop = /**
            * Cancels playback of this synth immediately.
            */
            function () {
            };
            Synth.prototype.handleArpModes = function (midiEvent) {
                this._arpVoices = [];
                if(this._octaves > 1) {
                    var octaves = [];
                    for(var j = 0; j < this._octaves - 1; j++) {
                        for(var i = 0; i < this._activeVoices.length; i++) {
                            var e = this._activeVoices[i].midiEvent;
                            var note = e.noteNumber;
                            var ev = {
                                "type": "channel",
                                "subtype": e.subtype,
                                "noteNumber": note += 12 * (j + 1),
                                "velocity": e.velocity,
                                "deltaTime": e.deltaTime
                            };
                            octaves.push({
                                midiEvent: ev,
                                transpose: this._activeVoices[i].transpose
                            });
                        }
                    }
                    this._arpVoices = this._activeVoices.concat(octaves);
                } else {
                    this._arpVoices = this._activeVoices;
                }
                if(this._arpMode === 'up') {
                    this._arpVoices = this._arpVoices.sort(this.sortVoices);
                } else if(this._arpMode === 'down') {
                    this._arpVoices = this._arpVoices.sort(this.sortVoices);
                    this._arpVoices.reverse();
                } else if(this._arpMode === 'up-down') {
                    var up = this._arpVoices.slice(0);
                    up.sort(this.sortVoices);
                    var down = this._arpVoices.slice(0);
                    down.sort(this.sortVoices);
                    down.reverse();
                    this._arpVoices = up.concat(down);
                    if(this._arpVoices.length > 1) {
                        this._arpVoices.splice(this._arpVoices.length / 2, 1);
                        this._arpVoices.pop();
                    }
                } else if(this._arpMode === 'random') {
                    this._arpVoices = Util.shuffle(this._arpVoices);
                }
            };
            Synth.prototype.sortVoices = function (a, b) {
                if(a.midiEvent.noteNumber < b.midiEvent.noteNumber) {
                    return -1;
                }
                if(a.midiEvent.noteNumber > b.midiEvent.noteNumber) {
                    return 1;
                }
                return 0;
            };
            Synth.prototype.arpActive = function (active) {
                if(active) {
                    if(this._sync) {
                        var seq = Core.instance.findInstance(this._sync);
                        seq.registerSynth(this);
                        if(!seq._started) {
                            seq.start();
                        }
                    }
                } else {
                    this._arpMode = 'off';
                    if(this._sync) {
                        var seq = Core.instance.findInstance(this._sync);
                        seq.unregisterSynth(this);
                    }
                }
            };
            Synth.prototype.update = /**
            * Called from the sequencer that this synth listens to.
            * @param {currentStep} The sequencer's current step.
            * @param {scheduleTime} Web Audio API context time that corresponds to the current step.
            */
            function (currentStep, scheduleTime) {
                // Räkna fram och köa upp endast om denna synth lyssnar
                /**
                *   TODO: Sortera activeVoices / _arpModes
                *   oktaver
                *   note length
                */
                if(currentStep % this._beatSubscription == 0) {
                    this._arpPatternStep = (currentStep * 4) % this._arpPattern.length;
                    if(this._arpVoices.length === 0) {
                        return;
                    }
                    // OM man har ett arpPattern så spelas arpeggiot bara om true
                    if(this._arpPattern.length) {
                        if(!this._arpPattern[(currentStep * 4) % this._arpPattern.length]) {
                            return;
                        }
                    }
                    this._arpCounter++;
                    this._arpCounter = this._arpCounter % this._arpVoices.length;
                    if(this._arpCounter < this._arpVoices.length) {
                        var vel = this._fixedVelocities ? this._fixedVelocities[this._arpCounter] : this._arpVoices[this._arpCounter].midiEvent.velocity;
                        this._arpVoices[this._arpCounter].midiEvent.velocity = vel;
                        this.handleMidiEvent(this._arpVoices[this._arpCounter].midiEvent, scheduleTime, this._arpVoices[this._arpCounter].transpose, true);
                        var noteOff = {
                            "type": "channel",
                            "subtype": "noteOff",
                            "noteNumber": this._arpVoices[this._arpCounter].midiEvent.noteNumber,
                            "velocity": this._arpVoices[this._arpCounter].midiEvent.velocity,
                            "deltaTime": this._arpVoices[this._arpCounter].midiEvent.deltaTime
                        };
                        this.handleMidiEvent(noteOff, scheduleTime + this._arpNoteLength, this._arpVoices[this._arpCounter].transpose, true);
                    }
                }
            };
            Synth.prototype.deschedule = /**
            * Deschedules scheduled playback.
            */
            function () {
                return this;
            };
            Object.defineProperty(Synth.prototype, "arpCounter", {
                get: function () {
                    return this._arpCounter;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Synth.prototype, "arpLength", {
                get: function () {
                    return this._arpVoices.length;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Synth.prototype, "output", {
                get: /**
                * The audio's output.
                * @type {GainNode}
                */
                function () {
                    return this._output;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Synth.prototype, "arpPattern", {
                get: function () {
                    return this._arpPattern;
                },
                set: function (pattern) {
                    this._arpPattern = pattern;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Synth.prototype, "arpPatternStep", {
                get: function () {
                    return this._arpPatternStep;
                },
                enumerable: true,
                configurable: true
            });
            return Synth;
        })();
        Model.Synth = Synth;        
        /**
        * Fills an empty buffer with values using the specified algorithm
        * @param {number} frames Number of frames in the buffer.
        * @param {number} alg Algorithm to use to fill the buffer.
        * @return {AudioBuffer} The generated buffer
        */
        function generateNoiseBuffer(frames, alg) {
            //var source = context.createBufferSource();
            var sampleFrames = frames || 65536;
            var buffer = Klang.context.createBuffer(1, sampleFrames, Klang.context.sampleRate);
            var bufferData = buffer.getChannelData(0);
            if(!alg) {
                alg = 0;
            }
            for(var i = 0; i < sampleFrames; i++) {
                switch(alg) {
                    case 0:
                        bufferData[i] = Math.random() * 2 - 1;
                        break;
                    case 1:
                        bufferData[i] = Math.random();
                        break;
                    case 2:
                        bufferData[i] = Math.random() - 1;
                        break;
                    case 3:
                        bufferData[i] = i / sampleFrames;
                        break;
                    default:
                        break;
                }
            }
            /*source.buffer = buffer;
            source.loop = true;*/
            return buffer;
        }
        Model.generateNoiseBuffer = generateNoiseBuffer;
        /*
        * Source: src/model/audio/synths/Symple.ts
        */
        /**
        * One voice of a symepl oscillator
        * @param {Object} data Configuration data.
        * @param {number} voiceType Type of voice
        * @param {number} startTime When to start oscs
        * @param {AudioBuffer} noiseBuffer Noise buffer to use for noise type
        * @constructor
        * @extends {Klang.Model.Synth}
        */
        var SympleVoice = (function () {
            function SympleVoice() {
                throw 'Symple not up to date, fix if(safari)';
            }
            return SympleVoice;
        })();        
        // 	public voiceType: number;
        // 	public source: any;
        // 	public gain: GainNode;
        // 	public filter: BiquadFilterNode;
        // 	public filterStartFreq: number = -1;;
        // 	public filterTargetFreq: number;
        // 	public active: bool;
        // 	public activatedNote: number;
        // 	private _enabled: bool;
        // 	private _detune:number;
        // 	private _wave:number;
        // 	private _frames:number;
        // 	private _algorithm:number;
        // 	public _filterData:any;
        // 	private _envelope:GainNode;
        // 	public filterAmplitudeGainNode:GainNode;
        // 	private _noiseBuffer:AudioBuffer;
        // 	constructor(data: any, voiceType: number, filterData: any, startTime: number, noiseBuffer?: AudioBuffer) {
        // 		this.voiceType = voiceType;
        // 		this.active = false
        // 		this.activatedNote = -1
        // 		this._enabled = true;
        // 		this._detune = data.detune || 0;
        // 		this._wave = data.wave || 0;
        // 		this._frames = data.frames;
        // 		this._algorithm = data.algorithm;
        // 		if (noiseBuffer) {
        // 			this._noiseBuffer = noiseBuffer;
        // 		}
        // 		this.gain = context.createGain();
        //// 		this._filterData = filterData;
        // 		//this.gain.gain.setValueAtTime(0.0, 0.0);
        // 	}
        // 	/**
        //      * Handles note on event
        //      * @param {number} noteNumber Which note to turn on
        //      * @param {number} when When to turn on note
        //      * @param {Object} gainEG Gain envelope to use.
        //      * @param {Object} filterEG Filter envelope to use.
        //      * @param {Object} pitchEG Pitch envelopeto use
        //      * @param {number} transpose How much to tranpose midi note
        //      */
        // 	public noteOn(noteNumber: number, velocity:number, when: number, gainEG: any, filterEG: any, pitchEG: any, transpose: number): void {
        // 		if (!this.enabled) {
        // 			return;
        // 		}
        // 		// Oscillator
        // 		if (this._wave !== 4) {
        // 			this.source = context.createOscillator();
        // 			this.source.type = this._wave
        // 			this.source.detune.value = this._detune;
        // 		}
        // 		// Noise generator
        // 		else if (this._wave == 4) {
        // 			this.source  = context.createBufferSource();
        // 			this.source.buffer = this._noiseBuffer;
        //     		this.source.loop = true;
        // 			//this.source = generateNoiseBuffer(this._frames, this._algorithm);
        // 		}
        // 		this._envelope = context.createGain();
        // 		if (this._filterData) {
        // 			this.filter = context.createBiquadFilter();
        // 			this.filter.type = Util.safeFilterType(this._filterData.filter_type);
        // 		    this.filter.frequency.value = this._filterData.frequency == undefined ? Util.NYQUIST_FREQUENCY : this._filterData.frequency;
        // 		    if (this.filter.detune) this.filter.detune.value = this._filterData.detune || 0;	// detune finns inte i safari
        // 		    this.filter.Q.value = this._filterData.Q || this.filter.Q;
        // 		    this.filter.gain.value = this._filterData.gain || this.filter.gain;
        // 		    this.filterTargetFreq = this.filter.frequency.value;
        // 			this.source.connect(this.filter);
        // 			this.filter.connect(this._envelope);
        // 			this._envelope.connect(this.gain);
        // 		}
        // 		else {
        // 			this.source.connect(this._envelope);
        // 			this._envelope.connect(this.gain);
        // 		}
        // 		if (this.voiceType == 1) {
        // 			this.filterAmplitudeGainNode.connect(this.filter.frequency);
        // 		}
        // 		if (when < Util.now()) when = Util.now();
        // 		//Klang.log("note on", noteNumber, when);
        // 		this.active = true;
        // 		this.activatedNote = noteNumber;
        // 		// Bara för oscillator
        // 		if (this._wave !== 4) {
        // 			// FREQUENCY
        // 			var pitchTargetFreq = Util.midiNoteToFrequency(noteNumber + transpose);
        // 			if (pitchEG) {
        // 				var pitchStartFreq = -1;
        // 				if (pitchEG.contour > 0) {
        // 					pitchStartFreq = pitchTargetFreq * (1-pitchEG.contour);
        // 				}
        // 				else if (pitchEG.contour < 0) {
        // 					pitchStartFreq = (Util.NYQUIST_FREQUENCY-pitchTargetFreq) * (-pitchEG.contour) + pitchTargetFreq;
        // 				}
        // 				this.source.frequency.cancelScheduledValues(when);
        // 				if (pitchStartFreq != -1) {
        // 					this.source.frequency.setValueAtTime(pitchStartFreq, when);
        // 					if (safari) this.source.frequency.setTargetValueAtTime(pitchTargetFreq, when, pitchEG.decay);
        // 					else this.source.frequency.setTargetAtTime(pitchTargetFreq, when, pitchEG.decay);
        // 				}
        // 				// om contour är 0 sätts värdet direkt
        // 				else {
        // 					this.source.frequency.setValueAtTime(pitchTargetFreq, when);
        // 				}
        // 			}
        // 			else {
        // 				this.source.frequency.setValueAtTime(pitchTargetFreq, when);
        // 			}
        // 		}
        // 		// FILTER EG
        // 		if (filterEG) {
        // 			this.filterStartFreq = -1;
        // 			if (filterEG.contour < 0) {
        // 				this.filterStartFreq = this.filterTargetFreq * (1+filterEG.contour) + 1;	// +1 för att inte börja på 0 (exp ramp)
        // 			}
        // 			else if (filterEG.contour > 0) {
        // 				this.filterStartFreq = (Util.NYQUIST_FREQUENCY-this.filterTargetFreq) * filterEG.contour + this.filterTargetFreq;
        // 			}
        // 			if (this.filterStartFreq != -1) {
        // 				this.filter.frequency.cancelScheduledValues(when);
        // 				this.filter.frequency.setValueAtTime(this.filterStartFreq, when);
        // 				this.filter.frequency.exponentialRampToValueAtTime(this.filterTargetFreq, when + filterEG.attack);
        // 				if (safari) this.filter.frequency.setTargetValueAtTime(this.filterTargetFreq * filterEG.sustain, when + filterEG.attack, filterEG.decay);
        // 				else this.filter.frequency.setTargetAtTime(this.filterTargetFreq * filterEG.sustain, when + filterEG.attack, filterEG.decay);
        // 			}
        // 		}
        // 		// GAIN EG
        // 		var vol;//velocity/127;
        // 		if (gainEG.volumeCurve === "linear") {
        //             vol = velocity/128;
        //         }else if (gainEG.volumeCurve === "exponential") {
        //             vol = Math.abs(1-Math.exp(velocity/128));
        //         }else {
        //             vol = 1;
        //         }
        // 		if (gainEG) {
        // 			//this.gain.gain.cancelScheduledValues(when);
        // 			//this._envelope.gain.value = 0.0;
        // 			this._envelope.gain.setValueAtTime(0.0, when);
        // 			this._envelope.gain.linearRampToValueAtTime(vol, when + gainEG.attack);
        // 			if (safari) this._envelope.gain.setTargetValueAtTime(vol * gainEG.sustain, when + gainEG.attack, gainEG.decay);
        // 			else this._envelope.gain.setTargetAtTime(vol * gainEG.sustain, when + gainEG.attack, gainEG.decay);
        // 		}
        // 		else {
        // 			this._envelope.gain.setValueAtTime(vol, when);
        // 		}
        // 		this.source["startTime"] = when;
        // 		safari ? this.source.noteOn(when) : this.source.start(when);
        // 	}
        // 	/**
        //      * Handles note off event
        //      * @param {number} noteNumber Which note to turn off
        //      * @param {number} when When to turn off note
        //      * @param {Object} gainEG Gain envelope to use.
        //      * @param {Object} filterEG Filter envelope to use.
        //      */
        // 	public noteOff(noteNumber: number, when: number, gainEG: any, filterEG: any): void {
        // 		if (!this.enabled) {
        // 			return;
        // 		}
        // 		if (when < Util.now()) when = Util.now();
        // 		//Klang.log("note off", noteNumber, when);
        // 		this.active = false;
        // 		if (filterEG) {
        // 			if (this.filterStartFreq != -1) {
        // 				var currentFreq = this.filter.frequency.value;
        // 				this.filter.frequency.cancelScheduledValues(when);
        // 				this.filter.frequency.setValueAtTime(currentFreq, when);
        // 				if (safari) this.filter.frequency.setTargetValueAtTime(this.filterStartFreq, when, filterEG.release);
        // 				else this.filter.frequency.setTargetAtTime(this.filterStartFreq, when, filterEG.release);
        // 			}
        // 		}
        // 		/*
        // 			ändrade val till gainEG.sustain eftersom this.gain.gain.value var 0.
        // 			Om gain inte hunnit ner till sustain kan det kanske låta konstigt?
        // 		*/
        // 		//var val = this.gain.gain.value;
        // 		if (gainEG) {
        // 			//var val = gainEG.sustain
        // 			this._envelope.gain.cancelScheduledValues(when);
        // 			if (when != Util.now()) {
        // 				this._envelope.gain.setValueAtTime(gainEG.sustain, when);
        // 			}else {
        // 				this._envelope.gain.setValueAtTime(this._envelope.gain.value, when);
        // 			}
        // 			if (safari) this._envelope.gain.setTargetValueAtTime(0.0, when, gainEG.release);
        // 			else this._envelope.gain.setTargetAtTime(0.0, when, gainEG.release);
        // 		}
        // 		else {
        // 			this._envelope.gain.setValueAtTime(0.0, when);
        // 		}
        // 		this.source["offTime"] = when;
        // 		safari ? this.source.noteOff(when + gainEG.release *5) : this.source.stop(when + gainEG.release *5);
        // 	}
        // 	/**
        //      * Cancels playback of this synth immediately.
        //      */
        // 	public stop(): void {
        // 		this.filter.frequency.cancelScheduledValues(0);
        // 		this._envelope.gain.cancelScheduledValues(0);
        // 		this._envelope.gain.setValueAtTime(0, 0);
        // 		safari ? this.source.noteOff(0) : this.source.stop(0);
        // 		this.source.disconnect();
        // 		if (this.filter) {
        // 			this.filter.disconnect();
        // 		}
        // 		if (this._envelope) {
        // 			this._envelope.disconnect();
        // 		}
        // 	}
        // 	/**
        //      * Cancels playback softly (fades out)
        //      * @param {number} when When to stop
        //      * @param {Object} gainEG Envelope to use for fade
        //      * @param {Object} filterEG Envelope to use for filter
        //      */
        // 	public stopSoft(when: number, gainEG: any, filterEG: any): void {
        // 		this.active = false;
        // /*		if (this.filterStartFreq != -1) {
        // 			var currentFreq = this.filter.frequency.value;
        // 			this.filter.frequency.cancelScheduledValues(0);
        // 			if (safari) this.filter.frequency.setTargetValueAtTime(this.filterStartFreq, when, filterEG.release);
        // 			else this.filter.frequency.setTargetAtTime(this.filterStartFreq, when, filterEG.release);
        // 		}*/
        // 		this._envelope.gain.cancelScheduledValues(when);
        // 		if (safari) this._envelope.gain.setTargetValueAtTime(0.0, when, gainEG.release);
        // 		else this._envelope.gain.setTargetAtTime(0.0, when, gainEG.release);
        // 		var offTime = when + gainEG.release * 5;
        // 		safari ? this.source.noteOff(offTime) : this.source.stop(offTime);
        // 		var _this = this;
        // 		setTimeout(function() {
        // 			_this.source.disconnect();
        // 			if (_this.filter) {
        // 				_this.filter.disconnect();
        // 			}
        // 			if (_this._envelope) {
        // 				_this._envelope.disconnect();
        // 			}
        // 		}, (offTime-Util.now())*1000);
        // 	}
        // 	/**
        //      * Whether this osc is enabled or not
        //      * @type {boolean}
        //      */
        // 	public get enabled(): bool {
        // 		return this._enabled;
        // 	}
        //     public set enabled(state: bool) {
        //         this._enabled = state;
        //     }
        /**
        * One oscillator in Symple
        * @constructor
        * @param {Object} data Config data for osc
        * @param {Object} filterData Config data for filter
        * @param {number} startTime When to start osc
        */
        var SympleOsc = (function () {
            function SympleOsc() {
                throw 'Symple not up to date, fix if(safari)';
            }
            return SympleOsc;
        })();        
        // public voices: SympleVoice[];
        // public nextVoice: number;
        // public octave: number;
        // public output: GainNode;
        // private _enabled: bool;
        // public _data:any;
        // public _filterData:any;
        // public _poly:number;
        // public lfoPitchGainNode:GainNode;
        // public filterAmplitude:GainNode;
        // public _detune:number;
        // private _noiseBuffer:AudioBuffer;
        // constructor(data: any, poly:number, filterData: any, startTime: any) {
        // 	this._enabled = true;
        // 	this.nextVoice = 0;
        // 	this.octave = data.octave || 0;
        // 	this.output = context.createGain();
        // 	this.output.gain.value = data.volume == undefined ? 1.0 : data.volume;
        // 	this._data = data;
        // 	this._poly = poly;
        // 	this._filterData = filterData;
        // 	this.voices = [];
        // 	// Always generate noise buffer in debug, to be able to switch osc type to noise dynamically
        // 	if (data.wave == 4) {
        // 		this._noiseBuffer = generateNoiseBuffer(this._data._frames, this._data._algorithm);
        // 	}
        //    }
        //    /**
        //     * Handles note on event
        //     * @param {number} noteNumber Which note to turn on
        //     * @param {number} when When to turn on note
        //     * @param {Object} gainEG Gain envelope to use.
        //     * @param {Object} filterEG Filter envelope to use.
        //     * @param {Object} pitchEG Pitch envelopeto use
        //     * @param {number} transpose How much to tranpose midi note
        //     */
        //    public noteOn(noteNumber: number, velocity:number, when: number, gainEG: any, filterEG: any, pitchEG: any, transpose: number): void {
        //    	if (!this.enabled) {
        //    		return;
        //    	}
        //    	if (this.voices.length == this._poly) {
        //    		this.voices[0].noteOff(noteNumber, when, gainEG, filterEG);
        //    		this.voices.splice(0,1);
        //    	}
        //    	/*
        //    	for (var ix = 0; ix < this.voices.length; ix++) {
        //    		var v = this.voices[ix];
        //    		if (v.source.playbackState == 3) {
        //    			this.voices.splice(ix, 1);
        //    			ix--;
        //    		}
        //    	}
        //    	*/
        //    	noteNumber += this.octave * 12;
        //    	var v;
        //    	if (this._data.wave == 4) {
        // 		v = new SympleVoice(this._data, 0, this._filterData, when, this._noiseBuffer);
        // 	}else {
        // 		v = new SympleVoice(this._data, 0, this._filterData, when, null);
        // 	}
        // 	v.gain.connect(this.output);
        // 	v.noteOn(noteNumber, velocity, when, gainEG, filterEG, pitchEG, transpose);
        // 	// Sätts av lfon om lfo pitch ska kopplas in
        // 	if (this.lfoPitchGainNode && this._data.wave != 4) {
        // 		this.lfoPitchGainNode.connect(v.source.frequency)
        // 	}
        // 	// Sätts av lfon om lfo filter ska kopplas in
        // 	if (this.filterAmplitude && v.filter) {
        // 		this.filterAmplitude.connect(v.filter.frequency)
        // 	}
        // 	this.voices.push(v);
        //    }
        //    *
        //     * Handles note off event
        //     * @param {number} noteNumber Which note to turn off
        //     * @param {number} when When to turn off note
        //     * @param {Object} gainEG Gain envelope to use.
        //     * @param {Object} filterEG Filter envelope to use.
        //    public noteOff(noteNumber: number, when: number, gainEG: any, filterEG: any): void {
        //    	if (!this.enabled) {
        //    		return;
        //    	}
        //    	noteNumber += this.octave * 12;
        //    	// Stäng av den som sattes på med samma not
        // 	for (var ix = 0; ix < this.voices.length; ix++) {
        // 		if (this.voices[ix].active && this.voices[ix].activatedNote == noteNumber) {
        // 			this.voices[ix].noteOff(noteNumber, when, gainEG, filterEG);
        // 			this.voices.splice(ix, 1);
        // 			break;
        // 		}
        // 	}
        //    }
        //    /**
        //     * Cancels playback softly (fades out)
        //     * @param {number} when When to stop
        //     * @param {Object} gainEG Envelope to use for fade
        //     * @param {Object} filterEG Envelope to use for filter
        //     */
        //    public stopSoft(when: number, gainEG: any, filterEG: any): void {
        // 	for (var ix = 0; ix < this.voices.length; ix++) {
        // 		this.voices[ix].stopSoft(when, gainEG, filterEG);
        // 	}
        // 	this.voices = [];
        //    }
        //    /**
        //     * Cancels playback of this osc immediately.
        //     */
        //    public stop(): void {
        //    	for (var ix = 0, len = this.voices.length; ix < len; ix++) {
        //    		this.voices[ix].stop();
        //    	}
        //    	this.voices = [];
        //    }
        //    /**
        //     * Deschedules scheduled playback.
        //     */
        //    public deschedule(): void {
        //    	for (var ix = 0, len = this.voices.length; ix < len; ix++) {
        //    		if (this.voices[ix]) {
        //     		var source = this.voices[ix].source;
        //     		if (source.playbackState == 1 || source["startTime"] > context.currentTime) {
        //                 this.voices[ix].stop();
        //                 this.voices.splice(ix, 1);
        //                 ix--;
        //             }
        //         }
        //    	}
        //    }
        //    /**
        //     * Updates detune amount
        //     * @param {number} detune Amount detune
        //     * @param {number} when When to updte detune.
        //     */
        //    public setDetune(detune:number, when?:number) {
        //    	//this._detune = detune;
        //    	if (this._data) {
        //     	this._data.detune = detune;
        //     	for (var ix = 0, len = this.voices.length; ix < len; ix++) {
        //     		this.voices[ix].source.detune.setValueAtTime(detune, when);
        //     	}
        //     }
        //    }
        //    /**
        //     * Whether this osc is enabled or not
        //     * @type {boolean}
        //     */
        //    public get enabled(): bool {
        // 	return this._enabled;
        // }
        //    public set enabled(state: bool) {
        //        this._enabled = state;
        //    }
        //    /**
        //     * How detuned osc is
        //     * @type {number} Detune amount
        //     */
        //    public get detune() :number {
        //    	return this._detune;
        //    }
        /**
        * Modulates parameter of the Symple synth
        * @param {Object} data Configuration data.
        * @param {number} startTime When to start the LFO
        * @constructor
        */
        var SympleLFO = (function () {
            function SympleLFO() {
                throw 'Symple not up to date, fix if(safari)';
            }
            return SympleLFO;
        })();        
        // public osc: any;
        // public phaseDelay: DelayNode;
        // public oscVolumeAmplitude: GainNode;
        // public pitchAmplitude: GainNode;
        // public filterAmplitude: GainNode;
        // public sync: string;
        //    public syncResolution: number;
        //    public phase: number;
        // constructor(data: any, startTime: number) {
        // 	this.osc = context.createOscillator();
        // 	this.phaseDelay = context.createDelay();
        // 	this.osc.type = data.wave || 0;
        // 	this.osc.frequency.value = data.rate || 1;
        // 	this.phase = data.phase || 0;
        // 	this.phaseDelay.delayTime.value = this.phase * (1 / this.osc.frequency.value);
        // 	this.sync = data.sync;
        // 	this.syncResolution = data.rate;
        // 	this.osc.connect(this.phaseDelay);
        // 	//if (data.osc_volume_amount) {
        // 		this.oscVolumeAmplitude = context.createGain();
        // 		this.oscVolumeAmplitude.gain.value = data.osc_volume_amount;
        // 		this.phaseDelay.connect(this.oscVolumeAmplitude);
        // 	//}
        // 	//if (data.pitch_amount) {
        // 		this.pitchAmplitude = context.createGain();
        // 		this.pitchAmplitude.gain.value = data.pitch_amount;
        // 		this.phaseDelay.connect(this.pitchAmplitude);
        // 	//}
        // 	//if (data.filter_amount) {
        // 		this.filterAmplitude = context.createGain();
        // 		this.filterAmplitude.gain.value = data.filter_amount;
        // 		this.phaseDelay.connect(this.filterAmplitude);
        // 	//}
        // 	safari ? this.osc.noteOn(startTime) : this.osc.start(startTime);
        // }
        // /**
        //  * Updates sync from a sequencer.
        //  * @param {number} bpm New BPM.
        //  */
        // public updateSync(bpm: number): SympleLFO {
        //        this.osc.frequency.value = (bpm/60) / this.syncResolution;
        //        this.phaseDelay.delayTime.value = this.phase * (1 / this.osc.frequency.value);
        //        return this;
        //    }
        /**
        * Plays synthesized tones based on midi input.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        * @extends {Klang.Model.Synth}
        */
        var Symple = (function (_super) {
            __extends(Symple, _super);
            function Symple(data, name) {
                        _super.call(this, data, name);
                throw 'Symple not up to date, fix if(safari)';
            }
            return Symple;
        })(Synth);
        Model.Symple = Symple;        
        // private _oscs: SympleOsc[];
        // private _gainEG: any;
        // private _filterEG: any;
        // private _pitchEG: any;
        // private _LFO: SympleLFO;
        // private _poly: number;
        // private bendRange:number = 400; //cents
        // constructor(data: any, name: string) {
        // 	super(data, name);
        // 	var startTime = context.currentTime + Util.OSC_START_DELAY;	// Tid då alla oscillatorer ska starta, för att de ska startas exakt samtidigt
        // 	this._gainEG = data.gain_eg;
        // 	this._filterEG = data.filter_eg;
        // 	this._pitchEG = data.pitch_eg;
        // 	// OSCILLATORS
        // 	this._oscs = [];
        // 	this._poly = data.poly;
        // 	for (var ix = 0, len = data.oscillators.length; ix < len; ix++) {
        // 		var o = new SympleOsc(data.oscillators[ix], data.poly, data.filter, startTime);
        // 		o.output.connect(this.output);
        // 		this._oscs.push(o);
        // 	}
        // 	if (data.LFO) {
        // 		this._LFO = new SympleLFO(data.LFO, startTime);
        // 		// oscillators
        // 		for (var ix = 0, len = this._oscs.length; ix < len; ix++) {
        // 			var osc = this._oscs[ix];
        // 			// osc volume
        // 			if (this._LFO.oscVolumeAmplitude) {
        // 				this._LFO.oscVolumeAmplitude.connect(osc.output.gain);
        // 			}
        // 			if (this._LFO.pitchAmplitude) {
        // 				osc.lfoPitchGainNode = this._LFO.pitchAmplitude;
        // 			}
        // 			// filter freq
        // 			if (this._LFO.filterAmplitude) {
        // 				osc.filterAmplitude = this._LFO.filterAmplitude;
        // 			}
        // 			// voices
        // 		}
        // 		// synkning
        // 		if (this._LFO.sync) {
        //             Core.instance.pushToPreLoadInitStack(this);
        //         }
        // 	}
        // 	// ARP
        // 	if (this._sync) {
        // 		Core.instance.pushToPreLoadInitStack(this);
        // 	}
        //    }
        //    /**
        //     * Inits sync to sequencer.
        //     */
        //    private init(): void {
        //        if (this._LFO && this._LFO.sync) {
        //     	// kommer endast hit om LFO finns och ska synkas
        //         var seq = Core.instance.findInstance(this._LFO.sync);
        //         this._LFO.updateSync(seq.bpm);
        //         seq.registerBPMSync(this._LFO);
        //     }
        //        if (this._sync) {
        // 		var seq = Core.instance.findInstance(this._sync);
        // 		seq.registerSynth(this);
        // 		if (!seq.started) {
        // 			seq.start();
        // 		}
        // 	}
        //    }
        //    /**
        //     * Handles a midi event.
        //     * @param {any} event Midi event to handle.
        //     * @param {number} when Time when the event should be handled, in Web Audio context time.
        //     * @param {number} transpose How much to transpose midi notes
        //     * @param {boolean} bypassArp Force no use of arp
        //     */
        //    public handleMidiEvent(midiEvent: any, when?: number, transpose?: number, bypassArp?:bool): Synth {
        //    	when = when || context.currentTime;
        //    	bypassArp = bypassArp || false;
        //    	transpose = transpose || 0;
        // 	if (midiEvent.type == "channel") {
        // 		if (midiEvent.subtype == "noteOn") {
        // 			if (this._arpMode != 'off' && !bypassArp) {
        // 				this._activeVoices.push({
        // 					midiEvent:midiEvent,
        // 					transpose:transpose
        // 				});
        // 				this.handleArpModes(midiEvent);
        // 				return
        // 			}
        // 			for (var ix = 0, len = this._oscs.length; ix < len; ix++) {
        // 				this._oscs[ix].noteOn(midiEvent.noteNumber, midiEvent.velocity, when, this._gainEG, this._filterEG, this._pitchEG, transpose);
        // 			}
        // 		}
        // 		else if (midiEvent.subtype == "noteOff") {
        // 			if (this._arpMode != 'off' && !bypassArp) {
        // 				for (var i = 0; i< this._activeVoices.length; i++) {
        // 					if (midiEvent.noteNumber === this._activeVoices[i].midiEvent.noteNumber) {
        // 						this._activeVoices.splice(i,1);
        // 					}
        // 				}
        // 				this.handleArpModes(midiEvent);
        // 				return
        // 			}
        // 			for (var ix = 0, len = this._oscs.length; ix < len; ix++) {
        // 				this._oscs[ix].noteOff(midiEvent.noteNumber, when, this._gainEG, this._filterEG);
        // 			}
        // 		}else if (midiEvent.subtype == "pitchBend") {
        // 			var bend;
        // 			if (midiEvent.value != undefined) {
        // 				bend = midiEvent.value;
        // 			}else if (midiEvent.velocity != undefined) {
        // 				bend = midiEvent.velocity;
        // 			}
        // 			var currentPitch = ((bend -8192)/16384)* this.bendRange;
        //                //var currentPitch = ((bend - 64) / 127) * this.bendRange;
        //                //console.log(currentPitch, when, Util.now());
        //                for (var i = 0; i< this._oscs.length; i++) {
        //                    this._oscs[i].setDetune(currentPitch, when);
        //                }
        //            }
        // 	}
        //        return this;
        //    }
        //    public glideTo(midiNotes: number[], when: number, duration: number, transpose: number): Symple {
        // 	var now = Util.now();
        //    	when = when || now;
        //    	if (duration == undefined) {
        //    		duration = 0.5;
        //    	}
        //    	transpose = transpose || 0;
        //    	for (var o = 0, len = this._oscs.length; o < len; o++) {
        // 		var osc = this._oscs[o];
        // 		var voicesToUpdate = Math.min(midiNotes.length, osc.voices.length);
        // 		for (var v = 0; v < voicesToUpdate; v++) {
        // 			var voice = osc.voices[v];
        // 			var toFrequency = Util.midiNoteToFrequency(midiNotes[v]+transpose+osc.octave*12);
        // 			if (voice.source.frequency) {
        // 				voice.source.frequency.cancelScheduledValues(now);
        // 				voice.source.frequency.setValueAtTime(voice.source.frequency.value, when);
        // 				voice.source.frequency.linearRampToValueAtTime(toFrequency, when+duration);
        // 			}
        // 		}
        //    	}
        //    	return this;
        //    }
        //    /**
        //     * Cancels playback of this synth immediately.
        //     */
        //    public stop(when?:number): void {
        // 	when = when || Util.now();
        //    	for (var ix = 0, len = this._oscs.length; ix < len; ix++) {
        //    		//this._oscs[ix].stop();
        //    		this._oscs[ix].stopSoft(when, this._gainEG, this._filterEG);
        //    	}
        //    	if (this._activeVoices.length) {
        //    		this._activeVoices = [];
        //    	}
        //    	this._arpVoices = [];
        //    }
        //    /**
        //     * Deschedules scheduled playback.
        //     */
        //    public deschedule(): Symple {
        //    	for (var o = 0, len = this._oscs.length; o < len; o++) {
        // 		this._oscs[o].deschedule();
        // 	}
        //    	return this;
        //    }
        //    public set filterFrequency(val: number) {
        //        for (var o = 0, len = this._oscs.length; o < len; o++) {
        //        	var osc = this._oscs[o];
        //        	osc._filterData.frequency = val;
        //        	for (var v = 0, vlen = osc.voices.length; v < vlen; v++) {
        //        		var voice = osc.voices[v];
        // 			voice.filterTargetFreq = val;
        // 			if (!this._filterEG || this._filterEG.contour == 0) {
        // 				voice.filter.frequency.value = val;
        // 			}
        //        	}
        //        }
        //    }
        //    public set filterQ(val: number) {
        //        for (var o = 0, len = this._oscs.length; o < len; o++) {
        //        	var osc = this._oscs[o];
        //        	osc._filterData.Q = val;
        //        	for (var v = 0, vlen = osc.voices.length; v < vlen; v++) {
        //        		var voice = osc.voices[v];
        // 			voice.filterTargetFreq = val;
        // 			if (!this._filterEG || this._filterEG.contour == 0) {
        // 				voice.filter.Q.value = val;
        // 			}
        //        	}
        //        }
        //    }
        //    public set filterType(val: BiquadFilterType) {
        //        for (var o = 0, len = this._oscs.length; o < len; o++) {
        //        	var osc = this._oscs[o];
        //        	osc._filterData.filter_type = val;
        //        	for (var v = 0, vlen = osc.voices.length; v < vlen; v++) {
        //        		var voice = osc.voices[v];
        // 			voice.filter.type = val;
        //        	}
        //        }
        //    }
        //    public set osc1Wave(val: string) {
        //    	var osc = this._oscs[0];
        //    	osc._data.wave = val;
        //    	for (var v = 0, vlen = osc.voices.length; v < vlen; v++) {
        //    		var voice = osc.voices[v];
        // 		if (voice.source.type && val !== "4") {voice.source.type = val;}
        //    	}
        //    }
        //    public set osc1Vol(val: number) {
        //    	var osc = this._oscs[0];
        //    	osc.output.gain.value = val;
        //    }
        //    public set osc1Detune(val: number) {
        //    	var osc = this._oscs[0];
        //    	osc._detune = val;
        //    	for (var v = 0, vlen = osc.voices.length; v < vlen; v++) {
        //    		var voice = osc.voices[v];
        // 		if (voice.source.detune) {voice.source.detune.value = val; }
        //    	}
        //    }
        //    public set osc1Octave(val: number) {
        //    	var osc = this._oscs[0];
        //    	osc.octave = val;
        //    }
        //    public set osc2Wave(val: string) {
        //    	if (this._oscs.length < 2) return;
        //    	var osc = this._oscs[1];
        //    	osc._data.wave = val;
        //    	for (var v = 0, vlen = osc.voices.length; v < vlen; v++) {
        //    		var voice = osc.voices[v];
        // 		if (voice.source.type && val !== "4") {voice.source.type = val;}
        //    	}
        //    }
        //    public set osc2Vol(val: number) {
        //    	if (this._oscs.length < 2) return;
        //    	var osc = this._oscs[1];
        //    	osc.output.gain.value = val;
        //    }
        //    public set osc2Detune(val: number) {
        //    	if (this._oscs.length < 2) return;
        //    	var osc = this._oscs[1];
        //    	osc._detune = val;
        //    	for (var v = 0, vlen = osc.voices.length; v < vlen; v++) {
        //    		var voice = osc.voices[v];
        // 		if (voice.source.detune) {voice.source.detune.value = val; }
        //    	}
        //    }
        //    public set osc2Octave(val: number) {
        //    	if (this._oscs.length < 2) return;
        //    	var osc = this._oscs[1];
        //    	osc.octave = val;
        //    }
        //    public set pitchDecay(val: number) {
        //    	if (this._pitchEG) {
        //    		this._pitchEG.decay = val;
        //    	}
        //    }
        //    public set pitchContour(val: number) {
        //    	if (this._pitchEG) {
        //    		this._pitchEG.contour = val;
        //    	}
        //    }
        //    public set lfoWave(val: string) {
        //    	if (this._LFO) {
        //    		this._LFO.osc.type = val;
        //    	}
        //    }
        //    public set lfoRate(val: number) {
        //    	if (this._LFO) {
        //    		this._LFO.osc.frequency.value = val;
        //    	}
        //    }
        //    public set lfoPhase(val: number) {
        //    	if (this._LFO) {
        //    		this._LFO.phase = val;
        //    	}
        //    }
        //    public set lfoOscVol(val: number) {
        //    	if (this._LFO) {
        //    		this._LFO.oscVolumeAmplitude.gain.value = val;
        //    	}
        //    }
        //    public set lfoPitch(val: number) {
        //    	if (this._LFO) {
        //    		this._LFO.pitchAmplitude.gain.value = val;
        //    	}
        //    }
        //    public set lfoFilter(val: number) {
        //    	if (this._LFO) {
        //    		this._LFO.filterAmplitude.gain.value = val;
        //    	}
        //    }
        //    public set arpMode(val: string) {
        //    	this._arpMode = val;
        //    }
        //    public set arpOctaves(val: number) {
        //    	this._octaves = val;
        //    }
        /*
        * Source: src/model/audio/synths/SamplePlayer.ts
        */
        /**
        * Plays samples based on midi events.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        * @extends {Klang.Model.Synth}
        */
        var SamplePlayer = (function (_super) {
            __extends(SamplePlayer, _super);
            //A sample is stopped after releaseTime * _stopFactor seconds.
            function SamplePlayer(data, name) {
                        _super.call(this, data, name);
                this._content = [];
                this._playingVoices = [];
                // alla röster som låter
                this._allVoices = [];
                // Alla röster som spelas, även om de schedulerats att stoppa
                this._hasNoteOffSamples = false;
                this._hasSustainOnSamples = false;
                this._hasSustainOffSamples = false;
                this._pitchBendRange = 0.25;
                this._pedalOnTime = -1;
                this._sustained = [];
                this._maxNotes = 20;
                this._stopFactor = 5;
                this._content = data.content;
                this._volumeCurve = data.volume_curve || "none";
                this._gainEG = data.eg_gain || {
                    attack: 0,
                    decay: 0,
                    sustain: 1,
                    release: 0.5
                };
                this._currentPitch = 1;
                Core.instance.pushToPreLoadInitStack(this);
            }
            SamplePlayer.prototype.init = /**
            * Initializes sample player
            * Will run everytime new content is loaded
            */
            function () {
                var success = true;
                //this._envelope = context.createGain();
                for(var ix = 0, len = this._content.length; ix < len; ix++) {
                    if(this._content[ix].value === "noteOff") {
                        this._hasNoteOffSamples = true;
                    }
                    if(this._content[ix].value === "sustainOn") {
                        this._hasSustainOnSamples = true;
                    }
                    if(this._content[ix].value === "sustainOff") {
                        this._hasSustainOffSamples = true;
                    }
                    for(var j = 0; j < this._content[ix].samples.length; j++) {
                        // byter ut strängen source mot audioSource-instanser
                        if(typeof this._content[ix].samples[j].source === 'string') {
                            // try finding the instance, it might be that it's missing or that it's just not loaded yet
                            //
                            var audioSource = Core.instance.findInstance(this._content[ix].samples[j].source);
                            if(audioSource) {
                                this._content[ix].samples[j].source = audioSource;
                                this._content[ix].samples[j].loaded = true;
                                this._content[ix].samples[j].source._parentType = "SamplePlayer";
                                if(this._content[ix].samples[j].source.loop) {
                                    this._loopedSamples = true;
                                }
                            } else {
                                success = false;
                            }
                        }
                    }
                }
                if(this._sync) {
                    var seq = Core.instance.findInstance(this._sync);
                    seq.registerSynth(this);
                    // if (!seq.started) {
                    //     //seq.start();
                    // }
                                    }
                return success;
            };
            SamplePlayer.prototype.handleMidiEvent = /**
            * Handles a midi event.
            * @param {any} event Midi event to handle.
            * @param {number} when Time when the event should be handled, in Web Audio context time.
            * @param {number}
            */
            function (midiEvent, when, transpose, bypassArp) {
                if(midiEvent.noteNumber === undefined || !isFinite(midiEvent.noteNumber)) {
                    return this;
                }
                when = when || Util.now();
                // for ( var i = 0; i < this._playingVoices.length; i++ ) {
                //     var playingVoice = this._playingVoices[ i ];
                //     // not accomodating transpose?
                //     if ( playingVoice.time === when && playingVoice.note === midiEvent.noteNumber ) {
                //         Klang.warn( 'midi event fired twice ', midiEvent );
                //     }
                // }
                if(when < Util.now()) {
                    Klang.warn('midi event scheduled behind context time ', midiEvent);
                }
                if(midiEvent.velocity > 127 || midiEvent.velocity < 0) {
                    Klang.warn('velocity out of range ', midiEvent);
                    //return this;
                                    }
                // clamp velocity between 0 and 127
                midiEvent.velocity = Math.max(0, Math.min(127, midiEvent.velocity));
                bypassArp = bypassArp || false;
                transpose = transpose || 0;
                if(midiEvent.type == "channel") {
                    if(midiEvent.subtype == "noteOn") {
                        if(this._arpMode != 'off' && !bypassArp) {
                            this._activeVoices.push({
                                midiEvent: midiEvent,
                                transpose: transpose,
                                when: when
                            });
                            //this.handleArpModes(midiEvent);
                            return;
                        }
                        this.noteOn(when, midiEvent.noteNumber, transpose, midiEvent.velocity, midiEvent.subtype);
                        //Klang.log("Note on: " + midiEvent.noteNumber);
                        if(this._callback) {
                            this._callback(midiEvent, when);
                        }
                    } else if(midiEvent.subtype == "noteOff") {
                        if(this._arpMode != 'off' && !bypassArp) {
                            for(var i = 0; i < this._activeVoices.length; i++) {
                                if(midiEvent.noteNumber === this._activeVoices[i].midiEvent.noteNumber) {
                                    this._activeVoices.splice(i, 1);
                                }
                            }
                            //this.handleArpModes(midiEvent);
                            return;
                        }
                        this.noteOff(when, midiEvent.noteNumber, midiEvent.velocity, midiEvent.subtype);
                        if(this._callback) {
                            this._callback(midiEvent, when);
                        }
                        //Klang.log("Note off: " + midiEvent.noteNumber);
                                            } else if(midiEvent.subtype == "pitchBend") {
                        var bend = midiEvent.value;
                        //this._currentPitch = 1+((bend -8192)/16384);
                        this._currentPitch = 1 + ((bend - 64) / 127);
                        for(var i = 0; i < this._playingVoices.length; i++) {
                            this._playingVoices[i].source.playbackRateNode.setValueAtTime(this._currentPitch, when);
                        }
                    } else if(midiEvent.subtype == "controller") {
                        var controllerType = midiEvent.controllerType || midiEvent.noteNumber;
                        var value = midiEvent.value == undefined ? midiEvent.velocity : midiEvent.value;
                        switch(controllerType) {
                            case 1:
                                //modulation
                                break;
                            case 64:
                                //sustain
                                if(value < 64) {
                                    this.pedalRelease(when);
                                    if(when > this._pedalOnTime) {
                                        this._pedalOnTime = -1;
                                    }
                                    if(this._hasSustainOffSamples) {
                                        this.noteOn(when, 0, 0, 127, "sustainOff");
                                    }
                                } else if(value > 64) {
                                    this._pedalOnTime = when;
                                    if(this._hasSustainOnSamples) {
                                        this.noteOn(when, 0, 0, 127, "sustainOn");
                                    }
                                }
                                break;
                            default:
                        }
                    }
                }
                return this;
            };
            SamplePlayer.prototype.noteOn = /**
            * Plays a sample corresponding to a midi note.
            * @param {number} when When to play the note.
            * @param {number} midiNote What note to play
            * @param {number} transpose How much to tranpose the note
            * @param {number} velocity Note velocity
            * @param {string} value Type of midi event
            * @param {number} volume Volume to play at
            * @private
            */
            function (when, midiNote, transpose, velocity, value, volume) {
                // Ta bort voices som stoppats
                for(var ix = 0; ix < this._allVoices.length; ix++) {
                    var v = this._allVoices[ix];
                    if(v.source._sources.length == 0 || v.source.lastSource.playbackState == 3) {
                        this._allVoices.splice(ix, 1);
                        v.source.destroy();
                        ix--;
                    }
                }
                //Klang.log("when", when, "midiNote", midiNote, "velocity", velocity,  "value", value);
                var note = (midiNote !== undefined) && this.getNote(midiNote + transpose, velocity, value);
                if(!note) {
                    return;
                }
                //calculate pitch/playbackRate
                var targetPitch = Util.midiNoteToFrequency(midiNote + transpose);
                var rootPitch = Util.midiNoteToFrequency(note.root);
                var rate = targetPitch / rootPitch;
                if(note.root === -1) {
                    rate = 1;
                }
                var copy = new AudioSource(note.source.data, midiNote.toString());
                if(value === "noteOn") {
                    var newVoice = {
                        "source": copy,
                        "time": when,
                        "velocity": velocity,
                        "note": midiNote,
                        "transpose": transpose
                    };
                    this._playingVoices.push(newVoice);
                    this._allVoices.push(newVoice);
                }
                //  samplePlayerns destination overridar audiosourcens
                if(this.destinationName) {
                    copy.connect(Core.instance.findInstance(this.destinationName).input);
                } else {
                    copy.connect(Core.instance.findInstance(copy.destinationName).input);
                }
                when = when < Util.now() ? Util.now() : when;
                var vol = 0;
                if(volume) {
                    vol = volume * velocity / 128;
                } else if(this._volumeCurve === "linear") {
                    vol = velocity / 128;
                } else if(this._volumeCurve === "exponential") {
                    vol = Math.abs(1 - Math.exp(velocity / 128));
                } else if(this._volumeCurve === "none") {
                    vol = 1;
                }
                vol *= copy.output.gain.value;
                copy.output.gain.cancelScheduledValues(when);
                copy.nextPlaybackRate = rate * this._currentPitch;
                copy.play(when);
                copy.output.gain.value = 0.0;
                copy.output.gain.setValueAtTime(0.0, when);
                var adsrStartTime = when + this._gainEG.attack + 0.01;// add a small delay to make sure order is correct
                
                copy.output.gain.linearRampToValueAtTime(vol, adsrStartTime);
                if(copy.output.gain.setTargetAtTime) {
                    copy.output.gain.setTargetAtTime(vol * this._gainEG.sustain, adsrStartTime + 0.01, this._gainEG.decay);
                } else if(copy.output.gain.setTargetValueAtTime) {
                    copy.output.gain.setTargetValueAtTime(vol * this._gainEG.sustain, adsrStartTime, this._gainEG.decay);
                }
            };
            SamplePlayer.prototype.adsr = /**
            * get/set ADSR
            * @param {float} [attack] Attack in seconds
            * @param {float} [decay]  Decay in seconds
            * @param {float} [sustain] Sustain amplitude (0-1)
            * @param {float} [release] Release time in seconds
            * return {object} If no arguments are supplied, the a copy of the current adsr is returned.
            */
            function (attack, decay, sustain, release) {
                var eg = this._gainEG;
                if(arguments.length === 0) {
                    return {
                        attack: eg.attack,
                        decay: eg.decay,
                        sustain: eg.sustain,
                        release: eg.release
                    };
                } else {
                    eg.attack = typeof arguments[0] !== 'number' ? eg.attack : arguments[0];
                    eg.decay = typeof arguments[1] !== 'number' ? eg.decay : arguments[1];
                    eg.sustain = typeof arguments[2] !== 'number' ? eg.sustain : arguments[2];
                    eg.release = typeof arguments[3] !== 'number' ? eg.release : arguments[3];
                }
                return this;
            };
            SamplePlayer.prototype.noteOff = /**
            * Handles note off event
            * @param {number} When to handle note off
            * @param {number} midiNote What note to noteOff
            * @param {number} velocity NoteOff velocity
            * @param {string} value noteOff value
            * @private
            */
            function (when, midiNote, velocity, value) {
                var note = this.getNote(midiNote, velocity, "noteOn");
                if(!note) {
                    return;
                }
                var retain = [];
                for(var i = 0; i < this._playingVoices.length; i++) {
                    var voice = this._playingVoices[i];
                    if(!midiNote || midiNote.toString() === voice.source._name) {
                        // If pedal is pressed
                        if(when > this._pedalOnTime && this._pedalOnTime > 0) {
                            // Limits the number of sustained notes. Splices the first one (oldest) and adds the new note.
                            if(this._sustained.length > this._maxNotes) {
                                this._sustained[0].source.stop(when + this._gainEG.release * this._stopFactor);
                                this._sustained.splice(0, 1);
                            }
                            this._sustained.push(this._playingVoices[i]);
                            this._playingVoices.splice(i, 1);
                        } else {
                            if(when < Util.now()) {
                                when = Util.now();
                            }
                            var val = this._playingVoices[i].source.output.gain.value;
                            this._playingVoices[i].source.output.gain.cancelScheduledValues(when);
                            if(when != Util.now() || Klang.browser == "Firefox") {
                                this._playingVoices[i].source.output.gain.setValueAtTime(this._gainEG.sustain, when);
                            } else {
                                this._playingVoices[i].source.output.gain.setValueAtTime(val, when);
                            }
                            this._playingVoices[i].source.stop(when + this._gainEG.release * this._stopFactor);
                            this._playingVoices[i].source.output.gain.setTargetAtTime(0.0, when, this._gainEG.release);
                            if(this._hasNoteOffSamples) {
                                var t = Util.now() - this._playingVoices[i].time;
                                var v = Math.min((Math.exp(-t) / 3), 1);
                                this.noteOn(when, midiNote, this._playingVoices[i].transpose, this._playingVoices[i].velocity, value, v);
                            }
                            //this._playingVoices.splice(i,1);
                                                    }
                    } else {
                        retain.push(voice);
                    }
                }
                this._playingVoices = retain;
            };
            SamplePlayer.prototype.stop = /**
            * Stops all notes and resets pedal
            * @param {number} when When to stop
            */
            function (when) {
                var when = when || Util.now();
                this.pedalRelease(when);
                for(var i = 0; i < this._playingVoices.length; i++) {
                    if(when < Util.now()) {
                        when = Util.now();
                    }
                    var val = this._playingVoices[i].source.output.gain.value;
                    this._playingVoices[i].source.output.gain.cancelScheduledValues(when);
                    this._playingVoices[i].source.output.gain.setValueAtTime(val, when);
                    this._playingVoices[i].source.stop(when + this._gainEG.release * this._stopFactor);
                    this._playingVoices[i].source.output.gain.setTargetAtTime(0.0, when, this._gainEG.release);
                }
                this._playingVoices = [];
                this._arpVoices = [];
                return this;
            };
            SamplePlayer.prototype.deschedule = /**
            * Deschedules scheduled playback.
            */
            function () {
                for(var i = 0; i < this._allVoices.length; i++) {
                    this._allVoices[i].source.deschedule();
                }
                return this;
            };
            SamplePlayer.prototype.pedalRelease = /**
            * Releases pedal
            * @param {number} when When to release pedal
            * @private
            */
            function (when) {
                for(var i = 0; i < this._sustained.length; i++) {
                    if(when < Util.now()) {
                        when = Util.now();
                    }
                    // Fulfix för Firefox som inte funkar så bra
                    if(Klang.browser == "Firefox") {
                        //var val = this._sustained[i].source.output.gain.value;
                        //this._sustained[i].source.output.gain.cancelScheduledValues(when);
                        //this._sustained[i].source.output.gain.setValueAtTime(val, when);
                        this._sustained[i].source.output.gain.linearRampToValueAtTime(0.0, when + 0.3);
                        this._sustained[i].source.stop(when + this._gainEG.release * this._stopFactor);
                        continue;
                    }
                    this._sustained[i].source.output.gain.setTargetAtTime(0.0, when, this._gainEG.release);
                    if(this._hasNoteOffSamples) {
                        var t = Util.now() - this._sustained[i].time;
                        var v = Math.min((Math.exp(-t) / 3), 1);
                        this.noteOn(when, this._sustained[i].note, this._sustained[i].transpose, this._sustained[i].velocity, "noteOff", v);
                    }
                }
                this._sustained = [];
            };
            SamplePlayer.prototype.getNote = /**
            * Checks which source to play based on it's note and velocity
            * @param {number} note noteNumber to check
            * @param {number} velocity Velocity to check
            * @param {string} value Value to check
            */
            function (note, velocity, value) {
                var i = 0;
                var val = this._content[i].value || "noteOn";
                while(velocity > this._content[i].highVelocity || value !== this._content[i].value) {
                    i++;
                }
                var velocityLayer = i;
                var j = 0;
                while(note < this._content[velocityLayer].samples[j].startRange || note > this._content[velocityLayer].samples[j].endRange) {
                    j++;
                    if(j >= this._content[velocityLayer].samples.length) {
                        Klang.warn('Note ' + note + ' out of range');
                        return false;
                    }
                }
                var sample = this._content[velocityLayer].samples[j];
                return sample.loaded && sample;
            };
            Object.defineProperty(SamplePlayer.prototype, "content", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * Sample content
                * @type {Array}
                */
                function () {
                    return this._content;
                },
                set: function (value) {
                    this._content = value;
                    this.init();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(SamplePlayer.prototype, "callbackFunction", {
                set: /**
                * Callback
                * @type {Function}
                */
                function (func) {
                    this._callback = func;
                },
                enumerable: true,
                configurable: true
            });
            return SamplePlayer;
        })(Synth);
        Model.SamplePlayer = SamplePlayer;        
        /*
        * Source: src/model/audio/synths/Smattr.ts
        */
        /**
        * Plays a synthesized kick drum sound.
        * @param {Object} data Configuration data.
        * @param {number} startTime When to start oscs
        * @param {AudioNode} destination Where to route output
        * @constructor
        */
        var SmattrKick1 = (function () {
            function SmattrKick1() {
                throw 'Smattr not up to date, fix if(safari)';
            }
            return SmattrKick1;
        })();        
        /**
        * Enum for pattern syncing methods.
        * @enum
        */
        (function (SyncType) {
            SyncType._map = [];
            SyncType._map[0] = "Restart";
            SyncType.Restart = 0;// Start from beginning
            
            SyncType._map[1] = "Playing";
            SyncType.Playing = 1;// Sync with the patterns playing of those you're starting.
            
            SyncType._map[2] = "All";
            SyncType.All = 2;// Sync with all playing patterns
            
            SyncType._map[3] = "Continue";
            SyncType.Continue = 3;// Continues if already playing.
            
        })(Model.SyncType || (Model.SyncType = {}));
        var SyncType = Model.SyncType;
        /**
        * Handles syncing of patterns.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        */
        var Sequencer = (function () {
            function Sequencer(data, name) {
                // Tid i sekunder att schemalägga framtiden
                this._scheduler = null;
                // Handle till setTimeout
                this._started = false;
                this._bpm = 120;
                this._barLength = 4;
                this._beatLength = 1;
                this._resolution = 0.25;
                // Timestamp i Web Audio Context då nästa steg sker
                this._currentStep = 0;
                // Nuvarande steg
                this._paused = false;
                this._maxSwing = .08;
                this._swingFactor = 0.0;
                this._name = name;
                this._type = data.type;
                this._bpm = data.bpm || 120;
                this._barLength = data.bar_length || 4;
                this._beatLength = data.beat_length || 1;
                this._registeredPatterns = [];
                this._registeredSynths = [];
                this._syncHandler = new SyncHandler();
                this._syncedObjects = [];
                this._swingFactor = data.swing_factor || 0;
                Core.instance.pushToPreLoadInitStack(this);
            }
            Sequencer.prototype.init = /**
            * Initializes the sequencer
            */
            function () {
                this._lookahead = Core.settings.sequencer_lookahead || 50.0;
                this._scheduleAheadTime = Core.settings.sequencer_schedule_ahead || 0.2;
                if(Klang.isIOS) {
                    this._scheduleAheadTime = Core.settings.sequencer_schedule_ahead_ios || 5;
                }
                this._resolution = Core.settings.sequencer_resolution || 0.25;
            };
            Sequencer.prototype.startScheduler = /**
            * Steps the sequenver forward and schedules the next step.
            * @private
            */
            function () {
                if(!this._paused && Klang.context.currentTime !== 0) {
                    this._lastScheduleLoopTime = Klang.context.currentTime;
                    while(this._scheduleTime < Klang.context.currentTime + this._scheduleAheadTime) {
                        //if (this._scheduleTime>= context.currentTime && context.currentTime !== 0) {
                        // Notifiera Patterns
                        for(var ix = 0, len = this._registeredPatterns.length; ix < len; ix++) {
                            this._registeredPatterns[ix].update(this._currentStep, this._scheduleTime);
                        }
                        // Notifiera Synths
                        for(var jx = 0, len = this._registeredSynths.length; jx < len; jx++) {
                            this._registeredSynths[jx].update(this._currentStep, this._scheduleTime);
                        }
                        // Gå till nästa step
                        this._currentStep += this._resolution;
                        //this._scheduleTime += (60.0 / this._bpm) * this._resolution;
                        this._syncHandler.update(this._resolution);
                        // apply swing
                        if(this._swingFactor > 0) {
                            if((this._currentStep * 4) % 2) {
                                this._scheduleTime += (0.25 + this._maxSwing * this._swingFactor) * (60.0 / this._bpm);
                            } else {
                                this._scheduleTime += (0.25 - this._maxSwing * this._swingFactor) * (60.0 / this._bpm);
                            }
                        } else {
                            this._scheduleTime += (60.0 / this._bpm) * this._resolution;
                        }
                        /*}else {
                        this._scheduleTime = context.currentTime;
                        //console.log("*** this._scheduleTime", this._scheduleTime, "context.currentTime", context.currentTime, "this._scheduleAheadTime", this._scheduleAheadTime);
                        }*/
                                            }
                }
                // Hax för att kunna anropa en privat funktion med setTimeout
                var _this = this;
                this._scheduler = setTimeout(function () {
                    _this.startScheduler();
                }, _this._lookahead);
            };
            Sequencer.prototype.start = /**
            * Starts scheduling.
            * @return {Klang.Model.Sequencer}
            */
            function () {
                this._started = true;
                this._scheduleTime = Klang.context.currentTime;
                if(this._scheduleAheadTime <= 0.2) {
                    this._scheduleTime += 0.3;
                }
                clearTimeout(this._scheduler);
                this.startScheduler();
                return this;
            };
            Sequencer.prototype.pause = /**
            * Pauses playback.
            * @return {Klang.Model.Sequencer} Self
            */
            function () {
                this._paused = true;
                this._pauseOffset = this._scheduleTime - Util.now();
                for(var ix = 0, len = this._registeredPatterns.length; ix < len; ix++) {
                    this._registeredPatterns[ix].pause();
                }
                return this;
            };
            Sequencer.prototype.unpause = /**
            * Resumes playback.
            * @return {Klang.Model.Sequencer} Self
            */
            function () {
                this._paused = false;
                this._scheduleTime = Util.now() + this._pauseOffset;
                for(var ix = 0, len = this._registeredPatterns.length; ix < len; ix++) {
                    this._registeredPatterns[ix].unpause();
                }
                return this;
            };
            Sequencer.prototype.reschedule = /**
            * Removes everything that has been scheduled to play, and reschedules it.
            * @return {Klang.Model.Sequencer} Self
            */
            function () {
                clearTimeout(this._scheduler)// för att en ny schemaläggning inte ska ske mitt i reschedule
                ;
                var scheduled = this._scheduleTime - Klang.context.currentTime;// hur lång tid som schemalaggts
                
                var resolutionTime = this.getNoteTime(this._resolution);
                var scheduleOffset = scheduled > this._scheduleAheadTime ? (scheduled - this._scheduleAheadTime) : (scheduled - (this._scheduleAheadTime - resolutionTime));
                var realScheduledSteps = ((scheduled - scheduled % resolutionTime) / resolutionTime) / (this._beatLength / this._resolution);
                var scheduledSteps = (this._scheduleAheadTime / resolutionTime) / (this._beatLength / this._resolution);// antal steg som schemalaggts
                
                this._scheduleTime = Klang.context.currentTime + scheduleOffset// ny tid för nästa steg
                ;
                if(realScheduledSteps < scheduledSteps) {
                    this._scheduleTime -= resolutionTime;
                }
                this._currentStep -= scheduledSteps;
                // currentstep borde inte bli NaN.......
                if(isNaN(this._currentStep) || this._currentStep < 0) {
                    this._currentStep = 0;
                }
                // Ta bort schemaläggning som redan gjorts
                for(var ix = 0, len = this._registeredPatterns.length; ix < len; ix++) {
                    this._registeredPatterns[ix].deschedule(scheduledSteps);
                }
                // Kör schemaläggning direkt
                this.startScheduler();
                return this;
            };
            Sequencer.prototype.stop = /**
            * Stop the sequencer.
            * @return {Klang.Model.Sequencer} Self
            */
            function () {
                this._started = false;
                clearTimeout(this._scheduler);
                this._scheduler = null;
                this._started = false;
                return this;
            };
            Sequencer.prototype.stopAll = /**
            * Stops all synced patterns.
            * @param {Object} params Stop options.
            * @param {Array.<Klang.Model.Pattern>} exceptions Patterns that should not be stopped.
            * @return {Klang.Model.Sequencer} Self
            */
            function (params) {
                var exceptions = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    exceptions[_i] = arguments[_i + 1];
                }
                var beat = params.beat != undefined ? params.beat : 4;
                var fadeTime = params.fadeTime || 1;
                var forceFade = params.forceFade || false;
                var wait = params.wait || 0;
                //this.reschedule();
                for(var ix = 0, len = this._registeredPatterns.length; ix < len; ix++) {
                    if(exceptions.indexOf(this._registeredPatterns[ix]) == -1) {
                        this._registeredPatterns[ix].forceFade = forceFade;
                        this._registeredPatterns[ix].stop(beat, true, fadeTime, wait);
                    }
                }
                return this;
            };
            Sequencer.prototype.restart = /**
            * Resets the sequencer to step 0.
            * @return {Klang.Model.Sequencer} Self
            */
            function () {
                this._currentStep = 0;
                return this;
            };
            Sequencer.prototype.registerPattern = /**
            * Registers a pattern for updates from this sequencer.
            * @param {Pattern} pattern Pattern that should receive updates.
            * @return {Klang.Model.Sequencer} Self
            */
            function (pattern) {
                this._registeredPatterns.push(pattern);
                return this;
            };
            Sequencer.prototype.unregisterPattern = /**
            * Unregisters a pattern for updates from this sequencer.
            * @param {Pattern} pattern Pattern that should stop receiving updates.
            * @return {Klang.Model.Sequencer} Self
            */
            function (pattern) {
                var index = this._registeredPatterns.indexOf(pattern);
                this._registeredPatterns.splice(index, 1);
                return this;
            };
            Sequencer.prototype.registerSynth = /**
            * Registers a synth for updates from this sequencer.
            * @param {Synth} synth Synth that should receive updates.
            * @return {Klang.Model.Sequencer} Self
            */
            function (synth) {
                if(this._registeredSynths.indexOf(synth) == -1) {
                    this._registeredSynths.push(synth);
                }
                return this;
            };
            Sequencer.prototype.unregisterSynth = /**
            * Unregisters a synth for updates from this sequencer.
            * @param {Synth} synth Synth that should stop receiving updates.
            * @return {Klang.Model.Sequencer} Self
            */
            function (synth) {
                var index = this._registeredPatterns.indexOf(synth);
                this._registeredSynths.splice(index, 1);
                return this;
            };
            Sequencer.prototype.sync = /**
            * Schedules the execution of a process synced to this sequencer.
            * @param {Process} process The process to schedule.
            * @param {number} beatModifier When to run the process.
            * @param {Array.<Object>} args Arguments to send to the process.
            * @return {Klang.Model.Sequencer} Self
            */
            function (process, beatModifier, args) {
                return this.syncInSteps(process, this.getStepsToNext(this.beatLength * beatModifier), args);
            };
            Sequencer.prototype.syncInSteps = /**
            * Schedules the execution of a process synced to this sequencer.
            * @param {Process} process The process to schedule.
            * @param {number} steps In how many steps to run the process
            * @param {Array.<Object>} args Arguments to send to the process.
            * @return {Klang.Model.Sequencer} Self
            */
            function (process, steps, args) {
                // Starta sequencern om den inte är igång
                if(!this._started) {
                    this.start();
                }
                var scheduleTime = this.getNoteTime(steps) + this._scheduleTime;
                //lägger alltid in sceduleTime som sista argument
                if(!args) {
                    args = [
                        scheduleTime
                    ];
                } else if(args.length) {
                    args.push(scheduleTime);
                }
                // Skapa en countdown för när actionen ska köras
                this._syncHandler.addSyncCountdown(new SyncCountdown(steps, process, args));
                return this;
            };
            Sequencer.prototype.syncPattern = /**
            * Schedules playback of a pattern.
            * @param {Object} params Sync options.
            * @param {Array.<Pattern>} patterns The patterns to start.
            * @return {Klang.Model.Sequencer} Self
            */
            function (params) {
                var patterns = [];
                for (var _i = 0; _i < (arguments.length - 1); _i++) {
                    patterns[_i] = arguments[_i + 1];
                }
                // Starta sequencern om den inte är igång
                var beat = params.beat || 0;
                var fadeIn = params.fadeIn || false;
                var duration = params.duration || 1;
                var absolute = params.absolute == undefined ? false : params.absolute;
                var syncType = params.syncType != undefined ? params.syncType : 3;
                var offset = params.offset;
                var wait = params.wait || 0;
                var steps;
                var first;
                if(!this._started) {
                    this._currentStep = 0;
                    this.start();
                    steps = beat = 0;
                    first = true;
                }
                /*
                Oklart om syncstep funkar för MidiPatterns.
                Eftersom MidiPatterns inte väntar ut takten utan går direkt till state 4.
                Syncstep synkar bara om patternet är i state 1 eller 2.
                */
                var syncStep;
                var restart = false;
                if(syncType === SyncType.Restart) {
                    // 0
                    syncStep = 0;
                    restart = true;
                } else if(syncType === SyncType.Playing) {
                    // 1
                    var longest = 0;
                    var longestId = -1;
                    for(var ix = 0, len = patterns.length; ix < len; ix++) {
                        if(patterns[ix].state === 1) {
                            if(patterns[ix].length > longest) {
                                longest = patterns[ix].length;
                                longestId = ix;
                            }
                        }
                    }
                    var nextBar = 0;
                    if(longestId > -1) {
                        nextBar = patterns[longestId].getNextBar(beat);
                    }
                    syncStep = nextBar * beat;
                    if(nextBar > 0 && wait > 0) {
                        syncStep += wait;
                    }
                } else if(syncType === SyncType.All) {
                    // 2
                    var longest = 0;
                    var longestId = -1;
                    for(var ix = 0, len = this._registeredPatterns.length; ix < len; ix++) {
                        if(this._registeredPatterns[ix].state === 1 || this._registeredPatterns[ix].state === 2) {
                            if(this._registeredPatterns[ix].length > longest) {
                                longest = this._registeredPatterns[ix].length;
                                longestId = ix;
                            }
                        }
                    }
                    var nextStep = 0;
                    if(longestId > -1) {
                        nextStep = this._currentStep + this.getStepsToNext(beat);
                    }
                    syncStep = nextStep;
                } else if(syncType === SyncType.Continue) {
                    // 3
                    syncStep = 0;
                    restart = first ? true : false;
                }
                if(absolute != false) {
                    if(typeof absolute == "number") {
                        steps = this.getStepsToNext(this.beatLength * absolute) + this.beatLength * beat;
                    } else {
                        steps = this.beatLength * beat;
                    }
                } else {
                    if(beat > 0) {
                        steps = this.getStepsToNext(this.beatLength * beat);
                    } else if(beat == 0) {
                        steps = 0;
                    }
                }
                if(wait > 0) {
                    steps += wait;
                }
                for(var ix = 0, len = patterns.length; ix < len; ix++) {
                    if(offset != undefined) {
                        offset = this.getNoteTime(offset);
                    }
                    patterns[ix].prePlaySchedule(steps, syncStep, restart, fadeIn, duration, offset);
                }
                // Fullösning för att första patternet ska starta direkt.
                // TODO: fixa
                if(first) {
                    // copy-pasta från reschedule
                    var scheduled = this._scheduleTime - Klang.context.currentTime;// hur lång tid som schemalaggts
                    
                    var resolutionTime = this.getNoteTime(this._resolution);
                    var scheduleOffset = scheduled > this._scheduleAheadTime ? (scheduled - this._scheduleAheadTime) : (scheduled - (this._scheduleAheadTime - resolutionTime));
                    this._scheduleTime = Klang.context.currentTime + scheduleOffset;
                    if(restart) {
                        this._currentStep = patterns[0]._currentStep - this._resolution// -this._resolution fixar att första patternet startar 1/16 för sent om restart
                        ;
                    } else {
                        this._currentStep = patterns[0]._currentStep;
                    }
                    first = false;
                } else if(this._scheduleAheadTime > 0.5) {
                    this.reschedule();
                }
                return this;
            };
            Sequencer.prototype.registerBPMSync = /**
            * Registers an object to be notified when the sequencers updates it's BPM.
            * @param {Object} obj Object to notify.
            * @return {Klang.Model.Sequencer} Self
            */
            function (obj) {
                if(this._syncedObjects.indexOf(obj) == -1) {
                    this._syncedObjects.push(obj);
                }
                return this;
            };
            Sequencer.prototype.getStepsToNext = /**
            * Calculate steps to the next specified beat.
            * @param {number} x Beat to calculate steps to
            * @return {number} Number calculated steps
            */
            function (x) {
                if(x == 0) {
                    return 0;
                }
                return x - (this._currentStep % x);
            };
            Sequencer.prototype.getNoteTime = /**
            * Gets the length of a note in seconds in this sequencer's tempo.
            * @param {number} note
            * @return {number} Length in seconds.
            */
            function (note) {
                if(note == undefined) {
                    note = 1;
                }
                return (60 / this._bpm) * note;
            };
            Sequencer.prototype.getBeatTime = /**
            * Get time when the specified beat will occur.
            * @param {number} x Beat to calculate time to.
            * @return {number} When the beat will occur.
            */
            function (x) {
                return this.getNoteTime(this.getStepsToNext(x)) + this._scheduleTime;
            };
            Object.defineProperty(Sequencer.prototype, "started", {
                get: /**
                * GETTERS / SETTERS
                *********************/
                /**
                * Whether the sequencer has started or not.
                * @type {boolean}
                */
                function () {
                    return this._started;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sequencer.prototype, "paused", {
                get: /**
                * Whether the sequencer is paused or not.
                * @type {boolean}
                */
                function () {
                    return this._paused;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sequencer.prototype, "bpm", {
                get: /**
                * The sequencer's current BPM.
                * @type {number}
                */
                function () {
                    return this._bpm;
                },
                set: function (value) {
                    this._bpm = value;
                    // Uppdatera bpm i midipatterns
                    for(var ix = 0, len = this._registeredPatterns.length; ix < len; ix++) {
                        if(this._registeredPatterns[ix]._type == "MidiPattern") {
                            this._registeredPatterns[ix].recalculateBPM(this._bpm);
                        }
                    }
                    // Uppdatera bpm i synkade objekt
                    for(var ix = 0, len = this._syncedObjects.length; ix < len; ix++) {
                        this._syncedObjects[ix].updateSync(this._bpm);
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sequencer.prototype, "scale", {
                set: /**
                * The scale for all registered midi patterns.
                * @type {string}
                */
                function (scale) {
                    // Uppdatera bpm i midipatterns
                    for(var ix = 0, len = this._registeredPatterns.length; ix < len; ix++) {
                        if(this._registeredPatterns[ix]._type == "MidiPattern") {
                            this._registeredPatterns[ix].scale = scale;
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sequencer.prototype, "customScale", {
                set: /**
                * The custom scale for all registered midi patterns.
                * @type {Object}
                */
                function (obj) {
                    // Uppdatera bpm i midipatterns
                    for(var ix = 0, len = this._registeredPatterns.length; ix < len; ix++) {
                        if(this._registeredPatterns[ix]._type == "MidiPattern") {
                            this._registeredPatterns[ix].customScale = obj;
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sequencer.prototype, "transpose", {
                set: /**
                * The transposition for all registered midi patterns.
                * @type {number}
                */
                function (transpose) {
                    // Uppdatera bpm i midipatterns
                    for(var ix = 0, len = this._registeredPatterns.length; ix < len; ix++) {
                        if(this._registeredPatterns[ix]._type == "MidiPattern") {
                            if(transpose === 0) {
                                this._registeredPatterns[ix].resetTranspose();
                            } else {
                                this._registeredPatterns[ix].transpose += transpose;
                            }
                        }
                    }
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sequencer.prototype, "resolution", {
                get: /**
                * The sequencer's resolution.
                * @type {number}
                */
                function () {
                    return this._resolution;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sequencer.prototype, "barLength", {
                get: /**
                * Length of a bar.
                * @type {number}
                */
                function () {
                    return this._barLength;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sequencer.prototype, "beatLength", {
                get: /**
                * Length of a beat.
                * @type {number}
                */
                function () {
                    return this._beatLength;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sequencer.prototype, "currentStep", {
                get: /**
                * The sequencer's current step.
                * @type {number}
                */
                function () {
                    return this._currentStep;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(Sequencer.prototype, "swingFactor", {
                set: function (val) {
                    this._swingFactor = val;
                },
                enumerable: true,
                configurable: true
            });
            return Sequencer;
        })();
        Model.Sequencer = Sequencer;        
        /*
        * Source: src/model/control/SyncCountdown.ts
        */
        /**
        * Handles syncing porocesses to a sequencer.
        * @param {number} targetStep When to run the process.
        * @param {Klang.Model.Process} What process to run.
        * @param {Array} Arguments for the process.
        * @constructor
        */
        var SyncCountdown = (function () {
            function SyncCountdown(targetStep, process, args) {
                this._currentStep = 0;
                this._targetStep = targetStep;
                this._process = process;
                this._args = args;
            }
            SyncCountdown.prototype.advance = /**
            * Step the countdown forward.
            * @param {number} step
            */
            function (step) {
                this._currentStep += step;
            };
            SyncCountdown.prototype.performAction = /**
            * Runs the process.
            */
            function () {
                if(typeof this._process == "string") {
                    new Function("Core", "Model", "Util", "args", this._process)(Core, Model, Util, this._args);
                } else {
                    this._process.start(this._args);
                }
            };
            Object.defineProperty(SyncCountdown.prototype, "finished", {
                get: /**
                * if the countdown has finished.
                * @type {boolean}
                */
                function () {
                    return this._currentStep >= this._targetStep;
                },
                enumerable: true,
                configurable: true
            });
            return SyncCountdown;
        })();
        Model.SyncCountdown = SyncCountdown;        
        /*
        * Source: src/model/control/SyncHandler.ts
        */
        /**
        * Handles all sync countdowns.
        * @constructor
        */
        var SyncHandler = (function () {
            function SyncHandler() {
                this._timers = [];
            }
            SyncHandler.prototype.addSyncCountdown = /**
            * Adds a sync countdown to this sync handler.
            * @param {number} countdown
            */
            function (countdown) {
                this._timers.push(countdown);
            };
            SyncHandler.prototype.update = /**
            * Updates all sync countdowns.
            * @param {number} step
            */
            function (step) {
                // Uppdatera alla räknare
                for(var ix = 0; ix < this._timers.length; ix++) {
                    var countdown = this._timers[ix];
                    countdown.advance(step);
                    if(countdown.finished) {
                        countdown.performAction();
                        // Ta bort räknaren och justera ix i loopen för att inte hoppa över något index
                        this._timers.splice(ix, 1);
                        ix--;
                    }
                }
            };
            return SyncHandler;
        })();
        Model.SyncHandler = SyncHandler;        
        /*
        * Source: src/model/control/TimeHandler.ts
        */
        /**
        * Handles timing that is not synced to a sequencer.
        * @constructor
        */
        var TimeHandler = (function () {
            function TimeHandler() {
                this._updateTime = Core.settings.timehandler_lookahead;
                this._callbacks = [];
            }
            TimeHandler.inst = null;
            Object.defineProperty(TimeHandler, "instance", {
                get: /**
                * The single instance.
                * @type {Klang.Model.TimeHandler}
                */
                function () {
                    if(TimeHandler.inst == null) {
                        TimeHandler.inst = new TimeHandler();
                    }
                    return TimeHandler.inst;
                },
                enumerable: true,
                configurable: true
            });
            TimeHandler.prototype.startScheduler = /**
            * Start the time handling scheduler.
            * @private
            */
            function () {
                // Om inga callbacks finns kvar stängs schemaläggaren av
                if(this._callbacks.length > 0) {
                    var currentTime = Klang.context.currentTime;
                    var deltaTime = currentTime - this._lastTime;
                    // Gå igenom alla callbacks och anropa funktionen om det är dags
                    for(var ix = 0; ix < this._callbacks.length; ix++) {
                        var callback = this._callbacks[ix];
                        callback.timePassed += deltaTime;
                        if(callback.timePassed >= callback.targetTime) {
                            callback.obj[callback.func]();
                            // Ta bort callbacken och justera ix i loopen för att inte hoppa över något index
                            this._callbacks.splice(ix, 1);
                            ix--;
                        }
                    }
                    this._lastTime = currentTime;
                    var _this = this;
                    this._scheduler = setTimeout(function () {
                        _this.startScheduler();
                    }, _this._updateTime);
                } else {
                    this.stop();
                }
            };
            TimeHandler.prototype.start = /**
            * Starts the scheduler.
            */
            function () {
                this._started = true;
                this._lastTime = Klang.context.currentTime;
                clearTimeout(this._scheduler);
                this.startScheduler();
            };
            TimeHandler.prototype.stop = /**
            * Stops the scheduler.
            */
            function () {
                this._started = false;
                clearTimeout(this._scheduler);
                this._scheduler = null;
            };
            TimeHandler.prototype.registerMethodCallback = /**
            * Registers a callback for a time.
            * @param {Object} obj Target object.
            * @param {Function} func Callback function.
            * @param {number} targetTime Target time.
            */
            function (obj, func, targetTime) {
                this._callbacks.push({
                    obj: obj,
                    func: func,
                    timePassed: 0,
                    targetTime: targetTime
                });
                if(!this._started) {
                    this.start();
                }
            };
            TimeHandler.prototype.removeMethodCallback = /**
            * Removes a previously added callback.
            * @param {Object} obj Obejct to remove.
            * @param {function} func Function to remove.
            */
            function (obj, func) {
                for(var ix = 0, len = this._callbacks.length; ix < len; ix++) {
                    var callback = this._callbacks[ix];
                    if(callback.obj == obj && callback.func == func) {
                        this._callbacks.splice(ix, 1);
                        return;
                    }
                }
            };
            return TimeHandler;
        })();
        Model.TimeHandler = TimeHandler;        
        /*
        * Source: src/model/control/Process.ts
        */
        /**
        * Base class for all process types. Processes runs a series of actions.
        * @param {Object} data Configuration data.
        * @constructor
        */
        var Process = (function () {
            function Process(data) {
                this._vars = data.vars;
                Core.instance.pushToPreLoadInitStack(this);
            }
            Process.prototype.init = /**
            * Initializes the process by getting references for the required variables.
            */
            function () {
                var success = true;
                // Gå igenom listan av variabelnamn och hämta referenser till objekten
                for(var ix = 0, len = this._vars.length; ix < len; ix++) {
                    var n = this._vars[ix];
                    var destination = Core.instance.findInstance(n);
                    if(destination) {
                        this._destination = this._actionData[n] = destination;
                    } else {
                        success = false;
                    }
                }
                if(success) {
                    this._vars = null;
                }
                return success;
            };
            Process.prototype.start = /**
            * Starts this process.
            * @param {Array.<Object>} args Arguments to pass to the process.
            */
            function (args) {
            };
            Process.prototype.destination = /**
            * Get destination
            */
            function () {
                return this._destination;
            };
            Process.prototype.execute = /**
            * Runs the process' actions.
            * @param {string} action Action to run.
            * @param {Array.<Object>} args Arguments to pass to the action.
            */
            function (action, args, noCache) {
                if(!this._func || noCache) {
                    this._func = new Function("Core", "Model", "Util", "me", "args", action);
                }
                // Skapa en anonym funktion och kalla på den direkt.
                // Funktionens kropp är strängen som skickats in som 'action',
                // 'me' och '_args' blir parametrar till funktionen.
                return this._func(Core, Model, Util, this._actionData, args);
            };
            return Process;
        })();
        Model.Process = Process;        
        /**
        * Runs actions instantaneously.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        */
        var SimpleProcess = (function (_super) {
            __extends(SimpleProcess, _super);
            function SimpleProcess(data, name) {
                        _super.call(this, data);
                this._name = name;
                this._type = data.type;
                this._action = data.action;
                this._actionData = {
                };
            }
            SimpleProcess.prototype.start = /**
            * Starts this process.
            * @param {Array.<Object>} args Arguments to pass to the process.
            */
            function (args) {
                try  {
                    this.execute(this._action, args);
                } catch (ex) {
                    Klang.err("Klang: error in process '" + this._name + "': " + ex.name + ": " + ex.message);
                }
            };
            return SimpleProcess;
        })(Process);
        Model.SimpleProcess = SimpleProcess;        
        /**
        * Executes a series of actions containing JavaScript code.
        * @param {Object} data Configuration data.
        * @param {string} name Identifying name.
        * @constructor
        */
        var AdvancedProcess = (function (_super) {
            __extends(AdvancedProcess, _super);
            function AdvancedProcess(data, name) {
                        _super.call(this, data);
                // start tid baserad på context-tid
                this._nextStartTime = 0;
                // start tid för nästa loop baserad på context-tid
                this._waitOffset = 0;
                // Totala wait-tiden per loop
                this.SCHEDULE_AHEAD_TIME = 0.2;
                //Tid för att schedulera ljudet
                this._lastTime = 0;
                this._name = name;
                this._type = data.type;
                this._preAction = data.pre_action || null;
                this._actions = data.actions;
                this._currentAction = 0;
                this._started = false;
                this._loop = data.loop != undefined ? data.loop : false;
                this._loopTime = data.loopTime || -1;
                this._actionData = {
                    process: this
                };
            }
            AdvancedProcess.prototype.start = /**
            * Starts this process.
            * @param {Array.<Object>} args Arguments to pass to the process.
            */
            function (args) {
                // avancerad process fuckas upp vid lång scroll på ios
                if(Klang.isIOS) {
                    return;
                }
                try  {
                    this._args = args;
                    this._currentAction = 0;
                    this._execTime = 0;
                    this._startTime = Klang.context.currentTime;
                    this._nextStartTime = this._startTime;
                    // Om preaction är av typen exec körs scriptet
                    if(this._preAction) {
                        if(this._preAction.operation == "exec") {
                            this.execute(this._preAction.script, this._args);
                        } else // Om det är en wait registreras cont som callback i TimeHandler och processen avbryts
                        if(this._preAction.operation == "wait") {
                            this._execTime = this.execute(this._preAction.script, this._args);
                            this._waitOffset += this._execTime;
                            if(this._execTime >= this.SCHEDULE_AHEAD_TIME) {
                                TimeHandler.instance.registerMethodCallback(this, "cont", this._execTime - (this.SCHEDULE_AHEAD_TIME / 2));
                            } else {
                                this.cont();
                            }
                            return;
                        }
                    }
                    this._started = true;
                    //Om ingen preaction kör igång direkt.
                    this.cont();
                } catch (ex) {
                    Klang.err("Klang: error in process '" + this._name + "': " + ex.name + ": " + ex.message);
                }
            };
            AdvancedProcess.prototype.cont = /**
            * Continues execution of this process after it has been paused.
            */
            function () {
                //sparar tiden som nästa exec ska köras på som en variabel i actionData
                this._actionData["execTime"] = this._nextStartTime + this._waitOffset;
                for(var len = this._actions.length; this._currentAction < len; this._currentAction++) {
                    // Avsluta om started har ändrats till false
                    if(!this._started) {
                        return;
                    }
                    var action = this._actions[this._currentAction];
                    // Om denna action är av typen exec körs scriptet
                    if(action.operation == "exec") {
                        this.execute(action.script, this._args, true);
                        this._execTime = 0;
                    } else // Om det är en wait registreras cont som callback i TimeHandler och processen avbryts
                    if(action.operation == "wait") {
                        this._execTime = this.execute(action.script, this._args, true);
                        this._waitOffset += this._execTime;
                        //om tiden är längre än SCHEDULE_AHEAD_TIME görs en timeout, annars fortsätter den schedulera till waitOffset är längre än SCHEDULE_AHEAD_TIME
                        if(this._execTime >= this.SCHEDULE_AHEAD_TIME) {
                            TimeHandler.instance.registerMethodCallback(this, "cont", this._execTime - (this.SCHEDULE_AHEAD_TIME / 2));
                        } else {
                            if(this._waitOffset > this.SCHEDULE_AHEAD_TIME) {
                                this.scheduleLoop(this._waitOffset);
                            } else {
                                this._currentAction++;
                                this.cont();
                            }
                        }
                        this._currentAction++;
                        return;
                    }
                }
                // Kör cont igen om processen ska loopa
                if(this._loop) {
                    if(this._loopTime > 0) {
                        this.scheduleLoop(this._loopTime);
                    } else {
                        this._waitOffset = 0;
                        this._currentAction = 0;
                        this.cont();
                    }
                }
            };
            AdvancedProcess.prototype.scheduleLoop = //kollar hur långt tid  det är kvar till loopTime och gör en timeout 0.1s innan.
            //Man kan specificera en loopTid i json filen som '"loopTime": 2' (sek) eller bara sätta loop till true som innan.
            /**
            * Scheules the looping of this process.
            * @param {number} loopTime Time to loop.
            * @private
            */
            function (loopTime) {
                if(!this._started) {
                    return;
                }
                this._nextStartTime += loopTime// start tid för nästa loop baserad på context tid.
                ;
                var timeTilNext = this._nextStartTime - Klang.context.currentTime;// tid till nästa loop ska starta
                
                var _this = this;
                var loopTimeoutId = setTimeout(function () {
                    _this._waitOffset = 0;
                    _this._currentAction = 0;
                    _this.cont();
                }, (timeTilNext - (this.SCHEDULE_AHEAD_TIME / 2)) * 1000);
            };
            AdvancedProcess.prototype.stop = /**
            * Stops execution of this process.
            */
            function () {
                this._started = false;
                // Ta bort callbacken till metoden cont från TimeHandler
                TimeHandler.instance.removeMethodCallback(this, "cont");
            };
            Object.defineProperty(AdvancedProcess.prototype, "started", {
                get: /**
                * Whether the process has started or not.
                * @type {boolean}
                */
                function () {
                    return this._started;
                },
                enumerable: true,
                configurable: true
            });
            return AdvancedProcess;
        })(Process);
        Model.AdvancedProcess = AdvancedProcess;        
    })(Model || (Model = {}));
    var Util;
    (function (Util) {
        /** @namespace Klang.Util */ /**
        * Sets the value of an audio param.
        * @param  {number} param What parameter to set.
        * @param  {number} value Value to set the parameter to.
        * @param  {number} when? When the value should be set.
        */
        function setParam(param, value, when) {
            param.setValueAtTime(value, when || Klang.context.currentTime);
        }
        Util.setParam = setParam;
        /**
        * Increments the value of an audio param.
        * @param  {number} param What parameter to increment.
        * @param  {number} value How much to increment the value.
        * @param  {number} when? When the value should be incremented.
        */
        function adjustParam(param, value, when) {
            param.setValueAtTime(param.value + value, when || Klang.context.currentTime);
        }
        Util.adjustParam = adjustParam;
        /**
        * Curves a parameter's value linearly over time.
        * @param  {number} param What parameter to curve.
        * @param  {number} value Target value of the parameter.
        * @param  {number} duration Length of the curve in seconds.
        * @param  {number} when? When the value should be at the target.
        */
        function curveParamLin(param, value, duration, when, startValue) {
            when = when || Klang.context.currentTime;
            var startAt = param.value;
            if(startValue != undefined && Klang.browser == "Firefox") {
                startAt = startValue;
            }
            param.setValueAtTime(startAt, when);
            param.linearRampToValueAtTime(value, Klang.context.currentTime + duration);
        }
        Util.curveParamLin = curveParamLin;
        /**
        * Curves a parameter's value exponentially over time.
        * @param  {number} param What parameter to curve.
        * @param  {number} value Target value of the parameter.
        * @param  {number} duration Length of the curve in seconds.
        * @param  {number} when? When the value should be at the target.
        */
        function curveParamExp(param, value, duration, when, startValue) {
            when = when || Klang.context.currentTime;
            var startAt = param.value;
            if(startValue != undefined && Klang.browser == "Firefox") {
                startAt = startValue;
            }
            param.setValueAtTime(startAt == 0 ? Util.EXP_MIN_VALUE : startAt, when);
            param.exponentialRampToValueAtTime(value, Klang.context.currentTime + duration);
        }
        Util.curveParamExp = curveParamExp;
        /**
        * Curves a parameter's value with a custom curve.
        * @param  {number} param What parameter to curve.
        * @param  {string} curve Curve to use.
        * @param  {number} duration Length of the curve in seconds.
        * @param  {number} when? When the value should be at the target.
        */
        function curveParam(param, curve, duration, when) {
            when = when || Klang.context.currentTime;
            param.setValueCurveAtTime(Util.CUSTOM_CURVES[curve], when, duration);
        }
        Util.curveParam = curveParam;
        Util.CUSTOM_CURVES = {
        };
        function createCurves(data) {
            for(var name in data) {
                var cdata = data[name];
                // Om man anger en array av värden används värdena som en kurva
                if(cdata instanceof Array) {
                    var curve = new Float32Array(cdata.length);
                    for(var ix = 0, len = cdata.length; ix < len; ix++) {
                        curve[ix] = cdata[ix];
                    }
                } else// Annars
                 {
                    if(!cdata.resolution) {
                        cdata.resolution = 1024;
                    }
                    if(!cdata.amplitude) {
                        cdata.amplitude = 1;
                    }
                    if(!cdata.amplitude_offset) {
                        cdata.amplitude_offset = 0;
                    }
                    if(!cdata.phase_offset) {
                        cdata.phase_offset = 0;
                    }
                    if(!cdata.length) {
                        cdata.length = 1;
                    }
                    var curve = new Float32Array(cdata.resolution);
                    if(cdata.curve_type == "sine") {
                        var phase_offset = cdata.phase_offset * Math.PI * 2;
                        var length = cdata.length * Math.PI * 2;
                        for(var ix = 0, len = curve.length; ix < len; ix++) {
                            curve[ix] = cdata.amplitude_offset + Math.sin(phase_offset + (ix / len) * length) * cdata.amplitude;
                        }
                    } else // TODO: Lägg in fasförtjutning och längd
                    if(cdata.curve_type == "saw") {
                        for(var ix = 0, len = curve.length; ix < len; ix++) {
                            curve[ix] = cdata.amplitude_offset + ((len - ix) / len) * cdata.amplitude;
                        }
                    } else if(cdata.curve_type == "inverse-saw") {
                        for(var ix = 0, len = curve.length; ix < len; ix++) {
                            curve[ix] = cdata.amplitude_offset + (ix / len) * cdata.amplitude;
                        }
                    } else {
                    }
                    Util.CUSTOM_CURVES[name] = curve;
                }
            }
        }
        Util.createCurves = createCurves;
        if(navigator.userAgent.indexOf('MSIE') != -1) {
            var ie = true;
            var ua = navigator.userAgent;
            var re = new RegExp("MSIE ([0-9]{1,}[.0-9]{0,})");
            var ieVersion;
            if(re.exec(ua) != null) {
                ieVersion = parseInt(RegExp.$1);
            }
            // Resets defineProperty for IE8
            if(ieVersion < 9) {
                Object.defineProperty = Object['oldDefineProperty'];
                delete Object['oldDefineProperty'];
            }
        }
        /**
        * Second root of 12
        * @const {Number}
        */
        Util.ROOT12 = 1.059463094359295;// andra roten ur 12
        
        /**
        * Nyquist frequency at sample rate 44100
        * @const {Number}
        */
        Util.NYQUIST_FREQUENCY = 22050;
        /**
        * FFT size when pitch shifting samples.
        * @const {Number}
        */
        Util.PITCH_SHIFT_FFT = 2048;
        /**
        * Value to start from when ramping exponentially instead of 0.
        * @const {Number}
        */
        Util.EXP_MIN_VALUE = 0.0001;
        /**
        * Oscillator start time delay.
        * @const {Number}
        */
        Util.OSC_START_DELAY = 0.005;
        /**
        * Color of the time stamp in debug logs
        * @const {string}
        */
        Util.LOG_TIME_COLOR = "#999999";
        Util.LOG_EVENT_COLOR = "#54CBDD";
        Util.LOG_UNIMPLEMENTED_EVENT_COLOR = "#E075A9";
        Util.LOG_LOAD_COLOR = "#333333";
        Util.LOG_WARN_COLOR = "DarkOrange";
        Util.LOG_ERROR_COLOR = "Red";
        /**
        * Name of the last event that was received.
        */
        Util.lastEvent = undefined;
        /**
        * Includes project specific variables.
        */
        Util.vars = {
        };
        /**
        * Generates a random integer in a range.
        * @param  {number} max Max value to be generated.
        * @param  {number} min? Min value to be generated.
        * @return {number} The randomly generated number.
        */
        function random(max, min) {
            min != undefined ? min : 1;
            return Math.floor(min + (1 + max - min) * Math.random());
        }
        Util.random = random;
        /**
        * Generates a random float in a range.
        * @param  {number} max max value to be generated.
        * @param  {number} min? Min value to be generated.
        * @return {number} The randomly generated number.
        */
        function randomFloat(max, min) {
            min != undefined ? min : 1;
            return min + (max - min) * Math.random();
        }
        Util.randomFloat = randomFloat;
        /**
        * Eases the change of a numeric value.
        * @param {number} current Current value.
        * @param {number} delta Change of the value to be eased.
        * @param {number} ease Easing factor, defaults to 3.
        * @return {number} Eased value.
        */
        function ease(current, delta, ease) {
            if (typeof ease === "undefined") { ease = 3; }
            return current - (current - delta) / ease;
            //vol -= (vol-speed)/ease
                    }
        Util.ease = ease;
        /**
        * Gets the current web audio api time in seconds.
        * @return {number} The current time.
        */
        function now() {
            return Klang.context.currentTime;
        }
        Util.now = now;
        /**
        * Converts a midi note number to frequency.
        * http://www.dzone.com/snippets/midi-note-number-and-frequency
        * @param {number} note Which note to convert
        * @return {number} The note's frequency.
        */
        function midiNoteToFrequency(note) {
            return 440 * Math.pow(2, (note - 69) / 12);
        }
        Util.midiNoteToFrequency = midiNoteToFrequency;
        /**
        * Converts a frequency to midi note.
        * @param {number} freq Frequency to convert.
        * @return {number} Note number of the frequency.
        */
        function frequencyToMidiNote(freq) {
            return 69 + 12 * Math.log(freq / 440) / Math.log(2);
        }
        Util.frequencyToMidiNote = frequencyToMidiNote;
        /**
        * Returns the correct filter type for the current browser;
        * @param  {Object} filterType Filter type to check
        * @return {Object} Filter types matching the browser's capabilities.
        */
        function safeFilterType(filterType) {
            if(filterType == undefined) {
                // if (Klang.safari) {
                //     return 0;
                // }
                // else {
                return "lowpass";
                // }
                            }
            // fixed in polyfill.js
            // // firefox does not handle filter type as number
            // if (Klang.browser == "Firefox") {
            //     if (typeof filterType == "number") {
            //         switch (filterType) {
            //             case 0: return "lowpass";
            //             case 1: return "highpass";
            //             case 2: return "bandpass";
            //             case 3: return "lowshelf";
            //             case 4: return "highshelf";
            //             case 5: return "peaking";
            //             case 6: return "notch";
            //             case 7: return "allpass";
            //             default: return "lowpass";
            //         }
            //     }
            //     else {
            //         return filterType;
            //     }
            // }
            // // old safari does not handle filter type as string
            // else if (Klang.safari) {
            //     if (typeof filterType == "string") {
            //         switch (filterType) {
            //             case "lowpass": return 0;
            //             case "highpass": return 1;
            //             case "bandbass": return 2;
            //             case "lowshelf": return 3;
            //             case "highshelf": return 4;
            //             case "peaking": return 5;
            //             case "notch": return 6;
            //             case "allpass": return 7;
            //             default: return 0;
            //         }
            //     }
            //     else {
            //         return filterType;
            //     }
            // }
            // other implementations are fine with either
            return filterType;
        }
        Util.safeFilterType = safeFilterType;
        /**
        * Checks if the user is on a mobile device.
        * @return {boolean} True if the user is on a mobile.
        */
        function checkMobile() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        }
        Util.checkMobile = checkMobile;
        /**
        * Checks if the user is on an iOS device.
        * @return {boolean} True if the user is using iOS
        */
        function checkIOS() {
            return /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
        }
        Util.checkIOS = checkIOS;
        /**
        * Sets whether or not to fade out audio when window loses focus.
        * @param {boolean} state Fade state
        */
        function setBlurFadeOut(state) {
            Core.instance.blurFadeOut = state;
        }
        Util.setBlurFadeOut = setBlurFadeOut;
        function getParameterByName(name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
            return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        }
        Util.getParameterByName = getParameterByName;
        /**
        * Stops playing all audio loops, patterns and advanced processes.
        * @param  {Object} ...exceptions Names of all objects that should keep playing.
        */
        function stopPlayingExcept() {
            var exceptions = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                exceptions[_i] = arguments[_i + 0];
            }
            // argument till sequencer, fyll på med de patterns som inte ska stoppas
            var sequencerArgs = [
                {
                    beat: 0,
                    fadeOut: 2
                }
            ];
            for(var ix = exceptions.length - 1; ix >= 0; ix--) {
                var instance = Core.instance.findInstance(exceptions[ix]);
                if(instance.type == "Pattern") {
                    sequencerArgs.push(exceptions[ix]);
                }
            }
            // Stoppa allt som ska stoppas
            var objects = Core.instance._objectTable;
            for(var o in Core.instance._objectTable) {
                var obj = objects[o];
                if(obj._type == "AudioSource" && exceptions.indexOf(o) == -1) {
                    if(obj.loop && obj.playing) {
                        obj.fadeOutAndStop(1);
                    }
                } else if(obj._type == "Sequencer") {
                    obj.stopAll.apply(obj, sequencerArgs);
                } else if(obj._type == "AdvancedProcess") {
                    if(obj.started && exceptions.indexOf(o) == -1) {
                        obj.stop();
                    }
                }
            }
        }
        Util.stopPlayingExcept = stopPlayingExcept;
        /**
        * Shuffles an array
        * @param {Array} array Array to shuffle
        * @private
        */
        function shuffle(array) {
            var counter = array.length, temp, index;
            // While there are elements in the array
            while(counter--) {
                // Pick a random index
                index = (Math.random() * counter) | 0;
                // And swap the last element with it
                temp = array[counter];
                array[counter] = array[index];
                array[index] = temp;
            }
            return array;
        }
        Util.shuffle = shuffle;
        function logFreq(value) {
            if(value == 0) {
                return 0;
            }
            var min = 20;
            var max = 20000;
            if(min == 0) {
                min = 0.01;
            }
            var position = value;
            // position will be between 0 and 100
            var minp = min;
            var maxp = max;
            // The result should be between 100 an 10000000
            var minv = Math.log(minp);
            var maxv = Math.log(maxp);
            // calculate adjustment factor
            var scale = (maxv - minv) / (maxp - minp);
            return (Math.exp(minv + scale * (position - minp)));
        }
        Util.logFreq = logFreq;
        /**
        *   Warning, No guarantee that this will be unique
        *
        */
        function generateIdString(len) {
            var seed = '';
            while(seed.length < len) {
                seed += '0';
            }
            return (seed + (Math.random() * Math.pow(36, len) << 0).toString(36)).slice(-len);
        }
        Util.generateIdString = generateIdString;
        function clone(obj) {
            if(obj == null || typeof obj !== 'object') {
                return obj;
            }
            var temp = obj.constructor();// changed
            
            for(var key in obj) {
                if(obj.hasOwnProperty(key)) {
                    temp[key] = clone(obj[key]);
                }
            }
            return temp;
        }
        Util.clone = clone;
    })(Util || (Util = {}));
})(Klang || (Klang = {}));
return Klang;}));
