let nextId = 4;

function now() {
  return new Date().toISOString();
}

let users = [
  {
    userId: 1,
    firstName: "Admin",
    lastName: "Root",
    userRole: "admin",
    createDate: "2026-01-01T00:00:00.000Z",
    updateDate: "2026-01-01T00:00:00.000Z",
  },
  {
    userId: 2,
    firstName: "Dana",
    lastName: "Cohen",
    userRole: "trainer",
    createDate: "2026-01-02T00:00:00.000Z",
    updateDate: "2026-01-02T00:00:00.000Z",
  },
  {
    userId: 3,
    firstName: "Mike",
    lastName: "Levi",
    userRole: "trainee",
    createDate: "2026-01-03T00:00:00.000Z",
    updateDate: "2026-01-03T00:00:00.000Z",
  },
];

function getAll() {
  return users;
}

function getById(userId) {
  return users.find((u) => u.userId === userId);
}

function create(item) {
  const ts = now();
  const row = { userId: nextId++, ...item, createDate: ts, updateDate: ts };
  users.push(row);
  return row;
}

function update(userId, patch) {
  const idx = users.findIndex((u) => u.userId === userId);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch, userId, updateDate: now() };
  return users[idx];
}

function remove(userId) {
  const idx = users.findIndex((u) => u.userId === userId);
  if (idx === -1) return null;
  const [removed] = users.splice(idx, 1);
  return removed;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
