import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', 
        { email, password },
        { 
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true 
        }
      );
      
      if (response.status === 200) {
        localStorage.setItem('userInfo', JSON.stringify(response.data));
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || 'Network Error: Cannot connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginWrapper>
      <div className="login-container">
        <div className="brand-header">
          <svg viewBox="0 0 24 24" className="brand-icon">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          <h1>SENTINEL</h1>
          <p>Zone Breach System 2.0</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="dinesh@123gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
          </button>
        </form>
        
        <p className="register-link">
  Unauthorized access prohibited. <br/> Need clearance? 
  <span onClick={() => navigate('/register')}> Request Access</span>
</p>
      </div>
    </LoginWrapper>
  );
};

const LoginWrapper = styled.div`
  width: 100vw; height: 100vh; display: flex; justify-content: center; align-items: center;
  background-color: #000000; background-image: radial-gradient(circle at 50% -20%, #1f2937, #000000 80%);
  color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;

  .login-container {
    width: 100%; max-width: 420px; padding: 48px; background: rgba(28, 28, 30, 0.6);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  }

  .brand-header { text-align: center; margin-bottom: 40px; }
  .brand-icon { width: 48px; height: 48px; fill: #00FFFF; margin-bottom: 16px; filter: drop-shadow(0 0 8px rgba(0, 255, 255, 0.4)); }
  .brand-header h1 { font-size: 24px; font-weight: 700; letter-spacing: 4px; margin: 0 0 8px 0; }
  .brand-header p { color: #a1a1a6; font-size: 14px; letter-spacing: 1px; margin: 0; }

  .error-message { background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 12px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 14px; text-align: center; margin-bottom: 24px; }
  
  .input-group { margin-bottom: 24px; }
  .input-group label { display: block; font-size: 12px; font-weight: 600; color: #a1a1a6; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
  .input-group input { width: 100%; padding: 16px; background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; color: #ffffff; font-size: 16px; transition: all 0.3s ease; box-sizing: border-box;}
  .input-group input:focus { outline: none; border-color: #00FFFF; box-shadow: 0 0 0 1px #00FFFF; background: rgba(0, 0, 0, 0.6); }
  .input-group input:disabled { opacity: 0.5; cursor: not-allowed; }

  .submit-btn { width: 100%; padding: 16px; background: linear-gradient(135deg, #00C6FF 0%, #0072FF 100%); color: white; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; letter-spacing: 2px; cursor: pointer; transition: all 0.3s ease; margin-top: 8px; }
  .submit-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0, 114, 255, 0.3); }
  .submit-btn:disabled { opacity: 0.7; cursor: wait; }

  .register-link { margin-top: 32px; text-align: center; font-size: 13px; color: #6b7280; line-height: 1.6; }
  .register-link span { color: #00FFFF; cursor: pointer; font-weight: 600; }
  .register-link span:hover { text-decoration: underline; }
`;

export default Login;