export default function Notifications({ notifications, setNotifications }) {
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  function markRead(id) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }

  function markAllRead() {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }

  return (
    <section className="notifications" id="notifications">
      <div className="notifications-header">
        <div>
          <p className="eyebrow">AP-STREAM</p>

          <h2>
            🔔 Notifications
            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount}
              </span>
            )}
          </h2>

          <p className="section-subtitle">
            Stay updated with activity across AP-STREAM.
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={markAllRead}>
            ✓ Mark all as read
          </button>
        )}
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="notification-empty">
            <div>🔕</div>
            <h3>No notifications</h3>
            <p>You're all caught up.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <article
              className={`notification-item ${
                notification.read ? "read" : "unread"
              }`}
              key={notification.id}
              onClick={() => markRead(notification.id)}
            >
              <div className="notification-icon">
                {notification.icon}
              </div>

              <div className="notification-content">
                <strong>{notification.title}</strong>
                <p>{notification.text}</p>
                <small>{notification.time}</small>
              </div>

              {!notification.read && (
                <span className="notification-dot" />
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
