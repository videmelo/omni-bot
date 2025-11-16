import { useState, useEffect, useRef } from 'react';
import Omni from '../assets/icons/Omni.js';
import Loading from '../assets/icons/Loading.js';

type StatusType = 'error' | 'warn' | 'async' | 'done' | 'default';

interface StatusItem {
   id: number;
   message: string | null;
   type: StatusType;
   async?: string | null;
   respond?: string | null;
   createdAt: number;
   isExiting: boolean;
}

interface StatusProps {
   status: StatusItem | null;
   styles?: string;
   visible?: string;
   hidden?: string;
}

function Status({ status, styles = '', visible = '', hidden = '' }: StatusProps) {
   const [queue, setQueue] = useState<StatusItem[]>([]);
   const timersRef = useRef<{
      [key: number]: { exitTimer: NodeJS.Timeout; removalTimer?: NodeJS.Timeout };
   }>({});
   const pendingAsync = useRef<{ [key: string]: number }>({});

   useEffect(() => {
      return () => {
         Object.values(timersRef.current).forEach(({ exitTimer, removalTimer }) => {
            clearTimeout(exitTimer);
            if (removalTimer) clearTimeout(removalTimer);
         });
      };
   }, []);

   useEffect(() => {
      if (!status) return;

      const newStatus: StatusItem = {
         id: Date.now(),
         message: status?.message || null,
         type: status?.type || 'default',
         async: status?.async || null,
         respond: status?.respond || null,
         createdAt: Date.now(),
         isExiting: false,
      };

      setQueue((prevQueue) => {
         let updatedQueue = [...prevQueue];

         if (newStatus.respond) {
            const targetIndex = updatedQueue.findIndex((item) => item.async === newStatus.respond);

            if (targetIndex > -1) {
               const target = updatedQueue[targetIndex];
               const timeDisplayed = Date.now() - target.createdAt;
               const remainingTime = Math.max(1000 - timeDisplayed, 0);

               if (!newStatus.message) {
                  clearExistingTimers(target.id);
                  updatedQueue = updatedQueue.filter((_, i) => i !== targetIndex);
               } else if (remainingTime > 0) {
                  setTimeout(() => {
                     setQueue((prev) => {
                        const newQueue = [...prev];
                        const newTargetIndex = newQueue.findIndex((item) => item.id === target.id);

                        if (newTargetIndex > -1) {
                           newQueue[newTargetIndex] = {
                              ...newQueue[newTargetIndex],
                              message: newStatus.message,
                              type: newStatus.type,
                              async: newStatus.async || null,
                              isExiting: false,
                              createdAt: Date.now(),
                           };

                           if (!newStatus.async) {
                              startTimer(newQueue[newTargetIndex]);
                           }
                        }
                        return newQueue.slice(-3);
                     });
                  }, remainingTime);
                  return prevQueue;
               } else {
                  updatedQueue[targetIndex] = {
                     ...target,
                     message: newStatus.message,
                     type: newStatus.type,
                     async: newStatus.async || null,
                     isExiting: false,
                     createdAt: Date.now(),
                  };

                  if (!newStatus.async) {
                     startTimer(updatedQueue[targetIndex]);
                  }
               }
               return updatedQueue.slice(-3);
            }
         }

         if (newStatus.message) {
            updatedQueue = [...updatedQueue, newStatus].slice(-3);

            if (!newStatus.async) {
               startTimer(newStatus);
            } else {
               pendingAsync.current[newStatus.async] = newStatus.id;
            }
         }

         return updatedQueue;
      });
   }, [status]);

   const startTimer = (status: StatusItem) => {
      clearExistingTimers(status.id);

      const minDisplayTime = status.type === 'async' ? 2000 : 0;
      const timerDuration = Math.max(3000, minDisplayTime);

      const exitTimer = setTimeout(() => {
         setQueue((prev) => prev.map((item) => (item.id === status.id ? { ...item, isExiting: true } : item)));

         const removalTimer = setTimeout(() => {
            setQueue((prev) => prev.filter((item) => item.id !== status.id));
            if (status.async) delete pendingAsync.current[status.async!];
         }, 500);

         timersRef.current[status.id] = { exitTimer, removalTimer };
      }, timerDuration);

      timersRef.current[status.id] = { exitTimer };
   };

   const clearExistingTimers = (id: number) => {
      if (timersRef.current[id]) {
         clearTimeout(timersRef.current[id].exitTimer);
         if (timersRef.current[id].removalTimer) {
            clearTimeout(timersRef.current[id].removalTimer);
         }
         delete timersRef.current[id];
      }
   };

   const processMessage = (message: string | null) => {
      if (!message) return null;

      const regex = /\[([^\]]+)\]/g;
      const parts: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = regex.exec(message)) !== null) {
         if (match.index > lastIndex) {
            parts.push(message.slice(lastIndex, match.index));
         }
         parts.push(
            <span key={lastIndex} className="bg-white bg-opacity-20 rounded-full px-2 mx-1">
               {match[1]}
            </span>
         );
         lastIndex = regex.lastIndex;
      }

      if (lastIndex < message.length) {
         parts.push(message.slice(lastIndex));
      }

      return parts;
   };

   return (
      <div className={`${styles} items-center flex flex-col gap-2`}>
         {queue.map((item) => (
            <div
               key={item.id}
               className={`w-max rounded-full p-2 flex justify-center gap-3 items-center ease-in duration-500
            ${item.type === 'error' ? 'bg-red-600' : item.type === 'warn' ? 'bg-yellow-600' : item.type === 'async' ? 'bg-blue-600' : item.type === 'done' ? 'bg-green-600' : 'bg-gray-600'}
            ${item.isExiting ? hidden : visible}`}
            >
               <Omni />
               <div className="text-sm text-white text-opacity-80 flex flex-wrap items-center">{processMessage(item.message)}</div>
               {item.type === 'async' && (
                  <div className="bg-white bg-opacity-10 rounded-full px-3">
                     <Loading className="w-6 h-6" />
                  </div>
               )}
            </div>
         ))}
      </div>
   );
}

export default Status;
