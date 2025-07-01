import React, { useEffect } from 'react';

const DviewRelation = () => {
  const realtionsUrl = window.featureFlags.RELATIONS_URL;
  const password = window.featureFlags.LOGIN_PASSWORD;
  const emailid = window.featureFlags.LOGIN_USERNAME;

  useEffect(() => {
    const iframe = document.getElementById('cloud-relation');

    if (!iframe) return;

    iframe.onload = () => {
      const targetOrigin = new URL(dsenseUrl).origin;

      setTimeout(() => {
        iframe.contentWindow?.postMessage(
          {
            supersetemail: emailid,
            pass: password,
          },
          targetOrigin,
        );
      }, 500);
    };
  }, [realtionsUrl, emailid, password]);
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
