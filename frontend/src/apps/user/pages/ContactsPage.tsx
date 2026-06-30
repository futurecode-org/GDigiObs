import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Search, Plus, User, Users, Hash, Check, X, Loader2, Bell, Send, Users2, Shield, UserMinus, Crown, Trash2, LogOut, Info, MessageSquare, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { friendApi, groupApi, userApi, conversationApi } from "../../../lib/api";
import { toast } from "sonner";
import type { Friend, FriendRequest, Group, GroupJoinApplication, GroupInvitation, GroupMember, User as UserType, UserPage } from "../../../lib/types";
import { cn } from "@/lib/utils";

interface ContactsPageProps {
  onNavigate?: (page: UserPage) => void;
}

export function ContactsPage({ onNavigate }: ContactsPageProps) {
  const [activeTab, setActiveTab] = useState<"friends" | "groups" | "requests">("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupDetail, setShowGroupDetail] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [joinApplications, setJoinApplications] = useState<GroupJoinApplication[]>([]);
  const [groupInvitations, setGroupInvitations] = useState<GroupInvitation[]>([]);
  const [groupAnnouncements, setGroupAnnouncements] = useState<any[]>([]);
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementContent, setAnnouncementContent] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [searchUsers, setSearchUsers] = useState("");
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  const [showSearchUserDialog, setShowSearchUserDialog] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyTargetUser, setApplyTargetUser] = useState<UserType | null>(null);
  const [applyMessage, setApplyMessage] = useState("");

  const [showFriendDetailDialog, setShowFriendDetailDialog] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendRemark, setFriendRemark] = useState("");
  const [friendGroup, setFriendGroup] = useState("");
  const [editingRemark, setEditingRemark] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);

  const [showTransferOwnerDialog, setShowTransferOwnerDialog] = useState(false);
  const [transferTargetUser, setTransferTargetUser] = useState<number | null>(null);

  const [myGroupRole, setMyGroupRole] = useState<string>("member");
  const [showMuteDialog, setShowMuteDialog] = useState(false);
  const [muteTargetUserId, setMuteTargetUserId] = useState<number | null>(null);
  const [muteDuration, setMuteDuration] = useState(60);
  const [groupDetailTab, setGroupDetailTab] = useState<"members" | "applications" | "announcements">("members");

  const { user } = useAuth();

  useEffect(() => {
    if (activeTab === "friends") {
      fetchFriends();
    } else if (activeTab === "groups") {
      fetchGroups();
    } else {
      fetchRequests();
      fetchGroupInvitations();
    }
  }, [activeTab]);

  useEffect(() => {
    const handleFriendApplication = () => {
      fetchRequests();
    };
    
    window.addEventListener("friend_application_received", handleFriendApplication);
    return () => {
      window.removeEventListener("friend_application_received", handleFriendApplication);
    };
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupDetail(selectedGroup.id);
      setGroupDetailTab("members");
    }
  }, [selectedGroup?.id]);

  const fetchFriends = async () => {
    setIsLoading(true);
    try {
      const result = await friendApi.getList();
      setFriends(result as Friend[]);
    } catch {
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const result = await groupApi.getList();
      setGroups(result as Group[]);
    } catch {
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const result = await friendApi.getRequests();
      setRequests(result as FriendRequest[]);
    } catch {
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupInvitations = async () => {
    try {
      const result = await groupApi.getInvitations();
      setGroupInvitations(result as GroupInvitation[]);
    } catch {
      setGroupInvitations([]);
    }
  };

  const fetchGroupDetail = async (groupId: number) => {
    if (!groupId || isNaN(groupId)) return;
    if (!user) return;
    try {
      const group = await groupApi.getDetail(groupId);
      setSelectedGroup(group);
      setGroupMembers(group.members || []);

      const announcements = await groupApi.getAnnouncements(groupId);
      setGroupAnnouncements(announcements as any[]);

      const applications = await groupApi.getJoinApplications(groupId);
      setJoinApplications(applications as GroupJoinApplication[]);

      const myMember = group.members?.find(m => m.user_id === user?.id);
      const role = myMember?.role || "member";
      setMyGroupRole(role);
    } catch {}
  };

  const searchAvailableUsers = async (keyword: string) => {
    if (!keyword.trim()) {
      setAvailableUsers([]);
      return;
    }
    try {
      const result = await userApi.search(keyword, { page: 1, page_size: 10 });
      const data = result as any;
      const items = data.items || [];
      setAvailableUsers(items);
    } catch {
      setAvailableUsers([]);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchKeyword.trim()) return;
    try {
      const result = await userApi.search(searchKeyword, { page: 1, page_size: 20 });
      const data = result as any;
      setSearchResults(data.items || []);
    } catch {
      setSearchResults([]);
    }
  };

  const handleOpenApplyDialog = (user: UserType) => {
    setApplyTargetUser(user);
    setShowApplyDialog(true);
  };

  const handleSendFriendRequest = async () => {
    if (!applyTargetUser) return;
    try {
      await friendApi.apply(applyTargetUser.id, applyMessage);
      setShowApplyDialog(false);
      setApplyMessage("");
      setApplyTargetUser(null);
      setSearchKeyword("");
      setSearchResults([]);
      fetchRequests();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "发送好友申请失败";
      toast.error(message);
    }
  };

  const handleAccept = async (id: number) => {
    try {
      await friendApi.acceptRequest(id);
      fetchRequests();
      fetchFriends();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "接受好友申请失败";
      toast.error(message);
    }
  };

  const handleReject = async (id: number) => {
    try {
      await friendApi.rejectRequest(id);
      fetchRequests();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "拒绝好友申请失败";
      toast.error(message);
    }
  };

  const handleDeleteFriend = async (friendId: number) => {
    try {
      await friendApi.delete(friendId);
      fetchFriends();
      setShowFriendDetailDialog(false);
      setSelectedFriend(null);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "删除好友失败";
      toast.error(message);
    }
  };

  const handleStartChat = async (friendId: number) => {
    try {
      await conversationApi.create(friendId);
      onNavigate?.("messages");
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "发起会话失败";
      toast.error(message);
    }
  };

  const handleViewFriendDetail = (friend: Friend) => {
    setSelectedFriend(friend);
    setFriendRemark(friend.remark || "");
    setFriendGroup(friend.group || "");
    setEditingRemark(false);
    setEditingGroup(false);
    setShowFriendDetailDialog(true);
  };

  const handleSaveRemark = async () => {
    if (!selectedFriend) return;
    try {
      await friendApi.updateRemark(selectedFriend.friend_id, friendRemark);
      setEditingRemark(false);
      fetchFriends();
    } catch {}
  };

  const handleSaveGroup = async () => {
    if (!selectedFriend) return;
    try {
      await friendApi.setGroup(selectedFriend.friend_id, friendGroup);
      setEditingGroup(false);
      fetchFriends();
    } catch {}
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return;
    
    setCreateLoading(true);
    try {
      await groupApi.create(groupName, groupDescription || undefined);
      setShowCreateGroupDialog(false);
      setGroupName("");
      setGroupDescription("");
      fetchGroups();
    } catch {} finally {
      setCreateLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!announcementContent.trim() || !selectedGroup) return;
    
    try {
      await groupApi.createAnnouncement(selectedGroup.id, announcementContent);
      setShowAnnouncementDialog(false);
      setAnnouncementContent("");
      fetchGroupDetail(selectedGroup.id);
    } catch {}
  };

  const handleDeleteAnnouncement = async (groupId: number, announcementId: number) => {
    try {
      await groupApi.deactivateAnnouncement(announcementId);
      fetchGroupDetail(groupId);
      toast.success("公告已删除");
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "删除公告失败";
      toast.error(message);
    }
  };

  const handleAcceptJoinApplication = async (groupId: number, applicationId: number) => {
    try {
      await groupApi.acceptJoinApplication(groupId, applicationId);
      fetchGroupDetail(groupId);
    } catch {}
  };

  const handleRejectJoinApplication = async (groupId: number, applicationId: number) => {
    try {
      await groupApi.rejectJoinApplication(groupId, applicationId);
      fetchGroupDetail(groupId);
    } catch {}
  };

  const handleInviteUsers = async () => {
    if (!selectedGroup || selectedUsers.length === 0) return;
    
    try {
      await groupApi.inviteToGroup(selectedGroup.id, selectedUsers, inviteMessage);
      setShowInviteDialog(false);
      setSelectedUsers([]);
      setInviteMessage("");
      setSearchUsers("");
      setAvailableUsers([]);
      fetchGroupDetail(selectedGroup.id);
      toast.success("邀请已发送");
    } catch (err: any) {
      const message = err?.message || "邀请失败";
      toast.error(message);
    }
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await groupApi.acceptInvitation(invitationId);
      fetchGroupInvitations();
      fetchGroups();
    } catch {}
  };

  const handleRejectInvitation = async (invitationId: number) => {
    try {
      await groupApi.rejectInvitation(invitationId);
      fetchGroupInvitations();
    } catch {}
  };

  const handleMuteMember = (_groupId: number, userId: number) => {
    setMuteTargetUserId(userId);
    setMuteDuration(60);
    setShowMuteDialog(true);
  };

  const handleConfirmMute = async () => {
    if (!selectedGroup || !muteTargetUserId) return;
    try {
      await groupApi.muteMember(selectedGroup.id, muteTargetUserId, muteDuration);
      fetchGroupDetail(selectedGroup.id);
      setShowMuteDialog(false);
      setMuteTargetUserId(null);
    } catch {}
  };

  const handleUnmuteMember = async (groupId: number, userId: number) => {
    try {
      await groupApi.unmuteMember(groupId, userId);
      fetchGroupDetail(groupId);
    } catch {}
  };

  const handleRemoveMember = async (groupId: number, userId: number) => {
    try {
      await groupApi.removeMember(groupId, userId);
      fetchGroupDetail(groupId);
    } catch {}
  };

  const handleSetAdmin = async (groupId: number, userId: number, isAdmin: boolean) => {
    try {
      await groupApi.setAdmin(groupId, userId, isAdmin);
      fetchGroupDetail(groupId);
    } catch {}
  };

  const handleLeaveGroup = async (groupId: number) => {
    try {
      await groupApi.leave(groupId);
      setShowGroupDetail(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch {}
  };

  const handleDissolveGroup = async (groupId: number) => {
    try {
      await groupApi.dissolve(groupId);
      setShowGroupDetail(false);
      setSelectedGroup(null);
      fetchGroups();
      toast.success("群组已解散");
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "解散群组失败";
      toast.error(message);
    }
  };

  const handleTransferOwner = async () => {
    if (!selectedGroup || !transferTargetUser) return;
    try {
      await groupApi.setAdmin(selectedGroup.id, transferTargetUser, true);
      await groupApi.setAdmin(selectedGroup.id, selectedGroup.created_by, false);
      fetchGroupDetail(selectedGroup.id);
      setShowTransferOwnerDialog(false);
      setTransferTargetUser(null);
    } catch {}
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner": return "群主";
      case "admin": return "管理员";
      default: return "成员";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-red-50 text-red-600";
      case "admin": return "bg-orange-50 text-orange-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const isMuted = (member: GroupMember) => {
    if (!member.muted_until) return false;
    return new Date(member.muted_until) > new Date();
  };

  const pendingInvitations = groupInvitations.filter(i => i.status === "pending");

  return (
    <div className="h-full flex">
      <div className="w-72 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">联系人</h2>
            <div className="flex gap-1">
              <Dialog open={showSearchUserDialog} onOpenChange={setShowSearchUserDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"><Search className="w-4 h-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      搜索用户
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      value={searchKeyword}
                      onChange={e => setSearchKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                      placeholder="搜索用户名或昵称..."
                    />
                    <Button onClick={handleSearchUsers} disabled={!searchKeyword.trim()}>搜索</Button>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {searchResults.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                              {(user.nickname || user.username || "?").charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{user.nickname || user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email || "-"}</p>
                            </div>
                          </div>
                          <Button variant="default" size="sm" onClick={() => handleOpenApplyDialog(user)}><Send className="w-3 h-3" /> 添加</Button>
                        </div>
                      ))}
                      {searchResults.length === 0 && searchKeyword && (
                        <p className="text-center text-muted-foreground text-sm">未找到用户</p>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm"><Plus className="w-4 h-4" /></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      创建群组
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">群组名称 *</Label>
                      <Input
                        id="groupName"
                        value={groupName}
                        onChange={e => setGroupName(e.target.value)}
                        placeholder="请输入群组名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groupDescription">群组描述</Label>
                      <Input
                        id="groupDescription"
                        value={groupDescription}
                        onChange={e => setGroupDescription(e.target.value)}
                        placeholder="请输入群组描述（可选）"
                      />
                    </div>
                    <div className="flex gap-2 mt-6">
                      <Button variant="outline" className="flex-1" onClick={() => setShowCreateGroupDialog(false)}>取消</Button>
                      <Button className="flex-1" onClick={handleCreateGroup} disabled={createLoading || !groupName.trim()}>
                        {createLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        创建
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索联系人..."
              className="w-full pl-9 pr-3 py-2 bg-muted border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => setActiveTab("friends")}
              className={cn("flex-1 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1", activeTab === "friends" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              <Users className="w-3 h-3" /> 好友
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={cn("flex-1 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1 relative", activeTab === "groups" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              <Hash className="w-3 h-3" /> 群组
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={cn("flex-1 py-1.5 text-xs rounded transition-colors flex items-center justify-center gap-1 relative", activeTab === "requests" ? "bg-primary/10 text-primary" : "text-muted-foreground")}
            >
              <User className="w-3 h-3" /> 请求
              {pendingInvitations.length > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                  {pendingInvitations.length}
                </Badge>
              )}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : activeTab === "friends" ? (
            friends.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无好友</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowSearchUserDialog(true)}>
                  <Plus className="w-4 h-4" /> 添加好友
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase">
                  好友 ({friends.length})
                </div>
                {friends.map(friend => (
                  <div
                    key={friend.friend_id}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                        {(friend.nickname || friend.username || "?").charAt(0)}
                      </div>
                      {friend.is_online && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => handleStartChat(friend.friend_id)}>
                      <p className="text-sm font-medium text-foreground">{friend.remark || friend.nickname || friend.username || "?"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {friend.group && <span className="mr-2">{friend.group}</span>}
                        {friend.is_online ? "在线" : `上次在线 ${formatTime(friend.last_online_at || "")}`}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem onClick={() => handleViewFriendDetail(friend)}>
                          <Info className="w-4 h-4 mr-2" /> 查看资料
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStartChat(friend.friend_id)}>
                          <MessageSquare className="w-4 h-4 mr-2" /> 发起聊天
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteFriend(friend.friend_id)}>
                          <UserMinus className="w-4 h-4 mr-2" /> 删除好友
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )
          ) : activeTab === "groups" ? (
            groups.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Hash className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无群组</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreateGroupDialog(true)}>
                  <Plus className="w-4 h-4" /> 创建群组
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase">
                  群组 ({groups.length})
                </div>
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowGroupDetail(true);
                    }}
                    className={cn("w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left", selectedGroup?.id === group.id ? "bg-primary/10" : "")}
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                      <Hash className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{group.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">{group.member_count} 成员</span>
                        {group.description && (
                          <span className="text-[10px] text-muted-foreground truncate">· {group.description}</span>
                        )}
                      </div>
                    </div>
                    {group.members && group.members.length > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded ${getRoleColor(group.members[0]?.role || "member")}`}>
                        {getRoleLabel(group.members[0]?.role || "member")}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {pendingInvitations.length > 0 && (
                <div className="space-y-3">
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase flex items-center gap-1">
                    <Send className="w-3 h-3" /> 群邀请 ({pendingInvitations.length})
                  </div>
                  {pendingInvitations.map(invitation => (
                    <div key={invitation.id} className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                          <Hash className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{invitation.group_name}</p>
                          <p className="text-xs text-muted-foreground">{invitation.inviter_name} 邀请你加入</p>
                          {invitation.message && <p className="text-xs text-muted-foreground mt-1">{invitation.message}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{formatTime(invitation.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button variant="default" size="sm" className="flex-1" onClick={() => handleAcceptInvitation(invitation.id)}><Check className="w-3 h-3" /> 接受</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleRejectInvitation(invitation.id)}><X className="w-3 h-3" /> 拒绝</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {requests.filter(r => r.status === "pending").length > 0 && (
                <div className="space-y-3">
                  <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase">
                    好友请求
                  </div>
                  {requests.filter(r => r.status === "pending").map(req => {
                    // 用户类型中文映射
                    const roleLabels: Record<string, string> = {
                      internal: "内部用户",
                      external: "外部用户",
                      admin: "管理员"
                    };
                    const fromRoleLabel = req.from_role ? (roleLabels[req.from_role] || req.from_role) : "";
                    
                    return (
                    <div key={req.id} className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                          {(req.from_nickname || req.from_username || "?").charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{req.from_nickname || req.from_username}</p>
                          {(fromRoleLabel || req.from_company) && (
                            <p className="text-xs text-muted-foreground">{fromRoleLabel}{fromRoleLabel && req.from_company ? " · " : ""}{req.from_company}</p>
                          )}
                          {req.message ? (
                            <p className="text-xs text-muted-foreground mt-1 italic">"{req.message}"</p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1">请求添加您为好友</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1">{formatTime(req.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button variant="default" size="sm" className="flex-1" onClick={() => handleAccept(req.id)}><Check className="w-3 h-3" /> 接受</Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleReject(req.id)}><X className="w-3 h-3" /> 拒绝</Button>
                      </div>
                    </div>
                  )})}
                </div>
              )}
              {pendingInvitations.length === 0 && requests.filter(r => r.status === "pending").length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无请求</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {showGroupDetail && selectedGroup ? (
          <div className="flex-1 flex flex-col border-l border-border">
            <div className="h-14 px-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{selectedGroup.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedGroup.member_count} 成员</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">群设置</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {myGroupRole === "owner" && (
                      <>
                        <DropdownMenuItem onSelect={() => {
                          setGroupDetailTab("members");
                          if (selectedGroup) {
                            fetchGroupDetail(selectedGroup.id);
                          }
                        }}>
                          <Users2 className="w-4 h-4 mr-2" /> 管理成员
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setShowTransferOwnerDialog(true)}>
                          <Crown className="w-4 h-4 mr-2" /> 转让群主
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onSelect={() => handleDissolveGroup(selectedGroup.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> 解散群组
                        </DropdownMenuItem>
                      </>
                    )}
                    {myGroupRole === "admin" && (
                      <>
                        <DropdownMenuItem onSelect={() => {
                          setGroupDetailTab("members");
                          if (selectedGroup) {
                            fetchGroupDetail(selectedGroup.id);
                          }
                        }}>
                          <Users2 className="w-4 h-4 mr-2" /> 管理成员
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleLeaveGroup(selectedGroup.id)}>
                          <LogOut className="w-4 h-4 mr-2" /> 退出群聊
                        </DropdownMenuItem>
                      </>
                    )}
                    {myGroupRole === "member" && (
                      <DropdownMenuItem onSelect={() => handleLeaveGroup(selectedGroup.id)}>
                        <LogOut className="w-4 h-4 mr-2" /> 退出群聊
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="sm" onClick={() => {
                  setShowGroupDetail(false);
                  setSelectedGroup(null);
                }}>关闭</Button>
              </div>
            </div>

            <div className="flex border-b border-border">
              <button 
                className={cn("flex-1 py-3 text-xs font-medium transition-colors", groupDetailTab === "members" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
                onClick={() => setGroupDetailTab("members")}
              >
                <Users2 className="w-4 h-4 inline mr-1" /> 成员
              </button>
              <button 
                className={cn("flex-1 py-3 text-xs font-medium transition-colors", groupDetailTab === "applications" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
                onClick={() => setGroupDetailTab("applications")}
              >
                <Users className="w-4 h-4 inline mr-1" /> 入群申请
                {joinApplications.filter(a => a.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-1">{joinApplications.filter(a => a.status === "pending").length}</Badge>
                )}
              </button>
              <button 
                className={cn("flex-1 py-3 text-xs font-medium transition-colors", groupDetailTab === "announcements" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}
                onClick={() => setGroupDetailTab("announcements")}
              >
                <Bell className="w-4 h-4 inline mr-1" /> 公告
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {groupDetailTab === "members" && (
                <>
                  <div className="mb-4 flex gap-2">
                    <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                      <DialogTrigger asChild>
                        <Button variant="default" size="sm"><Bell className="w-4 h-4 mr-2" />发布公告</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>发布群公告</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <Textarea
                            value={announcementContent}
                            onChange={e => setAnnouncementContent(e.target.value)}
                            placeholder="输入公告内容..."
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>取消</Button>
                            <Button onClick={handleCreateAnnouncement} disabled={!announcementContent.trim()}>发布</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm"><Send className="w-4 h-4 mr-2" />邀请成员</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>邀请成员</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <Input
                            value={searchUsers}
                            onChange={e => {
                              setSearchUsers(e.target.value);
                              searchAvailableUsers(e.target.value);
                            }}
                            placeholder="搜索用户..."
                          />
                          <div className="max-h-40 overflow-y-auto space-y-2">
                            {availableUsers.map(user => (
                              <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.id)}
                                  onChange={() => {
                                    if (selectedUsers.includes(user.id)) {
                                      setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                    } else {
                                      setSelectedUsers([...selectedUsers, user.id]);
                                    }
                                  }}
                                  className="w-4 h-4 rounded"
                                />
                                <div className="w-8 h-8 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                                  {(user.nickname || user.username || "?").charAt(0)}
                                </div>
                                <span className="text-sm">{user.nickname || user.username}</span>
                              </div>
                            ))}
                          </div>
                          <Textarea
                            value={inviteMessage}
                            onChange={e => setInviteMessage(e.target.value)}
                            placeholder="邀请消息（可选）"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>取消</Button>
                            <Button onClick={handleInviteUsers} disabled={selectedUsers.length === 0}>邀请 ({selectedUsers.length})</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="space-y-3">
                    {groupMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                            {(member.nickname || member.username || "?").charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{member.nickname || member.username}</p>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded ${getRoleColor(member.role)}`}>
                                {getRoleLabel(member.role)}
                              </span>
                              {isMuted(member) && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-red-600 flex items-center gap-1">
                                  <Shield className="w-3 h-3" /> 禁言中
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {member.role !== "owner" && myGroupRole !== "member" && (
                            <>
                              {isMuted(member) ? (
                                <Button variant="outline" size="sm" onClick={() => handleUnmuteMember(selectedGroup!.id, member.user_id)}>解除禁言</Button>
                              ) : (
                                <Button variant="outline" size="sm" onClick={() => handleMuteMember(selectedGroup!.id, member.user_id)}>禁言</Button>
                              )}
                              {myGroupRole === "owner" && (
                                <Button variant="outline" size="sm" onClick={() => handleSetAdmin(selectedGroup!.id, member.user_id, member.role !== "admin")}>
                                  {member.role === "admin" ? "取消管理员" : "设为管理员"}
                                </Button>
                              )}
                              <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleRemoveMember(selectedGroup!.id, member.user_id)}>
                                <UserMinus className="w-3 h-3" /> 踢出
                              </Button>
                            </>
                          )}
                          {member.role === "owner" && myGroupRole === "owner" && (
                            <Badge variant="default" className="bg-red-50 text-red-600">我是群主</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {groupDetailTab === "applications" && (
                <div>
                  {joinApplications.filter(a => a.status === "pending").length > 0 ? (
                    <div className="space-y-3">
                      {joinApplications.filter(a => a.status === "pending").map(app => (
                        <div key={app.id} className="p-3 rounded-lg bg-muted/30">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                              {(app.nickname || app.username || "?").charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{app.nickname || app.username}</p>
                              {app.message && <p className="text-xs text-muted-foreground mt-1">{app.message}</p>}
                              <p className="text-[10px] text-muted-foreground mt-1">{formatTime(app.created_at)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button variant="default" size="sm" onClick={() => handleAcceptJoinApplication(selectedGroup!.id, app.id)}><Check className="w-3 h-3" /> 接受</Button>
                            <Button variant="outline" size="sm" onClick={() => handleRejectJoinApplication(selectedGroup!.id, app.id)}><X className="w-3 h-3" /> 拒绝</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无入群申请</p>
                    </div>
                  )}
                </div>
              )}

              {groupDetailTab === "announcements" && (
                <div>
                  <div className="mb-4">
                    <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                      <DialogTrigger asChild>
                        <Button variant="default" size="sm"><Bell className="w-4 h-4 mr-2" />发布公告</Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>发布群公告</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <Textarea
                            value={announcementContent}
                            onChange={e => setAnnouncementContent(e.target.value)}
                            placeholder="输入公告内容..."
                            rows={4}
                          />
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>取消</Button>
                            <Button onClick={handleCreateAnnouncement} disabled={!announcementContent.trim()}>发布</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {groupAnnouncements.filter(a => a.status === "active").length > 0 ? (
                    <div className="space-y-3">
                      {groupAnnouncements.filter(a => a.status === "active").map(announcement => (
                        <div key={announcement.id} className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                          <p className="text-sm text-foreground">{announcement.content}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-muted-foreground">{formatTime(announcement.created_at)}</p>
                            {myGroupRole !== "member" && (
                              <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteAnnouncement(selectedGroup!.id, announcement.id)}>
                                <Trash2 className="w-3 h-3" /> 删除
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无群公告</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              {activeTab === "groups" ? (
                <>
                  <Hash className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>选择一个群组查看详情</p>
                </>
              ) : (
                <>
                  <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>选择一个联系人开始聊天</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>发送好友申请</DialogTitle>
          </DialogHeader>
          {applyTargetUser && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                  {(applyTargetUser.nickname || applyTargetUser.username || "?").charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{applyTargetUser.nickname || applyTargetUser.username}</p>
                  <p className="text-xs text-muted-foreground">{applyTargetUser.email || "-"}</p>
                </div>
              </div>
              <Textarea
                value={applyMessage}
                onChange={e => setApplyMessage(e.target.value)}
                placeholder="添加验证消息（可选）"
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowApplyDialog(false)}>取消</Button>
                <Button onClick={handleSendFriendRequest}>发送申请</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showFriendDetailDialog} onOpenChange={setShowFriendDetailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>好友资料</DialogTitle>
          </DialogHeader>
          {selectedFriend && (
            <div className="space-y-4 mt-4">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-cyan-500/15 text-cyan-400 text-xl font-semibold flex items-center justify-center mb-3">
                  {(selectedFriend.nickname || selectedFriend.username || "?").charAt(0)}
                </div>
                <p className="text-lg font-medium text-foreground">{selectedFriend.nickname || selectedFriend.username}</p>
                <p className="text-sm text-muted-foreground">{selectedFriend.is_online ? "在线" : `上次在线 ${formatTime(selectedFriend.last_online_at || "")}`}</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">用户ID</span>
                  <span className="text-sm font-medium text-foreground">{selectedFriend.id}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">用户名</span>
                  <span className="text-sm font-medium text-foreground">{selectedFriend.username}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">备注</span>
                    <button onClick={() => setEditingRemark(true)} className="p-1 hover:bg-muted rounded">
                      <Edit3 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  {editingRemark ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={friendRemark} 
                        onChange={e => setFriendRemark(e.target.value)} 
                        className="w-24 text-sm" 
                        autoFocus
                      />
                      <button onClick={handleSaveRemark} className="p-1 hover:bg-muted rounded">
                        <Check className="w-3 h-3 text-green-500" />
                      </button>
                      <button onClick={() => setEditingRemark(false)} className="p-1 hover:bg-muted rounded">
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-foreground">{friendRemark || "无备注"}</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">分组</span>
                    <button onClick={() => setEditingGroup(true)} className="p-1 hover:bg-muted rounded">
                      <Edit3 className="w-3 h-3 text-muted-foreground" />
                    </button>
                  </div>
                  {editingGroup ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={friendGroup} 
                        onChange={e => setFriendGroup(e.target.value)} 
                        className="w-24 text-sm" 
                        autoFocus
                      />
                      <button onClick={handleSaveGroup} className="p-1 hover:bg-muted rounded">
                        <Check className="w-3 h-3 text-green-500" />
                      </button>
                      <button onClick={() => setEditingGroup(false)} className="p-1 hover:bg-muted rounded">
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-foreground">{friendGroup || "未分组"}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="default" onClick={() => handleStartChat(selectedFriend.friend_id)}><MessageSquare className="w-4 h-4 mr-2" /> 发起聊天</Button>
                <Button variant="outline" className="text-red-600" onClick={() => handleDeleteFriend(selectedFriend.friend_id)}><UserMinus className="w-4 h-4 mr-2" /> 删除好友</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showMuteDialog} onOpenChange={setShowMuteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              设置禁言
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">选择禁言时长：</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "1小时", value: 60 },
                { label: "6小时", value: 360 },
                { label: "12小时", value: 720 },
                { label: "24小时", value: 1440 },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setMuteDuration(option.value)}
                  className={cn("py-2 px-3 rounded-lg text-sm transition-colors", muteDuration === option.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowMuteDialog(false)}>取消</Button>
              <Button onClick={handleConfirmMute}>确认禁言</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferOwnerDialog} onOpenChange={setShowTransferOwnerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              转让群主
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">选择一个群成员作为新的群主：</p>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {groupMembers.filter(m => m.role !== "owner").map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => setTransferTargetUser(member.user_id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cyan-500/15 text-cyan-400 text-sm font-semibold flex items-center justify-center">
                      {(member.nickname || member.username || "?").charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.nickname || member.username}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${getRoleColor(member.role)}`}>
                        {getRoleLabel(member.role)}
                      </span>
                    </div>
                  </div>
                  {transferTargetUser === member.user_id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTransferOwnerDialog(false)}>取消</Button>
              <Button onClick={handleTransferOwner} disabled={!transferTargetUser}>确认转让</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}