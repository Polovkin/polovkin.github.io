/*
const audio = document.querySelector('.speedcontrolcontainer  audio');
const playbackrate = document.querySelector('.speedcontrolcontainer input');
const display = document.querySelector('.speedcontrolcontainer span');
const displayvalue = val => {
  return parseInt(val * 100, 10) + '%'
}
if (window.localStorage.pbspeed) {
  audio.playbackRate = window.localStorage.pbspeed;
  playbackrate.value = window.localStorage.pbspeed;
}
display.innerText = displayvalue(audio.playbackRate);
playbackrate.addEventListener('change', e => {
  audio.playbackRate = playbackrate.value;
  display.innerText = displayvalue(playbackrate.value);
  window.localStorage.pbspeed = playbackrate.value;
});
*/
console.log(321)

import {
  SuperpoweredWebAudio,
  SuperpoweredTrackLoader,
  SuperpoweredGlue
} from "../static/superpowered/SuperpoweredWebAudio.js";

const superPoweredWasmLocation = "/static/superpowered/superpowered.wasm";
const playerProcessorUrl = "/static/processors/playerProcessor.js";

const minimumSampleRate = 48000;

class DemoApplication {
  constructor() {
    this.webaudioManager = null;
    this.processorNode = null;
    this.startButtonRef = document.getElementById("startButton");
    this.playerVolumeRef = document.getElementById("playerVolumeSlider");
    this.playerSpeedRef = document.getElementById("playerSpeedSlider");
    this.playerPitchRef = document.getElementById("playerPitchSlider");
    this.loadAssetButtonRef = document.getElementById("loadAssetButton");
    this.trackLoadingStatusRef = document.getElementById("trackLoadStatus");
    this.startApp();
  }

  onMessageProcessorAudioScope(message) {
    if (message.event === "ready") {
      this.trackLoadingStatusRef.innerHTML = "Press download & play, wait 10-15 seconds and change the speed. Track starts with silence about 10 seconds in.";
    }
    if (message.event === "assetLoaded") {
      this.loadAssetButtonRef.style.display = "none";
      this.playerVolumeRef.disabled = false;
      this.playerSpeedRef.disabled = false;
      this.playerPitchRef.disabled = false;
      this.trackLoadingStatusRef.style.display = "none";
    }
  }

  onParamChange(id, value) {
    this.processorNode.sendMessageToAudioScope({
      type: "parameterChange",
      payload: {
        id,
        value
      }
    });
  }

  async startApp() {
    this.superpowered = await SuperpoweredGlue.fetch(superPoweredWasmLocation);
    this.superpowered.Initialize({
      licenseKey: "ExampleLicenseKey-WillExpire-OnNextUpdate"
    });
    console.log(`Running Superpowered v${this.superpowered.Version()}`);
    this.webaudioManager = new SuperpoweredWebAudio(
      minimumSampleRate,
      this.superpowered
    );

    // Now create the AudioWorkletNode, passing in the AudioWorkletProcessor url, it's registered name (defined inside the processor) and a callback then gets called when everything is up a ready
    this.processorNode = await this.webaudioManager.createAudioNodeAsync(
      playerProcessorUrl,
      "PlayerProcessor",
      this.onMessageProcessorAudioScope.bind(this)
    );
    this.processorNode.onprocessorerror = (e) => {
      console.error(e);
    };
    this.webaudioManager.audioContext.suspend();
    // Connect the AudioWorkletNode to the WebAudio destination (speakers);
    this.processorNode.connect(this.webaudioManager.audioContext.destination);
  }

  loadTrack() {
    this.trackLoadingStatusRef.innerHTML = "Downloading and decoding track...";
    this.webaudioManager.audioContext.resume();
    const loadedCallback = this.processorNode.sendMessageToAudioScope.bind(
      this.processorNode
    );
    SuperpoweredTrackLoader.downloadAndDecode(
      "/static/audio/test.mp3",
      loadedCallback
    );
  }
}

const demoApplication = new DemoApplication();

//exposes methods to window for UI
window.startApp = demoApplication.startApp.bind(demoApplication);
window.loadTrack = demoApplication.loadTrack.bind(demoApplication);
window.onParamChange = demoApplication.onParamChange.bind(demoApplication);

