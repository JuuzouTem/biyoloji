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
    scene.background = new THREE.Color(0xf0f4f8); // CSS ile aynı arka plan rengi

    // 2. Kamera Oluşturma
    const aspect = modelContainer.clientWidth / modelContainer.clientHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000); // Görüş açısı ayarlandı
    camera.position.copy(initialCameraPosition);
    camera.lookAt(scene.position); // Sahnenin merkezine bak

    // 3. Renderer Oluşturma
    renderer = new THREE.WebGLRenderer({ antialias: true }); // Kenar yumuşatma aktif
    renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // Daha net görüntü için
    modelContainer.appendChild(renderer.domElement); // Canvas'ı div'e ekle

    // 4. Kontrolleri Ekleme (OrbitControls)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Yumuşak dönüş efekti
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = false; // Kaydırmayı engelle
    controls.minDistance = 2; // Minimum yaklaşma mesafesi
    controls.maxDistance = 25; // Maksimum uzaklaşma mesafesi
    controls.target.set(0, 0, 0); // Dönüş merkezi

    // 5. Işıkları Ekleme
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Ortam ışığı
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Yönlü ışık (güneş gibi)
    directionalLight.position.set(5, 10, 7); // Işığın konumu
    scene.add(directionalLight);

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
    if (loaderOverlay) loaderOverlay.style.display = 'flex'; // Yükleme göstergesini göster

    loader.load(
        path,
        // Model başarıyla yüklendiğinde
        function (gltf) {
            heartModel = gltf.scene;

            // Modelin boyutunu ve konumunu ayarla (modele göre değişir)
            const box = new THREE.Box3().setFromObject(heartModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Modeli ortala ve ölçekle
            heartModel.position.sub(center); // Merkeze taşı
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 4 / maxDim; // Modelin yaklaşık 4 birim büyüklüğünde olmasını sağla
            heartModel.scale.set(scale, scale, scale);

            scene.add(heartModel);

            // Model yüklendikten sonra etiketleri oluştur
            createLabels();
            if (loaderOverlay) loaderOverlay.style.display = 'none'; // Yükleme göstergesini gizle
        },
        // Yükleme ilerlemesi (isteğe bağlı)
        function (xhr) {
            if (loaderOverlay) {
                const percentLoaded = (xhr.loaded / xhr.total * 100).toFixed(0);
                loaderOverlay.textContent = `Yükleniyor... ${percentLoaded}%`;
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
    // ÖNEMLİ: Bu pozisyonlar sizin kullandığınız `heart_model.glb` modeline
    // göre ayarlanmalıdır. Modeldeki belirli parçaların pozisyonlarını
    // alarak veya deneme yanılma ile bulabilirsiniz.
    const labelData = [
        { text: "Aort", position: new THREE.Vector3(0, 2.5, 0) },
        { text: "Pulmoner Arter", position: new THREE.Vector3(0.8, 2, 0.5) },
        { text: "Sol Ventrikül", position: new THREE.Vector3(-1, -1, 0.5) },
        { text: "Sağ Ventrikül", position: new THREE.Vector3(1, -1, 0.5) },
        { text: "Sol Atriyum", position: new THREE.Vector3(-1, 1, 0) },
        { text: "Sağ Atriyum", position: new THREE.Vector3(1, 1, 0) },
        { text: "Vena Cava", position: new THREE.Vector3(1.2, 2.0, 0.2) }
        // ... diğer etiketler eklenebilir
    ];

    // Önceki etiketleri temizle (varsa)
    labels.forEach(label => scene.remove(label));
    labels = [];

    labelData.forEach(data => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = 20; // Yazı tipi boyutu
        context.font = `Bold ${fontSize}px Arial`;
        const textMetrics = context.measureText(data.text);
        const textWidth = textMetrics.width;

        // Canvas boyutunu metne göre ayarla (kenar boşluklu)
        canvas.width = textWidth + 10;
        canvas.height = fontSize + 10;

        // Arka plan
        context.fillStyle = "rgba(0, 0, 0, 0.6)";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Metin
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
            depthTest: false, // Etiketler modelin arkasında kalsa bile görünsün
            sizeAttenuation: false // Boyut mesafeyle değişmesin
        });
        const sprite = new THREE.Sprite(spriteMaterial);

        // --- SABİT ÖLÇEKLEME ---
        // Bu değerleri (0.1, 0.05) deneyerek etiket boyutunu ayarlayın.
        // Daha küçük yapmak için: 0.05, 0.025 gibi
        // Biraz daha büyük yapmak için: 0.15, 0.075 gibi değerler deneyin.
        sprite.scale.set(0.1, 0.05, 1); // SABİT DEĞERLERİ AYARLAYIN

        // Etiketin pozisyonunu ayarla
        sprite.position.copy(data.position);

        sprite.visible = labelsVisible; // Başlangıç görünürlüğü
        scene.add(sprite);
        labels.push(sprite); // Etiketleri listeye ekle
    });
}


// --- Animasyon Döngüsü ---
function animate() {
    requestAnimationFrame(animate); // Tarayıcıdan bir sonraki frame'i iste

    controls.update(); // Damping etkinse kontrolleri güncelle

    renderer.render(scene, camera); // Sahneyi render et
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
    // --- Tab Değiştirme ---
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            // Aktif sınıfları yönet
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            // Seçileni aktif yap
            button.classList.add('active');
            const targetTab = document.getElementById(tabId);
            if (targetTab) targetTab.classList.add('active');
        });
    });

    // --- Cevap Gösterme/Gizleme ---
    // Global fonksiyona erişim için window'a ekleyelim (HTML'deki onclick'ler için)
    window.toggleAnswer = function(button) {
        const answer = button.nextElementSibling;
        if (!answer) return; // Güvenlik kontrolü
        if (answer.style.display === 'block') {
            answer.style.display = 'none';
            button.textContent = 'Cevabı Göster';
        } else {
            answer.style.display = 'block';
            button.textContent = 'Cevabı Gizle';
        }
    }

    // --- Model Kontrol Butonları ---
    document.getElementById('btn-show-all')?.addEventListener('click', () => {
        if (heartModel) heartModel.visible = true;
        // İleride: Eğer modelde ayrı parçalar varsa, burada hepsini görünür yapabilirsiniz.
    });

    document.getElementById('btn-isolate-heart')?.addEventListener('click', () => {
        if (heartModel) {
            heartModel.visible = true; // Ana modeli göster
             // İleride: Model parçalarına göre damarları vs. gizleyebilirsiniz.
             // Örneğin:
             // heartModel.traverse((child) => {
             //    if (child.isMesh && child.name.toLowerCase().includes('artery')) {
             //       child.visible = false;
             //    } else if (child.isMesh) {
             //       child.visible = true;
             //    }
             // });
        }
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
        heartbeatAudio.loop = true; // <<< SESİN TEKRAR ETMESİ İÇİN true
        heartbeatAudio.preload = 'auto';

        const onCanPlay = () => {
             console.log("Ses dosyası çalmaya hazır.");
             if (audioButton) audioButton.disabled = false;
             // Event listener'ı kaldır ki tekrar tekrar tetiklenmesin
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

        // Butonu başlangıçta devre dışı bırak
        if (audioButton) audioButton.disabled = true;

        // Tarayıcılar bazen 'canplaythrough' eventini atmayabilir,
        // bu yüzden bir süre sonra hala yüklenmediyse butonu yine de etkinleştirmeyi deneyebiliriz.
        // Ancak bu ideal değildir. Şimdilik sadece event'e güvenelim.


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
    if (heartbeatAudio && heartbeatAudio.readyState >= 2) { // Yüklendi mi kontrolü
        if (heartbeatAudio.paused) {
            heartbeatAudio.play().catch(e => console.error("Ses çalma hatası:", e));
            // Belki buton metnini değiştirebilirsin:
            // document.getElementById('btn-play-heartbeat').textContent = 'Sesi Durdur';
        } else {
            heartbeatAudio.pause();
            // İsteğe bağlı: Sesi başa sarmak için
            // heartbeatAudio.currentTime = 0;
            // Belki buton metnini değiştirebilirsin:
            // document.getElementById('btn-play-heartbeat').textContent = 'Kalp Atışını Oynat';
        }
    } else {
        console.warn("Ses dosyası henüz hazır değil veya yüklenemedi.");
    }
}


// --- Başlatma ---
// DOM tamamen yüklendiğinde init fonksiyonunu çağır
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init(); // Zaten yüklendiyse doğrudan çağır
}
