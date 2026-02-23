class AmbientMixer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.sounds = [
            { id: 'rain', label: 'Soft Rain', icon: '🌧️', url: 'https://actions.google.com/sounds/v1/water/rain_on_roof.pid' },
            { id: 'wind', label: 'Soft Wind', icon: '🌬️', url: 'https://actions.google.com/sounds/v1/weather/wind_heavy_swirl.pid' },
            { id: 'white', label: 'White Noise', icon: '🌫️', url: 'https://actions.google.com/sounds/v1/foley/static_noise.pid' },
            { id: 'waves', label: 'Deep Ocean', icon: '🌊', url: 'https://actions.google.com/sounds/v1/water/waves_crashing_on_shore.pid' }
        ];
        this.audioElements = {};
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .mixer-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.2rem;
                }
                .sound-control {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    background: oklch(100% 0 0 / 0.02);
                    padding: 1rem 1.5rem;
                    border-radius: 20px;
                    border: 1px solid oklch(100% 0 0 / 0.05);
                    transition: all 0.5s ease;
                }
                .sound-control:hover {
                    background: oklch(100% 0 0 / 0.04);
                    border-color: oklch(100% 0 0 / 0.1);
                }
                .label {
                    flex: 1;
                    font-size: 0.85rem;
                    font-weight: 300;
                    letter-spacing: 0.05em;
                    color: var(--text-secondary);
                }
                input[type="range"] {
                    width: 100px;
                    accent-color: var(--accent-forest);
                    cursor: pointer;
                    opacity: 0.3;
                    transition: opacity 0.3s;
                }
                input[type="range"]:hover {
                    opacity: 0.8;
                }
                .play-pause {
                    background: none;
                    border: none;
                    color: var(--text-primary);
                    cursor: pointer;
                    opacity: 0.3;
                    transition: all 0.3s;
                }
                .play-pause.active {
                    opacity: 1;
                    color: var(--accent-forest);
                }
            </style>
            <div class="mixer-grid">
                ${this.sounds.map(sound => `
                    <div class="sound-control">
                        <div class="label">${sound.label}</div>
                        <input type="range" min="0" max="1" step="0.01" value="0.5" class="volume-slider" data-id="${sound.id}">
                        <button class="play-pause" data-id="${sound.id}">
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;

        this.setupAudio();
        this.setupEventListeners();
    }

    setupAudio() {
        this.sounds.forEach(sound => {
            try {
                const audio = new Audio(sound.url);
                audio.loop = true;
                this.audioElements[sound.id] = audio;
            } catch (e) {
                console.warn(`Audio init failed for ${sound.label}`);
            }
        });
    }

    setupEventListeners() {
        this.shadowRoot.querySelectorAll('.play-pause').forEach(btn => {
            btn.onclick = () => this.toggleSound(btn.dataset.id, btn);
        });

        this.shadowRoot.querySelectorAll('.volume-slider').forEach(slider => {
            slider.oninput = (e) => {
                const id = slider.dataset.id;
                if (this.audioElements[id]) {
                    this.audioElements[id].volume = e.target.value;
                }
            };
        });
    }

    toggleSound(id, btn) {
        const audio = this.audioElements[id];
        if (!audio) return;

        if (audio.paused) {
            audio.play().then(() => {
                btn.classList.add('active');
                btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
            }).catch(() => {
                console.log("Interaction required to play audio.");
            });
        } else {
            audio.pause();
            btn.classList.remove('active');
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
    }
}

customElements.define('ambient-mixer', AmbientMixer);
