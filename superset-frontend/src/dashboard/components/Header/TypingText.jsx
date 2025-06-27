import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';

const TypingText = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState('');

  function boldWordsInsideQuotes(text) {
    return text.replace(/\*\*(.*?)\*\*/g, (_, matchedText) => {
      return `<b>${matchedText.toUpperCase()}</b>`;
    });
  }
  function formatMarkdownSections(input) {
    return input
      // Step 1: Format section headers like "# Answer:"
      .replace(/^#\s*([\w\s]+):\n/gm, (_, section) => `<b> ${section.toUpperCase()}:</b><br>`)
  
      // Step 2: Replace double newlines with <br><br>
      .replace(/\n{2,}/g, '<br><br>')
  
      // Step 3: Replace remaining single newlines with <br>
      .replace(/\n/g, '<br>')
      
      .trim();
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
      dangerouslySetInnerHTML={{ __html: formatMarkdownSections(boldWordsInsideQuotes(displayedText))}}
    />
  );
};

export default TypingText;
