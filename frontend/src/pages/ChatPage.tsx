import { useState, useEffect, useRef, useMemo } from "react";
import api from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import {
  Send,
  MessageSquare,
  Video,
  Users,
  UserPlus,
  LogOut,
  Settings2,
  Clock3,
  Rows3,
  CornerDownLeft,
} from "lucide-react";
import socket from "../lib/socket";
import CreateGroupModal from "../components/CreateGroupModal";
import { useChatNotifications } from "../context/ChatNotificationContext";
import Avatar from "../components/Avatar";

interface SimpleUser {
  _id: string;
  username: string;
  avatar?: string;
}

interface Match {
  _id: string;
  sender: SimpleUser;
  receiver: SimpleUser;
  status: string;
}

interface Message {
  _id: string;
  sender: SimpleUser;
  content: string;
  type: string;
  createdAt: string;
  matchId?: string;
}

interface GroupMember {
  user: SimpleUser;
  status: "pending" | "accepted" | "declined";
}

interface Group {
  _id: string;
  teacher: SimpleUser;
  title: string;
  roomName: string;
  members: GroupMember[];
  status: "pending" | "active" | "closed";
}

interface GroupMessage {
  _id: string;
  sender: SimpleUser;
  content: string;
  createdAt: string;
  groupId?: string;
}


export default function ChatPage() {
  const { token, user } = useAuth();
  const userId = user?.id || (user as any)?._id;
  const headers = { Authorization: `Bearer ${token}` };

  // ── Đã lấy setActiveCallRoom từ Context ra ──
  const { unreadCounts, setActiveConversationId, setActiveCallRoom } =
    useChatNotifications();

  const [viewMode, setViewMode] = useState<"direct" | "groups">("direct");

  // ── Chat 1-1 ──
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Nhóm học ──
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupContent, setGroupContent] = useState("");
  const [groupLoading, setGroupLoading] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [chatSettings, setChatSettings] = useState(() => {
    try {
      return {
        showTime: true,
        compact: false,
        sendOnEnter: true,
        ...JSON.parse(localStorage.getItem("chatSettings") || "{}"),
      };
    } catch {
      return { showTime: true, compact: false, sendOnEnter: true };
    }
  });
  const groupBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMatches();
    fetchGroups();
  }, []);

  useEffect(() => {
    localStorage.setItem("chatSettings", JSON.stringify(chatSettings));
  }, [chatSettings]);

  // ── Đánh dấu "đang xem" đúng cuộc trò chuyện hiện tại ──
  useEffect(() => {
    if (viewMode === "direct" && selectedMatch) {
      setActiveConversationId(selectedMatch._id);
      fetchMessages(selectedMatch._id);
    } else if (viewMode === "groups" && selectedGroup) {
      setActiveConversationId(`group_${selectedGroup._id}`);
      fetchGroupMessages(selectedGroup._id);
    } else {
      setActiveConversationId(null);
    }
    return () => setActiveConversationId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMatch, selectedGroup, viewMode]);

  // ── Lắng nghe tin nhắn mới để cập nhật khung chat đang mở ──
  useEffect(() => {
    const handleNewMessage = (msg: Message) => {
      if (msg.matchId === selectedMatch?._id) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    const handleNewGroupMessage = (msg: GroupMessage) => {
      if (msg.groupId === selectedGroup?._id) {
        setGroupMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("new_group_message", handleNewGroupMessage);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("new_group_message", handleNewGroupMessage);
    };
  }, [selectedMatch, selectedGroup]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    groupBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [groupMessages]);

  const fetchMatches = async () => {
    try {
      const [recv, sent] = await Promise.all([
        api.get(`/api/match/received`, { headers }),
        api.get(`/api/match/sent`, { headers }),
      ]);
      const accepted = [...recv.data.matches, ...sent.data.matches].filter(
        (m) => m.status === "accepted",
      );

      const seen = new Set<string>();
      const unique = accepted.filter((match) => {
        const otherId =
          match.sender._id === userId ? match.receiver._id : match.sender._id;
        if (seen.has(otherId)) return false;
        seen.add(otherId);
        return true;
      });

      setMatches(unique);
      if (unique.length > 0) setSelectedMatch(unique[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (matchId: string) => {
    try {
      setLoading(true);
      const res = await api.get(`/api/message/${matchId}`, { headers });
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get(`/api/group`, { headers });
      setGroups(res.data.groups || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroupMessages = async (groupId: string) => {
    try {
      setGroupLoading(true);
      const res = await api.get(`/api/group/${groupId}/messages`, {
        headers,
      });
      setGroupMessages(res.data.messages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setGroupLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedMatch) return;
    try {
      await api.post(
        `/api/message/${selectedMatch._id}`,
        { content },
        { headers },
      );
      setContent("");
    } catch (err) {
      console.error(err);
    }
  };

  const sendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupContent.trim() || !selectedGroup) return;
    try {
      await api.post(
        `/api/group/${selectedGroup._id}/messages`,
        { content: groupContent },
        { headers },
      );
      setGroupContent("");
    } catch (err) {
      console.error(err);
    }
  };

  const getOther = (match: Match) => {
    if (!match || !match.sender || !match.receiver) return null;
    return match.sender._id === userId ? match.receiver : match.sender;
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const matchPartners: SimpleUser[] = useMemo(() => {
    return matches.map((m) => getOther(m)).filter((u): u is SimpleUser => !!u);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, userId]);

  const badgeCount = (count?: number) => {
    if (!count) return null;
    return (
      <span className="ml-auto shrink-0 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
        {count > 9 ? "9+" : count}
      </span>
    );
  };

  // ── Bắt đầu cuộc gọi bằng setActiveCallRoom từ Context ──
  const startCall = () => {
    if (!selectedMatch) return;
    const other = getOther(selectedMatch);
    if (!other) return;
    const roomName = `skillswap-${selectedMatch._id}`;
    socket.emit("call_invite", {
      matchId: selectedMatch._id,
      roomName,
      callerName: user?.username || "Người dùng",
      receiverId: other._id,
    });
    setActiveCallRoom(roomName);
  };

  const startGroupCall = () => {
    if (!selectedGroup) return;
    setActiveCallRoom(selectedGroup.roomName);
  };

  // ── Nhóm học ──
  const isGroupTeacher = (group: Group) => group.teacher._id === userId;

  const myMemberStatus = (group: Group) =>
    group.members.find((m) => m.user._id === userId)?.status;

  const acceptedMembers = (group: Group) =>
    group.members.filter((m) => m.status === "accepted");

  const closeGroup = async () => {
    if (!selectedGroup) return;
    if (!confirm("Kết thúc buổi học nhóm này?")) return;
    try {
      await api.put(
        `/api/group/${selectedGroup._id}/close`,
        {},
        { headers },
      );
      setSelectedGroup(null);
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full relative bg-[radial-gradient(circle_at_75%_0%,rgba(124,58,237,0.08),transparent_30%)]">
      {/* ── Sidebar ── */}
      <div className="w-64 min-w-64 border-r border-border flex flex-col bg-card/30">
        <div className="p-3 border-b border-border space-y-3">
          <div className="flex items-center justify-between px-1">
            <div><p className="text-sm font-bold">Tin nhắn</p><p className="text-[11px] text-muted-foreground">Không gian trao đổi của bạn</p></div>
            <button onClick={() => setShowChatSettings(true)} className="w-8 h-8 rounded-lg border border-border bg-background/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors" title="Cài đặt chat"><Settings2 className="w-4 h-4" /></button>
          </div>
          <div className="flex gap-1 p-1 bg-secondary rounded-xl">
            <button
              onClick={() => setViewMode("direct")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "direct"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Tin nhắn
            </button>
            <button
              onClick={() => setViewMode("groups")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "groups"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Nhóm học
            </button>
          </div>
        </div>

        {viewMode === "direct" ? (
          <div className="flex-1 overflow-y-auto">
            {matches.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Chưa có cuộc trò chuyện nào
              </div>
            ) : (
              matches.map((match) => {
                const other = getOther(match);
                const isSelected = selectedMatch?._id === match._id;
                if (!other) return null;

                return (
                  <button
                    key={match._id}
                    onClick={() => setSelectedMatch(match)}
                    className={`w-full flex items-center gap-3 mx-2 w-[calc(100%-16px)] px-3 py-3 rounded-xl hover:bg-secondary/80 transition-all text-left ${
                      isSelected ? "bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <Avatar
                      avatar={other.avatar}
                      username={other.username}
                      className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {other.username || "Người dùng ẩn"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Nhấn để xem tin nhắn
                      </p>
                    </div>
                    {badgeCount(unreadCounts[match._id])}
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-3">
              <button
                onClick={() => setShowCreateGroup(true)}
                disabled={matchPartners.length === 0}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" /> Tạo buổi học nhóm
              </button>
            </div>
            {groups.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Chưa có nhóm học nào
              </div>
            ) : (
              groups.map((group) => {
                const isSelected = selectedGroup?._id === group._id;
                const myStatus = myMemberStatus(group);
                if (!isGroupTeacher(group) && myStatus !== "accepted")
                  return null;

                return (
                  <button
                    key={group._id}
                    onClick={() => setSelectedGroup(group)}
                    className={`w-full flex items-center gap-3 mx-2 w-[calc(100%-16px)] px-3 py-3 rounded-xl hover:bg-secondary/80 transition-all text-left ${
                      isSelected ? "bg-primary/10 text-foreground shadow-sm ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-medium text-purple-700 shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {group.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isGroupTeacher(group)
                          ? `Bạn là giáo viên · ${acceptedMembers(group).length} học viên`
                          : `GV: ${group.teacher.username}`}
                      </p>
                    </div>
                    {badgeCount(unreadCounts[`group_${group._id}`])}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Khu vực chat 1-1 ── */}
      {viewMode === "direct" &&
        (selectedMatch && getOther(selectedMatch) ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border bg-card/40 backdrop-blur-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  avatar={getOther(selectedMatch)?.avatar}
                  username={getOther(selectedMatch)?.username}
                  className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700"
                />
                <span className="text-sm font-medium">
                  {getOther(selectedMatch)?.username || "Người dùng ẩn"}
                </span>
              </div>

              <button
                onClick={startCall}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Video className="w-3.5 h-3.5" /> Bắt đầu gọi video
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto px-5 py-5 flex flex-col ${chatSettings.compact ? "gap-1.5" : "gap-3"}`}>
              {loading ? (
                <div className="text-center py-10">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender._id === userId;
                  return (
                    <div
                      key={msg._id}
                      className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {!isMine && (
                        <Avatar
                          avatar={msg.sender?.avatar}
                          username={msg.sender?.username}
                          className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-700"
                        />
                      )}
                      <div
                          className={`max-w-[68%] px-3.5 ${chatSettings.compact ? "py-1.5" : "py-2.5"} rounded-2xl text-sm shadow-sm ${
                          isMine
                            ? "bg-primary text-white rounded-br-sm"
                            : "bg-secondary text-foreground rounded-bl-sm"
                        }`}
                      >
                        {msg.content}
                        {chatSettings.showTime && <p
                          className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-muted-foreground"}`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={sendMessage}
              className="px-5 py-3 border-t border-border bg-card/50 flex items-center gap-3"
            >
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !chatSettings.sendOnEnter) e.preventDefault(); }}
                placeholder="Nhập tin nhắn..."
                className="flex-1 h-11 px-4 rounded-2xl bg-secondary/80 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-sm text-foreground placeholder:text-muted-foreground transition-all"
              />
              <button
                type="submit"
                disabled={!content.trim()}
                className="w-11 h-11 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 hover:-translate-y-0.5 shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
          </div>
        ))}

      {/* ── Khu vực nhóm học ── */}
      {viewMode === "groups" &&
        (selectedGroup ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{selectedGroup.title}</p>
                <p className="text-xs text-muted-foreground">
                  {acceptedMembers(selectedGroup).length} thành viên đã tham gia
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={startGroupCall}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Video className="w-3.5 h-3.5" /> Vào phòng học
                </button>
                {isGroupTeacher(selectedGroup) && (
                  <button
                    onClick={closeGroup}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-medium rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Kết thúc
                  </button>
                )}
              </div>
            </div>

            <div className={`flex-1 overflow-y-auto px-5 py-5 flex flex-col ${chatSettings.compact ? "gap-1.5" : "gap-3"}`}>
              {groupLoading ? (
                <div className="text-center py-10">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : groupMessages.length === 0 ? (
                <div className="text-center py-10 text-xs text-muted-foreground">
                  Chưa có tin nhắn nào trong nhóm này
                </div>
              ) : (
                groupMessages.map((msg) => {
                  const isMine = msg.sender._id === userId;
                  return (
                    <div
                      key={msg._id}
                      className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {!isMine && (
                        <Avatar
                          avatar={msg.sender?.avatar}
                          username={msg.sender?.username}
                          className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-medium text-purple-700"
                        />
                      )}
                      <div className="max-w-[65%]">
                        {!isMine && (
                          <p className="text-[10px] text-muted-foreground mb-0.5 px-1">
                            {msg.sender?.username}
                          </p>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            isMine
                              ? "bg-primary text-white rounded-br-sm"
                              : "bg-secondary text-foreground rounded-bl-sm"
                          }`}
                        >
                          {msg.content}
                          {chatSettings.showTime && <p
                            className={`text-[10px] mt-1 ${isMine ? "text-white/60" : "text-muted-foreground"}`}
                          >
                            {formatTime(msg.createdAt)}
                          </p>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={groupBottomRef} />
            </div>

            <form
              onSubmit={sendGroupMessage}
              className="px-5 py-3 border-t border-border flex items-center gap-3"
            >
              <input
                type="text"
                value={groupContent}
                onChange={(e) => setGroupContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !chatSettings.sendOnEnter) e.preventDefault(); }}
                placeholder="Nhập tin nhắn cho cả nhóm..."
                className="flex-1 h-10 px-4 rounded-full bg-secondary border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                disabled={!groupContent.trim()}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <Users className="w-10 h-10 opacity-30" />
            <p className="text-sm">Chọn 1 nhóm học hoặc tạo nhóm mới</p>
          </div>
        ))}

      {/* ── Modal tạo nhóm ── */}
      {showChatSettings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <div><h3 className="font-bold">Cài đặt chat</h3><p className="text-xs text-muted-foreground mt-0.5">Lưu riêng trên thiết bị này</p></div>
              <button onClick={() => setShowChatSettings(false)} className="w-8 h-8 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4 mx-auto" /></button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { key: "showTime" as const, icon: Clock3, title: "Hiển thị thời gian", description: "Hiện thời điểm gửi bên dưới mỗi tin nhắn." },
                { key: "compact" as const, icon: Rows3, title: "Chế độ gọn", description: "Thu hẹp khoảng cách để xem nhiều tin nhắn hơn." },
                { key: "sendOnEnter" as const, icon: CornerDownLeft, title: "Gửi bằng phím Enter", description: "Tắt để Enter không gửi tin nhắn." },
              ].map(({ key, icon: Icon, title, description }) => (
                <button key={key} type="button" onClick={() => setChatSettings((prev) => ({ ...prev, [key]: !prev[key] }))} className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl border border-border/70 bg-secondary/25 hover:bg-secondary/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="w-4 h-4" /></div>
                  <div className="flex-1"><p className="text-sm font-semibold">{title}</p><p className="text-xs text-muted-foreground mt-0.5">{description}</p></div>
                  <span className={`relative w-10 h-6 rounded-full transition-colors ${chatSettings[key] ? "bg-primary" : "bg-muted-foreground/30"}`}><span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${chatSettings[key] ? "translate-x-4" : ""}`} /></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <CreateGroupModal
          students={matchPartners}
          token={token}
          onClose={() => setShowCreateGroup(false)}
          onCreated={fetchGroups}
        />
      )}
    </div>
  );
}
