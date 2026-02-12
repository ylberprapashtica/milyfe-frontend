import { useState, useRef, useEffect, ReactElement } from 'react';
import './VoiceRecorder.scss';

const MAX_DURATION_SEC = 60;

/** Check for Web Speech API support */
function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  const Win = window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition };
  return Win.SpeechRecognition ?? Win.webkitSpeechRecognition ?? null;
}

const speechRecognitionSupported = !!getSpeechRecognition();

export interface VoiceRecorderProps {
  /** Existing voice audio data URL (for edit mode) */
  initialVoiceAudio?: string | null;
  /** Callback when user confirms the recording; receives base64 data URL */
  onAccept: (base64DataUrl: string) => void;
  /** Callback when user discards or clears the recording */
  onDiscard: () => void;
  /** Callback when user wants to add transcript to content; receives transcript text */
  onTranscribeToContent?: (transcript: string) => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * Voice recorder component using MediaRecorder API.
 * Records audio, allows playback, optional transcription via Web Speech API,
 * and exports as base64 data URL.
 */
export const VoiceRecorder = ({
  initialVoiceAudio,
  onAccept,
  onDiscard,
  onTranscribeToContent,
  disabled = false,
}: VoiceRecorderProps): ReactElement => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedDataUrl, setRecordedDataUrl] = useState<string | null>(initialVoiceAudio || null);
  const [durationSec, setDurationSec] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync initial value when it changes (e.g. when editing another capture)
  useEffect(() => {
    setRecordedDataUrl(initialVoiceAudio || null);
  }, [initialVoiceAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const startRecording = async (): Promise<void> => {
    setTranscribeError(null);
    setTranscript('');
    setRecordedBlob(null);
    setRecordedDataUrl(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg';
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      const Recognition = getSpeechRecognition();
      if (Recognition && onTranscribeToContent) {
        const recognition = new Recognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = navigator.language || 'en-US';
        const finalTranscript: string[] = [];
        let lastInterim = '';
        recognition.onresult = (event: SpeechRecognitionEvent) => {
          lastInterim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0].transcript;
            if (result.isFinal) {
              finalTranscript.push(text);
            } else {
              lastInterim = text;
            }
          }
          const full = [...finalTranscript];
          if (lastInterim) full.push(lastInterim);
          setTranscript(full.join(' ').trim());
        };
        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          // Ignore "aborted" - we abort recognition when user stops recording (expected cleanup)
          if (event.error === 'aborted') return;
          const detail = event.message ? `${event.error}: ${event.message}` : event.error;
          console.error('SpeechRecognition error', event.error, event.message);
          setTranscribeError(`Transcription failed: ${detail}`);
        };
        recognition.onend = () => {
          recognitionRef.current = null;
        };
        recognition.start();
        recognitionRef.current = recognition;
      }

      recorder.onstop = () => {
        // Use stop() not abort() so recognition can emit final results before ending
        try {
          recognitionRef.current?.stop();
        } catch {
          // ignore
        }
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          setRecordedBlob(blob);
          const reader = new FileReader();
          reader.onloadend = () => {
            setRecordedDataUrl(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      recorder.start(1000);
      setIsRecording(true);
      setDurationSec(0);
      timerRef.current = setInterval(() => {
        setDurationSec((s) => {
          const next = s + 1;
          if (next >= MAX_DURATION_SEC && mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setTranscribeError('Microphone access denied or unavailable');
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleAccept = (): void => {
    const url = recordedDataUrl || initialVoiceAudio;
    if (url) {
      // If we have a transcript, append it to the capture content (same as "Transcribe to content")
      if (transcript.trim() && onTranscribeToContent) {
        onTranscribeToContent(transcript.trim());
      }
      onAccept(url);
    }
  };

  const handleDiscard = (): void => {
    setRecordedBlob(null);
    setRecordedDataUrl(null);
    setTranscript('');
    setDurationSec(0);
    onDiscard();
  };

  const handleTranscribeToContent = (): void => {
    if (transcript.trim() && onTranscribeToContent) {
      onTranscribeToContent(transcript.trim());
    }
  };

  const displayUrl = recordedDataUrl || initialVoiceAudio;
  const hasRecording = !!displayUrl;
  const canTranscribe = speechRecognitionSupported && transcript.trim().length > 0 && onTranscribeToContent;

  return (
    <div className="voice-recorder">
      <div className="voice-recorder-toolbar">
        {!isRecording && !hasRecording && (
          <button
            type="button"
            className="voice-recorder-btn voice-recorder-btn-record"
            onClick={startRecording}
            disabled={disabled}
          >
            Start recording
          </button>
        )}

        {isRecording && (
          <>
            <span className="voice-recorder-duration">
              {durationSec}s {durationSec >= MAX_DURATION_SEC ? '(max)' : ''}
            </span>
            <button
              type="button"
              className="voice-recorder-btn voice-recorder-btn-stop"
              onClick={stopRecording}
              disabled={disabled}
            >
              Stop
            </button>
          </>
        )}

        {hasRecording && !isRecording && (
          <>
            <button
              type="button"
              className="voice-recorder-btn voice-recorder-btn-accept"
              onClick={handleAccept}
              disabled={disabled}
            >
              Use this
            </button>
            <button
              type="button"
              className="voice-recorder-btn voice-recorder-btn-discard"
              onClick={handleDiscard}
              disabled={disabled}
            >
              Discard
            </button>
            {canTranscribe && (
              <button
                type="button"
                className="voice-recorder-btn voice-recorder-btn-transcribe"
                onClick={handleTranscribeToContent}
                disabled={disabled}
                title="Add transcript to note content"
              >
                Transcribe to content
              </button>
            )}
          </>
        )}
      </div>

      {!speechRecognitionSupported && onTranscribeToContent && (
        <p className="voice-recorder-hint">Transcription is not supported in this browser (Chrome recommended).</p>
      )}

      {transcribeError && (
        <p className="voice-recorder-error" role="alert">
          {transcribeError}
        </p>
      )}

      {transcript && !isRecording && (
        <div className="voice-recorder-transcript">
          <strong>Transcript:</strong>
          <p>{transcript}</p>
          <span className="voice-recorder-transcript-hint">
            Click &quot;Use this&quot; to attach the recording and append this transcript to your note content.
          </span>
        </div>
      )}

      {displayUrl && (
        <div className="voice-recorder-playback">
          <audio
            ref={audioRef}
            src={displayUrl}
            controls
            className="voice-recorder-audio"
          />
        </div>
      )}
    </div>
  );
};
