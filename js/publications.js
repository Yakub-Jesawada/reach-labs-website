/* ── REACH Lab — Publications ────────────────────────────────────────────── */

function renderPublication(pub) {
  const entry = mk('div', 'pub-entry');

  const titleDiv = mk('div', 'pub-entry-title');
  if (isHttpUrl(pub.link)) {
    const link = mk('a');
    link.href = pub.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = pub.title;
    titleDiv.appendChild(link);
  } else {
    titleDiv.textContent = pub.title;
  }
  entry.appendChild(titleDiv);

  const meta = mk('p', 'pub-entry-meta');
  const authors = mk('span');
  authors.textContent = pub.authors;
  meta.appendChild(authors);

  if (pub.venue || pub.year) {
    meta.append(' · ');
    const venueYear = mk('span');
    const parts = [];
    if (pub.venue) parts.push(pub.venue);
    if (pub.year) parts.push(String(pub.year));
    venueYear.textContent = parts.join(' ');
    meta.appendChild(venueYear);
  }
  entry.appendChild(meta);

  return entry;
}

function subscribeToPublications() {
  const container = document.getElementById('publications-list');

  db.collection('publications')
    .orderBy('order', 'asc')
    .onSnapshot(function(snapshot) {
      container.textContent = '';
      if (snapshot.empty) {
        const empty = mk('p');
        empty.textContent = 'No publications yet.';
        empty.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;';
        container.appendChild(empty);
        return;
      }
      snapshot.docs.forEach(function(d) {
        container.appendChild(renderPublication(Object.assign({ id: d.id }, d.data())));
      });
    }, function(err) {
      console.error('Firestore read error:', err);
      container.textContent = 'Could not load publications.';
    });
}

subscribeToPublications();
