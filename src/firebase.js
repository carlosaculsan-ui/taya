import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAqzlGnXeB1Ma6mQBFQQFvwbJPFtfE8Mlg',
  authDomain: 'taya-f1350.firebaseapp.com',
  projectId: 'taya-f1350',
  storageBucket: 'taya-f1350.firebasestorage.app',
  messagingSenderId: '871824238972',
  appId: '1:871824238972:web:f66747eea69c0c50a99cf9',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
