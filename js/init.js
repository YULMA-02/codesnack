// CodeSnack - init.js (original script order preserved)
        function initializeCodeSnack() {
            try { if (localStorage.getItem('codesnack-theme') === 'dark') document.documentElement.classList.add('dark'); } catch(e) {}
            document.getElementById('themeIcon').className = document.documentElement.classList.contains('dark') ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
            loadLearningProgress();
            setLanguage('python');
            switchTab('home');
            const savedRunner = document.getElementById('runnerEndpoint');
            if (savedRunner) { try { savedRunner.value = localStorage.getItem('codesnack-runner-endpoint') || ''; } catch (_) {} }
            updateRuntimeLabel();

            const connectFirebaseAuth = () => {
                if (!window.firebaseAuth || !window.onAuthStateChanged) return;
                window.onAuthStateChanged(window.firebaseAuth, async (user) => {
                if (user) {
                    const docSnap = await window.getDoc(window.doc(window.firebaseDb, "users", user.uid));
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        // 선생님인데 코드가 없다면 자동 발급
                        if (data.role === 'teacher' && !data.classCode) {
                            data.classCode = 'TCH-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                            await window.setDoc(window.doc(window.firebaseDb, "users", user.uid), { classCode: data.classCode }, { merge: true });
                        }
                        currentUser = { ...data, uid: user.uid };
                        xp = currentUser.xp || 0;
                        solvedQuizzesCount = currentUser.solvedCount || 0;
                        loadLearningProgress(currentUser);
                    }
                    updateUIForAuth();
                } else {
                    currentUser = null;
                    xp = 0;
                    solvedQuizzesCount = 0;
                    loadLearningProgress();
                    updateUIForAuth();
                }
            });
            };
            if (window.firebaseAuth && window.onAuthStateChanged) connectFirebaseAuth();
            else window.addEventListener('codesnack:firebase-ready', connectFirebaseAuth, { once: true });
        };

    