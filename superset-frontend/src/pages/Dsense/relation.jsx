import React, { useEffect } from 'react';

const DviewRelation = () => {
  const realtionsUrl = window.featureFlags.RELATIONS_URL;
  const password = window.featureFlags.LOGIN_PASSWORD;
  const emailid = window.featureFlags.LOGIN_USERNAME;

  useEffect(() => {
    const iframe = document.getElementById('cloud-relation');

    iframe.onload = function () {
      const supersetemail = emailid;
      const pass = password;
      iframe.contentWindow.postMessage({ supersetemail, pass }, realtionsUrl);
    };
  }, [realtionsUrl]);
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
