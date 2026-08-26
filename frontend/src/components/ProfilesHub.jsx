import { useState } from "react";

const starterProfiles = [
  {
    id: 1,
    username: "AP Music Star",
    bio: "Music, creativity and African sounds.",
    avatar: "",
    followers: 2400,
    following: 180,
    type: "Artist",
  },
  {
    id: 2,
    username: "Africa Creator",
    bio: "Stories, culture and creative content from Africa.",
    avatar: "",
    followers: 1800,
    following: 240,
    type: "Creator",
  },
  {
    id: 3,
    username: "AP Football",
    bio: "Football news, matches and fan conversations.",
    avatar: "",
    followers: 3200,
    following: 95,
    type: "Sports",
  },
];

export default function ProfilesHub({
  authUser,
  addNotification,
}) {
  const [profiles, setProfiles] = useState(starterProfiles);
  const [following, setFollowing] = useState({});

  function toggleFollow(profile) {
    const isFollowing = following[profile.id];

    setFollowing((current) => ({
      ...current,
      [profile.id]: !isFollowing,
    }));

    setProfiles((current) =>
      current.map((item) =>
        item.id === profile.id
          ? {
              ...item,
              followers: isFollowing
                ? item.followers - 1
                : item.followers + 1,
            }
          : item
      )
    );

    if (!isFollowing && addNotification) {
      addNotification(
        "👥",
        "Following",
        `You are now following ${profile.username}.`
      );
    }
  }

  return (
    <section className="profiles-hub" id="profiles">
      <div className="profiles-header">
        <div>
          <p className="eyebrow">AP-STREAM PEOPLE</p>
          <h2>👤 Profiles</h2>
          <p className="section-subtitle">
            Discover artists, creators, sports pages and people.
          </p>
        </div>

        {authUser && (
          <div className="my-profile-badge">
            👤 {authUser.username || authUser.name || "AP User"}
          </div>
        )}
      </div>

      <div className="profiles-grid">
        {profiles.map((profile) => (
          <article className="profile-card" key={profile.id}>
            <div className="profile-avatar">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.username}
                />
              ) : (
                "👤"
              )}
            </div>

            <span className="profile-type">
              {profile.type}
            </span>

            <h3>{profile.username}</h3>

            <p>{profile.bio}</p>

            <div className="profile-stats">
              <span>
                <strong>{profile.followers.toLocaleString()}</strong>
                Followers
              </span>

              <span>
                <strong>{profile.following.toLocaleString()}</strong>
                Following
              </span>
            </div>

            <div className="profile-actions">
              <button onClick={() => toggleFollow(profile)}>
                {following[profile.id]
                  ? "✓ Following"
                  : "➕ Follow"}
              </button>

              <button
                onClick={() =>
                  alert(`Opening ${profile.username}'s profile.`)
                }
              >
                View Profile
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
