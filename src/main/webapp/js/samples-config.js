/// All configuration for samples should be propagated to this class here, so that we have all config at one place

export class SamplesConfig {
    static getBackendUrl() {
        const parts = location.pathname.split("/").filter(Boolean);
        const rootUrl = `${location.origin}/${parts[0]}/`;

        return new URL(rootUrl);
    }

    static getConferenceUrl() {
        return new URL(`${location.origin}/circleTest/`);
    }
  }