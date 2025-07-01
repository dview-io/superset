import React, { useEffect, useState } from 'react';
import { Typography } from '@mui/material';

const TypingText2 = ({ text }) => {


  return (
    <div style={{ textAlign: 'center',display:'flex' ,alignItems:'center'}}>
      <div
        style={{
          borderBottom: '1px solid #ccc', // Line above the text
          width: '60px',
          margin: '0 auto',
          paddingRight:'5px',margin: '8px 0' // Center the line
        }}
      />
      <div
      style={{
        margin: '0px 8px'
      }}
      ><Typography
        variant="body1"
        style={{
          color: '#787878',
          fontFamily: 'Inter',
          fontSize: '12px',
          fontWeight: 400,
          lineHeight: 'normal',
          whiteSpace: 'pre-line', // Ensures \n creates a new line
          marginTop: '8px', // Adds spacing between the line and the text
        }}
      >
        {text}
      </Typography></div>
      <div
        style={{
          borderBottom: '1px solid #ccc', // Line below the text
          width: '60px',
          margin: '8px auto 0', 
          paddingLeft:'5px',margin: '8px 0' // Adds spacing below the text and centers the line
        }}
      />
    </div>

  );
};

export default TypingText2;
