const admin = require("firebase-admin");
const serviceAccount = require("../../serviceAccountKey.json"); // Make sure this path is correct!

// Only initialize if it hasn't been initialized yet
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

// ⚠️ IMPORTANT: Export the 'admin' object, NOT the app instance
module.exports = admin;