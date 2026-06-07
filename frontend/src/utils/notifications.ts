let audioUnlocked = false;

export function requestNotificationPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

export function unlockNotificationSound() {
  if (audioUnlocked) return;
  audioUnlocked = true;
  try {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    const ctx = AudioContextCtor ? new AudioContextCtor() : null;
    ctx?.resume().catch(() => {});
    ctx?.close().catch(() => {});
  } catch {
    // Certains navigateurs bloquent l'audio tant que l'utilisateur n'a pas interagi.
  }
}

export function playNotificationSound() {
  try {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    const ctx = new AudioContextCtor();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);

    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
    window.setTimeout(() => ctx.close().catch(() => {}), 450);
  } catch {
    // Son non critique : la notification visuelle reste disponible.
  }
}

export function notifyUser(title: string, body: string) {
  playNotificationSound();
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}
