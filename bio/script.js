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
    // İsteğe bağlı: Gölge ekleme
    // directionalLight.castShadow = true;
    // renderer.shadowMap.enabled = true;

    // 6. Modeli Yükleme
    loadGLBModel(modelPath);

    // 7. UI Olaylarını Ayarlama
    setupUIEventListeners();

    // 8. Ses Dosyasını Yükleme
    loadAudio(audioPath);

    // 9. Pencere Boyutlandırma Olayı
    window.addEventListener('resize', onWindowResize, false);

    // 10. Animasyon Döngüsünü Başlatma
    animate();
}

// --- Model Yükleme Fonksiyonu ---
function loadGLBModel(path) {
    const loader = new THREE.GLTFLoader();
    loaderOverlay.style.display = 'flex'; // Yükleme göstergesini göster

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

             // İsteğe Bağlı: Modeldeki parçaları gez (daha sonra kontrol için)
            /*
            heartModel.traverse((child) => {
                if (child.isMesh) {
                    console.log("Model Parçası:", child.name); // Parça isimlerini gör
                    // child.castShadow = true;
                    // child.receiveShadow = true;
                }
            });
            */

            // Model yüklendikten sonra etiketleri oluştur
            createLabels();
            loaderOverlay.style.display = 'none'; // Yükleme göstergesini gizle
        },
        // Yükleme ilerlemesi (isteğe bağlı)
        function (xhr) {
            const percentLoaded = (xhr.loaded / xhr.total * 100).toFixed(0);
            loaderOverlay.textContent = `Yükleniyor... ${percentLoaded}%`;
            // console.log((xhr.loaded / xhr.total * 100) + '% yüklendi');
        },
        // Hata durumunda
        function (error) {
            console.error('Model yüklenirken hata oluştu:', error);
             loaderOverlay.textContent = 'Model Yüklenemedi!';
             loaderOverlay.style.color = 'red';
        }
    );
}

// --- Etiket Oluşturma Fonksiyonu (Sprite Kullanarak) ---
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
        // ... diğer etiketler
    ];

    // Önceki etiketleri temizle (varsa)
    labels.forEach(label => scene.remove(label));
    labels = [];

    const fontLoader = new THREE.FontLoader();
    // Bir font dosyası yüklemeniz veya CDN kullanmanız gerekebilir.
    // Şimdilik basit canvas text kullanacağız.

    labelData.forEach(data => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const fontSize = 20;
        context.font = `Bold ${fontSize}px Arial`;
        const textWidth = context.measureText(data.text).width;

        canvas.width = textWidth + 10; // Biraz pay
        canvas.height = fontSize + 10; // Biraz pay

        // Arka plan
        context.fillStyle = "rgba(0, 0, 0, 0.6)"; // Yarı saydam siyah arka plan
        context.fillRect(0, 0, canvas.width, canvas.height);


        // Metin
        context.font = `Bold ${fontSize}px Arial`;
        context.fillStyle = "white"; // Beyaz yazı
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(data.text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false, // Etiketlerin diğer nesnelerin arkasında kalmamasını sağlar (isteğe bağlı)
            sizeAttenuation: false // Etiket boyutunun mesafeyle değişmemesini sağlar
        });
        const sprite = new THREE.Sprite(spriteMaterial);

        // --- DÜZELTME BURADA ---
        // Sprite boyutunu ayarlamak için daha küçük bir ölçek faktörü kullanın.
        // Bu değeri (0.008) deneyerek ayarlamanız gerekebilir.
        // Biraz daha küçültmek için 0.006, büyütmek için 0.01 gibi değerler deneyin.
        const labelScaleFactor = 0.008;
        sprite.scale.set(canvas.width * labelScaleFactor, canvas.height * labelScaleFactor, 1);

        // Pozisyonu ayarla (modele göre)
        sprite.position.copy(data.position);

        sprite.visible = labelsVisible; // Başlangıç görünürlüğü
        scene.add(sprite);
        labels.push(sprite);

        sprite.visible = labelsVisible; // Başlangıç görünürlüğü
        scene.add(sprite);
        labels.push(sprite);
    });
}


// --- Animasyon Döngüsü ---
function animate() {
    requestAnimationFrame(animate); // Tarayıcıdan bir sonraki frame'i iste

    controls.update(); // Damping etkinse kontrolleri güncelle

    // Etiketlerin kameraya bakmasını sağla (Sprite'lar zaten yapar ama 3D Text için gerekebilir)
    // labels.forEach(label => label.lookAt(camera.position));

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
            document.getElementById(tabId).classList.add('active');
        });
    });

    // --- Cevap Gösterme/Gizleme ---
    // Global fonksiyona erişim için window'a ekleyelim (HTML'deki onclick'ler için)
    window.toggleAnswer = function(button) {
        const answer = button.nextElementSibling;
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
        // Eğer modelde ayrı parçalar varsa, burada hepsini görünür yap
    });

    document.getElementById('btn-isolate-heart')?.addEventListener('click', () => {
        if (heartModel) {
            heartModel.visible = true; // Ana modeli göster
            // Eğer modelde damarlar ayrıysa, onları burada gizle:
            // heartModel.traverse((child) => {
            //     if (child.name.includes("Vessel") || child.name.includes("Artery")) {
            //         child.visible = false;
            //     } else {
            //          child.visible = true;
            //      }
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

// --- Ses Yükleme ---
function loadAudio(path) {
    try {
        heartbeatAudio = new Audio(path);
        heartbeatAudio.loop = true; // Tekrar etsin
        heartbeatAudio.preload = 'auto'; // Tarayıcı uygun gördüğünde yüklesin

        // Sesin çalmaya hazır olup olmadığını kontrol etmek için (isteğe bağlı)
        heartbeatAudio.addEventListener('canplaythrough', () => {
             console.log("Ses dosyası çalmaya hazır.");
             document.getElementById('btn-play-heartbeat').disabled = false; // Butonu etkinleştir
        }, false);

         heartbeatAudio.addEventListener('error', (e) => {
            console.error("Ses dosyası yüklenemedi veya hata oluştu:", e);
            document.getElementById('btn-play-heartbeat').disabled = true;
            document.getElementById('btn-play-heartbeat').textContent = 'Ses Hatası';
        });

        // Başlangıçta butonu devre dışı bırak, yüklenince etkinleşsin
        document.getElementById('btn-play-heartbeat').disabled = true;


    } catch (e) {
        console.error("Audio nesnesi oluşturulamadı:", e);
         document.getElementById('btn-play-heartbeat').disabled = true;
         document.getElementById('btn-play-heartbeat').textContent = 'Ses Hatası';
    }
}


// --- Kalp Atışı Sesini Oynatma/Durdurma ---
function playHeartbeat() {
    if (heartbeatAudio && heartbeatAudio.readyState >= 2) { // Yüklendi mi kontrolü (2: HAVE_CURRENT_DATA)
        if (heartbeatAudio.paused) {
            heartbeatAudio.play().catch(e => console.error("Ses çalma hatası:", e));
            // Buton metni değişebilir: button.textContent = 'Durdur';
        } else {
            heartbeatAudio.pause();
            heartbeatAudio.currentTime = 0; // Başa sar
             // Buton metni değişebilir: button.textContent = 'Oynat';
        }
    } else {
        console.warn("Ses dosyası henüz hazır değil veya yüklenemedi.");
        // Kullanıcıya bilgi verilebilir.
    }
}


// --- Başlatma ---
// DOM tamamen yüklendiğinde init fonksiyonunu çağır
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
