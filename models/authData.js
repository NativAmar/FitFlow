const authUsers = [
  {
    userId: 1,
    firstName: "Alex",
    lastName: "Admin",
    email: "admin@fitflow.com",
    password: "123456",
    userRole: "admin",
    token: "mock-token-admin",
  },
  {
    userId: 2,
    firstName: "Daniel",
    lastName: "Coach",
    email: "trainer@fitflow.com",
    password: "123456",
    userRole: "trainer",
    token: "mock-token-trainer",
  },
  {
    userId: 3,
    firstName: "Sam",
    lastName: "Trainee",
    email: "trainee@fitflow.com",
    password: "123456",
    userRole: "trainee",
    token: "mock-token-trainee",
  },
];

function findByCredentials(email, password) {
  const normalizedEmail = String(email).trim().toLowerCase();
  return authUsers.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
  );
}

function findByToken(token) {
  return authUsers.find((u) => u.token === token);
}

function toPublic(user) {
  return {
    userId: user.userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    userRole: user.userRole,
  };
}

module.exports = {
  findByCredentials,
  findByToken,
  toPublic,
};
