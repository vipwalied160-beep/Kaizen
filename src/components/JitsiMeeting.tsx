import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface JitsiMeetingProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
  isProfessor?: boolean;
}

export const JitsiMeeting = ({ roomName, displayName, onClose, isProfessor }: JitsiMeetingProps) => {
  const [loading, setLoading] = useState(true);

  // استخراج اسم الغرفة من الرابط إذا كان رابطاً كاملاً
  const extractRoomName = (nameOrUrl: string) => {
    try {
      if (nameOrUrl.includes('meet.jit.si/')) {
        return nameOrUrl.split('meet.jit.si/')[1];
      }
      return nameOrUrl;
    } catch {
      return nameOrUrl;
    }
  };

  const cleanRoomName = extractRoomName(roomName);
  const domain = "meet.jit.si";
  
  // إعدادات الاجتماع
  const configParams = [
    'config.prejoinPageEnabled=false',
    'config.deepLinkingEnabled=false',
    'config.startWithAudioMuted=true',
    'config.startWithVideoMuted=true',
    'interfaceConfig.SHOW_JITSI_WATERMARK=false',
    'interfaceConfig.SHOW_BRAND_WATERMARK=false',
    'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false',
  ].join('&');

  const userInfo = `userInfo.displayName="${encodeURIComponent(displayName)}"`;
  const url = `https://${domain}/${cleanRoomName}#${userInfo}&${configParams}`;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-in fade-in duration-300">
      <div className="flex justify-between items-center p-3 bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          <h3 className="font-semibold text-lg">
            {isProfessor ? "لوحة تحكم الاجتماع (الدكتور)" : "محاضرة مباشرة (Live)"}
          </h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => {
            if (confirm("هل أنت متأكد من مغادرة الاجتماع؟")) {
              onClose();
            }
          }} 
          className="hover:bg-red-500 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      <div className="flex-1 relative bg-black">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p>جاري الاتصال بالسيرفر الآمن...</p>
          </div>
        )}
        <iframe
          src={url}
          className="w-full h-full border-0"
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          onLoad={() => setLoading(false)}
          title="Jitsi Meeting"
        />
      </div>
    </div>
  );
};