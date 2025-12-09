
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
    src: string;
    duration?: number;
    isMe: boolean;
}

export const AudioPlayer = ({ src, duration, isMe }: AudioPlayerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioDuration, setAudioDuration] = useState(duration || 0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const onEnded = () => setIsPlaying(false);
        const onLoadedMetadata = () => {
            if (!duration) setAudioDuration(audio.duration);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
    }, [duration]);

    const togglePlay = () => {
        if (audioRef.current?.paused) {
            audioRef.current.play();
            setIsPlaying(true);
        } else {
            audioRef.current?.pause();
            setIsPlaying(false);
        }
    };

    const formatTime = (time: number) => {
        if (!time || isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`flex items-center gap-3 min-w-[200px] sm:min-w-[240px] p-1`}>
            <button
                onClick={togglePlay}
                className={`p-2 rounded-full flex-shrink-0 transition-all ${isMe
                        ? 'bg-blue-400/20 text-blue-100 hover:bg-blue-400/30'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                type="button"
            >
                {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current pl-0.5" />}
            </button>

            <div className="flex-1 flex flex-col justify-center gap-1">
                <input
                    type="range"
                    min="0"
                    max={audioDuration || 100}
                    value={currentTime}
                    onChange={(e) => {
                        const time = parseFloat(e.target.value);
                        if (audioRef.current) audioRef.current.currentTime = time;
                        setCurrentTime(time);
                    }}
                    className={`w-full h-1 rounded-full appearance-none cursor-pointer ${isMe ? 'bg-blue-400/30 accent-white' : 'bg-gray-200 accent-primary'
                        }`}
                    style={{
                        backgroundSize: `${(currentTime / (audioDuration || 1)) * 100}% 100%`
                    }}
                />
                <div className={`flex justify-between text-[10px] font-medium ${isMe ? 'text-blue-100' : 'text-gray-500'}`}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(audioDuration)}</span>
                </div>
            </div>

            <audio ref={audioRef} src={src} className="hidden" preload="metadata" />
        </div>
    );
};
