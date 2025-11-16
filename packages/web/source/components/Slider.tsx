import { useState, useRef, useEffect, useCallback } from 'react';

interface SliderProps {
   value?: number;
   duration?: number;
   onChange?: (value: any) => void;
   onCommit?: (value: any) => void;
   trackColor?: string;
   progressColor?: string;
   thumbColor?: string;
   showThumbOnHover?: boolean;
   showTimers?: boolean;
}

const Slider = ({
   value = 0,
   duration = 0,
   onChange,
   onCommit,
   trackColor = 'bg-[#797878]',
   progressColor = 'bg-white',
   thumbColor = 'bg-white',
   showThumbOnHover = true,
   showTimers = true,
}: SliderProps) => {
   const [progress, setProgress] = useState(0);
   const [isDragging, setIsDragging] = useState(false);
   const sliderRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      setProgress(duration > 0 ? (value / duration) * 100 : 0);
   }, [value, duration]);

   const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.abs(Math.floor(seconds % 60))
         .toString()
         .padStart(2, '0');
      return `${mins}:${secs}`;
   };

   const calcProgress = (clientX: any) => {
      if (!sliderRef.current) return 0;
      const rect = sliderRef.current.getBoundingClientRect();
      return Math.min(Math.max(((clientX - rect.left) / rect.width) * 100, 0), 100);
   };

   const commitProgress = (newProgress: number) => {
      const currentTime = (newProgress / 100) * duration;
      onCommit?.({
         progress: newProgress,
         time: currentTime,
         formattedTime: formatTime(currentTime),
      });
   };

   const updateSlider = useCallback(
      (clientX: any, commit = false) => {
         const newProgress = calcProgress(clientX);
         const currentTime = (newProgress / 100) * duration;
         setProgress(newProgress);
         onChange?.({
            progress: newProgress,
            time: currentTime,
            formattedTime: formatTime(currentTime),
         });
         if (commit) commitProgress(newProgress);
      },
      [duration, onChange, onCommit]
   );

   const handleMouseDown = (event: any) => {
      setIsDragging(true);
      updateSlider(event.clientX);
   };

   const handleMouseMove = useCallback(
      (event: any) => {
         if (isDragging) updateSlider(event.clientX);
      },
      [isDragging, updateSlider]
   );

   const handleMouseUp = useCallback(() => {
      if (isDragging) {
         commitProgress(progress);
         setIsDragging(false);
      }
   }, [isDragging, progress]);

   useEffect(() => {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
         document.removeEventListener('mousemove', handleMouseMove);
         document.removeEventListener('mouseup', handleMouseUp);
      };
   }, [handleMouseMove, handleMouseUp]);

   return (
      <div className="w-full group">
         <div className="flex flex-col items-center text-xs text-gray-400 font-medium">
            <div ref={sliderRef} className="relative w-full h-4 cursor-pointer" onMouseDown={handleMouseDown}>
               <div className={`absolute w-full h-1 ${trackColor} rounded-full top-1/2 -translate-y-1/2`} />
               <div className={`absolute h-1 ${progressColor} rounded-full top-1/2 -translate-y-1/2`} style={{ width: `${progress}%` }} />
               <div
                  className={`
              absolute top-1/2 -translate-y-1/2 h-3 w-3 ${thumbColor} rounded-full shadow-lg
              transition-opacity duration-150 ${isDragging ? 'opacity-100' : 'opacity-0'}
              ${showThumbOnHover && 'group-hover:opacity-100'} scale-50 group-hover:scale-100 z-20
            `}
                  style={{
                     left: `${progress}%`,
                     transform: 'translate(-50%, -50%)',
                     pointerEvents: 'none',
                  }}
               />
            </div>

            {showTimers && (
               <div className="flex w-full justify-between">
                  <span className="select-none w-12">{formatTime((progress / 100) * duration)}</span>
                  <span className="select-none w-12 text-right">-{formatTime(Math.max(0, duration - (progress / 100) * duration))}</span>
               </div>
            )}
         </div>
      </div>
   );
};

export default Slider;
