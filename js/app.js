/* ── REACH Lab — Public Site JS ─────────────────────────────────────────────
   Read-only. Subscribes to Firestore and renders project cards.               */

const DEFAULT_PROJECTS = [
  {
    id: 'p1',
    title: 'Dexterous Manipulation with Deformable Objects',
    tag: 'Robot Learning · Manipulation',
    desc: 'Advancing robotic grasping, in-hand manipulation, and adaptable object handling in complex real-world scenarios, including those involving deformable objects and uncertain conditions. We develop reinforcement learning and imitation learning pipelines that allow robots to acquire manipulation skills from limited demonstrations.',
    contact: { name: 'Prof. Fares Abu-Dakka', url: 'https://nyuad.nyu.edu' },
    video: { type: 'youtube', url: 'https://www.youtube.com/embed/videoseries?list=PLRezMy-3ORkgm6b3E4LL5m07hd-eELrui' },
    pubs: [{ text: 'Abu-Dakka et al. Robot skill learning via compliance-driven RL. IEEE RA-L 2024.', url: '' }]
  },
  {
    id: 'p2',
    title: 'Autonomous Robot Learning from Human Observation',
    tag: 'Imitation Learning · HRI',
    desc: 'Drawing inspiration from how humans and animals learn, we develop algorithms that enable robots to acquire new skills through reinforcement learning, trial and error, and observing and mimicking the actions of others. A key challenge is bridging the gap between human demonstrations and robot execution in varied environments.',
    contact: { name: 'REACH Lab', url: '' },
    video: { type: 'none', url: '' },
    pubs: []
  },
  {
    id: 'p3',
    title: 'Safe Human-Robot Collaboration',
    tag: 'Safety · Control',
    desc: 'Designing control architectures that keep robots safe and predictable during close collaboration with humans. We integrate constraint-aware motion planning with learned task policies, ensuring that robotic assistants can handle dangerous or repetitive tasks while remaining under human oversight at all times.',
    contact: { name: 'REACH Lab', url: '' },
    video: { type: 'none', url: '' },
    pubs: []
  }
];

const isHttpUrl = u => typeof u === 'string' && /^https?:\/\//i.test(u);

function videoEmbedUrl(type, url) {
  if (!url || type === 'none') return null;
  if (type === 'youtube') {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    if (m) return 'https://www.youtube.com/embed/' + m[1];
    if (url.includes('youtube.com/embed')) return url;
  }
  if (type === 'vimeo') {
    const m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return 'https://player.vimeo.com/video/' + m[1];
    if (url.includes('player.vimeo.com')) return url;
  }
  if (type === 'direct' && isHttpUrl(url)) return url;
  return null;
}

function mk(tag, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  return el;
}

function buildMediaCol(p) {
  const media = mk('div', 'project-media');
  const embedUrl = videoEmbedUrl(p.video && p.video.type, p.video && p.video.url);
  if (embedUrl) {
    const iframe = mk('iframe');
    iframe.src = embedUrl;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    media.appendChild(iframe);
  } else {
    const placeholder = mk('div', 'no-video');
    placeholder.textContent = 'Video coming soon';
    media.appendChild(placeholder);
  }
  return media;
}

function buildContentCol(p) {
  const content = mk('div', 'project-content');

  if (p.tag) {
    const tag = mk('span', 'project-tag');
    tag.textContent = p.tag;
    content.appendChild(tag);
  }

  const title = mk('h3', 'project-title');
  title.textContent = p.title;
  content.appendChild(title);

  const desc = mk('p', 'project-desc');
  desc.textContent = p.desc;
  content.appendChild(desc);

  if (p.contact && p.contact.name) {
    const contact = mk('p', 'project-contact');
    contact.append('Contact: ');
    if (isHttpUrl(p.contact.url)) {
      const link = mk('a');
      link.href = p.contact.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = p.contact.name;
      contact.appendChild(link);
    } else {
      contact.append(p.contact.name);
    }
    content.appendChild(contact);
  }

  if (p.pubs && p.pubs.length) {
    const pubsDiv = mk('div', 'project-pubs');
    const pubsTitle = mk('p', 'project-pubs-title');
    pubsTitle.textContent = 'Relevant Publications';
    pubsDiv.appendChild(pubsTitle);
    p.pubs.forEach(pub => {
      const item = mk('div', 'pub-item');
      item.textContent = pub.text;
      if (isHttpUrl(pub.url)) {
        const link = mk('a', 'pub-link');
        link.href = pub.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = '[link]';
        item.appendChild(link);
      }
      pubsDiv.appendChild(item);
    });
    content.appendChild(pubsDiv);
  }

  return content;
}

function renderProject(p) {
  const card = mk('div', 'project-card');
  card.id = 'project-' + String(p.id).replace(/[^a-zA-Z0-9_-]/g, '');

  const inner = mk('div', 'project-card-inner');
  inner.appendChild(buildContentCol(p));
  inner.appendChild(buildMediaCol(p));
  card.appendChild(inner);
  return card;
}

async function seedDefaultProjects() {
  const batch = db.batch();
  DEFAULT_PROJECTS.forEach((p, i) => {
    const ref = db.collection('projects').doc(p.id);
    batch.set(ref, Object.assign({}, p, {
      order: i,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }));
  });
  await batch.commit();
}

function subscribeToProjects() {
  const container = document.getElementById('projects-container');
  const loading = mk('p');
  loading.textContent = 'Loading projects…';
  loading.style.cssText = 'color:var(--gray-500);text-align:center;padding:2rem 0;';
  container.appendChild(loading);

  db.collection('projects')
    .orderBy('order', 'asc')
    .onSnapshot(function(snapshot) {
      if (snapshot.empty) {
        seedDefaultProjects().catch(console.error);
        return;
      }
      const projects = snapshot.docs.map(function(d) {
        return Object.assign({ id: d.id }, d.data());
      });
      container.textContent = '';
      projects.forEach(function(p) { container.appendChild(renderProject(p)); });
      document.getElementById('meta-projects').textContent = projects.length;
    }, function(err) {
      console.error('Firestore read error:', err);
      container.textContent = 'Could not load projects.';
    });
}

subscribeToProjects();
