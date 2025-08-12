/**
 * StreamPublishAnalytics displays real-time stream statistics for a published stream.
 */

import { ComponentCommon } from './component-common.js';

const stylePath = ComponentCommon.getComponentCssConfig('stream-publish-analytics');
const bootstrapPath = ComponentCommon.getBootstrapCss();
const commonStylePath = ComponentCommon.getCommonCss();

const templateHtml = document.createElement('template');
templateHtml.innerHTML = `
    <link rel="stylesheet" href="${bootstrapPath}">
    <link rel="stylesheet" href="${stylePath}">
    <link rel="stylesheet" href="${commonStylePath}">
    <div class="card">
        <div class="card-header collapsible-header" id="header" data-toggle="collapse" data-target="#collapse-body" aria-expanded="true" aria-controls="collapse-body">
            <span>Publish Statistics</span>
            <span id="status-badge" class="badge stream-status-offline ml-2">Stream Offline</span>
        </div>
        <div id="collapse-body" class="collapse show">
            <div class="card-body">
                <div id="offline-message" class="text-center text-muted p-4">
                    <p><strong>Stream is offline</strong></p>
                    <p>Please start publishing to view real-time statistics and charts</p>
                </div>
                <div id="stats-content" style="display: none;">
                    <div class="stats-grid">
                        <div class="stat-item">Avg. Bitrate: <span id="avg-bitrate">N/A</span> Kbps</div>
                        <div class="stat-item">Current Bitrate: <span id="current-bitrate">N/A</span> Kbps</div>
                        <div class="stat-item">Packet Loss: <span id="packet-loss">N/A</span></div>
                        <div class="stat-item">Jitter: <span id="jitter">N/A</span></div>
                        <div class="stat-item">RTT: <span id="rtt">N/A</span></div>
                        <div class="stat-item">Resolution: <span id="resolution">N/A</span></div>
                        <div class="stat-item">FPS: <span id="fps">N/A</span></div>
                        <div class="stat-item">Audio Level: <meter id="audio-level" high="0.25" max="1" value="0"></meter></div>
                    </div>
                    <div class="charts-container">
                        <div class="chart-wrapper">
                            <canvas id="bitrate-chart"></canvas>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="fps-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
`;

const audioLevelRefreshRate = 250;

class StreamPublishAnalytics extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(templateHtml.content.cloneNode(true));
        this._adaptor = null;
        this._bitrateChart = null;
        this._fpsChart = null;
        this._bitrateData = [];
        this._startTime = Date.now();
        this._audioLevelTimerId = -1;
    }

    connectedCallback() {
        this._initCollapse();
        this._initCharts();
    }

    _initCollapse() {
        if (typeof $ === 'function' && $.fn.collapse) {
            const header = this.shadowRoot.getElementById('header');
            const body = this.shadowRoot.getElementById('collapse-body');
            
            $(body).on('show.bs.collapse hide.bs.collapse', (e) => {
                header.setAttribute('aria-expanded', e.type === 'show');
            });

            header.addEventListener('click', () => {
                $(body).collapse('toggle');
            });
        }
    }

    _initCharts() {
        this._bitrateChart = new Chart(this.shadowRoot.getElementById('bitrate-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: 'Avg', data: [], borderColor: 'rgb(54, 162, 235)', tension: 0.1 },
                    { label: 'Current', data: [], borderColor: 'rgb(255, 99, 132)', tension: 0.1 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });

        this._fpsChart = new Chart(this.shadowRoot.getElementById('fps-chart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{ label: 'FPS', data: [], borderColor: 'rgb(75, 192, 192)', tension: 0.1 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    setup(adaptor) {
        this._adaptor = adaptor;
        this._adaptor.addEventListener((info, obj) => {
            if (info === "publish_started") {
                this.shadowRoot.getElementById('status-badge').style.display = 'none';
                this.shadowRoot.getElementById('offline-message').style.display = 'none';
                this.shadowRoot.getElementById('stats-content').style.display = 'block';
                this._adaptor.enableStats(obj.streamId);
                this._startAudioMeter(obj.streamId);
            } else if (info === "publish_finished") {
                this.shadowRoot.getElementById('status-badge').style.display = 'inline';
                this.shadowRoot.getElementById('offline-message').style.display = 'block';
                this.shadowRoot.getElementById('stats-content').style.display = 'none';
                this._stopAudioMeter();
            } else if (info === "updated_stats") {
                this._updateStats(obj);
            }
        });
    }

    _updateStats(stats) {
        this.shadowRoot.getElementById('avg-bitrate').textContent = stats.averageOutgoingBitrate || 'N/A';
        this.shadowRoot.getElementById('packet-loss').textContent = (parseInt(stats.videoPacketsLost) + parseInt(stats.audioPacketsLost)) || 'N/A';
        this.shadowRoot.getElementById('jitter').textContent = ((parseFloat(stats.videoJitter) + parseFloat(stats.audioJitter)) / 2).toPrecision(3) || 'N/A';
        this.shadowRoot.getElementById('rtt').textContent = ((parseFloat(stats.videoRoundTripTime) + parseFloat(stats.audioRoundTripTime)) / 2).toPrecision(3) || 'N/A';
        this.shadowRoot.getElementById('resolution').textContent = stats.resWidth && stats.resHeight ? `${stats.resWidth}x${stats.resHeight}` : 'N/A';
        this.shadowRoot.getElementById('fps').textContent = stats.currentFPS || 'N/A';

        this._updateCurrentBitrate(stats.currentOutgoingBitrate || 0);
        this._updateCharts(stats);
    }

    _updateCurrentBitrate(bitrate) {
        const now = Date.now();
        this._bitrateData.push({ time: now, value: bitrate });
        this._bitrateData = this._bitrateData.filter(d => now - d.time <= 1000);
        
        const avg = this._bitrateData.length ? 
            this._bitrateData.reduce((sum, d) => sum + d.value, 0) / this._bitrateData.length : 0;
        
        this.shadowRoot.getElementById('current-bitrate').textContent = avg.toFixed(0);
    }

    _updateCharts(stats) {
        const secondsElapsed = Math.floor((Date.now() - this._startTime) / 1000);
        const timeLabel = `${Math.floor(secondsElapsed / 60)}:${(secondsElapsed % 60).toString().padStart(2, '0')}`;
        const maxPoints = 60;

        const bitrateData = this._bitrateChart.data;
        if (bitrateData.labels.length >= maxPoints) {
            bitrateData.labels.shift();
            bitrateData.datasets.forEach(d => d.data.shift());
        }
        bitrateData.labels.push(timeLabel);
        bitrateData.datasets[0].data.push(stats.averageOutgoingBitrate || 0);
        bitrateData.datasets[1].data.push(stats.currentOutgoingBitrate || 0);
        this._bitrateChart.update('none');

        const fpsData = this._fpsChart.data;
        if (fpsData.labels.length >= maxPoints) {
            fpsData.labels.shift();
            fpsData.datasets[0].data.shift();
        }
        fpsData.labels.push(timeLabel);
        fpsData.datasets[0].data.push(stats.currentFPS || 0);
        this._fpsChart.update('none');
    }

    _startAudioMeter(streamId) {
        this._stopAudioMeter();
        this._audioLevelTimerId = setInterval(() => {
            if (!this._adaptor || !this._adaptor.remotePeerConnection[streamId]) {
                return;
            }

            this._adaptor.remotePeerConnection[streamId].getStats(null).then(stats => {
                for (const stat of stats.values()) {
                    if (stat.type !== 'media-source') {
                        continue;
                    }

                    if (stat.kind === 'audio' && stat.audioLevel) {
                        this.shadowRoot.getElementById('audio-level').value = stat.audioLevel;
                        return;
                    }
                }
            }).catch(e => console.error(e));
        }, audioLevelRefreshRate);
    }

    _stopAudioMeter() {
        if (this._audioLevelTimerId !== -1) {
            clearInterval(this._audioLevelTimerId);
            this._audioLevelTimerId = -1;
        }
        this.shadowRoot.getElementById('audio-level').value = 0;
    }
}

window.customElements.define('stream-publish-analytics', StreamPublishAnalytics); 