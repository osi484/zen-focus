class AmbientMixer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // 가장 안정적인 Google Actions 정식 MP3 리소스로 교체
        this.sounds = [
            { id: 'rain', label: 'Soft Rain', url: 'https://actions.google.com/sounds/v1/water/rain_on_roof.mp3' },
            { id: 'wind', label: 'Soft Wind', url: 'https://actions.google.com/sounds/v1/weather/wind_heavy_swirl.mp3' },
            { id: 'forest', label: 'Nature Ambient', url: 'https://actions.google.com/sounds/v1/nature/forest_ambience.mp3' },
            { id: 'white', label: 'White Noise', url: 'https://actions.google.com/sounds/v1/foley/static_noise.mp3' }
        ];
        this.audioElements = {};
    }

    connectedCallback() {
        this.render();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host { display: block; }
                .mixer-grid { display: grid; grid-template-columns: 1fr; gap: 1.2rem; }
                .sound-control {
                    display: flex; align-items: center; gap: 1.5rem;
                    background: oklch(100% 0 0 / 0.02); padding: 1rem 1.5rem;
                    border-radius: 20px; border: 1px solid oklch(100% 0 0 / 0.05);
                    transition: all 0.5s ease;
                }
                .label { flex: 1; font-size: 0.85rem; font-weight: 300; letter-spacing: 0.05em; color: var(--text-secondary); }
                input[type="range"] { 
                    width: 100px; accent-color: var(--accent-forest); cursor: pointer; 
                    opacity: 0.3; transition: opacity 0.3s;
                }
                input[type="range"]:hover { opacity: 0.8; }
                .play-pause {
                    background: none; border: none; color: var(--text-primary); cursor: pointer;
                    opacity: 0.3; transition: all 0.3s; display: flex; align-items: center;
                    padding: 5px;
                }
                .play-pause.active { opacity: 1; color: var(--accent-forest); }
                .play-pause svg { pointer-events: none; } /* 클릭 방해 방지 */
            </style>
            <div class="mixer-grid">
                ${this.sounds.map(sound => `
                    <div class="sound-control">
                        <div class="label">${sound.label}</div>
                        <input type="range" min="0" max="1" step="0.01" value="0.5" class="volume-slider" data-id="${sound.id}">
                        <button class="play-pause" data-id="${sound.id}" aria-label="Play ${sound.label}">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        this.setupEventListeners();
    }

    // 오디오 객체 관리 및 에러 핸들링 강화
    getOrCreateAudio(id) {
        if (!this.audioElements[id]) {
            const sound = this.sounds.find(s => s.id === id);
            const audio = new Audio();
            audio.src = sound.url;
            audio.loop = true;
            audio.crossOrigin = "anonymous"; // CORS 이슈 방지
            
            // 볼륨 설정
            const slider = this.shadowRoot.querySelector(`.volume-slider[data-id="${id}"]`);
            audio.volume = slider ? slider.value : 0.5;

            audio.onerror = () => {
                console.error(`사운드 로드 실패: ${sound.label}`);
                alert(`${sound.label} 소리를 불러오는 데 실패했습니다. 네트워크 연결을 확인해 주세요.`);
            };

            this.audioElements[id] = audio;
        }
        return this.audioElements[id];
    }

    setupEventListeners() {
        this.shadowRoot.querySelectorAll('.play-pause').forEach(btn => {
            btn.onclick = (e) => {
                const id = btn.dataset.id;
                this.toggleSound(id, btn);
            };
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
        const audio = this.getOrCreateAudio(id);

        if (audio.paused) {
            // 재생 시도 (Promise 처리)
            audio.play().then(() => {
                btn.classList.add('active');
                btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
            }).catch(err => {
                console.warn("재생 실패:", err);
                // 브라우저 정책 알림
                if (err.name === 'NotAllowedError') {
                    alert("브라우저 보안 정책에 따라, 페이지의 빈 공간을 아무 곳이나 한 번 클릭하신 후 다시 버튼을 눌러주세요.");
                }
            });
        } else {
            audio.pause();
            btn.classList.remove('active');
            btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
        }
    }
}
customElements.define('ambient-mixer', AmbientMixer);
