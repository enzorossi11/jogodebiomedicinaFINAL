/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Sistema de Áudio Inclusivo & Síntese Sonora Suave
 * Projetado para evitar sobrecarga sensorial em TEA, TDAH e TOC.
 * Somente ondas senoidais puras, frequências harmônicas (528 Hz, 432 Hz) e envelopes suaves.
 */

class CalmMiniAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.4;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public unlock() {
    this.initContext();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Som de "Plim" suave (528 Hz - frequência do tom harmônico de cura / relaxamento)
   * Sem cliques, ataque suave (15ms) e decaimento gradual (300ms).
   */
  public playSoftPlim(freq: number = 528) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.18 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // AudioContext blocked or not allowed
    }
  }

  /**
   * Som de compressão muscular suave (peristaltismo) - tom grave e tranquilo (180 Hz -> 140 Hz)
   */
  public playGentleSquish() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.14 * this.volume, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // safe fallback
    }
  }

  /**
   * Som suave de mastigação / mordida (duplo toque senoidal abafado e agradável, sem ruído áspero)
   */
  public playSoftCrunch() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [280, 220].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(140, start + 0.11);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.14 * this.volume, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.16);
      });
    } catch {
      // safe fallback
    }
  }

  /**
   * Som de gota d'água / suco gástrico delicado (800 Hz -> 400 Hz)
   */
  public playWaterDrop() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12 * this.volume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // safe
    }
  }

  /**
   * Som de absorção de nutriente (acorde pentatônico suave em ascensão)
   */
  public playNutrientAbsorbed(index: number = 0) {
    if (this.isMuted) return;
    const notes = [440, 493.88, 554.37, 659.25, 739.99]; // Pentatônica A maior
    const freq = notes[index % notes.length];
    this.playSoftPlim(freq);
  }

  /**
   * Feedback neutro e compassivo quando precisa tentar novamente (sem buzz, sem erro, duas notas calmas)
   */
  public playGentleGuidance() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      [392, 349.23].forEach((f, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.12);

        gain.gain.setValueAtTime(0, now + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.09 * this.volume, now + i * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.3);
      });
    } catch {
      // safe
    }
  }

  /**
   * Celebração serena e harmoniosa (arpeggio suave)
   */
  public playSereneCompletion() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const chords = [261.63, 329.63, 392.00, 523.25, 659.25]; // C maior suave
      const now = this.ctx.currentTime;

      chords.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const start = now + idx * 0.14;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12 * this.volume, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.7);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.75);
      });
    } catch {
      // safe
    }
  }
}

export const calmAudio = new CalmMiniAudio();

type SpeechStateListener = (speaking: boolean, text: string | null) => void;

/**
 * Leitor e Locutor de Voz Calmo e Pausado (SpeechSynthesis)
 * - Cacheia voz nativa pt-BR via onvoiceschanged
 * - Fornece suporte a legendas sincronizadas via listeners reativos
 */
export class CalmVoiceNarrator {
  private static isSpeaking: boolean = false;
  private static activeText: string | null = null;
  private static cachedPtVoice: SpeechSynthesisVoice | null = null;
  private static listeners: Set<SpeechStateListener> = new Set();
  private static isInitialized: boolean = false;

  private static initVoices() {
    if (this.isInitialized || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }
    this.isInitialized = true;

    const findVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Prioridade: vozes pt-BR de alta qualidade conhecidas
      const preferred = voices.find(
        (v) =>
          v.lang.toLowerCase().replace('_', '-') === 'pt-br' &&
          (v.name.includes('Google') ||
            v.name.includes('Luciana') ||
            v.name.includes('Francisca') ||
            v.name.includes('Natural') ||
            v.name.includes('Daniel') ||
            v.name.includes('Leticia'))
      );

      this.cachedPtVoice =
        preferred ||
        voices.find((v) => v.lang.toLowerCase().startsWith('pt')) ||
        null;
    };

    findVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = findVoice;
    }
  }

  public static addListener(listener: SpeechStateListener) {
    this.listeners.add(listener);
    listener(this.isSpeaking, this.activeText);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isSpeaking, this.activeText);
      } catch {
        // safe
      }
    });
  }

  public static speak(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      this.initVoices();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.88; // Ritmo mais pausado e calmo para TEA/TDAH
      utterance.pitch = 1.0;
      utterance.volume = 0.9;

      if (this.cachedPtVoice) {
        utterance.voice = this.cachedPtVoice;
      }

      utterance.onend = () => {
        CalmVoiceNarrator.isSpeaking = false;
        CalmVoiceNarrator.activeText = null;
        CalmVoiceNarrator.notifyListeners();
        onEnd?.();
      };

      utterance.onerror = () => {
        CalmVoiceNarrator.isSpeaking = false;
        CalmVoiceNarrator.activeText = null;
        CalmVoiceNarrator.notifyListeners();
        onEnd?.();
      };

      CalmVoiceNarrator.isSpeaking = true;
      CalmVoiceNarrator.activeText = text;
      CalmVoiceNarrator.notifyListeners();

      window.speechSynthesis.speak(utterance);
    } catch {
      CalmVoiceNarrator.isSpeaking = false;
      CalmVoiceNarrator.activeText = null;
      CalmVoiceNarrator.notifyListeners();
      onEnd?.();
    }
  }

  public static stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      CalmVoiceNarrator.isSpeaking = false;
      CalmVoiceNarrator.activeText = null;
      CalmVoiceNarrator.notifyListeners();
    }
  }

  public static speaking(): boolean {
    return CalmVoiceNarrator.isSpeaking;
  }

  public static getActiveText(): string | null {
    return CalmVoiceNarrator.activeText;
  }
}
