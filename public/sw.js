
// 1. Listen for the Push Event from our server
self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Cafe Alert';
  
  const options = {
    body: data.body || 'You have a new notification.',
    icon: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png', // A default bell icon
    badge: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png',
    vibrate: [200, 100, 200, 100, 200], // Makes the phone buzz
    data: { url: data.url || '/admin' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. If the admin clicks the notification, open the Admin Dashboard!
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // If they already have the tab open, just switch to it
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].url.includes('/admin') && 'focus' in clientList[i]) {
          return clientList[i].focus();
        }
      }
      // If the app is completely closed, open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});