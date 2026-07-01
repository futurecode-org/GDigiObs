import { useEffect, useRef, useCallback } from "react";
import { getAccessToken } from "../lib/api";
import type { Message } from "../lib/types";

interface WebSocketEvent {
  event: "message.new" | "message.recalled" | "message.updated" | "message.read" | "conversation.updated" | "friend.application.new";
  data: unknown;
}

interface UseWebSocketOptions {
  onNewMessage?: (message: Message) => void;
  onMessageRecalled?: (messageId: number) => void;
  onMessageUpdated?: (message: any) => void;
  onMessageRead?: (conversationId: number) => void;
  onConversationUpdated?: () => void;
  onFriendApplication?: () => void;
}

const globalWsRef = { current: null as WebSocket | null };
const globalHeartbeatTimerRef = { current: null as ReturnType<typeof setInterval> | null };
const globalIsConnectedRef = { current: false };
const globalIsConnectingRef = { current: false };

export function useWebSocket({
  onNewMessage,
  onMessageRecalled,
  onMessageUpdated,
  onMessageRead,
  onConversationUpdated,
  onFriendApplication,
}: UseWebSocketOptions = {}) {
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlersRef = useRef({
    onNewMessage,
    onMessageRecalled,
    onMessageUpdated,
    onMessageRead,
    onConversationUpdated,
    onFriendApplication,
  });

  useEffect(() => {
    handlersRef.current = {
      onNewMessage,
      onMessageRecalled,
      onMessageUpdated,
      onMessageRead,
      onConversationUpdated,
      onFriendApplication,
    };
  }, [onNewMessage, onMessageRecalled, onMessageUpdated, onMessageRead, onConversationUpdated, onFriendApplication]);

  const startHeartbeat = useCallback(() => {
    if (globalHeartbeatTimerRef.current) {
      clearInterval(globalHeartbeatTimerRef.current);
    }
    globalHeartbeatTimerRef.current = setInterval(() => {
      if (globalWsRef.current && globalWsRef.current.readyState === WebSocket.OPEN) {
        globalWsRef.current.send(JSON.stringify({ type: "heartbeat" }));
      }
    }, 30000);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (globalHeartbeatTimerRef.current) {
      clearInterval(globalHeartbeatTimerRef.current);
      globalHeartbeatTimerRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (globalIsConnectedRef.current || globalIsConnectingRef.current) {
      console.log("WebSocket already connected or connecting");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      console.log("No token, skip WebSocket connection");
      return;
    }

    globalIsConnectingRef.current = true;
    const wsUrl = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000/ws";
    const socket = new WebSocket(`${wsUrl}/im?token=${encodeURIComponent(token)}`);

    socket.onopen = () => {
      console.log("WebSocket connected");
      globalIsConnectedRef.current = true;
      globalIsConnectingRef.current = false;
      globalWsRef.current = socket;
      socket.send(JSON.stringify({ type: "heartbeat" }));
      startHeartbeat();
    };

    socket.onmessage = (event) => {
      try {
        const wsEvent: WebSocketEvent = JSON.parse(event.data);
        console.log("WebSocket received event:", wsEvent.event, wsEvent.data);
        const handlers = handlersRef.current;
        switch (wsEvent.event) {
          case "message.new":
            const newMsgData = wsEvent.data as { conversation_id: number; message: any };
            handlers.onNewMessage?.(newMsgData.message);
            break;
          case "message.recalled":
            const recalledData = wsEvent.data as { message_id: number };
            handlers.onMessageRecalled?.(recalledData.message_id);
            break;
          case "message.updated":
            const updatedMsgData = wsEvent.data as { conversation_id: number; message: any };
            handlers.onMessageUpdated?.(updatedMsgData.message);
            break;
          case "message.read":
            const readData = wsEvent.data as { conversation_id: number; user_id: number };
            handlers.onMessageRead?.(readData.conversation_id);
            break;
          case "conversation.updated":
            handlers.onConversationUpdated?.();
            break;
          case "friend.application.new":
            handlers.onFriendApplication?.();
            break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.onerror = () => {
      console.error("WebSocket error");
      globalIsConnectingRef.current = false;
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      globalIsConnectedRef.current = false;
      globalIsConnectingRef.current = false;
      globalWsRef.current = null;
      stopHeartbeat();
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 5000);
    };
  }, [startHeartbeat, stopHeartbeat]);

  const disconnect = useCallback(() => {
    stopHeartbeat();
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (globalWsRef.current) {
      globalWsRef.current.close();
      globalWsRef.current = null;
    }
    globalIsConnectedRef.current = false;
  }, [stopHeartbeat]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  return { disconnect };
}
