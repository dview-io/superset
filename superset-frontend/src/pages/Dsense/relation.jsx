import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DviewRelation = () => {
  const realtionsUrl = window.featureFlags.RELATIONS_URL;
  const [credentials, setCredentials] = useState({
    emailid: null,
    password: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const SUPERSET_URL = `${window.location.origin}/api/v1`;

  const ERROR_REDIRECT_URL = `${window.location.origin}/superset/welcome/`;
  const FALLBACK_URL = `${window.location.origin}/superset/welcome/`;

  // Function to scroll to bottom
  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  // Auto scroll to bottom when component mounts
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

        if (error.response) {
          const status = error.response.status;
          if (status === 401 || status === 403) {
            // Unauthorized - redirect to login
            window.location.href = ERROR_REDIRECT_URL;
            return;
          } else if (status >= 500) {
            console.error('Server error:', status);
          }
        } else if (error.request) {
          // Network error
          console.error('Network error - no response received');
        }

        // For any error, redirect after a short delay to show error message
        setTimeout(() => {
          window.location.href = ERROR_REDIRECT_URL;
        }, 3000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCredentials();
  }, []);

  useEffect(() => {
    if (!credentials.emailid || !credentials.password || !realtionsUrl) {
      return;
    }

    const iframe = document.getElementById('cloud-relation');
    if (!iframe) return;

    const handleIframeLoad = () => {
      try {
        const targetOrigin = new URL(realtionsUrl).origin;

        setTimeout(() => {
          iframe.contentWindow?.postMessage(
            {
              supersetemail: credentials.emailid,
              pass: credentials.password,
            },
            targetOrigin,
          );
        }, 500);
      } catch (error) {
        console.error('Error posting message to iframe:', error);
        setError(error);
        // Redirect on iframe communication error
        setTimeout(() => {
          window.location.href = ERROR_REDIRECT_URL;
        }, 2000);
      }
    };

    iframe.onload = handleIframeLoad;

    // Handle iframe loading errors
    iframe.onerror = () => {
      console.error('Iframe failed to load');
      setError(new Error('Failed to load Dsense application'));
      setTimeout(() => {
        window.location.href = ERROR_REDIRECT_URL;
      }, 2000);
    };
  }, [realtionsUrl, credentials.emailid, credentials.password]);

  // Handle case where realtionsUrl is not available
  if (!realtionsUrl) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <h2>Configuration Error</h2>
        <p>Relations URL is not configured. Redirecting...</p>
        {setTimeout(() => {
          window.location.href = FALLBACK_URL;
        }, 2000)}
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div>Loading...</div>
        <p>Fetching credentials...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '20px',
          color: 'red',
        }}
      >
        <h2>Error Loading Relations</h2>
        <p>
          {error.response?.status === 401
            ? 'Authentication required. Redirecting to login...'
            : error.response?.status >= 500
              ? 'Server error. Please try again later. Redirecting...'
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
        id="cloud-relation"
        style={{ width: '100vw', height: '100vh' }}
        src={realtionsUrl}
        title="Dsense"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
};

export default DviewRelation;
