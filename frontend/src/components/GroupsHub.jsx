import { useState } from "react";

const starterGroups = [
  {
    id: 1,
    name: "AP Music Fans",
    description: "Share music, discoveries and artist updates.",
    members: 1240,
    joined: false,
    posts: [
      {
        id: 101,
        author: "AP Music Star",
        text: "Welcome to the AP Music Fans group! 🎵",
        likes: 12,
      },
    ],
  },
  {
    id: 2,
    name: "African Creators",
    description: "A community for African artists and creators.",
    members: 860,
    joined: false,
    posts: [],
  },
  {
    id: 3,
    name: "Football Fans",
    description: "Fixtures, results, football talk and fan chat.",
    members: 2150,
    joined: false,
    posts: [
      {
        id: 301,
        author: "AP Football",
        text: "What match are you watching today? ⚽",
        likes: 25,
      },
    ],
  },
];

export default function GroupsHub({ addNotification }) {
  const [groups, setGroups] = useState(starterGroups);
  const [newGroup, setNewGroup] = useState("");
  const [activeGroup, setActiveGroup] = useState(null);
  const [postText, setPostText] = useState("");

  function toggleGroup(group) {
    setGroups((current) =>
      current.map((item) =>
        item.id === group.id
          ? {
              ...item,
              joined: !item.joined,
              members: item.joined
                ? item.members - 1
                : item.members + 1,
            }
          : item
      )
    );

    if (!group.joined && addNotification) {
      addNotification(
        "👥",
        "Joined group",
        `You joined ${group.name}.`
      );
    }
  }

  function createGroup() {
    const name = newGroup.trim();
    if (!name) return;

    const group = {
      id: Date.now(),
      name,
      description: "A new AP-STREAM community group.",
      members: 1,
      joined: true,
      posts: [],
    };

    setGroups((current) => [group, ...current]);
    setNewGroup("");

    if (addNotification) {
      addNotification(
        "👥",
        "Group created",
        `You created ${name}.`
      );
    }
  }

  function createGroupPost() {
    const text = postText.trim();
    if (!text || !activeGroup) return;

    const newPost = {
      id: Date.now(),
      author: "AP User",
      text,
      likes: 0,
    };

    setGroups((current) =>
      current.map((group) =>
        group.id === activeGroup.id
          ? {
              ...group,
              posts: [newPost, ...group.posts],
            }
          : group
      )
    );

    setPostText("");

    if (addNotification) {
      addNotification(
        "📝",
        "Group post created",
        `Your post was added to ${activeGroup.name}.`
      );
    }
  }

  function likeGroupPost(groupId, postId) {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              posts: group.posts.map((post) =>
                post.id === postId
                  ? { ...post, likes: post.likes + 1 }
                  : post
              ),
            }
          : group
      )
    );
  }

  return (
    <section className="groups-hub" id="groups">
      <div className="groups-header">
        <div>
          <p className="eyebrow">AP-STREAM COMMUNITY</p>
          <h2>👥 Groups</h2>
          <p className="section-subtitle">
            Find communities and connect with people who share your interests.
          </p>
        </div>
      </div>

      <div className="create-group">
        <input
          value={newGroup}
          onChange={(event) => setNewGroup(event.target.value)}
          placeholder="Create a new group..."
        />
        <button onClick={createGroup}>
          ＋ Create Group
        </button>
      </div>

      <div className="groups-grid">
        {groups.map((group) => (
          <article className="group-card" key={group.id}>
            <div className="group-icon">👥</div>

            <h3>{group.name}</h3>

            <p>{group.description}</p>

            <span className="group-members">
              👤 {group.members.toLocaleString()} members
            </span>

            <div className="group-actions">
              <button onClick={() => toggleGroup(group)}>
                {group.joined ? "✓ Joined" : "＋ Join Group"}
              </button>

              <button onClick={() => setActiveGroup(group)}>
                💬 Open Group
              </button>
            </div>
          </article>
        ))}
      </div>

      {activeGroup && (
        <div className="group-room">
          <div className="group-room-header">
            <div>
              <p className="eyebrow">GROUP</p>
              <h2>👥 {activeGroup.name}</h2>
              <p>{activeGroup.description}</p>
            </div>

            <button onClick={() => setActiveGroup(null)}>
              ✕ Close
            </button>
          </div>

          {!activeGroup.joined ? (
            <div className="group-join-message">
              <p>Join this group to participate in group discussions.</p>
              <button onClick={() => toggleGroup(activeGroup)}>
                ＋ Join Group
              </button>
            </div>
          ) : (
            <>
              <div className="group-post-create">
                <textarea
                  value={postText}
                  onChange={(event) => setPostText(event.target.value)}
                  placeholder={`Share something with ${activeGroup.name}...`}
                  rows="3"
                />

                <button onClick={createGroupPost}>
                  📝 Post
                </button>
              </div>

              <div className="group-posts">
                {activeGroup.posts.length === 0 ? (
                  <div className="empty-group">
                    <h3>No posts yet</h3>
                    <p>Be the first person to start the conversation.</p>
                  </div>
                ) : (
                  activeGroup.posts.map((post) => (
                    <article className="group-post" key={post.id}>
                      <div className="group-post-user">
                        <div className="group-post-avatar">👤</div>

                        <div>
                          <strong>{post.author}</strong>
                          <small>Just now</small>
                        </div>
                      </div>

                      <p>{post.text}</p>

                      <div className="group-post-actions">
                        <button
                          onClick={() =>
                            likeGroupPost(activeGroup.id, post.id)
                          }
                        >
                          ❤️ Like {post.likes > 0 && post.likes}
                        </button>

                        <button
                          onClick={() =>
                            navigator.share
                              ? navigator.share({
                                  title: activeGroup.name,
                                  text: post.text,
                                }).catch(() => {})
                              : navigator.clipboard?.writeText(post.text)
                          }
                        >
                          ↗ Share
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
