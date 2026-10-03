import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

interface BannerCarouselProps {
  images: string[];
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ images }) => {
  const safeImages = Array.isArray(images) ? images : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (safeImages.length === 0) {
    return (
      <div className="w-full h-48 sm:h-64 md:h-80 bg-gradient-to-r from-emerald-900 to-gray-900 rounded-2xl flex items-center justify-center text-white/70 text-sm font-medium">
        <span>CareSync Verified Service Provider</span>
      </div>
    );
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? safeImages.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === safeImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full h-56 sm:h-72 md:h-96 rounded-2xl overflow-hidden bg-gray-900 shadow-md group">
      {/* Banner Image */}
      <img
        src={safeImages[currentIndex]}
        alt={`Banner ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-all duration-500 ease-out"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Expand Preview Button */}
      <button
        onClick={() => setPreviewImage(safeImages[currentIndex])}
        className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white rounded-full transition"
        title="View image full screen"
      >
        <Maximize2 className="w-4 h-4" />
      </button>

      {/* Navigation Controls */}
      {safeImages.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 hover:bg-white text-gray-900 shadow-lg backdrop-blur-sm transition hover:scale-105"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 hover:bg-white text-gray-900 shadow-lg backdrop-blur-sm transition hover:scale-105"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            {safeImages.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-white/60 hover:bg-white'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Full Screen Image Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewImage}
            alt="Full Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
