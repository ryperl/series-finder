import React from 'react'
import styled from 'styled-components'
import SeriesManager from '../components/SeriesManager'

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  color: #333;
  font-size: 2.5rem;
  margin-bottom: 1rem;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const Discover: React.FC = () => {
  return (
    <Container>
      <Header>
        <Title>Discover Series</Title>
        <Subtitle>
          Explore TV series recommendations from the community. Find your next favorite show!
        </Subtitle>
      </Header>
      
      <SeriesManager showMySeriesOnly={false} />
    </Container>
  )
}

export default Discover
