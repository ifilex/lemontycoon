import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationItem } from '../types';

interface NotificationToastProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-3 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notif) => {
          const bgColors = {
            info: 'bg-cyan-950 border-cyan-500 text-cyan-200',
            warning: 'bg-amber-950 border-amber-500 text-amber-200',
            success: 'bg-emerald-950 border-emerald-500 text-emerald-200',
            alert: 'bg-rose-950 border-rose-500 text-rose-200',
          };

          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={() => onDismiss(notif.id)}
              className="pointer-events-auto cursor-pointer p-3 border-2 border-[#8bac0f] bg-[#1a1c1a] text-[#9bbc0f] font-mono text-xs flex items-start gap-2 shadow-2xl rounded"
            >
              <span className="text-sm">
                {notif.type === 'success' ? '⭐' : notif.type === 'alert' ? '🚨' : notif.type === 'warning' ? '⚠️' : '🔔'}
              </span>
              <div className="flex-1">
                <div className="font-bold tracking-tight mb-0.5 uppercase text-[10px] text-[#9bbc0f]">{notif.title}</div>
                <div className="text-[9px] text-[#8bac0f] leading-tight font-mono">{notif.message}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
