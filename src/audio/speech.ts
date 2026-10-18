class SpeechService {
  private voice: SpeechSynthesisVoice | null = null;
  private checked = false;
  private supported = false;
  private speaking = false;
  private lastText = '';
  private lastAt = 0;

  constructor() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.supported = true;
    this.pickVoice();
    window.speechSynthesis.addEventListener?.('voiceschanged', () => this.pickVoice());
  }

  get available(): boolean {
    if (!this.supported) return false;
    if (!this.checked) this.pickVoice();
    return this.voice !== null;
  }

  private pickVoice(): void {
    this.checked = true;
    if (!this.supported) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) {
      this.voice = null;
      return;
    }
    const preferred =
      voices.find((voice) => /^zh[-_]CN/i.test(voice.lang)) ??
      voices.find((voice) => /^zh[-_]Hans/i.test(voice.lang)) ??
      voices.find((voice) => /^zh/i.test(voice.lang)) ??
      null;
    this.voice = preferred;
  }

  speak(text: string): void {
    if (!this.supported) return;
    if (!this.voice) this.pickVoice();
    if (!this.voice) return;
    const now = performance.now();
    if (text === this.lastText && now - this.lastAt < 700) return;
    this.lastText = text;
    this.lastAt = now;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.slice(0, 180));
      utterance.voice = this.voice;
      utterance.lang = this.voice.lang;
      utterance.rate = 1.02;
      utterance.pitch = 1;
      utterance.volume = 0.9;
      utterance.onend = () => {
        this.speaking = false;
      };
      utterance.onerror = () => {
        this.speaking = false;
      };
      this.speaking = true;
      window.speechSynthesis.speak(utterance);
    } catch {
      this.speaking = false;
    }
  }

  cancel(): void {
    if (!this.supported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // noop
    }
    this.speaking = false;
  }

  get isSpeaking(): boolean {
    return this.speaking;
  }
}

export const speechService = new SpeechService();
