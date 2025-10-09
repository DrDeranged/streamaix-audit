import { useState } from 'react';
import { Users, UserPlus, Percent, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollaboration, type CollaboratorCursor } from '@/hooks/useCollaboration';
import { Badge } from '@/components/ui/badge';

interface CollaborationPanelProps {
  bountyId: string;
  userId: string;
  username: string;
  avatar?: string;
  isOwner?: boolean;
}

export function CollaborationPanel({ bountyId, userId, username, avatar, isOwner }: CollaborationPanelProps) {
  const { connected, collaborators, inviteCollaborator, updateShares } = useCollaboration(
    bountyId,
    userId,
    username,
    avatar
  );

  const [showInvite, setShowInvite] = useState(false);
  const [showShares, setShowShares] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteShare, setInviteShare] = useState('20');
  const [shares, setShares] = useState<Record<string, number>>({});

  const handleInvite = () => {
    if (!inviteUserId || !inviteShare) return;
    
    const share = parseInt(inviteShare);
    if (share < 1 || share > 100) return;

    inviteCollaborator(inviteUserId, share);
    setShowInvite(false);
    setInviteUserId('');
    setInviteShare('20');
  };

  const handleUpdateShares = () => {
    const total = Object.values(shares).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      alert('Shares must total 100%');
      return;
    }

    updateShares(shares);
    setShowShares(false);
  };

  const initializeShares = () => {
    const initialShares: Record<string, number> = {};
    const equalShare = Math.floor(100 / (collaborators.length + 1));
    
    initialShares[userId] = equalShare;
    collaborators.forEach(c => {
      initialShares[c.userId] = equalShare;
    });

    setShares(initialShares);
    setShowShares(true);
  };

  return (
    <div className="fixed right-4 top-20 z-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-4 w-64">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-sm">Collaborators</h3>
          <Badge variant={connected ? 'default' : 'secondary'} className="text-xs">
            {connected ? 'Live' : 'Offline'}
          </Badge>
        </div>
        
        {isOwner && (
          <Dialog open={showInvite} onOpenChange={setShowInvite}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" data-testid="button-invite-collaborator">
                <UserPlus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Collaborator</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    placeholder="Enter user ID"
                    data-testid="input-user-id"
                  />
                </div>
                <div>
                  <Label htmlFor="share">Reward Share (%)</Label>
                  <Input
                    id="share"
                    type="number"
                    min="1"
                    max="100"
                    value={inviteShare}
                    onChange={(e) => setInviteShare(e.target.value)}
                    data-testid="input-reward-share"
                  />
                </div>
                <Button onClick={handleInvite} className="w-full" data-testid="button-send-invite">
                  Send Invite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="space-y-2">
        {collaborators.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">No active collaborators</p>
        )}

        {collaborators.map((collab) => (
          <div
            key={collab.userId}
            className="flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800"
            data-testid={`collaborator-${collab.userId}`}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={collab.avatar} />
              <AvatarFallback>{collab.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{collab.username}</p>
              {collab.cursor && (
                <p className="text-xs text-purple-600">Active</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {isOwner && collaborators.length > 0 && (
        <div className="mt-4">
          <Dialog open={showShares} onOpenChange={setShowShares}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={initializeShares}
                data-testid="button-manage-shares"
              >
                <Percent className="h-4 w-4 mr-2" />
                Manage Reward Shares
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reward Distribution</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {Object.entries(shares).map(([uid, share]) => {
                  const collab = collaborators.find(c => c.userId === uid) || 
                    (uid === userId ? { userId, username, avatar } : null);
                  
                  if (!collab) return null;

                  return (
                    <div key={uid} className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={collab.avatar} />
                        <AvatarFallback>{collab.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{collab.username}</p>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={share}
                        onChange={(e) => setShares(prev => ({ ...prev, [uid]: parseInt(e.target.value) || 0 }))}
                        className="w-20"
                        data-testid={`input-share-${uid}`}
                      />
                      <span className="text-sm">%</span>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="font-medium">Total:</span>
                  <span className={`font-bold ${Object.values(shares).reduce((sum, val) => sum + val, 0) === 100 ? 'text-green-600' : 'text-red-600'}`}>
                    {Object.values(shares).reduce((sum, val) => sum + val, 0)}%
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowShares(false)}
                    className="flex-1"
                    data-testid="button-cancel-shares"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateShares}
                    className="flex-1"
                    disabled={Object.values(shares).reduce((sum, val) => sum + val, 0) !== 100}
                    data-testid="button-update-shares"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Update Shares
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
