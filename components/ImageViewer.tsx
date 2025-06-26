
import React, { useState } from 'react';
import LoadingSpinner from './ui/LoadingSpinner';
import Modal from './ui/Modal'; // Assuming Modal component for larger view

interface ImageViewerProps {
  src?: string; // Optional src for when it's loading or not yet available
  alt: string;
  isLoading?: boolean;
  className?: string;
  caption?: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, isLoading = false, className = '', caption }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (isLoading || (!src && isLoading !== false)) { // Show spinner if isLoading is explicitly true, or if src is missing and isLoading is not explicitly false
    return (
      <div className={`flex items-center justify-center bg-slate-800 rounded-lg aspect-video ${className}`}>
        <LoadingSpinner text="Generating art..." />
      </div>
    );
  }

  if (!src) {
     return (
      <div className={`flex items-center justify-center bg-slate-800 text-slate-500 rounded-lg aspect-video ${className}`}>
        No image available.
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <figure className="bg-slate-800 rounded-lg overflow-hidden shadow-lg">
        {!imageLoaded && <div className="aspect-video flex items-center justify-center"><LoadingSpinner text="Loading image..." /></div>}
        <img
          src={src}
          alt={alt}
          className={`w-full h-auto object-contain transition-opacity duration-500 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${!imageLoaded ? 'h-0' : ''} cursor-pointer`}
          onLoad={handleImageLoad}
          onClick={() => setIsModalOpen(true)}
          style={{ display: imageLoaded ? 'block' : 'none' }}
        />
         {caption && imageLoaded && <figcaption className="p-2 text-xs text-center text-slate-400">{caption}</figcaption>}
      </figure>

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={alt}>
          <img src={src} alt={alt} className="max-w-full max-h-[80vh] mx-auto object-contain" />
           {caption && <p className="mt-2 text-sm text-center text-slate-300">{caption}</p>}
        </Modal>
      )}
    </div>
  );
};

export default ImageViewer;
    