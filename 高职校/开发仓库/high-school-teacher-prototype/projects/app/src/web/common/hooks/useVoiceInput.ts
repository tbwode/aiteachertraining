import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { audioTranscriptions } from '@/app/chat/api';

export type VoiceStopReason = 'finish' | 'cancel';

const getSupportedAudioFormats = () => {
  const audioFormats = [
    'audio/mp3',
    'audio/aac',
    'audio/ogg',
    'audio/wav',
    'audio/flac',
    'audio/webm',
    'audio/mp4'
  ];
  return audioFormats.filter((format) => MediaRecorder.isTypeSupported(format));
};

/**
 * 通用语音输入 hook。
 * - 录音 → 调华为云转写接口 `/huayun-ai/client/chat/huawei/cloud/audio/transcriptions`
 * - 支持取消 (`stopSpeak('cancel')`) 与完成 (`stopSpeak('finish')`)
 * - 暴露 `audioSecond` 与 `speakingTimeString` 供 UI 渲染倒计时
 */
export const useVoiceInput = () => {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTransCription, setIsTransCription] = useState(false);
  const [audioSecond, setAudioSecond] = useState(0);
  const intervalRef = useRef<any>();
  const startTimestamp = useRef(0);
  const stopReasonRef = useRef<VoiceStopReason>();

  const speakingTimeString = useMemo(() => {
    const minutes = Math.floor(audioSecond / 60);
    const remainingSeconds = Math.floor(audioSecond % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, [audioSecond]);

  const startSpeak = useCallback(
    async (onFinish: (text: string) => void) => {
      if (isSpeaking || isTransCription) return;
      stopReasonRef.current = undefined;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const mimeType = getSupportedAudioFormats()[0];
        mediaRecorder.current = new MediaRecorder(stream, { mimeType });
        const chunks: Blob[] = [];
        setIsSpeaking(true);

        mediaRecorder.current.onstart = () => {
          startTimestamp.current = Date.now();
          setAudioSecond(0);
          intervalRef.current = setInterval(() => {
            const duration = (Date.now() - startTimestamp.current) / 1000;
            setAudioSecond(duration);
          }, 1000);
        };

        mediaRecorder.current.ondataavailable = (e) => {
          chunks.push(e.data);
        };

        mediaRecorder.current.onstop = async () => {
          clearInterval(intervalRef.current);
          mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;

          if (stopReasonRef.current === 'cancel') {
            setIsTransCription(false);
            setIsSpeaking(false);
            return;
          }

          const blob = new Blob(chunks, { type: mediaRecorder.current?.mimeType });
          const duration = Math.round((Date.now() - startTimestamp.current) / 1000);

          const formData = new FormData();
          formData.append('file', blob, 'recording.mp4');
          formData.append('metadata', JSON.stringify({ duration }));
          formData.append('language', 'zh');
          formData.append('prompt', '以下是普通话');

          setIsTransCription(true);
          try {
            const result = await audioTranscriptions(formData);
            onFinish(result);
          } catch (error: any) {
            toast({
              status: 'warning',
              title: error?.message || '语音解析失败'
            });
          }
          setIsTransCription(false);
          setIsSpeaking(false);
        };

        mediaRecorder.current.onerror = () => {
          clearInterval(intervalRef.current);
          mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
          setIsSpeaking(false);
        };

        mediaRecorder.current.start();
      } catch {
        toast({
          status: 'error',
          title: '未检测到麦克风'
        });
      }
    },
    [isSpeaking, isTransCription, toast]
  );

  const stopSpeak = useCallback((reason: VoiceStopReason = 'finish') => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      stopReasonRef.current = reason;
      mediaRecorder.current.stop();
      clearInterval(intervalRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current);
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        stopReasonRef.current = 'cancel';
        mediaRecorder.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    };
  }, []);

  return {
    startSpeak,
    stopSpeak,
    isSpeaking,
    isTransCription,
    audioSecond,
    speakingTimeString
  };
};
