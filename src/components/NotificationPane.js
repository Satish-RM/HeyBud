import React, { useEffect, useRef } from 'react';

const NotificationPane = ({ notifications }) => {
  const carouselRef = useRef(null);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    // Set initial position to the top
    carousel.scrollTop = 0;

    const scroll = () => {
      if (carousel) {
        // Scroll down by incrementing scrollTop
        carousel.scrollTop += 1;

        // If reached the bottom (scrollTop >= scrollHeight - clientHeight), reset to the top
        if (carousel.scrollTop >= carousel.scrollHeight - carousel.clientHeight) {
          carousel.scrollTop = 0;
        }
      }
    };

    const interval = setInterval(scroll, 50); // Adjust speed by changing interval
    return () => clearInterval(interval);
  }, [notifications]); // Re-run effect if notifications change

  return (
    <div className="p-4 bg-white rounded-lg shadow h-64 overflow-hidden">
      <h2 className="text-lg font-semibold mb-2">Notification Pane</h2>
      <div
        ref={carouselRef}
        className="h-48 overflow-y-scroll scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {notifications.length === 0 ? (
          <p className="text-gray-500">No notifications.</p>
        ) : (
          // Duplicate notifications to ensure seamless scrolling
          <>
            {notifications.map((notification, index) => (
              <p key={index} className="mb-2 text-sm text-gray-700">
                {notification}
              </p>
            ))}
            {notifications.map((notification, index) => (
              <p key={`duplicate-${index}`} className="mb-2 text-sm text-gray-700">
                {notification}
              </p>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPane;