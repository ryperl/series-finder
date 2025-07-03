import React from 'react'
import styled from 'styled-components'
import { useAuth } from '../contexts/AuthContext'
import SeriesManager from '../components/SeriesManager'

const HomeContainer = styled.div`
  min-height: 100vh;
`;

const Hero = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
`;

const WelcomeMessage = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 600px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const Home: React.FC = () => {
  const { user } = useAuth()

  return (
    <HomeContainer>
      <Hero>
        <Title>Welcome to Series Finder</Title>
        <Subtitle>
          Discover, track, and share your favorite TV series with friends
        </Subtitle>
      </Hero>
      
      {user ? (
        <SeriesManager showMySeriesOnly={false} />
      ) : (
        <WelcomeMessage>
          <h2>Get Started</h2>
          <p>Sign up or log in to start tracking your favorite TV series, connect with friends, and discover new shows!</p>
        </WelcomeMessage>
      )}
    </HomeContainer>
  )
}

export default Home
