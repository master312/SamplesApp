/// All configuration for samples should be propagated to this class here, so that we have all config at one place

export class SamplesConfig {
    static getBackendUrl() {
        return new URL("http://localhost:5080/WebRTCAppEE/");
    }

    static getConferenceUrl() {
        return new URL("http://localhost:5080/Conference/");
    }
  }