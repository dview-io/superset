import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const Dsense = () => {
  const dsenseUrl = window.featureFlags.DSENSE_URL;
  const iframeRef = useRef(null);
  const [credentials, setCredentials] = useState({
    emailid: null,
    password: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const SUPERSET_URL = `${window.location.origin}/api/v1`;

  const ERROR_REDIRECT_URL = `${window.location.origin}/superset/welcome/`;
  const FALLBACK_URL = `${window.location.origin}/superset/welcome/`;

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await axios.get(`${SUPERSET_URL}/dsense/login/dview`);

        if (response?.data?.email && response?.data?.password) {
          setCredentials({
            emailid: response.data.email,
            password: response.data.password,
          });
        } else {
          throw new Error('Invalid credentials received from server');
        }
      } catch (error) {
        console.error('API Error:', error);
        setError(error);

        const status = error.response?.status;
        if (status === 401 || status === 403) {
          window.location.href = ERROR_REDIRECT_URL;
          return;
        }

        setTimeout(() => {
          window.location.href = ERROR_REDIRECT_URL;
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, []);

  const handleIframeLoad = () => {
    try {
      const targetOrigin = new URL(dsenseUrl).origin;

      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          {
            supersetemail: credentials.emailid,
            pass: credentials.password,
          },
          targetOrigin,
        );

        setTimeout(scrollToBottom, 1000);
      }, 500);
    } catch (err) {
      console.error('Error posting message to iframe:', err);
      setError(err);
      setTimeout(() => {
        window.location.href = ERROR_REDIRECT_URL;
      }, 2000);
    }
  };

  if (!dsenseUrl) {
    useEffect(() => {
      setTimeout(() => {
        window.location.href = FALLBACK_URL;
      }, 2000);
    }, []);
    return (
      <div style={centeredStyle}>
        <h2>Configuration Error</h2>
        <p>Dsense URL is not configured. Redirecting...</p>
      </div>
    );
  }

  if (isLoading || !credentials.emailid || !credentials.password) {
    return (
      <div style={centeredStyle}>
        <div>Loading...</div>
        <p>Fetching credentials...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...centeredStyle, color: 'red' }}>
        <h2>Error Loading Dsense</h2>
        <p>
          {error.response?.status === 401
            ? 'Authentication required. Redirecting to login...'
            : error.response?.status >= 500
              ? 'Server error. Please try again later.'
              : 'Failed to load application. Redirecting...'}
        </p>
        <p style={{ fontSize: '14px', color: '#666' }}>
          You will be redirected automatically in a few seconds.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxHeight: '100vh' }}>
      <iframe
        id="cloud-frame"
        ref={iframeRef}
        src={dsenseUrl}
        title="Dsense"
        onLoad={handleIframeLoad}
        onError={() => {
          console.error('Iframe failed to load');
          setError(new Error('Failed to load Dsense application'));
          setTimeout(() => {
            window.location.href = ERROR_REDIRECT_URL;
          }, 2000);
        }}
        style={{ width: '100vw', height: '100vh' }}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
};

const centeredStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  flexDirection: 'column',
  gap: '20px',
};

export default Dsense;
