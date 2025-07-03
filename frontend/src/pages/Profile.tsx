import React, { useState } from 'react'
import styled from 'styled-components'
import { useAuth } from '../contexts/AuthContext'
import SeriesManager from '../components/SeriesManager'
import { FiEdit, FiSave, FiX } from 'react-icons/fi'

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProfileHeader = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
  font-weight: bold;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.h1`
  color: #333;
  margin-bottom: 0.5rem;
`;

const UserBio = styled.p`
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const EditButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
  
  &:hover {
    background: #764ba2;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const TextArea = styled.textarea`
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  ` : `
    background: #e5e7eb;
    color: #374151;
  `}
  
  &:hover {
    opacity: 0.9;
  }
`;

const SectionTitle = styled.h2`
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await updateUser(formData)
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleCancel = () => {
    setFormData({
      displayName: user?.displayName || '',
      bio: user?.bio || ''
    })
    setEditing(false)
  }

  if (!user) {
    return (
      <Container>
        <ProfileHeader>
          <p>Please log in to view your profile.</p>
        </ProfileHeader>
      </Container>
    )
  }

  return (
    <Container>
      <ProfileHeader>
        <ProfileInfo>
          <Avatar>
            {user.displayName.charAt(0).toUpperCase()}
          </Avatar>
          <UserDetails>
            {editing ? (
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="bio">Bio</Label>
                  <TextArea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself..."
                  />
                </FormGroup>
                <ButtonGroup>
                  <Button type="submit" variant="primary">
                    <FiSave />
                    Save Changes
                  </Button>
                  <Button type="button" onClick={handleCancel}>
                    <FiX />
                    Cancel
                  </Button>
                </ButtonGroup>
              </Form>
            ) : (
              <>
                <UserName>{user.displayName}</UserName>
                <UserBio>{user.bio || 'No bio provided'}</UserBio>
                <EditButton onClick={() => setEditing(true)}>
                  <FiEdit />
                  Edit Profile
                </EditButton>
              </>
            )}
          </UserDetails>
        </ProfileInfo>
      </ProfileHeader>

      <SectionTitle>My Series</SectionTitle>
      <SeriesManager showMySeriesOnly={true} />
    </Container>
  )
}

export default Profile
