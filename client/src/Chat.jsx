import React, { useState, useRef, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import {
  ArrowLeft,
  Search,
  Paperclip,
  Send,
  RefreshCw,
  Image as ImageIconLucide,
  Loader2,
  MapPin,
  MessageSquare,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import ConfirmDialog from "./ConfirmDialog";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { UserProvider } from "./contexts/UserContext";
import { toastError } from "./services/toastService";
import {
  getContacts as apiGetContacts,
  getMessages as apiGetMessages,
  sendMessage as apiSendMessage,
  deleteContacts as apiDeleteContacts,
  uploadImage as apiUploadImage,
  uploadFile as apiUploadFile,
  SOCKET_URL,
} from "./services/chatService";
import "./Chat.css";

const getToken = () => localStorage.getItem("token");

const normalizeContact = (c) => {
  const rel = c.contactRel ?? {};
  const name = rel.individual?.full_Name ?? rel.business?.business_Name ?? "Unknown";
  const rawLocation = rel.individual?.location ?? rel.business?.locations ?? "";
  const location = String(rawLocation || "").split(/[,;]/)[0].trim();
  const rawPhoto = rel.profile_Photo ?? null;
  const photo = rawPhoto ? `${SOCKET_URL}/${rawPhoto}`.replace(/([^:]\/)\/+/g, "$1") : null;

  return {
    id: c.id,
    userId: parseInt(rel.id, 10),
    name,
    location,
    photo,
    type: rel.type,
    online: false,
    unread: 0,
    lastMessage: null,
  };
};

const getAttachmentNameFromPath = (pathValue) => {
  if (!pathValue) return "File";
  try {
    const url = new URL(pathValue, window.location.origin);
    const encodedName = url.searchParams.get("name");
    if (encodedName) return decodeURIComponent(encodedName);
  } catch {
    const queryIndex = pathValue.indexOf("?");
    if (queryIndex >= 0) {
      const params = new URLSearchParams(pathValue.slice(queryIndex + 1));
      const encodedName = params.get("name");
      if (encodedName) return decodeURIComponent(encodedName);
    }
  }
  return pathValue.split("/").pop() || "File";
};

const getAttachmentKind = (pathValue, fallbackKind = "file") => {
  if (!pathValue) return fallbackKind;
  const basePath = String(pathValue).split("?")[0].toLowerCase();
  if (basePath.match(/\.(png|jpe?g|gif|webp|bmp|avif|svg)$/)) return "image";
  if (basePath.endsWith(".pdf")) return "pdf";
  return "file";
};

const AttachmentBadge = ({ kind }) => {
  if (kind === "image") return <span className="ch-attachment-badge ch-attachment-badge--image">Photo</span>;
  if (kind === "pdf") return <span className="ch-attachment-badge ch-attachment-badge--pdf">PDF</span>;
  return <span className="ch-attachment-badge ch-attachment-badge--file">File</span>;
};

const AttachmentIcon = ({ kind }) => {
  if (kind === "image") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <path d="M21 16l-5.5-5.5L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === "pdf") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 15h8M8 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const AttachmentBubble = ({ kind, name, url }) => {
  if (kind === "image") {
    return (
      <div className="ch-attachment-card ch-attachment-card--image" onClick={() => window.open(url, "_blank")} role="button" tabIndex={0}>
        <img src={url} alt={name} className="ch-attachment-photo" />
        <div className="ch-attachment-meta">
          <AttachmentBadge kind={kind} />
          <span className="ch-attachment-name">{name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`ch-attachment-card ch-attachment-card--${kind}`} onClick={() => window.open(url, "_blank")} role="button" tabIndex={0}>
      <div className="ch-attachment-icon-wrap"><AttachmentIcon kind={kind} /></div>
      <div className="ch-attachment-body">
        <AttachmentBadge kind={kind} />
        <span className="ch-attachment-name">{name}</span>
        <span className="ch-attachment-hint">{kind === "pdf" ? "Open PDF document" : "Open file attachment"}</span>
      </div>
    </div>
  );
};

function Avatar({ conv, size = 48, onClick, showOnline = true }) {
  const [imgError, setImgError] = useState(false);
  const colorKeys = ["green", "blue", "orange", "purple"];
  const colorHex = { green: "var(--app-green)", blue: "var(--app-green)", orange: "#f97316", purple: "#a855f7" };
  const colorKey = colorKeys[(conv.name?.charCodeAt(0) || 0) % colorKeys.length];
  const initials = (conv.name || "?").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div
      className="ch-avatar-wrap"
      style={{ width: size, height: size, cursor: onClick ? "pointer" : "default" }}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
      title={onClick ? `View ${conv.name}'s profile` : undefined}
    >
      {conv.photo && !imgError ? (
        <img src={conv.photo} alt={conv.name} className="ch-avatar-img" style={{ width: size, height: size }} onError={() => setImgError(true)} />
      ) : (
        <div
          className="ch-avatar-fallback"
          style={{ width: size, height: size, background: `${colorHex[colorKey]}22`, color: colorHex[colorKey], fontSize: size * 0.35 }}
        >
          {initials}
        </div>
      )}
      {showOnline && conv.online && <span className="ch-online-dot" />}
    </div>
  );
}

function ChatContent({
  onNavigate,
  onBack,
  currentUserId,
  userName = "User",
  userRole = "USER",
  userPhoto = "",
  hasUnreadNotifications = false,
}) {
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactsError, setContactsError] = useState(null);

  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);

  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState([]);

  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imgInputRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const selectAllRef = useRef(null);
  const activeConvRef = useRef(null);
  const onlineUsersRef = useRef(new Set());

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  useEffect(() => {
    if (!currentUserId) return;

    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: getToken() },
    });

    const socket = socketRef.current;
    socket.on("connect", () => socket.emit("join", parseInt(currentUserId, 10)));

    socket.on("online_users", ({ users }) => {
      onlineUsersRef.current = new Set(users);
      setContacts((prev) => prev.map((c) => ({ ...c, online: users.includes(c.userId) })));
    });

    socket.on("receive_message", (message) => {
      const conv = activeConvRef.current;
      const senderId = message.fromUser;

      if (conv && (conv.userId == senderId || conv.id == senderId)) {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
      } else {
        setContacts((prev) =>
          prev.map((c) =>
            c.userId == senderId ? { ...c, unread: (c.unread || 0) + 1, lastMessage: message.msg || "📎 Attachment" } : c
          )
        );
      }
    });

    socket.on("message_sent", (message) => {
      setMessages((prev) => prev.map((m) => (m._pending && m.id === message.id ? { ...message, _pending: false } : m)));
    });

    socket.on("typing", ({ fromUser }) => {
      const conv = activeConvRef.current;
      if (conv && (conv.userId == fromUser || conv.id == fromUser)) setOtherUserTyping(true);
    });

    socket.on("stop_typing", ({ fromUser }) => {
      const conv = activeConvRef.current;
      if (conv && (conv.userId == fromUser || conv.id == fromUser)) setOtherUserTyping(false);
    });

    socket.on("user_online", ({ userId }) => {
      onlineUsersRef.current.add(userId);
      setContacts((prev) => prev.map((c) => (c.userId == userId ? { ...c, online: true } : c)));
      setActiveConv((prev) => (prev && prev.userId == userId ? { ...prev, online: true } : prev));
    });

    socket.on("user_offline", ({ userId }) => {
      onlineUsersRef.current.delete(userId);
      setContacts((prev) => prev.map((c) => (c.userId == userId ? { ...c, online: false } : c)));
      setActiveConv((prev) => (prev && prev.userId == userId ? { ...prev, online: false } : prev));
    });

    return () => socket.disconnect();
  }, [currentUserId]);

  useEffect(() => {
    const t = setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    return () => clearTimeout(t);
  }, [messages]);

  useEffect(() => {
    if (!messagesLoading && activeConv) messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messagesLoading, activeConv]);

  useEffect(() => {
    setContactsLoading(true);
    setContactsError(null);
    apiGetContacts()
      .then((data) => {
        const normalized = data.map(normalizeContact);
        setContacts(normalized.map((c) => ({ ...c, online: onlineUsersRef.current.has(c.userId) })));
      })
      .catch((err) => setContactsError(err.message))
      .finally(() => setContactsLoading(false));
  }, []);

  useEffect(() => {
    setSelectedContactIds((prev) => prev.filter((id) => contacts.some((contact) => contact.id === id)));
  }, [contacts]);

  const handleBack = () => {
    if (onBack) onBack();
    else if (onNavigate) onNavigate("dashboard");
  };

  const goToProfile = (userId) => {
    if (!userId || !onNavigate) return;
    onNavigate("publicProfile", { userId, publicUserId: userId, from: "chat" });
  };

  const openConversation = useCallback(async (conv) => {
    setContacts((prev) => prev.map((c) => (c.id === conv.id ? { ...c, unread: 0 } : c)));
    setActiveConv(conv);
    setMessages([]);
    setInputText("");
    setPreviewFile(null);
    setOtherUserTyping(false);
    setMessagesLoading(true);
    setMessagesError(null);

    try {
      const data = await apiGetMessages(conv.userId ?? conv.id);
      setMessages(data);
    } catch (err) {
      setMessagesError(err.message);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const closeConversation = () => {
    setActiveConv(null);
    setMessages([]);
    setInputText("");
    setPreviewFile(null);
    setMessagesError(null);
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text && !previewFile) return;

    const receiverId = activeConv?.userId ?? activeConv?.id;
    const time = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const tempId = Date.now();

    const newMsg = {
      id: tempId,
      fromUser: currentUserId,
      toUser: receiverId,
      msg: text || null,
      image: previewFile ? previewFile.url : null,
      createdAt: new Date().toISOString(),
      _localTime: time,
      _localFile: previewFile,
      _pending: true,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setPreviewFile(null);

    try {
      let imageUrl = null;
      if (previewFile?.type === "image" && previewFile.file) imageUrl = await apiUploadImage(previewFile.file);
      else if (previewFile?.type === "file" && previewFile.file) imageUrl = await apiUploadFile(previewFile.file);

      const response = await apiSendMessage(receiverId, text || null, imageUrl);

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? { ...response.data, _localTime: time, _pending: false } : msg))
      );

      if (socketRef.current) socketRef.current.emit("send_message", { ...response.data, toUser: receiverId });
    } catch (err) {
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? { ...msg, _failed: true, _pending: false } : msg)));
      console.error("Failed to send message:", err);
    }
  };

  const resendMessage = (msg) => {
    setMessages((prev) => [
      ...prev,
      {
        ...msg,
        id: Date.now(),
        _localTime: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        resent: true,
      },
    ]);
  };

  const emitTyping = () => {
    const receiverId = activeConv?.userId ?? activeConv?.id;
    if (socketRef.current && receiverId) {
      socketRef.current.emit("typing", { toUser: receiverId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => socketRef.current.emit("stop_typing", { toUser: receiverId }), 2000);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else emitTyping();
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    emitTyping();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      toastError("Only images and PDFs are allowed");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toastError("File must be under 5 MB");
      e.target.value = "";
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewFile({ url, name: file.name, type: isImage ? "image" : "file", file });
    e.target.value = "";
  };

  const isMyMessage = (msg) => (msg.fromUser ?? msg.from) == currentUserId || msg.from === "me";
  const formatTime = (msg) => msg._localTime || (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : msg.time || "");
  const getMsgText = (msg) => msg.msg ?? msg.text ?? null;

  const getMsgImage = (msg) => {
    const raw = msg.image ?? msg._localFile?.url ?? null;
    if (!raw) return null;
    if (raw.startsWith("blob:") || raw.startsWith("data:") || raw.startsWith("http")) return raw;
    const normalized = raw.startsWith("/") ? raw : `/${raw}`;
    return `${SOCKET_URL}${normalized}`;
  };

  const getMsgImageType = (msg) => {
    if (msg._localFile?.type === "image") return "image";
    if (msg._localFile?.type === "file") return "pdf";
    return getAttachmentKind(msg.image, "file");
  };

  const getMsgFileName = (msg) => msg._localFile?.name ?? getAttachmentNameFromPath(msg.image);

  const filteredContacts = contacts.filter((c) => (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()));
  const visibleContactIds = filteredContacts.map((c) => c.id);
  const allVisibleSelected = visibleContactIds.length > 0 && visibleContactIds.every((id) => selectedContactIds.includes(id));
  const someVisibleSelected = visibleContactIds.some((id) => selectedContactIds.includes(id));

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
  }, [allVisibleSelected, someVisibleSelected]);

  const toggleContactSelection = (contactId) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const toggleSelectVisible = (checked) => {
    setSelectedContactIds((prev) => (checked ? Array.from(new Set([...prev, ...visibleContactIds])) : prev.filter((id) => !visibleContactIds.includes(id))));
  };

  const promptDeleteSelectedContacts = () => {
    if (selectedContactIds.length === 0) return;
    setDeleteTargetIds(selectedContactIds);
    setDeleteDialogOpen(true);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedContactIds([]);
        setDeleteDialogOpen(false);
        setDeleteTargetIds([]);
      }
      return next;
    });
  };

  const confirmDeleteSelectedContacts = async () => {
    if (deleteTargetIds.length === 0) return;
    setDeleteBusy(true);
    try {
      const response = await apiDeleteContacts(deleteTargetIds);
      const deletedIds = response?.data?.deletedContactIds || deleteTargetIds;
      setContacts((prev) => prev.filter((c) => !deletedIds.includes(c.id)));
      setSelectedContactIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
      setDeleteDialogOpen(false);
      setDeleteTargetIds([]);
    } catch (err) {
      toastError(err.message || "Failed to delete contacts");
    } finally {
      setDeleteBusy(false);
    }
  };

  const unreadCount = contacts.filter((c) => c.unread > 0).length;
  const normalizedRole = String(userRole || "").toUpperCase();

  const listView = (
    <>
      <div className="ch-header">
        <div className="ch-header-left">
          <button className="ch-back-btn" onClick={handleBack}><ArrowLeft size={20} /></button>
          <div className="ch-header-info">
            <span className="ch-header-title">Messages</span>
            {!contactsLoading && <span className="ch-header-subtitle">{unreadCount > 0 ? `${unreadCount} unread` : "All read"}</span>}
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div className="ch-body">
        <div className="ch-search-wrap">
          <span className="ch-search-icon"><Search size={16} /></span>
          <input className="ch-search" type="text" placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>

        <div className="ch-list-header">
          <div className="ch-section-label ch-section-label--compact">Recent</div>
          <button type="button" className={`ch-selection-toggle-btn ${isSelectionMode ? "ch-selection-toggle-btn--active" : ""}`} onClick={toggleSelectionMode}>
            {isSelectionMode ? "Done" : "Select"}
          </button>
        </div>

        {isSelectionMode && !contactsLoading && !contactsError && contacts.length > 0 && (
          <div className="ch-list-actions">
            <label className="ch-select-all">
              <input ref={selectAllRef} type="checkbox" checked={allVisibleSelected} onChange={(e) => toggleSelectVisible(e.target.checked)} />
              <span>Select visible</span>
            </label>
            <button type="button" className="ch-delete-selected-btn" onClick={promptDeleteSelectedContacts} disabled={selectedContactIds.length === 0}>
              Delete selected
            </button>
          </div>
        )}

        {contactsLoading && <div className="ch-loading-state"><Loader2 size={20} className="ch-spin-icon" /><span>Loading contacts...</span></div>}

        {contactsError && !contactsLoading && (
          <div className="ch-error-state">
            <span>⚠ {contactsError}</span>
            <button
              className="ch-retry-btn"
              onClick={() => {
                setContactsLoading(true);
                setContactsError(null);
                apiGetContacts()
                  .then((data) => setContacts(data.map(normalizeContact)))
                  .catch((e) => setContactsError(e.message))
                  .finally(() => setContactsLoading(false));
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!contactsLoading && !contactsError && (
          <div className="ch-conv-list">
            {filteredContacts.length === 0 && (
              <div className="ch-empty">
                <div className="ch-empty-icon"><Search size={24} /></div>
                <span className="ch-empty-title">{contacts.length === 0 ? "No contacts yet" : "No results"}</span>
                <span className="ch-empty-desc">{contacts.length === 0 ? "Your contacts will appear here." : "No conversations match your search."}</span>
              </div>
            )}

            {filteredContacts.map((conv, idx) => (
              <React.Fragment key={conv.id ?? conv._id}>
                <div className={`ch-conv-item ${selectedContactIds.includes(conv.id) ? "ch-conv-item--selected" : ""}`} onClick={() => openConversation(conv)}>
                  <Avatar conv={conv} size={50} showOnline={true} onClick={() => goToProfile(conv.userId ?? conv.id)} />

                  <div className="ch-conv-info">
                    <div className="ch-conv-row">
                      <span className="ch-conv-name">{conv.name}</span>
                      <span className="ch-conv-time">{conv.time ?? conv.lastMessageAt ?? ""}</span>
                    </div>
                    <div className="ch-conv-meta">
                      {conv.type && <span className="ch-conv-type">{conv.type === "BUSINESS" ? "Business" : "Individual"}</span>}
                      {conv.location && <span className="ch-conv-location"><MapPin size={10} className="ch-conv-location-icon" />{conv.location}</span>}
                    </div>
                    <div className="ch-conv-preview-row">
                      <span className={`ch-conv-preview ${conv.unread ? "ch-conv-preview--unread" : ""}`}>{conv.lastMessage ?? conv.lastMsg ?? ""}</span>
                      {conv.unread > 0 && <span className="ch-unread-badge">{conv.unread}</span>}
                    </div>
                  </div>

                  {isSelectionMode && (
                    <div className="ch-conv-select" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="ch-conv-checkbox" checked={selectedContactIds.includes(conv.id)} onChange={() => toggleContactSelection(conv.id)} aria-label={`Select ${conv.name}`} />
                    </div>
                  )}
                </div>
                {idx < filteredContacts.length - 1 && <div className="ch-divider" />}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const chatView = activeConv ? (
    <>
      <div className="ch-chat-header">
        <button className="ch-back-btn" onClick={closeConversation} title="Back"><ArrowLeft size={20} /></button>
        <Avatar conv={activeConv} size={40} onClick={() => goToProfile(activeConv.userId ?? activeConv.id)} showOnline={true} />
        <div className="ch-chat-info ch-chat-info--clickable" onClick={() => goToProfile(activeConv.userId ?? activeConv.id)}>
          <div className="ch-chat-name">{activeConv.name}</div>
          <div className="ch-chat-status">{otherUserTyping ? <span className="ch-typing-indicator">typing...</span> : activeConv.online ? "● Online" : "Offline"}</div>
        </div>
        <ThemeToggle />
      </div>

      <div className="ch-messages">
        <div className="ch-date-sep">TODAY</div>
        {messagesLoading && <div className="ch-loading-state"><Loader2 size={20} className="ch-spin-icon" /><span>Loading messages...</span></div>}
        {messagesError && !messagesLoading && <div className="ch-error-state"><span>⚠ {messagesError}</span><button className="ch-retry-btn" onClick={() => openConversation(activeConv)}>Retry</button></div>}
        {!messagesLoading && !messagesError && messages.length === 0 && <div className="ch-empty-messages"><span>No messages yet. Say hello! 👋</span></div>}

        {!messagesLoading && messages.map((msg) => {
          const mine = isMyMessage(msg);
          const imgUrl = getMsgImage(msg);
          const imgType = getMsgImageType(msg);
          const text = getMsgText(msg);
          const attachmentName = getMsgFileName(msg);

          return (
            <div key={msg.id ?? msg._id ?? Math.random()} className={`ch-msg ch-msg--${mine ? "me" : "them"}`}>
              {imgUrl ? (
                <div className={`ch-bubble ch-bubble--file ${mine ? "ch-bubble--me-file" : "ch-bubble--them-file"}`}>
                  <AttachmentBubble kind={imgType} name={attachmentName} url={imgUrl} />
                  {text && <p className="ch-file-caption">{text}</p>}
                </div>
              ) : (
                <div className="ch-bubble">{text}</div>
              )}
              <div className="ch-msg-meta">
                <span className="ch-msg-time">{formatTime(msg)}</span>
                {mine && <button className="ch-resend-btn" title="Resend" onClick={() => resendMessage(msg)}><RefreshCw size={14} /></button>}
                {msg.resent && <span className="ch-resent-label">Resent</span>}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {previewFile && (
        <div className="ch-preview-strip">
          <div className={`ch-preview-card ch-preview-card--${previewFile.type}`}>
            {previewFile.type === "image" ? <img src={previewFile.url} alt="preview" className="ch-preview-img" /> : <div className="ch-preview-icon-wrap"><AttachmentIcon kind="pdf" /></div>}
            <div className="ch-preview-copy">
              <AttachmentBadge kind={previewFile.type === "image" ? "image" : "pdf"} />
              <span className="ch-preview-name">{previewFile.name}</span>
            </div>
          </div>
          <button className="ch-preview-cancel" onClick={() => setPreviewFile(null)}>✕</button>
        </div>
      )}

      <div className="ch-input-bar">
        <input type="file" ref={fileInputRef} className="ch-hidden-input" accept="image/*,.pdf" onChange={handleFileChange} />
        <input type="file" ref={imgInputRef} className="ch-hidden-input" accept="image/*" onChange={handleFileChange} />
        <button className="ch-attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach file"><Paperclip size={18} /></button>
        <button className="ch-img-btn" onClick={() => imgInputRef.current?.click()} title="Send image"><ImageIconLucide size={18} /></button>

        <div className="ch-input-wrap">
          <textarea className="ch-input" placeholder="Type a message..." rows={1} value={inputText} onChange={handleInputChange} onKeyDown={handleKeyDown} />
        </div>

        <button className="ch-send-btn" onClick={sendMessage} disabled={!inputText.trim() && !previewFile}>
          <Send size={18} className="ch-send-icon" />
        </button>
      </div>
    </>
  ) : null;

  return (
    <div className="ch-screen">
      <div className="ch-mobile-shell">
        <div className={`ch-container ${activeConv ? "ch-container--conversation" : ""}`}>
          {activeConv ? chatView : listView}
        </div>
      </div>

      <div className="ch-desktop-shell">
        <div className="ch-desktop-layout">
          <Sidebar
            activeNav="chat"
            onNavigate={(tab) => {
              if (tab === "home") onNavigate?.("dashboard");
              else onNavigate?.(tab);
            }}
            userRole={normalizedRole}
          />

          <div className="ch-desktop-main">
            <Header
              userName={userName}
              userRole={normalizedRole}
              userPhoto={userPhoto}
              hasUnreadNotifications={hasUnreadNotifications}
              onNavigate={onNavigate}
            />

            <div className="ch-desktop-chat-surface">
              <div className="ch-desktop-list-panel">{listView}</div>
              <div className="ch-desktop-chat-panel">
                {activeConv ? (
                  chatView
                ) : (
                  <div className="ch-empty ch-empty--desktop">
                    <div className="ch-empty-icon"><MessageSquare size={24} /></div>
                    <span className="ch-empty-title">Select a conversation</span>
                    <span className="ch-empty-desc">Pick a contact from the left panel to start chatting.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Contacts"
        message={`Delete ${deleteTargetIds.length} selected contact${deleteTargetIds.length > 1 ? "s" : ""} and all messages with them?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteBusy}
        onCancel={() => {
          if (deleteBusy) return;
          setDeleteDialogOpen(false);
          setDeleteTargetIds([]);
        }}
        onConfirm={confirmDeleteSelectedContacts}
      />
    </div>
  );
}

export default function Chat(props) {
  return (
    <UserProvider>
      <ChatContent {...props} />
    </UserProvider>
  );
}
