
// Mock Firebase Auth
export const auth = {
    currentUser: { uid: 'test-user', email: 'test@example.com' },
    signOut: () => Promise.resolve()
};
export const onAuthStateChanged = (auth, callback) => {
    callback(auth.currentUser);
    return () => {};
};
export const signOut = () => Promise.resolve();

// Mock Firebase Firestore
export const db = {};
export const collection = (db, name) => ({ type: 'collection', name });
export const doc = (db, col, id) => ({ type: 'doc', col, id });
export const addDoc = () => Promise.resolve({ id: 'test-doc-id' });
export const updateDoc = () => Promise.resolve();
export const deleteDoc = () => Promise.resolve();
export const getDoc = () => Promise.resolve({ exists: () => false, data: () => ({}) });
export const getDocs = () => Promise.resolve({ empty: true, docs: [] });
export const setDoc = () => Promise.resolve();
export const onSnapshot = (ref, callback) => {
    // Simulate empty data initially
    callback({ docs: [] });
    return () => {};
};

// Mock Config
export const firebaseConfig = {};
export const app = {};
