const admin = require("firebase-admin");

// Import service account key
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Get Firestore database and Auth
const db = admin.firestore();
const auth = admin.auth();

// ==================== AUTHENTICATION ====================

/**
 * Create a new user with email and password
 */
const createUser = async (email, password, displayName = "") => {
  try {
    const userRecord = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: false
    });
    return {
      success: true,
      uid: userRecord.uid,
      message: "User created successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a user by UID
 */
const deleteUser = async (uid) => {
  try {
    await auth.deleteUser(uid);
    return {
      success: true,
      message: "User deleted successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get user by UID
 */
const getUserByUID = async (uid) => {
  try {
    const userRecord = await auth.getUser(uid);
    return {
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        emailVerified: userRecord.emailVerified,
        disabled: userRecord.disabled
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (uid, updates) => {
  try {
    await auth.updateUser(uid, updates);
    return {
      success: true,
      message: "User profile updated successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify ID token
 */
const verifyIdToken = async (idToken) => {
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    return {
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      decodedToken
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// ==================== FIRESTORE DATABASE ====================

/**
 * Add a new document to a collection
 */
const addDocument = async (collection, data) => {
  try {
    const docRef = await db.collection(collection).add({
      ...data,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
    return {
      success: true,
      docId: docRef.id,
      message: "Document added successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get a document by ID
 */
const getDocument = async (collection, docId) => {
  try {
    const doc = await db.collection(collection).doc(docId).get();
    if (!doc.exists) {
      return {
        success: false,
        error: "Document not found"
      };
    }
    return {
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update a document
 */
const updateDocument = async (collection, docId, data) => {
  try {
    await db.collection(collection).doc(docId).update({
      ...data,
      updatedAt: admin.firestore.Timestamp.now()
    });
    return {
      success: true,
      message: "Document updated successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete a document
 */
const deleteDocument = async (collection, docId) => {
  try {
    await db.collection(collection).doc(docId).delete();
    return {
      success: true,
      message: "Document deleted successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all documents from a collection
 */
const getAllDocuments = async (collection) => {
  try {
    const snapshot = await db.collection(collection).get();
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return {
      success: true,
      data: documents
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Query documents with conditions
 */
const queryDocuments = async (collection, conditions = []) => {
  try {
    let query = db.collection(collection);
    
    // Apply conditions: [{ field: 'name', operator: '==', value: 'John' }]
    conditions.forEach(condition => {
      query = query.where(condition.field, condition.operator, condition.value);
    });
    
    const snapshot = await query.get();
    const documents = [];
    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return {
      success: true,
      data: documents
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// ==================== USER DATA MANAGEMENT ====================

/**
 * Create user profile in Firestore
 */
const createUserProfile = async (uid, userData) => {
  try {
    await db.collection("users").doc(uid).set({
      uid,
      ...userData,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    });
    return {
      success: true,
      message: "User profile created successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get user profile
 */
const getUserProfile = async (uid) => {
  try {
    const doc = await db.collection("users").doc(uid).get();
    if (!doc.exists) {
      return {
        success: false,
        error: "User profile not found"
      };
    }
    return {
      success: true,
      data: doc.data()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update user profile in Firestore
 */
const updateUserProfileData = async (uid, updates) => {
  try {
    await db.collection("users").doc(uid).update({
      ...updates,
      updatedAt: admin.firestore.Timestamp.now()
    });
    return {
      success: true,
      message: "User profile updated successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete user profile
 */
const deleteUserProfile = async (uid) => {
  try {
    await db.collection("users").doc(uid).delete();
    return {
      success: true,
      message: "User profile deleted successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// ==================== BATCH OPERATIONS ====================

/**
 * Batch write operations
 */
const batchWrite = async (operations = []) => {
  try {
    const batch = db.batch();
    
    operations.forEach(op => {
      const ref = db.collection(op.collection).doc(op.docId);
      if (op.type === "set") {
        batch.set(ref, op.data);
      } else if (op.type === "update") {
        batch.update(ref, op.data);
      } else if (op.type === "delete") {
        batch.delete(ref);
      }
    });
    
    await batch.commit();
    return {
      success: true,
      message: "Batch operations completed successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Export all functions
module.exports = {
  db,
  auth,
  // Auth functions
  createUser,
  deleteUser,
  getUserByUID,
  updateUserProfile,
  verifyIdToken,
  // Firestore functions
  addDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  getAllDocuments,
  queryDocuments,
  // User profile functions
  createUserProfile,
  getUserProfile,
  updateUserProfileData,
  deleteUserProfile,
  // Batch operations
  batchWrite
};