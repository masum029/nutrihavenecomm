'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { SliderImage } from '@/types';
import type { Role } from '@/types';

type SessionPayload = {
  data?: {
    user?: { role?: Role };
  };
};

export default function Slider() {
  const [items, setItems] = useState<SliderImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const MIN_WIDTH = 1400;
  const MIN_HEIGHT = 500;

  const loadItems = async () => {
    const response = await fetch('/api/slider-images');
    const data = await response.json();
    setItems(data.data?.items ?? []);
  };

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const sliderResponse = await fetch('/api/slider-images');
      const sliderData = await sliderResponse.json();
      if (!active) return;
      setItems(sliderData.data?.items ?? []);

      try {
        const sessionResponse = await fetch('/api/auth/me');
        const session = (await sessionResponse.json()) as SessionPayload;
        if (!active) return;
        setIsAdmin(["super-admin", "admin", "manager"].includes(session.data?.user?.role ?? ""));
      } catch {
        if (!active) return;
        setIsAdmin(false);
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!items.length) return;
    if (!isAutoplay) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoplay, items.length]);

  const uploadSlideImage = async (file: File) => {
    setUploadError('');

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file.');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const checkResult = await new Promise<{ width: number; height: number; ok: boolean }>((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          ok: img.naturalWidth >= MIN_WIDTH && img.naturalHeight >= MIN_HEIGHT,
        });
      };
      img.onerror = () => resolve({ width: 0, height: 0, ok: false });
      img.src = objectUrl;
    });
    URL.revokeObjectURL(objectUrl);

    if (!checkResult.ok) {
      setUploadError(`Please upload image at least ${MIN_WIDTH}x${MIN_HEIGHT}px for good quality.`);
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    const uploadResponse = await fetch('/api/uploads/slider-image', {
      method: 'POST',
      body: formData,
    });

    setUploading(false);
    if (!uploadResponse.ok) {
      const uploadData = await uploadResponse.json();
      setUploadError(uploadData.message ?? 'Upload failed.');
      return;
    }

    const uploadData = await uploadResponse.json();
    const image = uploadData.data?.url;
    if (!image) {
      setUploadError('Upload finished but no image URL returned.');
      return;
    }

    const saveResponse = await fetch('/api/slider-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image }),
    });

    if (!saveResponse.ok) {
      const saveData = await saveResponse.json();
      setUploadError(saveData.message ?? 'Could not save slider image.');
      return;
    }

    await loadItems();
    setCurrentSlide(0);
  };

  const removeSlide = async (id: string) => {
    const response = await fetch('/api/slider-images', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) return;
    await loadItems();
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 10000);
  };

  const nextSlide = () => {
    if (!items.length) return;
    setCurrentSlide((prev) => (prev + 1) % items.length);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 10000);
  };

  const prevSlide = () => {
    if (!items.length) return;
    setCurrentSlide((prev) => (prev - 1 + items.length) % items.length);
    setIsAutoplay(false);
    setTimeout(() => setIsAutoplay(true), 10000);
  };

  const safeCurrentSlide = items.length ? currentSlide % items.length : 0;
  const slide = items[safeCurrentSlide];

  if (!slide) {
    return (
      <div className="max-w-7xl mx-auto mb-8">
        {isAdmin && (
          <div className="bg-white border border-emerald-100 rounded-xl p-4 mb-4">
            <h2 className="text-xl font-bold mb-2">Homepage Slider Upload</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) uploadSlideImage(file);
              }}
              className="w-full border rounded px-3 py-2"
            />
            {uploading && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
            {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}
          </div>
        )}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-10 text-center text-gray-600">
          No slider images available yet.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto mb-8">
      {isAdmin && (
        <div className="bg-white border border-emerald-100 rounded-xl p-4 mb-4">
          <h2 className="text-xl font-bold mb-2">Homepage Slider Upload</h2>
          <p className="text-sm text-gray-600 mb-3">
            Standard slider format: upload high-quality images at least {MIN_WIDTH}x{MIN_HEIGHT}px.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadSlideImage(file);
            }}
            className="w-full border rounded px-3 py-2"
          />
          {uploading && <p className="text-sm text-gray-600 mt-2">Uploading...</p>}
          {uploadError && <p className="text-sm text-red-600 mt-2">{uploadError}</p>}

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {items.map((item) => (
              <div key={item.id} className="relative border rounded overflow-hidden">
                <Image src={item.image} alt="Slider" width={320} height={96} className="w-full h-24 object-cover" />
                <button
                  type="button"
                  className="absolute top-1 right-1 px-2 py-1 text-xs bg-red-600 text-white rounded"
                  onClick={() => removeSlide(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="relative w-full overflow-hidden rounded-2xl border border-emerald-100 bg-white"
        onMouseEnter={() => setIsAutoplay(false)}
        onMouseLeave={() => setIsAutoplay(true)}
      >
        <div className="relative w-full h-[260px] sm:h-[340px] md:h-[440px] lg:h-[500px] bg-black">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`absolute inset-0 transition-opacity duration-700 ${index === safeCurrentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <Image
                src={item.image}
                alt={`Slider ${index + 1}`}
                fill
                priority={index === 0}
                quality={95}
                sizes="(max-width: 768px) 100vw, 1120px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-black/10" />
            </div>
          ))}

          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-primary text-gray-900 hover:text-white p-3 rounded-full transition-all shadow-lg"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-primary text-gray-900 hover:text-white p-3 rounded-full transition-all shadow-lg"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/30 px-3 py-2 rounded-full backdrop-blur-sm">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all duration-300 rounded-full ${index === safeCurrentSlide ? 'bg-white w-6 h-2' : 'bg-white/60 w-2 h-2'}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
