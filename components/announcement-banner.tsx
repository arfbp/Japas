'use client';

export function AnnouncementBanner({ announcements }: { announcements: any[] }) {
  if (!announcements || announcements.length === 0) return null;

  // Combine active announcements into one string or display them in sequence
  const text = announcements.map(a => `${a.title}: ${a.content}`).join(' • ');

  return (
    <div className="w-full bg-[#C96A3D] text-white text-sm font-medium py-2 overflow-hidden relative z-50">
      <div className="whitespace-nowrap animate-marquee inline-block">
        <span className="mx-4">{text}</span>
        {/* Duplicate text to create continuous effect */}
        <span className="mx-4">{text}</span>
        <span className="mx-4">{text}</span>
      </div>
    </div>
  );
}
