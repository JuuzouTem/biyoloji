// --- Global Three.js Değişkenleri ---
let scene, camera, renderer, controls;
let modelContainer; // Modeli içeren div
let heartModel; // Yüklenen ana 3D model
let labels = []; // Model üzerindeki etiketler (Sprite'lar)
let labelsVisible = true; // Etiketlerin görünürlük durumu
let initialCameraPosition = new THREE.Vector3(0, 1, 7); // Kameranın başlangıç pozisyonu

// --- Diğer Global Değişkenler ---
let heartbeatAudio;
const modelPath = 'models/heart_model.glb'; // Model dosyasının yolu
const audioPath = 'audio/heartbeat.mp3'; // Ses dosyasının yolu
const loaderOverlay = document.getElementById('loader-overlay'); // Yükleme göstergesi

// --- Ana Başlatma Fonksiyonu ---
function init() {
    modelContainer = document.getElementById('model-container');
    if (!modelContainer) {
        console.error("Model container bulunamadı!");
        return;
    }

    // 1. Sahne Oluşturma
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4f8);

    // 2. Kamera Oluşturma
    const aspect = modelContainer.clientWidth / modelContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    camera.position.copy(initialCameraPosition);
    camera.lookAt(scene.position);

    // 3. Renderer Oluşturma
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    modelContainer.appendChild(renderer.domElement);

    // 4. Kontrolleri Ekleme (OrbitControls)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = false;
    controls.minDistance = 2;
    controls.maxDistance = 25;
    controls.target.set(0, 0, 0);

    // 5. Işıkları Ekleme (Geliştirilmiş)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); // Ortam ışığı yoğunluğu artırıldı
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // Ana ışık yoğunluğu artırıldı ve konumu ayarlandı
    directionalLight.position.set(5, 8, 10);
    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);

    // İsteğe Bağlı: İkinci dolgu ışığı
    const directionalLight2 = new THREE.DirectionalLight(0xaaaaaa, 0.8);
    directionalLight2.position.set(-5, -3, -5);
    directionalLight2.target.position.set(0, 0, 0);
    scene.add(directionalLight2);
    scene.add(directionalLight2.target);

    // 6. Modeli Yükleme
    loadGLBModel(modelPath);

    // 7. UI Olaylarını Ayarlama
    setupUIEventListeners();

    // 8. Ses Dosyasını Yükleme (Loop aktif)
    loadAudio(audioPath);

    // 9. Pencere Boyutlandırma Olayı
    window.addEventListener('resize', onWindowResize, false);

    // 10. Animasyon Döngüsünü Başlatma
    animate();
}

// --- Model Yükleme Fonksiyonu ---
function loadGLBModel(path) {
    const loader = new THREE.GLTFLoader();
    if (loaderOverlay) loaderOverlay.style.display = 'flex';

    loader.load(
        path,
        // Başarıyla yüklendiğinde
        function (gltf) {
            heartModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(heartModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            heartModel.position.sub(center);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 4 / maxDim;
            heartModel.scale.set(scale, scale, scale);

            scene.add(heartModel);
            createLabels(); // Etiketleri model yüklendikten sonra oluştur
            if (loaderOverlay) loaderOverlay.style.display = 'none';
        },
        // Yükleme ilerlemesi (Geliştirilmiş - Infinity% sorunu düzeltildi)
        function (xhr) {
            if (loaderOverlay) {
                if (xhr.lengthComputable && xhr.total > 0) {
                    const percentLoaded = (xhr.loaded / xhr.total * 100).toFixed(0);
                    loaderOverlay.textContent = `Yükleniyor... ${percentLoaded}%`;
                } else {
                    const loadedMB = (xhr.loaded / 1024 / 1024).toFixed(2);
                    loaderOverlay.textContent = `Yükleniyor... (${loadedMB} MB)`;
                    // Veya: loaderOverlay.textContent = `Yükleniyor...`;
                }
            }
        },
        // Hata durumunda
        function (error) {
            console.error('Model yüklenirken hata oluştu:', error);
             if (loaderOverlay) {
                loaderOverlay.textContent = 'Model Yüklenemedi!';
                loaderOverlay.style.color = 'red';
             }
        }
    );
}

// --- Etiket Oluşturma Fonksiyonu (Sprite ve Sabit Ölçek Kullanarak) ---
function createLabels() {
    // !!! GÖRSELE DAYALI TAHMİNİ YENİ POZİSYONLAR !!!
    // Bu pozisyonları kendi modelinizde test edip ince ayar yapmanız önerilir.
    const labelData = [
        // Üst Kısım: Görselde Aort ortada ve en yukarıda. Pulmoner Arter ve Vena Cava onun sağında.
        { text: "Aort",           position: new THREE.Vector3( 0.0,  3.3, -0.5) }, // Ortada, en yukarıda, hafif arkada
        { text: "Pulmoner Arter", position: new THREE.Vector3( 1.0,  3.0, -0.6) }, // Aort'un sağında, biraz aşağıda ve arkasında
        { text: "Vena Cava",      position: new THREE.Vector3( 1.5,  2.8,  0.0) }, // En sağda, Pulmoner Arter'den biraz aşağıda ve önünde

        // Orta Kısım (Kulakçıklar): Görselde kalbin yanlarında, orta yükseklikte.
        { text: "Sağ Atriyum",    position: new THREE.Vector3( 1.9,  0.8,  0.5) }, // Daha sağda, orta yükseklikte, önde
        { text: "Sol Atriyum",    position: new THREE.Vector3(-1.9,  0.8,  0.3) }, // Daha solda, orta yükseklikte, biraz daha az önde

        // Alt Kısım (Karıncıklar): Görselde kalbin alt yanlarında.
        { text: "Sağ Ventrikül",  position: new THREE.Vector3( 1.6, -1.8,  0.8) }, // Sağ altta, öne doğru
        { text: "Sol Ventrikül",  position: new THREE.Vector3(-1.6, -1.8,  0.8) }  // Sol altta, öne doğru
    ];

    // Önceki etiketleri temizle
    labels.forEach(label => scene.remove(label));
    labels = [];

    labelData.forEach(data => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = 20;
        context.font = `Bold ${fontSize}px Arial`;
        const textMetrics = context.measureText(data.text);
        const textWidth = textMetrics.width;

        canvas.width = textWidth + 10;
        canvas.height = fontSize + 10;

        context.fillStyle = "rgba(0, 0, 0, 0.6)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.font = `Bold ${fontSize}px Arial`;
        context.fillStyle = "white";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(data.text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            sizeAttenuation: false
        });
        const sprite = new THREE.Sprite(spriteMaterial);

        // SABİT ÖLÇEKLEME (Bu değerleri önceki adımdaki gibi ayarlayın)
        // Etiket boyutunu buradan ayarlayın (örn: 0.1, 0.05 veya daha küçük)
        sprite.scale.set(0.1, 0.05, 1); // Önceki ayarlamanızdaki en iyi değeri kullanın

        // GÜNCELLENMİŞ TAHMİNİ POZİSYONU KULLAN
        sprite.position.copy(data.position);

        sprite.visible = labelsVisible;
        scene.add(sprite);
        labels.push(sprite);
    });
}

// --- Animasyon Döngüsü ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- Pencere Boyutlandırma İşleyici ---
function onWindowResize() {
    if (!modelContainer) return;
    const width = modelContainer.clientWidth;
    const height = modelContainer.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// --- UI Olay Dinleyicileri ---
function setupUIEventListeners() {
    // Tab Değiştirme
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            const targetTab = document.getElementById(tabId);
            if (targetTab) targetTab.classList.add('active');
        });
    });

    // Cevap Gösterme/Gizleme
    window.toggleAnswer = function(button) {
        const answer = button.nextElementSibling;
        if (!answer) return;
        if (answer.style.display === 'block') {
            answer.style.display = 'none';
            button.textContent = 'Cevabı Göster';
        } else {
            answer.style.display = 'block';
            button.textContent = 'Cevabı Gizle';
        }
    }

    // Model Kontrol Butonları
    document.getElementById('btn-show-all')?.addEventListener('click', () => {
        if (heartModel) heartModel.visible = true;
        // İleride model parçalarını kontrol etmek için traverse kullanılabilir
    });
    document.getElementById('btn-isolate-heart')?.addEventListener('click', () => {
        if (heartModel) heartModel.visible = true;
        // İleride model parçalarını kontrol etmek için traverse kullanılabilir
    });
    document.getElementById('btn-toggle-labels')?.addEventListener('click', toggleLabels);
    document.getElementById('btn-play-heartbeat')?.addEventListener('click', playHeartbeat);
}

// --- Etiket Görünürlüğünü Değiştirme ---
function toggleLabels() {
    labelsVisible = !labelsVisible;
    labels.forEach(label => {
        label.visible = labelsVisible;
    });
    const button = document.getElementById('btn-toggle-labels');
    if (button) button.textContent = labelsVisible ? 'Etiketleri Gizle' : 'Etiketleri Göster';
}

// --- Ses Yükleme (Loop aktif) ---
function loadAudio(path) {
    const audioButton = document.getElementById('btn-play-heartbeat');
    try {
        heartbeatAudio = new Audio(path);
        heartbeatAudio.loop = true; // Sesin tekrar etmesi için
        heartbeatAudio.preload = 'auto';

        const onCanPlay = () => {
             console.log("Ses dosyası çalmaya hazır.");
             if (audioButton) audioButton.disabled = false;
             heartbeatAudio.removeEventListener('canplaythrough', onCanPlay);
        };
        const onError = (e) => {
            console.error("Ses dosyası yüklenemedi veya hata oluştu:", e);
            if (audioButton) {
                audioButton.disabled = true;
                audioButton.textContent = 'Ses Hatası';
            }
        };

        heartbeatAudio.addEventListener('canplaythrough', onCanPlay, false);
        heartbeatAudio.addEventListener('error', onError, false);
        if (audioButton) audioButton.disabled = true; // Başlangıçta devre dışı

    } catch (e) {
        console.error("Audio nesnesi oluşturulamadı:", e);
         if (audioButton) {
             audioButton.disabled = true;
             audioButton.textContent = 'Ses Hatası';
         }
    }
}

// --- Kalp Atışı Sesini Oynatma/Durdurma ---
function playHeartbeat() {
    if (heartbeatAudio && heartbeatAudio.readyState >= 2) {
        if (heartbeatAudio.paused) {
            heartbeatAudio.play().catch(e => console.error("Ses çalma hatası:", e));
        } else {
            heartbeatAudio.pause();
        }
    } else {
        console.warn("Ses dosyası henüz hazır değil veya yüklenemedi.");
    }
}

// --- Başlatma ---
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
