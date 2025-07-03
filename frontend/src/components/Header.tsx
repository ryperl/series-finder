import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { FiHome, FiUser, FiUsers, FiCompass, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const HeaderContainer = styled.header`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 2rem;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  text-decoration: none;
  
  &:hover {
    color: #764ba2;
  }
`;

const Nav = styled.nav`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const NavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
  }
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  color: #666;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: #dc2626;
    background: rgba(220, 38, 38, 0.1);
  }
`;

const Header: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">Series Finder</Logo>
        
        <Nav>
          <NavLink to="/">
            <FiHome />
            Home
          </NavLink>
          
          <NavLink to="/discover">
            <FiCompass />
            Discover
          </NavLink>
          
          {user ? (
            <>
              <NavLink to="/friends">
                <FiUsers />
                Friends
              </NavLink>
              
              <NavLink to="/profile">
                <FiUser />
                Profile
              </NavLink>
              
              <LogoutButton onClick={handleLogout}>
                <FiLogOut />
                Logout
              </LogoutButton>
            </>
          ) : (
            <>
              <NavLink to="/login">
                Login
              </NavLink>
              
              <NavLink to="/register">
                Register
              </NavLink>
            </>
          )}
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  )
}

export default Header
