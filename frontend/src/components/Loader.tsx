import React from 'react';
import './loader.css';

interface LoaderProps {
  message?: string;
  height?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Loading...', height = 'auto' }) => {
  return (
    <div className="loader-wrapper" style={{ height }}>
      <div className="premium-loader">
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
        <div className="loader-ring"></div>
      </div>
      <span className="loader-text">{message}</span>
    </div>
  );
};

export default Loader;
