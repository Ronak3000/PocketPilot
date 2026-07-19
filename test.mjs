import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useChat } from '@ai-sdk/react';

function Test() {
  const chat = useChat();
  console.log('KEYS:', Object.keys(chat));
  return null;
}

try {
  renderToStaticMarkup(React.createElement(Test));
} catch (e) {
  console.error(e);
}
