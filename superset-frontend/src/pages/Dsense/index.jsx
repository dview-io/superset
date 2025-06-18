import React, { useEffect } from 'react';

const Dsense = () => {
  const dsenseUrl = window.featureFlags.DSENSE_URL;
  const password = window.featureFlags.LOGIN_PASSWORD;
  const emailid = window.featureFlags.LOGIN_USERNAME;

  useEffect(() => {
    const iframe = document.getElementById('cloud-frame');

    iframe.onload = function () {
      const supersetemail = emailid;
      const pass = password;
      iframe.contentWindow.postMessage({ supersetemail, pass }, dsenseUrl);
    };
  }, [dsenseUrl]);
  return (
    <div style={{ maxHeight: '100vh' }}>
      <iframe
        id="cloud-frame"
        style={{ width: '100vw', height: '100vh' }}
        src={dsenseUrl}
        title="Dsense"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
};

export default Dsense;
