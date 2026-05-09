/* ── REACH Lab — Home (News) ─────────────────────────────────────────────── */

function renderNewsItem(item) {
  const card = mk('div', 'news-card');

  const title = mk('h3', 'news-title');
  title.textContent = item.title;
  card.appendChild(title);

  const desc = mk('p', 'news-desc');
  desc.textContent = item.desc;
  card.appendChild(desc);

  if (isHttpUrl(item.link)) {
    const link = mk('a', 'news-link');
    link.href = item.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Read more →';
    card.appendChild(link);
  }

  return card;
}

function subscribeToNews() {
  const container = document.getElementById('news-container');

  db.collection('news')
    .orderBy('order', 'asc')
    .onSnapshot(function(snapshot) {
      container.textContent = '';
      if (snapshot.empty) {
        const empty = mk('p');
        empty.textContent = 'No news yet.';
        empty.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;';
        container.appendChild(empty);
        return;
      }
      snapshot.docs.forEach(function(d) {
        container.appendChild(renderNewsItem(Object.assign({ id: d.id }, d.data())));
      });
    }, function(err) {
      console.error('Firestore read error:', err);
      container.textContent = 'Could not load news.';
    });
}

subscribeToNews();
