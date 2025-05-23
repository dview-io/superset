import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';

const TypingText = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState('');

  function boldWordsInsideQuotes(text) {
    return text.replace(/\*\*(.*?)\*\*/g, (_, matchedText) => {
      return `<b>${matchedText.toUpperCase()}</b>`;
    });
  }

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(prev => prev + text[index]);
      index++;
      if (index >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <Typography
      style={{ display: 'inline', fontSize: '13px' }}
      variant="body1"
      dangerouslySetInnerHTML={{ __html: boldWordsInsideQuotes(displayedText) }}
    />
  );
};

export default TypingText;
