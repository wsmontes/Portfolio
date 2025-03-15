import React from 'react';
import ReactDOM from 'react-dom';
import ContentFrame from './components/ContentFrame';
import './index.css';

// Root app for React
const App = () => {
  const [activeFrame, setActiveFrame] = React.useState(null);
  const [isReady, setIsReady] = React.useState(false);

  // Function to create a content frame
  const createContentFrame = (nodeId) => {
    console.log(`Creating content frame for node: ${nodeId}`);
    setActiveFrame({ nodeId, key: Date.now() });
  };

  // Function to close the content frame
  const closeContentFrame = () => {
    console.log('Closing content frame');
    setActiveFrame(null);
  };

  // Expose these functions to vanilla JS and mark as ready
  React.useEffect(() => {
    // Make sure the window is defined (we're in the browser)
    if (typeof window === 'undefined') {
      console.error('Window is not defined in React app');
      return;
    }
    
    try {
      console.log('React app attempting to expose bridge functions...');
      
      // Dispatch event to indicate React is ready
      const event = new CustomEvent('reactAppReady', {
        detail: { createContentFrame, closeContentFrame }
      });
      
      // Directly set the functions on the window object as a backup
      window.createContentFrame = createContentFrame;
      window.closeContentFrame = closeContentFrame;
      window.reactInitialized = true;
      
      // Also dispatch the event for systems listening for it
      document.dispatchEvent(event);
      setIsReady(true);
      
      // Log that React is ready to handle content
      console.log('React content system ready and global functions exposed');
    } catch (error) {
      console.error('Error in React initialization:', error);
    }
    
    // Cleanup function to handle component unmount
    return () => {
      console.log('React App unmounting');
    };
  }, []); // Empty dependency array so this only runs once

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

// Add error boundary for the app root
try {
  console.log('Mounting React application...');
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );
  console.log('React application mounted successfully');
} catch (error) {
  console.error('Failed to mount React application:', error);
}
