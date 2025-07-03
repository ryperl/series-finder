import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useAuth } from '../contexts/AuthContext'
import { Friend, apiService } from '../services/apiService'
import { FiUserPlus, FiCheck, FiX, FiUsers } from 'react-icons/fi'

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  color: #333;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AddFriendForm = styled.form`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const Input = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'success' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        `;
      case 'success':
        return `
          background: #059669;
          color: white;
        `;
      case 'danger':
        return `
          background: #dc2626;
          color: white;
        `;
      default:
        return `
          background: #e5e7eb;
          color: #374151;
        `;
    }
  }}
  
  &:hover {
    opacity: 0.9;
  }
`;

const FriendGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const FriendCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
`;

const FriendInfo = styled.div`
  flex: 1;
`;

const FriendName = styled.h3`
  color: #333;
  margin-bottom: 0.25rem;
`;

const FriendUsername = styled.p`
  color: #666;
  font-size: 0.9rem;
`;

const FriendActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const LoadingMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 2rem;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #666;
  padding: 2rem;
`;

const Friends: React.FC = () => {
  const { user } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [addFriendUsername, setAddFriendUsername] = useState('')
  const [addingFriend, setAddingFriend] = useState(false)

  useEffect(() => {
    if (user) {
      loadFriends()
      loadFriendRequests()
    }
  }, [user])

  const loadFriends = async () => {
    if (!user) return
    
    try {
      const friendsData = await apiService.getFriends(user.id)
      setFriends(friendsData)
    } catch (error) {
      console.error('Error loading friends:', error)
    }
  }

  const loadFriendRequests = async () => {
    if (!user) return
    
    try {
      const requestsData = await apiService.getFriendRequests(user.id)
      setFriendRequests(requestsData)
    } catch (error) {
      console.error('Error loading friend requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !addFriendUsername.trim()) return

    try {
      setAddingFriend(true)
      // First, find the user by username
      const targetUser = await apiService.getUserByUsername(addFriendUsername)
      if (!targetUser) {
        alert('User not found')
        return
      }

      if (targetUser.id === user.id) {
        alert('You cannot add yourself as a friend')
        return
      }

      // Check if already friends or request exists
      const existingFriend = friends.find(f => f.friendId === targetUser.id)
      const existingRequest = friendRequests.find(r => r.userId === targetUser.id)
      
      if (existingFriend) {
        alert('You are already friends with this user')
        return
      }

      if (existingRequest) {
        alert('Friend request already sent')
        return
      }

      await apiService.addFriend(user.id, targetUser.id)
      setAddFriendUsername('')
      alert('Friend request sent!')
    } catch (error) {
      console.error('Error adding friend:', error)
      alert('Failed to send friend request')
    } finally {
      setAddingFriend(false)
    }
  }

  const handleAcceptRequest = async (friendId: string) => {
    if (!user) return

    try {
      await apiService.acceptFriendRequest(user.id, friendId)
      loadFriends()
      loadFriendRequests()
    } catch (error) {
      console.error('Error accepting friend request:', error)
    }
  }

  const handleRejectRequest = async (friendId: string) => {
    if (!user) return

    try {
      await apiService.rejectFriendRequest(user.id, friendId)
      loadFriendRequests()
    } catch (error) {
      console.error('Error rejecting friend request:', error)
    }
  }

  const handleRemoveFriend = async (friendId: string) => {
    if (!user) return
    if (!window.confirm('Are you sure you want to remove this friend?')) return

    try {
      await apiService.removeFriend(user.id, friendId)
      loadFriends()
    } catch (error) {
      console.error('Error removing friend:', error)
    }
  }

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading friends...</LoadingMessage>
      </Container>
    )
  }

  return (
    <Container>
      <Header>
        <Title>Friends</Title>
      </Header>

      <Section>
        <SectionTitle>
          <FiUserPlus />
          Add Friend
        </SectionTitle>
        <AddFriendForm onSubmit={handleAddFriend}>
          <Input
            type="text"
            placeholder="Enter username"
            value={addFriendUsername}
            onChange={(e) => setAddFriendUsername(e.target.value)}
            disabled={addingFriend}
          />
          <Button type="submit" variant="primary" disabled={addingFriend}>
            {addingFriend ? 'Sending...' : 'Send Request'}
          </Button>
        </AddFriendForm>
      </Section>

      {friendRequests.length > 0 && (
        <Section>
          <SectionTitle>Friend Requests</SectionTitle>
          <FriendGrid>
            {friendRequests.map(request => (
              <FriendCard key={request.id}>
                <Avatar>
                  {request.userId.charAt(0).toUpperCase()}
                </Avatar>
                <FriendInfo>
                  <FriendName>Friend Request</FriendName>
                  <FriendUsername>from {request.userId}</FriendUsername>
                </FriendInfo>
                <FriendActions>
                  <Button variant="success" onClick={() => handleAcceptRequest(request.userId)}>
                    <FiCheck />
                  </Button>
                  <Button variant="danger" onClick={() => handleRejectRequest(request.userId)}>
                    <FiX />
                  </Button>
                </FriendActions>
              </FriendCard>
            ))}
          </FriendGrid>
        </Section>
      )}

      <Section>
        <SectionTitle>
          <FiUsers />
          My Friends ({friends.length})
        </SectionTitle>
        
        {friends.length === 0 ? (
          <EmptyMessage>
            No friends yet. Start by adding some friends above!
          </EmptyMessage>
        ) : (
          <FriendGrid>
            {friends.map(friend => (
              <FriendCard key={friend.id}>
                <Avatar>
                  {friend.friendId.charAt(0).toUpperCase()}
                </Avatar>
                <FriendInfo>
                  <FriendName>{friend.friendId}</FriendName>
                  <FriendUsername>@{friend.friendId}</FriendUsername>
                </FriendInfo>
                <FriendActions>
                  <Button variant="danger" onClick={() => handleRemoveFriend(friend.friendId)}>
                    Remove
                  </Button>
                </FriendActions>
              </FriendCard>
            ))}
          </FriendGrid>
        )}
      </Section>
    </Container>
  )
}

export default Friends
