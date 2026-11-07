
    // 1. 인증(로그인/회원가입) 모듈 가져오기
    import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
    import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
    // 2. 데이터베이스 모듈 가져오기
    // 2. 데이터베이스 모듈 가져오기 (🔥 deleteDoc, updateDoc 추가)
    import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc, runTransaction } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

    const firebaseConfig = {
        apiKey: "AIzaSyA_4sG7FFzsl8GThHHAxBmJg1WOoRvol88",
        authDomain: "codesnack-e3066.firebaseapp.com",
        projectId: "codesnack-e3066",
        storageBucket: "codesnack-e3066.firebasestorage.app",
        messagingSenderId: "865639351865",
        appId: "1:865639351865:web:e2c51721364d8a8755efe8",
        measurementId: "G-2GHTC9R3VS"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // 전역(window) 객체에 할당하여 기존 스크립트 태그에서 사용할 수 있게 합니다.
    window.firebaseAuth = auth;
    window.firebaseDb = db;
    window.setDoc = setDoc;
    window.getDoc = getDoc;
    window.doc = doc;
    window.collection = collection;
    window.addDoc = addDoc;
    window.getDocs = getDocs;
    window.deleteDoc = deleteDoc; // 🔥 퀴즈 삭제용 함수 등록
    window.updateDoc = updateDoc; // 🔥 퀴즈 수정용 함수 등록
    window.runTransaction = runTransaction;
    
    // 🔥 이 세 줄이 가장 중요합니다! 회원가입/로그인/로그아웃/상태감지 함수를 등록합니다.
    window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
    window.signInWithEmailAndPassword = signInWithEmailAndPassword;
    // 로그인 화면의 자동 로그인 체크박스에 따라 인증 정보를 저장합니다.
    window.setAuthPersistence = setPersistence;
    window.browserLocalPersistence = browserLocalPersistence;
    window.browserSessionPersistence = browserSessionPersistence;
    window.signOut = signOut;
    window.onAuthStateChanged = onAuthStateChanged;

// Shared authentication state is ready for app initialization.
window.dispatchEvent(new Event('codesnack:firebase-ready'));
