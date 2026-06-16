let settings = {
  displayName: "Daniel Coach",
  email: "trainer@fitflow.com",
  theme: "light",
};

function get() {
  return { ...settings };
}

function update(patch) {
  settings = { ...settings, ...patch };
  return { ...settings };
}

module.exports = {
  get,
  update,
};
