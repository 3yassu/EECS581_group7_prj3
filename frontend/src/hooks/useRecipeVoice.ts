import { useEffect, useRef, useState } from 'react';
import { startListening } from '../lib/vosk';

const WAKE = 'hey chef';
const COMMANDS = ['next', 'back', 'repeat', 'start timer', 'stop timer'] as const;
const GRAMMAR = [WAKE, ...COMMANDS, '[unk]']; // [unk] absorbs everything else
const AWAKE_MS = 6000;

export type RecipeVoiceCommand = (typeof COMMANDS)[number];
type VoiceStatus = 'loading' | 'listening' | 'error';

export function useRecipeVoice(onCommand: (cmd: RecipeVoiceCommand) => void) {
  const awakeUntil = useRef(0);
  const onCommandRef = useRef(onCommand);
  const awakeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<VoiceStatus>('loading');
  const [isAwake, setIsAwake] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | null = null;

    startListening({
      grammar: GRAMMAR,
      onFinal: (text) => {
        const now = Date.now();
        const normalized = text.toLowerCase();
        let rest = normalized;

        if (normalized.includes(WAKE)) {
          awakeUntil.current = now + AWAKE_MS;
          rest = normalized.replace(WAKE, '').trim();
          setIsAwake(true);
          if (awakeTimeout.current) clearTimeout(awakeTimeout.current);
          awakeTimeout.current = setTimeout(() => setIsAwake(false), AWAKE_MS);
        }

        if (now < awakeUntil.current) {
          const cmd = COMMANDS.find((candidate) => rest.includes(candidate));
          if (cmd) {
            awakeUntil.current = 0;
            setIsAwake(false);
            if (awakeTimeout.current) clearTimeout(awakeTimeout.current);
            onCommandRef.current(cmd);
          }
        }
      },
    })
      .then((stopListening) => {
        if (cancelled) {
          stopListening();
          return;
        }
        stop = stopListening;
        setStatus('listening');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error('Voice start failed', err);
        setError(err instanceof Error ? err.message : String(err));
        setStatus('error');
      });

    return () => {
      cancelled = true;
      if (awakeTimeout.current) clearTimeout(awakeTimeout.current);
      stop?.();
    };
  }, []);

  return { status, isAwake, error };
}