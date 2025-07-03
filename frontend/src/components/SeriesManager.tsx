import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { useAuth } from '../contexts/AuthContext'
import { Series, apiService } from '../services/apiService'
import { FiPlus, FiHeart, FiStar, FiEdit, FiTrash2 } from 'react-icons/fi'

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2rem;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: opacity 0.2s;
  
  &:hover {
    opacity: 0.9;
  }
`;

const SeriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
`;

const SeriesCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const SeriesTitle = styled.h3`
  color: #333;
  margin-bottom: 0.5rem;
  font-size: 1.2rem;
`;

const SeriesInfo = styled.div`
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const SeriesDescription = styled.p`
  color: #666;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const SeriesActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
  
  &:hover {
    color: #764ba2;
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  color: white;
  background: ${props => {
    switch (props.status) {
      case 'watching': return '#059669';
      case 'completed': return '#2563eb';
      case 'plan-to-watch': return '#d97706';
      case 'dropped': return '#dc2626';
      default: return '#6b7280';
    }
  }};
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
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

const Select = styled.select`
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  
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

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: #666;
`;

interface SeriesManagerProps {
  showMySeriesOnly?: boolean;
}

const SeriesManager: React.FC<SeriesManagerProps> = ({ showMySeriesOnly = false }) => {
  const { user } = useAuth()
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSeries, setEditingSeries] = useState<Series | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    status: 'watching' as 'watching' | 'completed' | 'plan-to-watch' | 'dropped',
    rating: '',
    episodes: '',
    currentEpisode: '',
    year: '',
    isRecommendation: false
  })

  useEffect(() => {
    loadSeries()
  }, [showMySeriesOnly, user])

  const loadSeries = async () => {
    try {
      setLoading(true)
      let seriesData: Series[] = []
      
      if (showMySeriesOnly && user) {
        seriesData = await apiService.getUserSeries(user.id)
      } else {
        seriesData = await apiService.getRecommendations(user?.id)
      }
      
      setSeries(seriesData)
    } catch (error) {
      console.error('Error loading series:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const seriesData = {
        ...formData,
        userId: user.id,
        rating: formData.rating ? parseInt(formData.rating) : undefined,
        episodes: formData.episodes ? parseInt(formData.episodes) : undefined,
        currentEpisode: formData.currentEpisode ? parseInt(formData.currentEpisode) : undefined,
        year: formData.year ? parseInt(formData.year) : undefined,
        likes: 0,
        likedBy: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      if (editingSeries) {
        await apiService.updateSeries(editingSeries.id, editingSeries.userId, seriesData)
      } else {
        await apiService.createSeries({
          ...seriesData,
          id: `series-${Date.now()}`
        })
      }

      setShowModal(false)
      setEditingSeries(null)
      resetForm()
      loadSeries()
    } catch (error) {
      console.error('Error saving series:', error)
    }
  }

  const handleEdit = (series: Series) => {
    setEditingSeries(series)
    setFormData({
      title: series.title,
      description: series.description,
      genre: series.genre,
      status: series.status,
      rating: series.rating?.toString() || '',
      episodes: series.episodes?.toString() || '',
      currentEpisode: series.currentEpisode?.toString() || '',
      year: series.year?.toString() || '',
      isRecommendation: series.isRecommendation
    })
    setShowModal(true)
  }

  const handleDelete = async (series: Series) => {
    if (!window.confirm('Are you sure you want to delete this series?')) return

    try {
      await apiService.deleteSeries(series.id, series.userId)
      loadSeries()
    } catch (error) {
      console.error('Error deleting series:', error)
    }
  }

  const handleLike = async (series: Series) => {
    if (!user) return

    try {
      const isLiked = series.likedBy.includes(user.id)
      if (isLiked) {
        await apiService.unlikeSeries(series.id, series.userId, user.id)
      } else {
        await apiService.likeSeries(series.id, series.userId, user.id)
      }
      loadSeries()
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      genre: '',
      status: 'watching',
      rating: '',
      episodes: '',
      currentEpisode: '',
      year: '',
      isRecommendation: false
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (loading) {
    return <LoadingMessage>Loading series...</LoadingMessage>
  }

  return (
    <Container>
      <Header>
        <Title>{showMySeriesOnly ? 'My Series' : 'Recommended Series'}</Title>
        {user && (
          <AddButton onClick={() => setShowModal(true)}>
            <FiPlus />
            Add Series
          </AddButton>
        )}
      </Header>

      <SeriesGrid>
        {series.map(s => (
          <SeriesCard key={`${s.id}-${s.userId}`}>
            <SeriesTitle>{s.title}</SeriesTitle>
            <SeriesInfo>
              <StatusBadge status={s.status}>
                {s.status.replace('-', ' ')}
              </StatusBadge>
              {s.genre && <span> • {s.genre}</span>}
              {s.year && <span> • {s.year}</span>}
            </SeriesInfo>
            <SeriesDescription>{s.description}</SeriesDescription>
            <SeriesActions>
              <ActionButton onClick={() => handleLike(s)}>
                <FiHeart color={user && s.likedBy.includes(user.id) ? '#dc2626' : '#667eea'} />
                {s.likes}
              </ActionButton>
              {s.rating && (
                <ActionButton>
                  <FiStar />
                  {s.rating}/10
                </ActionButton>
              )}
              {user && s.userId === user.id && (
                <>
                  <ActionButton onClick={() => handleEdit(s)}>
                    <FiEdit />
                    Edit
                  </ActionButton>
                  <ActionButton onClick={() => handleDelete(s)}>
                    <FiTrash2 />
                    Delete
                  </ActionButton>
                </>
              )}
            </SeriesActions>
          </SeriesCard>
        ))}
      </SeriesGrid>

      {series.length === 0 && (
        <LoadingMessage>
          {showMySeriesOnly ? 'No series added yet.' : 'No recommendations available.'}
        </LoadingMessage>
      )}

      {showModal && (
        <Modal onClick={() => setShowModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>{editingSeries ? 'Edit Series' : 'Add New Series'}</h2>
            <Form onSubmit={handleSubmit}>
              <FormGroup>
                <Label htmlFor="title">Title</Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="description">Description</Label>
                <TextArea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="genre">Genre</Label>
                <Input
                  type="text"
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="watching">Watching</option>
                  <option value="completed">Completed</option>
                  <option value="plan-to-watch">Plan to Watch</option>
                  <option value="dropped">Dropped</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="rating">Rating (1-10)</Label>
                <Input
                  type="number"
                  id="rating"
                  name="rating"
                  min="1"
                  max="10"
                  value={formData.rating}
                  onChange={handleChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="episodes">Total Episodes</Label>
                <Input
                  type="number"
                  id="episodes"
                  name="episodes"
                  value={formData.episodes}
                  onChange={handleChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="currentEpisode">Current Episode</Label>
                <Input
                  type="number"
                  id="currentEpisode"
                  name="currentEpisode"
                  value={formData.currentEpisode}
                  onChange={handleChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label htmlFor="year">Year</Label>
                <Input
                  type="number"
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                />
              </FormGroup>
              
              <FormGroup>
                <Label>
                  <input
                    type="checkbox"
                    name="isRecommendation"
                    checked={formData.isRecommendation}
                    onChange={handleChange}
                  />
                  Recommend to friends
                </Label>
              </FormGroup>
              
              <ButtonGroup>
                <Button type="submit" variant="primary">
                  {editingSeries ? 'Update' : 'Add'} Series
                </Button>
                <Button type="button" onClick={() => {
                  setShowModal(false)
                  setEditingSeries(null)
                  resetForm()
                }}>
                  Cancel
                </Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </Container>
  )
}

export default SeriesManager
