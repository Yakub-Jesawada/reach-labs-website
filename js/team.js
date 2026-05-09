/* ── REACH Lab — Team ────────────────────────────────────────────────────── */

function getInitials(name) {
  return String(name).split(' ').filter(Boolean).slice(0, 2).map(function(w) {
    return w[0].toUpperCase();
  }).join('');
}

function renderTeamMember(member) {
  const card = mk('div', 'team-card');

  const photoDiv = mk('div', 'team-photo');
  if (isHttpUrl(member.photo)) {
    const img = mk('img');
    img.src = member.photo;
    img.alt = member.name;
    photoDiv.appendChild(img);
  } else {
    const initials = mk('span', 'team-photo-initials');
    initials.textContent = getInitials(member.name);
    photoDiv.appendChild(initials);
  }
  card.appendChild(photoDiv);

  const name = mk('div', 'team-name');
  name.textContent = member.name;
  card.appendChild(name);

  const role = mk('div', 'team-role');
  role.textContent = member.role;
  card.appendChild(role);

  if (member.bio) {
    const bio = mk('p', 'team-bio');
    bio.textContent = member.bio;
    card.appendChild(bio);
  }

  return card;
}

function subscribeToTeam() {
  const container = document.getElementById('team-container');

  db.collection('team')
    .orderBy('order', 'asc')
    .onSnapshot(function(snapshot) {
      container.textContent = '';
      if (snapshot.empty) {
        const empty = mk('p');
        empty.textContent = 'No team members yet.';
        empty.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;';
        container.appendChild(empty);
        return;
      }
      snapshot.docs.forEach(function(d) {
        container.appendChild(renderTeamMember(Object.assign({ id: d.id }, d.data())));
      });
    }, function(err) {
      console.error('Firestore read error:', err);
      container.textContent = 'Could not load team.';
    });
}

subscribeToTeam();
