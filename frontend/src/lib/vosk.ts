import { Model, type Model as VoskModel } from "vosk-browser";

const MODEL_URL = '/models/vosk-model-small-en-us-0.15.model';

let modelPromise: Promise<VoskModel> | null = null;

export function loadModel() {
  if (!modelPromise) {
    const model = new Model(MODEL_URL);
    modelPromise = new Promise<VoskModel>((resolve, reject) => {
      model.on('load', (message) => {
        if ('result' in message && message.result) {
          resolve(model);
        } else {
          reject(new Error('Vosk failed to load the speech model.'));
        }
      });
      model.on('error', (message) => {
        if ('error' in message) reject(new Error(message.error));
      });
    }).catch((error: unknown) => {
      model.terminate();
      modelPromise = null;
      throw error;
    });
  }
  return modelPromise;
}

type Handlers = {
    onPartial?: (text: string) => void;
    onFinal?: (text: string) => void;
    grammar?: string[];
};

type PartialResultMessage = { result: { partial: string } };
type FinalResultMessage = { result: { text: string } };

export async function startListening({ onPartial, onFinal, grammar }: Handlers) {
  const model = await loadModel();

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });

  const audioContext = new AudioContext();
  await audioContext.resume();

  const recognizer = grammar
  ? new model.KaldiRecognizer(audioContext.sampleRate, JSON.stringify(grammar))
  : new model.KaldiRecognizer(audioContext.sampleRate);

  recognizer.on('partialresult', (msg) => {
    onPartial?.((msg as PartialResultMessage).result.partial);
  });
  recognizer.on('result', (msg) => {
    const text = (msg as FinalResultMessage).result.text;
    if (text) onFinal?.(text);
  });

  const source = audioContext.createMediaStreamSource(stream);
  // ScriptProcessor is deprecated but works everywhere and is the simplest option
  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (e) => {
    try {
      recognizer.acceptWaveform(e.inputBuffer);
    } catch (err) {
      console.error('acceptWaveform failed', err);
    }
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  return () => {
    processor.disconnect();
    source.disconnect();
    stream.getTracks().forEach((t) => t.stop());
    audioContext.close();
    recognizer.remove();
  };
}
