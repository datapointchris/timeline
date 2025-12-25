import { db, initializeDatabase } from './index.js';

interface SeedEvent {
  id: string;
  title: string;
  summary: string;
  details?: string;
  date_start: string;
  date_end?: string;
  date_precision: string;
  date_display?: string;
  is_bce: number;
  type: string;
  tags: string[];
}

interface SeedRelationship {
  source_id: string;
  target_id: string;
  type: string;
  notes?: string;
}

const events: SeedEvent[] = [
  {
    id: 'industrial-revolution',
    title: 'Industrial Revolution',
    summary:
      'A period of major industrialization and innovation during the late 18th and early 19th century.',
    details:
      '<p>The Industrial Revolution fundamentally changed the way goods were manufactured and had profound effects on society, economics, and politics.</p><p>Beginning in Britain, it marked a shift from agrarian economies to industrial manufacturing. Key innovations included the steam engine, spinning jenny, and power loom.</p>',
    date_start: '1760',
    date_end: '1840',
    date_precision: 'decade',
    is_bce: 0,
    type: 'movement',
    tags: ['economics', 'technology'],
  },
  {
    id: 'french-revolution',
    title: 'French Revolution',
    summary: 'A period of radical political and societal change in France from 1789 to 1799.',
    details:
      '<p>The French Revolution began with the Estates General of 1789 and ended with the formation of the French Consulate in November 1799.</p><p>It led to the end of the monarchy and the rise of Napoleon Bonaparte. The revolution had lasting effects on political thought worldwide.</p>',
    date_start: '1789',
    date_end: '1799',
    date_precision: 'year',
    is_bce: 0,
    type: 'event',
    tags: ['politics', 'philosophy'],
  },
  {
    id: 'schopenhauer-world-as-will',
    title: 'The World as Will and Representation',
    summary:
      'Arthur Schopenhauer\'s magnum opus arguing the world is driven by a blind, purposeless "Will."',
    details:
      "<p>Published in 1818, this work presents Schopenhauer's pessimistic philosophy that would later deeply influence Nietzsche, Wagner, and Freud.</p><p>Schopenhauer argues that the underlying reality of the world is irrational will, and that human suffering results from our enslavement to desire.</p>",
    date_start: '1818',
    date_precision: 'year',
    is_bce: 0,
    type: 'book',
    tags: ['philosophy', 'german philosophy'],
  },
  {
    id: 'communist-manifesto',
    title: 'The Communist Manifesto',
    summary:
      'A political pamphlet by Marx and Engels presenting an analytical approach to class struggle.',
    details:
      '<p>Published in 1848, The Communist Manifesto presents an analytical approach to the class struggle and the conflicts of capitalism.</p><p>It outlines the theory of historical materialism and calls for the overthrow of the bourgeoisie by the proletariat.</p>',
    date_start: '1848',
    date_precision: 'year',
    is_bce: 0,
    type: 'book',
    tags: ['philosophy', 'politics', 'economics'],
  },
  {
    id: 'nietzsche-birth',
    title: 'Friedrich Nietzsche',
    summary:
      'German philosopher, cultural critic, and philologist who questioned traditional morality.',
    details:
      '<p>Friedrich Nietzsche (1844-1900) was a German philosopher whose work addressed fundamental questions about truth, morality, culture, and the meaning of existence.</p><p>His concepts include the "will to power," the "Übermensch," and the famous declaration that "God is dead." His work has been highly influential in philosophy, literature, and psychology.</p>',
    date_start: '1844',
    date_end: '1900',
    date_precision: 'year',
    is_bce: 0,
    type: 'person',
    tags: ['philosophy', 'german philosophy'],
  },
  {
    id: 'dostoevsky-brothers-karamazov',
    title: 'The Brothers Karamazov',
    summary: "Dostoevsky's final novel exploring questions of God, free will, and morality.",
    details:
      '<p>A philosophical novel by Russian author Fyodor Dostoevsky, published in 1880. It is considered one of the greatest novels ever written.</p><p>The novel explores deep moral questions through the story of three brothers and their father. The famous "Grand Inquisitor" chapter is particularly influential in philosophy.</p>',
    date_start: '1880',
    date_precision: 'year',
    is_bce: 0,
    type: 'book',
    tags: ['literature', 'philosophy'],
  },
  {
    id: 'nietzsche-zarathustra',
    title: 'Thus Spoke Zarathustra',
    summary: "Nietzsche's philosophical novel introducing the Übermensch and eternal recurrence.",
    details:
      "<p>A philosophical novel by Friedrich Nietzsche, composed in four parts between 1883-1885.</p><p>It introduces many of Nietzsche's key ideas, including the Übermensch (Superman), the death of God, and the eternal recurrence of the same. Written in a prophetic, poetic style.</p>",
    date_start: '1883',
    date_end: '1885',
    date_precision: 'year',
    is_bce: 0,
    type: 'book',
    tags: ['philosophy', 'german philosophy'],
  },
  {
    id: 'nietzsche-beyond-good-evil',
    title: 'Beyond Good and Evil',
    summary: "Nietzsche's critique of traditional philosophy and morality.",
    details:
      '<p>First published in 1886, Beyond Good and Evil attacks past philosophers for their alleged lack of critical sense and their blind acceptance of Christian premises.</p><p>Nietzsche develops his concept of "master morality" versus "slave morality" and critiques the assumptions underlying Western philosophy.</p>',
    date_start: '1886',
    date_precision: 'year',
    is_bce: 0,
    type: 'book',
    tags: ['philosophy', 'german philosophy'],
  },
  {
    id: 'socrates',
    title: 'Socrates',
    summary: 'Classical Greek philosopher credited as one of the founders of Western philosophy.',
    details:
      '<p>Socrates (c. 470-399 BCE) is known primarily through the accounts of later classical writers, especially his students Plato and Xenophon.</p><p>He developed the Socratic method of questioning and is famous for his claim that he knows nothing. He was sentenced to death by drinking hemlock.</p>',
    date_start: '470',
    date_end: '399',
    date_precision: 'approximate',
    date_display: 'c. 470-399 BCE',
    is_bce: 1,
    type: 'person',
    tags: ['philosophy', 'ancient greece'],
  },
  {
    id: 'plato-republic',
    title: 'The Republic',
    summary: "Plato's dialogue on justice and the ideal city-state.",
    details:
      '<p>A Socratic dialogue by Plato, written around 375 BCE. It concerns justice, the order and character of the just city-state, and the just man.</p><p>It contains the famous Allegory of the Cave and the theory of Forms. It remains one of the most influential works of philosophy and political theory.</p>',
    date_start: '375',
    date_precision: 'approximate',
    date_display: 'c. 375 BCE',
    is_bce: 1,
    type: 'book',
    tags: ['philosophy', 'ancient greece'],
  },
];

const relationships: SeedRelationship[] = [
  {
    source_id: 'french-revolution',
    target_id: 'industrial-revolution',
    type: 'contemporary_with',
    notes: 'Both major events of the late 18th century that reshaped European society',
  },
  {
    source_id: 'communist-manifesto',
    target_id: 'industrial-revolution',
    type: 'response_to',
    notes: 'Marx wrote in response to the social conditions created by industrial capitalism',
  },
  {
    source_id: 'nietzsche-beyond-good-evil',
    target_id: 'schopenhauer-world-as-will',
    type: 'influenced_by',
    notes: 'Nietzsche was deeply influenced by Schopenhauer in his early career',
  },
  {
    source_id: 'nietzsche-zarathustra',
    target_id: 'nietzsche-birth',
    type: 'part_of',
    notes: "Part of Nietzsche's philosophical corpus",
  },
  {
    source_id: 'nietzsche-beyond-good-evil',
    target_id: 'nietzsche-birth',
    type: 'part_of',
    notes: "Part of Nietzsche's philosophical corpus",
  },
  {
    source_id: 'dostoevsky-brothers-karamazov',
    target_id: 'nietzsche-birth',
    type: 'contemporary_with',
    notes: 'Both explored similar themes of morality and existence in the late 19th century',
  },
  {
    source_id: 'plato-republic',
    target_id: 'socrates',
    type: 'influenced_by',
    notes: "Plato was Socrates' student and wrote about Socratic philosophy",
  },
];

function seed() {
  console.log('Initializing database...');
  initializeDatabase();

  console.log('Clearing existing data...');
  db.exec('DELETE FROM relationships');
  db.exec('DELETE FROM event_tags');
  db.exec('DELETE FROM tags');
  db.exec('DELETE FROM media');
  db.exec('DELETE FROM events');

  console.log('Inserting events...');
  const insertEvent = db.prepare(`
    INSERT INTO events (id, title, summary, details, date_start, date_end, date_precision, date_display, is_bce, type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
  const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
  const insertEventTag = db.prepare('INSERT INTO event_tags (event_id, tag_id) VALUES (?, ?)');

  for (const event of events) {
    insertEvent.run(
      event.id,
      event.title,
      event.summary,
      event.details || null,
      event.date_start,
      event.date_end || null,
      event.date_precision,
      event.date_display || null,
      event.is_bce,
      event.type
    );

    for (const tagName of event.tags) {
      insertTag.run(tagName);
      const tag = getTagId.get(tagName) as { id: number };
      insertEventTag.run(event.id, tag.id);
    }
  }

  console.log('Inserting relationships...');
  const insertRelationship = db.prepare(`
    INSERT INTO relationships (source_id, target_id, type, notes)
    VALUES (?, ?, ?, ?)
  `);

  for (const rel of relationships) {
    insertRelationship.run(rel.source_id, rel.target_id, rel.type, rel.notes || null);
  }

  console.log('Seed completed successfully!');
  console.log(`  - ${events.length} events`);
  console.log(`  - ${relationships.length} relationships`);

  const tagCount = (db.prepare('SELECT COUNT(*) as count FROM tags').get() as { count: number })
    .count;
  console.log(`  - ${tagCount} tags`);
}

seed();
