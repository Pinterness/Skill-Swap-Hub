import { useEffect, useRef } from "react";

interface JitsiMeetingProps {
  roomName: string;
  displayName: string;
  onClose: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: any;
  }
}

export default function JitsiMeeting({
  roomName,
  displayName,
  onClose,
}: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    const loadScript = () =>
      new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://meet.jit.si/external_api.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Không tải được Jitsi Meet"));
        document.body.appendChild(script);
      });

    loadScript().then(() => {
      if (!mounted || !containerRef.current || !window.JitsiMeetExternalAPI)
        return;

      apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName, // tên phòng - trùng tên thì vào chung 1 phòng
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: { displayName },
        configOverwrite: {
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
      });

      // Khi người dùng bấm nút "rời cuộc gọi" trong giao diện Jitsi
      apiRef.current.addListener("readyToClose", () => {
        onClose();
      });
    });

    return () => {
      mounted = false;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800">
        <span className="text-sm text-white font-medium">
          Phòng họp: {roomName}
        </span>
        <button
          onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Đóng cửa sổ
        </button>
      </div>
      <div ref={containerRef} className="flex-1" />
    </div>
  );
}
