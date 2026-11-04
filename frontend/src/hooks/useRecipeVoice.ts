import { useEffect, useRef } from 'react';
import { startListening } from '../lib/vosk';

const WAKE = 'hey chef';
const COMMANDS = ['next', 'back', 'repeat', 'start timer', 'stop timer'];
const GRAMMAR = [WAKE, ...COMMANDS, '[unk]']; // [unk] absorbs everything else
const AWAKE_MS = 6000;

export function useRecipeVoice(onCommand: (cmd: string) => void) {
  const awakeUntil = useRef(0);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand; // always call the latest callback

  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | null = null;

    startListening({
      grammar: GRAMMAR,
      onFinal: (text) => {
        const now = Date.now();
        let rest = text;

        if (text.includes(WAKE)) {
          awakeUntil.current = now + AWAKE_MS;
          rest = text.replace(WAKE, '').trim(); // handles "hey chef next" in one breath
        }

        if (now < awakeUntil.current) {
          const cmd = COMMANDS.find((c) => rest.includes(c));
          if (cmd) {
            awakeUntil.current = 0;
            onCommandRef.current(cmd);
          }
        }
      },
    })
      .then((s) => (cancelled ? s() : (stop = s)))
      .catch((err) => console.error('Voice start failed', err));

    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
}