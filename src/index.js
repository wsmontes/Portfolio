import React from 'react';
import ReactDOM from 'react-dom';
import ContentFrame from './components/ContentFrame';
import './index.css';

// Root app for React
const App = () => {
  const [activeFrame, setActiveFrame] = React.useState(null);

  // Function to create a content frame
  const createContentFrame = (nodeId) => {
    setActiveFrame({ nodeId, key: Date.now() });
  };

  // Function to close the content frame
  const closeContentFrame = () => {
    setActiveFrame(null);
  };

  // Expose these functions to vanilla JS
  React.useEffect(() => {
    // Dispatch event to indicate React is ready
    const event = new CustomEvent('reactAppReady', {
      detail: { createContentFrame, closeContentFrame }
    });
    document.dispatchEvent(event);
  }, []);

  return (
    <>
      {activeFrame && (
        <ContentFrame 
          key={activeFrame.key} 
          nodeId={activeFrame.nodeId} 
          onClose={closeContentFrame} 
        />
      )}
    </>
  );
};

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
