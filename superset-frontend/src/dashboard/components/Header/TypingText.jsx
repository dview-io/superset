import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';

const TypingText = ({ text, speed = 50 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedText(prev => prev + text[index]);
      index++;
      if (index >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return <Typography variant="body1">{displayedText}</Typography>;
};

export default TypingText;