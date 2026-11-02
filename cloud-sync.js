
const CLOUD_URL = 'https://script.google.com/macros/s/AKfycbzMGH1LG0eIVzUr4HjBwLBbX8wOFUS30GW6r-Ql_EG9JdMqU5HyuCd0hiv-Pu4BNuo0qA/exec';
const CLOUD_TOKEN = 'Hmf4224839@';

const QUEUE_KEY = 'saatzan_cloud_queue_v1';

function cloudQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveCloudQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

async function cloudSend(payload) {
  const response = await fetch(CLOUD_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body: JSON.stringify({ ...payload, token: CLOUD_TOKEN })
  });
  return response;
}

function cloudUpsert(record) {
  if (!record || !record.id) return;

  const queue = cloudQueue().filter(
    item => !(item.action === 'upsert' && item.record.id === record.id)
  );

  queue.push({ action: 'upsert', record });
  saveCloudQueue(queue);
  cloudFlush();
}

function cloudDelete(id) {
  const queue = cloudQueue().filter(
    item => !(item.action === 'upsert' && item.record.id === id)
  );

  queue.push({ action: 'delete', id });
  saveCloudQueue(queue);
  cloudFlush();
}

let cloudBusy = false;

async function cloudFlush() {
  if (cloudBusy || !navigator.onLine) return;
  cloudBusy = true;

  try {
    let queue = cloudQueue();

    while (queue.length) {
      const item = queue[0];

      await cloudSend(item);

      queue.shift();
      saveCloudQueue(queue);
    }
  } catch (error) {
    console.log('Cloud sync pending:', error);
  } finally {
    cloudBusy = false;
  }
}

window.addEventListener('online', cloudFlush);
window.saatzanCloud = { upsert: cloudUpsert, delete: cloudDelete, flush: cloudFlush };
