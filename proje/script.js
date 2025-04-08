// --- START OF FILE script.js ---

// --- Global Three.js Değişkenleri ---
let scene, camera, renderer, controls;
let modelContainer; // Modeli içeren div
let heartModel; // Yüklenen ana 3D model
let labels = []; // Model üzerindeki etiketler (Sprite'lar)
let labelsVisible = true; // Etiketlerin görünürlük durumu
let initialCameraPosition = new THREE.Vector3(0, 1, 7); // Kameranın başlangıç pozisyonu

// --- Diğer Global Değişkenler ---
let heartbeatAudio;
const modelPath = 'models/heart_model.glb'; // Model dosyasının yolu (varsa)
const audioPath = 'audio/heartbeat.mp3'; // Ses dosyasının yolu (varsa)
const loaderOverlay = document.getElementById('loader-overlay'); // Yükleme göstergesi

// --- AYT Online Test Global Değişkenleri ---
let currentQuestionIndex = 0;
let userAnswers = []; // Kullanıcının cevaplarını saklayacak dizi
let totalQuestions = 0; // Toplam soru sayısı

// HTML Element Referansları (init içinde doldurulacak)
let aytStartScreen, aytTestContainer, aytProgress, aytQuestionText, aytOptionsArea;
let aytNavigation, btnPrevQuestion, btnNextQuestion, btnFinishTest;
let aytResultsSummary, aytFinalScore, aytResultsDetails, btnRestartTest, btnStartTest;


// --- AYT Soruları Verisi (AYT.txt'den Alındı ve Açıklamalar Eklendi) ---
const aytQuestionsData = [
    {
        question: "İnsan kalbinde bulunan kapakçıklar ile ilgili,<br>I. Tricuspid kapakçık sağ atriyum ile sağ ventrikül arasındadır.<br>II. Bicuspid kapakçık sol atriyum ile sol ventrikül arasındadır.<br>III. Semilunar kapakçıklar kalp ile büyük damarlar arasında bulunur.<br>yargılarından hangileri doğrudur?",
        options: ["Yalnız I", "Yalnız II", "I ve II", "II ve III", "I, II ve III"],
        correctOptionIndex: 4, // E şıkkı (0'dan başlar)
        answerLetter: "E",
        explanation: "Tricuspid (üçlü kapakçık) sağ kulakçık ile sağ karıncık arasında, Bicuspid (ikili kapakçık/Mitral) sol kulakçık ile sol karıncık arasında bulunur. Semilunar (yarım ay) kapakçıklar ise karıncıklar ile ana atardamarlar (Aort ve Pulmoner Arter) arasında bulunur. Dolayısıyla hepsi doğrudur."
    },
    {
        question: "Aşağıdakilerden hangisi büyük kan dolaşımında yer almaz?",
        options: ["Aort", "Pulmoner arter", "Üst ana toplardamar", "Sol ventrikül", "Karaciğer toplardamarı"],
        correctOptionIndex: 1, // B şıkkı
        answerLetter: "B",
        explanation: "Pulmoner arter, kanı sağ ventrikülden akciğerlere taşıyan küçük kan dolaşımının bir parçasıdır. Diğer seçenekler büyük kan dolaşımında görev alır."
    },
    {
        question: "Aşağıdakilerden hangisi kalp kasının özelliklerinden değildir?",
        options: ["İstemli çalışma", "Hızlı kasılma", "Yorulmazlık", "Otonom sinir sisteminden etkilenme", "Kendiliğinden kasılma"],
        correctOptionIndex: 0, // A şıkkı
        answerLetter: "A",
        explanation: "Kalp kası (miyokard) istemsiz çalışır. Otonom sinir sistemi tarafından hızı düzenlenebilir ancak çalışması isteğe bağlı değildir. Diğer özellikler kalp kasına aittir."
    },
    {
        question: "Aşağıdaki kan hücrelerinden hangisi bağışıklık sisteminde görev alır?",
        options: ["Eritrositler", "Trombositler", "Lenfositler", "Megakaryositler", "Retikülosit"],
        correctOptionIndex: 2, // C şıkkı
        answerLetter: "C",
        explanation: "Lenfositler, akyuvar (lökosit) çeşitlerinden biridir ve bağışıklık sisteminin temel hücrelerindendir. Eritrositler oksijen taşır, trombositler pıhtılaşmada görev alır."
    },
    {
        question: "Aşağıdakilerden hangisi kalbin dış zarıdır?",
        options: ["Endokard", "Myokard", "Epikard", "Perikard", "Periost"],
        correctOptionIndex: 3, // D şıkkı
        answerLetter: "D",
        explanation: "Perikard, kalbi çevreleyen çift katlı dış zardır. Endokard en iç tabaka, miyokard kas tabakasıdır. Epikard, perikardın iç yaprağıdır ve bazen dış tabaka olarak da kabul edilir ancak Perikard daha kapsayıcıdır. Periost kemik zarıdır."
    },
    {
        question: "Erişkin bir insanda, kanın oksijen bakımından en zengin olduğu damar aşağıdakilerden hangisidir?",
        options: ["Aort", "Pulmoner ven", "Pulmoner arter", "Üst ana toplardamar", "Akciğer toplardamarı"],
        // Not: Pulmoner ven = Akciğer toplardamarı. İki seçenek aynı şeyi ifade ediyor.
        // AYT.txt'de Cevap B (Pulmoner ven), şıklarda E de aynı damar. B'yi (index 1) işaretliyoruz.
        correctOptionIndex: 1, // B şıkkı
        answerLetter: "B",
        explanation: "Akciğerlerde temizlenen (oksijence zenginleşen) kan, Pulmoner venler (Akciğer toplardamarları) aracılığıyla kalbin sol kulakçığına döner. Bu nedenle oksijen oranı en yüksek olan damar Pulmoner ven'dir. Aort da temiz kan taşır ancak vücuda dağıldıkça oksijen oranı azalır. Seçeneklerde 'Pulmoner ven' ve 'Akciğer toplardamarı' aynı yapıyı ifade eder."
    },
     {
        question: "Aşağıdakilerden hangisi kalbin ürettiği seslerden biri değildir?",
        options: ["Lubb sesi", "Dupp sesi", "Birinci kalp sesi", "İkinci kalp sesi", "Üçüncü kalp sesi"],
        correctOptionIndex: 4, // E şıkkı
        answerLetter: "E",
        explanation: "Sağlıklı bir yetişkin kalbinde normalde iki temel ses duyulur: S1 (Lubb - AV kapakların kapanması) ve S2 (Dupp - Semilunar kapakların kapanması). Üçüncü ve dördüncü kalp sesleri bazı durumlarda (çocuklarda, atletlerde veya patolojik durumlarda) duyulabilir ancak temel seslerden değildir."
    },
    {
        question: "Aşağıdakilerden hangisi kan basıncını artıran etmenlerden biri değildir?",
        options: ["Adrenalin salgısının artması", "Periferik direncin artması", "Kalp atım hızının artması", "Atardamar elastikiyetinin artması", "Kan viskozitesinin artması"],
        correctOptionIndex: 3, // D şıkkı
        answerLetter: "D",
        explanation: "Atardamarların elastikiyetinin *artması*, damarların basınç değişimlerine daha iyi uyum sağlamasına ve basıncı *düşürmeye* yardımcı olur. Elastikiyetin *azalması* (damar sertliği) kan basıncını artırır. Diğer seçenekler kan basıncını artırır."
    },
    {
        question: "Aşağıdakilerden hangisi trombositler tarafından üretilen ve pıhtılaşmada rol oynayan bir maddedir?",
        options: ["Hemoglobin", "Trombopoietin", "Tromboksan", "Fibrinojen", "Serum"],
        correctOptionIndex: 2, // C şıkkı
        answerLetter: "C",
        explanation: "Tromboksan A2, trombositler tarafından üretilir ve trombositlerin kümelenmesini (agregasyon) ve damar büzülmesini sağlayarak pıhtılaşmaya katkıda bulunur. Fibrinojen plazma proteinidir, pıhtılaşma sırasında fibrine dönüşür."
    },
    {
        question: "Aşağıdakilerden hangisi kan pıhtılaşmasını önleyen bir maddedir?",
        options: ["Trombin", "Fibrin", "Heparin", "Fibrinojen", "Tromboplastin"],
        correctOptionIndex: 2, // C şıkkı
        answerLetter: "C",
        explanation: "Heparin, doğal bir antikoagülandır (pıhtılaşma önleyici). Özellikle bazofiller ve mast hücreleri tarafından üretilir ve trombin oluşumunu engelleyerek pıhtılaşmayı önler. Tıbbi olarak da kullanılır."
    },
    {
        question: "Lenf sistemi ile ilgili aşağıdaki ifadelerden hangisi yanlıştır?",
        options: ["Lenf sıvısı tek yönlü hareket eder", "Lenf damarlarında kapakçıklar bulunur", "Lenf sistemi dolaşım sistemine yardımcıdır", "Lenf sıvısı, arter ve venler arasında dolaşır", "Lenf sıvısı, doku sıvısının toplanmasıyla oluşur"],
        correctOptionIndex: 3, // D şıkkı
        answerLetter: "D",
        explanation: "Lenf sıvısı, doku aralıklarından toplanır ve lenf damarları aracılığıyla tek yönlü olarak toplardamar sistemine (kan dolaşımına) doğru akar. Arter ve venler arasında doğrudan dolaşmaz."
    },
    {
        question: "Aşağıdakilerden hangisi A kan grubuna sahip bir kişinin kanında bulunmaz?",
        options: ["Anti-B antikoru", "A antijeni", "Anti-A antikoru", "Rh antijeni", "Albumin"],
        correctOptionIndex: 2, // C şıkkı
        answerLetter: "C",
        explanation: "A kan grubuna sahip bir kişinin alyuvarlarında A antijeni, plazmasında ise Anti-B antikoru bulunur. Kendi antijenine karşı antikor (Anti-A) bulunmaz, aksi takdirde kendi kan hücreleri çökelirdi. Rh antijeni Rh faktörüne bağlıdır, Albumin ise bir plazma proteinidir."
    },
    {
        question: "Kalbin çalışmasını hızlandıran sinir aşağıdakilerden hangisidir?",
        options: ["Vagus siniri", "Trigeminal sinir", "Sempatik sinirler", "Parasempatik sinirler", "Motor sinirler"],
        correctOptionIndex: 2, // C şıkkı
        answerLetter: "C",
        explanation: "Sempatik sinir sistemi, 'savaş ya da kaç' tepkisini yönetir ve kalp atış hızını, kasılma gücünü artırır. Parasempatik sinirler (özellikle Vagus siniri) ise kalbi yavaşlatır."
    },
    {
        question: "Aşağıdakilerden hangisi kalbin yapısında yer almaz?",
        options: ["Sağ atriyum", "Sağ ventrikül", "Sol atriyum", "Sol ventrikül", "Medulla oblongata"],
        correctOptionIndex: 4, // E şıkkı
        answerLetter: "E",
        explanation: "Medulla oblongata (omurilik soğanı), beyin sapının bir parçasıdır ve solunum, kalp atışı gibi yaşamsal fonksiyonları düzenleyen merkezleri içerir, ancak kalbin fiziksel bir parçası değildir."
    },
    {
        question: "Aşağıdakilerden hangisi kırmızı kemik iliğinde üretilmez?",
        options: ["Eritrosit", "Lökosit", "Trombosit", "İnsülin", "Monosit"],
        correctOptionIndex: 3, // D şıkkı
        answerLetter: "D",
        explanation: "Kırmızı kemik iliği, kan hücrelerinin (eritrositler, lökositler, trombositler) üretildiği yerdir (hematopoez). İnsülin, pankreas tarafından üretilen bir hormondur."
    },
    {
        question: "Bir kan örneğinde aşağıdakilerden hangisi bulunmaz?",
        options: ["Lenfosit", "Nöron", "Trombosit", "Eritrosit", "Nötrofil"],
        correctOptionIndex: 1, // B şıkkı
        answerLetter: "B",
        explanation: "Nöronlar sinir hücreleridir ve sinir sistemine aittirler, kanda dolaşmazlar. Diğer seçenekler kanda bulunan hücreler veya hücre parçacıklarıdır."
    },
    {
        question: "Aşağıdakilerden hangisi arterler ile ilgili doğru bir bilgi değildir?",
        options: ["Kalpten uzaklaştıkça çapları daralır", "Duvarları kalındır", "Kanı vücuttan kalbe taşırlar", "Genellikle oksijence zengin kan taşırlar", "Elastik yapıdadırlar"],
        correctOptionIndex: 2, // C şıkkı
        answerLetter: "C",
        explanation: "Arterler (atardamarlar) kanı kalpten vücuda taşırlar. Kanı vücuttan kalbe taşıyan damarlar venlerdir (toplardamarlar)."
    },
    {
        question: "Sinoatrial (SA) düğümünün işlevi aşağıdakilerden hangisidir?",
        options: ["Kalp atımını yavaşlatmak", "Kalp atımını başlatmak", "Karıncıklar arası iletimi sağlamak", "Kan basıncını düzenlemek", "Kan akışını yönlendirmek"],
        correctOptionIndex: 1, // B şıkkı
        answerLetter: "B",
        explanation: "SA düğümü, kalbin doğal 'pacemaker'ıdır (pil). Elektriksel uyarıları üreterek kalp atımını başlatan ve ritmini belirleyen yapıdır."
    },
    {
        question: "Aşağıdakilerden hangisi kandaki akyuvar çeşitlerinden biri değildir?",
        options: ["Nötrofil", "Bazofil", "Eozinofil", "Trombosit", "Monosit"],
        correctOptionIndex: 3, // D şıkkı
        answerLetter: "D",
        explanation: "Trombositler (kan pulcukları), pıhtılaşmada görev alan hücre parçacıklarıdır, akyuvar (lökosit) değillerdir. Diğer seçenekler akyuvar çeşitleridir."
    },
    {
        question: "Aşağıdakilerden hangisi kanın sıvı kısmı olan plazmanın bir bileşeni değildir?",
        options: ["Su", "Albumin", "Fibrinojen", "Hemoglobin", "Hormonlar"],
        correctOptionIndex: 3, // D şıkkı
        answerLetter: "D",
        explanation: "Hemoglobin, alyuvarların içinde bulunan ve oksijen taşıyan proteindir. Plazmada serbest halde bulunmaz. Diğer seçenekler plazmanın temel bileşenleridir."
    },
    {
        question: "Aşağıdakilerden hangisi eritrositlerin yapısında bulunan ve oksijen taşınmasından sorumlu olan moleküldür?",
        options: ["Albumin", "Hemoglobin", "Keratin", "Melanin", "Miyoglobin"],
        correctOptionIndex: 1, // B şıkkı
        answerLetter: "B",
        explanation: "Hemoglobin, alyuvarlarda bulunan demir içeren bir proteindir ve akciğerlerden aldığı oksijeni dokulara taşır."
    },
    {
        question: "Aşağıdaki kan damarlarından hangisinde kanın akış hızı en yüksektir?",
        options: ["Aort", "Arteriroller", "Kapillerler", "Venüller", "Vena cava"],
        correctOptionIndex: 0, // A şıkkı
        answerLetter: "A",
        explanation: "Kan akış hızı, toplam damar kesit alanıyla ters orantılıdır. Kalpten çıkan ana atardamar olan Aort'un kesit alanı göreceli olarak küçük olduğu için kan akış hızı en yüksektir. Kapillerlerde toplam kesit alanı çok büyük olduğundan akış hızı en düşüktür."
    },
    {
        question: "Aşağıdakilerden hangisi kalbin elektriksel uyarılma sisteminin bir parçası değildir?",
        options: ["Sinoatrial düğüm", "Atriyoventriküler düğüm", "His demetleri", "Purkinje lifleri", "Endokardiyum"],
        correctOptionIndex: 4, // E şıkkı
        answerLetter: "E",
        explanation: "Endokardiyum, kalbin en iç tabakasıdır ve kalbin odacıklarını döşer. Elektriksel iletim sisteminin bir parçası değildir. Diğer seçenekler kalbin uyarı ve ileti sisteminin elemanlarıdır."
    },
    {
        question: "Bir bireyde AB Rh(-) kan grubu görülmesi aşağıdakilerden hangisini ifade eder?",
        options: ["Kanında A ve B antijenleri ile anti-D antikoru vardır", "Kanında sadece A antijeni vardır", "Kanında A ve B antijenleri vardır, Rh antijeni yoktur", "Kanında anti-A ve anti-B antikorları vardır", "Kanında hiçbir antijen yoktur"],
        correctOptionIndex: 2, // C şıkkı
        answerLetter: "C",
        explanation: "AB kan grubu, alyuvarlarda hem A hem de B antijeninin bulunduğu anlamına gelir. Rh(-), Rh(D) antijeninin bulunmadığı anlamına gelir. Bu gruptaki bireylerin plazmasında doğal olarak Anti-A veya Anti-B antikoru bulunmaz. Anti-D antikoru ise ancak Rh(+) kanla temas sonrası oluşabilir."
    },
    {
        question: "Elektrokardiyogramda (EKG) P dalgası neyi gösterir?",
        options: ["Karıncıkların uyarılmasını", "Karıncıkların gevşemesini", "Kulakçıkların uyarılmasını", "Kulakçıkların gevşemesini", "Kalbin durmasını"],
        correctOptionIndex: 2, // C şıkkı
        answerLetter: "C",
        explanation: "EKG'deki P dalgası, SA düğümünden çıkan uyarının kulakçıklara (atriyumlara) yayılması ve kulakçıkların depolarizasyonu (elektriksel olarak uyarılması ve kasılmaya hazırlanması) sonucu oluşur."
    }
];


// --- Ana Başlatma Fonksiyonu ---
function init() {
    modelContainer = document.getElementById('model-container');
    // Model container var mı kontrol et
    if (!modelContainer) {
        console.error("Model container bulunamadı! ('model-container')");
        // Eğer model container yoksa Three.js ile ilgili işlemleri yapma
    } else {
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
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 8, 10);
        directionalLight.target.position.set(0, 0, 0);
        scene.add(directionalLight);
        scene.add(directionalLight.target);
        const directionalLight2 = new THREE.DirectionalLight(0xaaaaaa, 0.8);
        directionalLight2.position.set(-5, -3, -5);
        directionalLight2.target.position.set(0, 0, 0);
        scene.add(directionalLight2);
        scene.add(directionalLight2.target);

        // 6. Modeli Yükleme (Eğer modelPath tanımlıysa)
        if (typeof modelPath !== 'undefined' && modelPath) {
             loadGLBModel(modelPath);
        } else {
            console.warn("Model yolu (modelPath) tanımlanmamış veya boş.");
             if (loaderOverlay) loaderOverlay.style.display = 'none'; // Model yoksa yükleyiciyi gizle
        }


        // 8. Ses Dosyasını Yükleme (Eğer audioPath tanımlıysa)
         if (typeof audioPath !== 'undefined' && audioPath) {
            loadAudio(audioPath);
         } else {
             console.warn("Ses yolu (audioPath) tanımlanmamış veya boş.");
             const audioButton = document.getElementById('btn-play-heartbeat');
             if(audioButton) {
                 audioButton.disabled = true; // Ses yoksa butonu devre dışı bırak
                 audioButton.textContent = 'Ses Yok'; // Buton metnini güncelle
             }
         }


        // 9. Pencere Boyutlandırma Olayı
        window.addEventListener('resize', onWindowResize, false);

        // 10. Animasyon Döngüsünü Başlatma
        animate();
    } // modelContainer kontrolünün sonu


    // YENİ: AYT Test elementlerini bul ve doğrula
    if (!initializeAYTElements()) {
         // Eğer elementler yüklenemezse veya veri yoksa, UI listener'ları kurmanın anlamı yok.
         console.error("AYT Test başlatılamadı. UI listener'lar kurulmayacak.");
         // Gerekirse kullanıcıya bir mesaj gösterilebilir.
         return; // init'ten çık
    }

    // 7. UI Olaylarını Ayarlama (Three.js'ten bağımsız çalışabilir)
    setupUIEventListeners(); // Elementler bulunduktan SONRA çağır

    // 11. AYT Sorularını Oluştur -> ARTIK GEREKLİ DEĞİL, KALDIRILDI
    // generateAYTQuestions(); // BU SATIR SİLİNDİ
}


// --- Model Yükleme Fonksiyonu ---
function loadGLBModel(path) {
    // GLTFLoader tanımlı mı kontrol et
    if (typeof THREE.GLTFLoader === 'undefined') {
         console.error("GLTFLoader kütüphanesi yüklenmemiş!");
         if (loaderOverlay) {
            loaderOverlay.textContent = 'Gerekli Kütüphane Eksik!';
            loaderOverlay.style.color = 'red';
         }
         return;
    }

    const loader = new THREE.GLTFLoader();
    if (loaderOverlay) loaderOverlay.style.display = 'flex';

    loader.load(
        path,
        // Başarıyla yüklendiğinde
        function (gltf) {
            heartModel = gltf.scene;

            // Modeli ortala ve boyutlandır (isteğe bağlı)
            try {
                const box = new THREE.Box3().setFromObject(heartModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                heartModel.position.sub(center);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 4 / maxDim; // İstenilen boyuta göre ölçekle
                heartModel.scale.set(scale, scale, scale);
            } catch (e) {
                console.warn("Model boyutlandırma/ortalama sırasında hata:", e);
                // Boyutlandırmadan devam et
            }


            scene.add(heartModel);
            createLabels(); // Etiketleri model yüklendikten sonra oluştur
            if (loaderOverlay) loaderOverlay.style.display = 'none';
            console.log("Model başarıyla yüklendi.");
        },
        // Yükleme ilerlemesi
        function (xhr) {
            if (loaderOverlay) {
                if (xhr.lengthComputable && xhr.total > 0) {
                    const percentLoaded = (xhr.loaded / xhr.total * 100).toFixed(0);
                    loaderOverlay.textContent = `Model Yükleniyor... ${percentLoaded}%`;
                } else {
                    const loadedMB = (xhr.loaded / 1024 / 1024).toFixed(2);
                    loaderOverlay.textContent = `Model Yükleniyor... (${loadedMB} MB)`;
                }
            }
        },
        // Hata durumunda
        function (error) {
            console.error('Model yüklenirken hata oluştu:', error);
             if (loaderOverlay) {
                loaderOverlay.textContent = 'Model Yüklenemedi!';
                loaderOverlay.style.color = 'red';
                // Hata sonrası overlay'i gizlememek daha iyi olabilir
             }
        }
    );
}

// --- Etiket Oluşturma Fonksiyonu ---
function createLabels() {
    // Gerekli: scene tanımlı olmalı
    if (typeof scene === 'undefined') return;

    // Örnek etiket verileri (Kendi modelinize göre ayarlayın)
    const labelData = [
        { text: "Aort",           position: new THREE.Vector3( 0.0,  2.3, -0.5) }, // Pozisyonlar modele göre ayarlanmalı
        { text: "Pulmoner Arter", position: new THREE.Vector3( 0.8,  2.0, -0.6) },
        { text: "Vena Cava",      position: new THREE.Vector3( 1.2,  1.8,  0.0) },
        { text: "Sağ Atriyum",    position: new THREE.Vector3( 1.5,  0.5,  0.5) },
        { text: "Sol Atriyum",    position: new THREE.Vector3(-1.5,  0.5,  0.3) },
        { text: "Sağ Ventrikül",  position: new THREE.Vector3( 1.0, -1.5,  0.8) },
        { text: "Sol Ventrikül",  position: new THREE.Vector3(-1.0, -1.5,  0.8) }
    ];

    // Önceki etiketleri temizle
    labels.forEach(label => {
        if (label && label.parent) {
            label.parent.remove(label);
        }
         // Bellekten de temizle (isteğe bağlı ama iyi pratik)
        if (label.material && label.material.map) label.material.map.dispose();
        if (label.material) label.material.dispose();
        if (label.geometry) label.geometry.dispose();
    });
    labels = []; // Diziyi boşalt

    labelData.forEach(data => {
        try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            const fontSize = 24; // Biraz daha büyük font
            context.font = `Bold ${fontSize}px Arial`;
            const textMetrics = context.measureText(data.text);
            const textWidth = textMetrics.width;

            // Padding ekle
            const padding = 5;
            canvas.width = textWidth + padding * 2;
            canvas.height = fontSize + padding * 2;

            // Arka plan
            context.fillStyle = "rgba(0, 0, 0, 0.7)"; // Biraz daha koyu arka plan
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Yazı
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
                depthTest: false,       // Diğer objelerin arkasında kalsa da görünsün
                sizeAttenuation: false  // Kameraya uzaklığa göre küçülmesin
            });
            const sprite = new THREE.Sprite(spriteMaterial);

            // Etiket boyutunu ayarla (Bu değerleri deneyerek ayarlayın)
            sprite.scale.set(0.08, 0.04, 1); // Sabit boyut

            sprite.position.copy(data.position);
            sprite.visible = labelsVisible;
            scene.add(sprite);
            labels.push(sprite);
        } catch (e) {
             console.error("Etiket oluşturulurken hata:", data.text, e);
        }

    });
    console.log(labels.length + " etiket oluşturuldu.");
}

// --- Animasyon Döngüsü ---
function animate() {
    // Renderer veya camera tanımlı değilse döngüyü durdur
    if (typeof renderer === 'undefined' || typeof camera === 'undefined' || typeof scene === 'undefined') {
        console.log("Animasyon döngüsü durduruldu (gerekli bileşenler eksik).");
        return;
    }
    requestAnimationFrame(animate);
    if (controls) controls.update(); // Damping etkinse gerekli
    renderer.render(scene, camera);
}

// --- Pencere Boyutlandırma İşleyici ---
function onWindowResize() {
    // Gerekli bileşenler yoksa işlem yapma
    if (!modelContainer || !camera || !renderer) return;

    const width = modelContainer.clientWidth;
    const height = modelContainer.clientHeight;

    // Genişlik veya yükseklik 0 ise işlem yapma (hataları önler)
    if (width === 0 || height === 0) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// --- Etiket Görünürlüğünü Değiştirme ---
function toggleLabels() {
    // labels dizisi tanımlı ve eleman içeriyor mu kontrol et
    if (typeof labels === 'undefined' || labels.length === 0) {
         console.warn("Değiştirilecek etiket bulunamadı.");
         return;
    }

    labelsVisible = !labelsVisible;
    labels.forEach(label => {
        if (label) { // Etiketin null olmadığından emin ol
           label.visible = labelsVisible;
        }
    });

    const button = document.getElementById('btn-toggle-labels');
    if (button) button.textContent = labelsVisible ? 'Etiketleri Gizle' : 'Etiketleri Göster';
    console.log("Etiket görünürlüğü değiştirildi:", labelsVisible);
}

// --- Ses Yükleme (Loop aktif) ---
function loadAudio(path) {
    const audioButton = document.getElementById('btn-play-heartbeat');
    try {
        // Mevcut sesi durdur ve temizle (varsa)
        if (heartbeatAudio) {
            heartbeatAudio.pause();
            heartbeatAudio = null;
        }

        heartbeatAudio = new Audio(path);
        heartbeatAudio.loop = true;
        heartbeatAudio.preload = 'auto'; // Tarayıcının karar vermesine izin ver

        // Olay dinleyicilerini ekle
        const onCanPlay = () => {
             if (audioButton && audioButton.textContent !== 'Sesi Durdur') { // Sadece çalmaya hazırsa ve zaten çalmıyorsa etkinleştir
                 audioButton.disabled = false;
                 audioButton.textContent = 'Kalp Atışını Oynat';
             }
             console.log("Ses dosyası çalmaya hazır:", path);
             // Dinleyiciyi kaldır ki tekrar tetiklenmesin (bazen gerekebilir)
             // heartbeatAudio.removeEventListener('canplaythrough', onCanPlay);
        };
        const onError = (e) => {
            console.error("Ses dosyası yüklenemedi veya çalınırken hata oluştu:", path, e);
            if (audioButton) {
                audioButton.disabled = true;
                audioButton.textContent = 'Ses Hatası';
            }
             // Hata durumunda dinleyicileri kaldır
             if(heartbeatAudio){
                heartbeatAudio.removeEventListener('canplaythrough', onCanPlay);
                heartbeatAudio.removeEventListener('error', onError);
             }
        };
        const onStalled = () => {
            console.warn("Ses yüklemesi durdu/yavaşladı:", path);
            if (audioButton) {
                 // audioButton.textContent = 'Ses Yükleniyor...'; // İsteğe bağlı
            }
        };

        heartbeatAudio.addEventListener('canplaythrough', onCanPlay, { once: false });
        heartbeatAudio.addEventListener('error', onError, { once: true });
        heartbeatAudio.addEventListener('stalled', onStalled, { once: true });

        // Başlangıçta butonu devre dışı bırak ve metni ayarla
        if (audioButton) {
            audioButton.disabled = true;
            audioButton.textContent = 'Ses Yükleniyor...';
        }

        // Yüklemeyi başlat (bazı tarayıcılarda gerekli)
        heartbeatAudio.load();

    } catch (e) {
        console.error("Audio nesnesi oluşturulamadı veya yüklenemedi:", e);
         const audioButton = document.getElementById('btn-play-heartbeat');
         if (audioButton) {
             audioButton.disabled = true;
             audioButton.textContent = 'Ses Hatası';
         }
    }
}

// --- Kalp Atışı Sesini Oynatma/Durdurma ---
function playHeartbeat() {
    const audioButton = document.getElementById('btn-play-heartbeat');

    if (!heartbeatAudio) {
        console.warn("Ses nesnesi (heartbeatAudio) mevcut değil.");
        if (audioButton) {
            audioButton.disabled = true;
            audioButton.textContent = 'Ses Yok';
        }
        return;
    }

     // Sesin durumu kontrol ediliyor
    console.log("Ses Durumu - Paused:", heartbeatAudio.paused, "ReadyState:", heartbeatAudio.readyState);


    if (heartbeatAudio.paused) {
        // Ses duraklatılmışsa çalmayı dene
         // readyState kontrolü eklendi (en azından meta veri yüklenmiş olmalı)
        if (heartbeatAudio.readyState >= 1) { // >= 1 (HAVE_METADATA) veya daha iyisi >= 3 (HAVE_FUTURE_DATA)
             heartbeatAudio.play()
                .then(() => {
                    if(audioButton) {
                        audioButton.textContent = 'Sesi Durdur';
                        audioButton.disabled = false; // Başarılı çalma sonrası etkin kalmalı
                    }
                    console.log("Ses çalınıyor.");
                })
                .catch(e => {
                    console.error("Ses çalma hatası (play):", e);
                    // Kullanıcı etkileşimi olmadan otomatik çalma engellenmiş olabilir.
                    if(audioButton) {
                         audioButton.textContent = 'Çalma Başlatılamadı';
                         // Kullanıcı tekrar tıklayabilsin diye disabled = false bırakılabilir.
                         audioButton.disabled = false;
                    }
                });
        } else {
             console.warn("Ses henüz çalmaya hazır değil (readyState < 1). Yükleniyor olabilir.");
             if(audioButton) {
                audioButton.textContent = 'Yükleniyor...';
                audioButton.disabled = true; // Hazır olana kadar devre dışı
             }
             // Yüklenmiyorsa tekrar yüklemeyi tetikle (riskli olabilir, sonsuz döngüye sokabilir)
             // if(!heartbeatAudio.seeking && heartbeatAudio.networkState !== 2) { // NETWORK_LOADING değilse
             //     heartbeatAudio.load();
             // }
        }

    } else {
        // Ses çalıyorsa duraklat
        heartbeatAudio.pause();
        if(audioButton) {
            audioButton.textContent = 'Kalp Atışını Oynat';
            audioButton.disabled = false; // Durdurduktan sonra tekrar oynatılabilir olmalı
        }
        console.log("Ses durduruldu.");
    }
}

// --- AYT Online Test Fonksiyonları ---

function initializeAYTElements() {
    aytStartScreen = document.getElementById('ayt-start-screen');
    aytTestContainer = document.getElementById('ayt-test-container');
    aytProgress = document.getElementById('ayt-progress');
    aytQuestionText = document.getElementById('ayt-question-text');
    aytOptionsArea = document.getElementById('ayt-options-area');
    aytNavigation = document.getElementById('ayt-navigation');
    btnPrevQuestion = document.getElementById('btn-prev-question');
    btnNextQuestion = document.getElementById('btn-next-question');
    btnFinishTest = document.getElementById('btn-finish-test');
    aytResultsSummary = document.getElementById('ayt-results-summary');
    aytFinalScore = document.getElementById('ayt-final-score');
    aytResultsDetails = document.getElementById('ayt-results-details');
    btnRestartTest = document.getElementById('btn-restart-test');
    btnStartTest = document.getElementById('btn-start-test');

    // Elementlerin varlığını temel düzeyde kontrol et
    if (!aytStartScreen || !aytTestContainer || !aytResultsSummary || !btnStartTest) {
        console.error("AYT Test için gerekli temel HTML elementlerinden bazıları bulunamadı!");
        return false; // Başlatma başarısız
    }

    // Veri kontrolü
     if (typeof aytQuestionsData === 'undefined' || !Array.isArray(aytQuestionsData)) {
        console.error("AYT Soru verisi (aytQuestionsData) bulunamadı veya dizi değil!");
        if(aytStartScreen) aytStartScreen.innerHTML = '<p style="color: red;">Test verileri yüklenemedi.</p>';
        return false; // Başlatma başarısız
     }
     totalQuestions = aytQuestionsData.length;
     if (totalQuestions === 0 && aytStartScreen) {
        aytStartScreen.innerHTML = '<p>Gösterilecek soru bulunamadı.</p>';
        if (btnStartTest) btnStartTest.disabled = true; // Soru yoksa başlatma butonu devre dışı
        return false; // Başlatma başarısız
     }
     return true; // Başlatma başarılı
}

function startAYTTest() {
    console.log("AYT Testi Başlatılıyor...");
    currentQuestionIndex = 0;
    userAnswers = new Array(totalQuestions).fill(null); // Cevapları sıfırla

    if (!aytTestContainer || !aytStartScreen || !aytResultsSummary) {
        console.error("Gerekli test elementleri bulunamadı.");
        return;
    }

    aytStartScreen.style.display = 'none';
    aytResultsSummary.style.display = 'none';
    aytTestContainer.style.display = 'block';
    if(aytNavigation) aytNavigation.style.display = 'flex'; // Navigasyon görünür olsun

    displayQuestion(currentQuestionIndex);
}

function displayQuestion(index) {
    if (index < 0 || index >= totalQuestions || !aytQuestionsData[index]) {
        console.error("Geçersiz soru index'i veya soru verisi eksik:", index);
        // Kullanıcıya bir mesaj gösterilebilir veya test sonlandırılabilir
        return;
    }
    const qData = aytQuestionsData[index];

     // Veri doğrulama (her soru için)
    if (!qData || typeof qData.question !== 'string' || !Array.isArray(qData.options)) {
         console.error(`Soru ${index + 1} hatalı formatta, atlanıyor:`, qData);
         // Hatalı soruyu atlayıp bir sonrakine geçmeyi deneyebiliriz veya testi durdurabiliriz.
         // Şimdilik sadece loglayalım ve devam edelim (kullanıcı fark etmeyebilir)
         // VEYA: Kullanıcıya hata gösterip testi durdur
         // if(aytQuestionText) aytQuestionText.innerHTML = `<p style="color:red;">Soru ${index + 1} yüklenirken hata oluştu.</p>`;
         // if(aytOptionsArea) aytOptionsArea.innerHTML = '';
         // return;
    }


    // İlerleme göstergesini güncelle
    if (aytProgress) aytProgress.textContent = `Soru ${index + 1} / ${totalQuestions}`;

    // Soru metnini güncelle
    if (aytQuestionText) aytQuestionText.innerHTML = qData.question.replace(/\n/g, '<br>'); // Satır sonlarını <br>'ye çevir

    // Seçenek alanını temizle ve doldur
    if (aytOptionsArea) {
        aytOptionsArea.innerHTML = ''; // Önceki seçenekleri temizle
        const optionLetters = ['A', 'B', 'C', 'D', 'E'];
        qData.options.forEach((option, optIndex) => {
             if (typeof option !== 'string') {
                 console.warn(`Soru ${index + 1}, Seçenek ${optIndex + 1} metin değil:`, option);
                 option = `Hatalı Seçenek ${optIndex + 1}`; // Hatalı seçeneği göster
             }
            const inputId = `q${index}_opt${optIndex}`;
            // Yeni HTML yapısı style.css ile uyumlu
            const optionHTML = `
                <div class="option-item">
                    <input type="radio" id="${inputId}" name="question-${index}" value="${optIndex}">
                    <label for="${inputId}">${option}</label>
                </div>
            `;
             /* // Alternatif (style.css'deki .option-letter/.option-text için):
             const optionHTML = `
                 <div class="option-item">
                     <input type="radio" id="${inputId}" name="question-${index}" value="${optIndex}">
                     <label for="${inputId}">
                         <span class="option-letter">${optionLetters[optIndex]})</span>
                         <span class="option-text">${option}</span>
                     </label>
                 </div>
             `;
             */
            aytOptionsArea.insertAdjacentHTML('beforeend', optionHTML);
        });

        // Kaydedilmiş cevabı kontrol et ve işaretle
        if (userAnswers[index] !== null && userAnswers[index] !== undefined) {
            // Değerin number olduğundan emin ol (saveCurrentAnswer'dan int geliyor)
            const savedValue = userAnswers[index];
            const savedOptionInput = aytOptionsArea.querySelector(`input[value="${savedValue}"]`);
            if (savedOptionInput) {
                savedOptionInput.checked = true;
            } else {
                console.warn(`Soru ${index+1} için kaydedilen cevap (${savedValue}) ile eşleşen input bulunamadı.`);
            }
        }
    }

    // Navigasyon butonlarının görünürlüğünü ayarla
    if (btnPrevQuestion) btnPrevQuestion.style.display = (index === 0) ? 'none' : 'inline-block';
    if (btnNextQuestion) btnNextQuestion.style.display = (index === totalQuestions - 1) ? 'none' : 'inline-block';
    if (btnFinishTest) btnFinishTest.style.display = (index === totalQuestions - 1) ? 'inline-block' : 'none';
}

function saveCurrentAnswer() {
    const selectedOptionInput = aytOptionsArea ? aytOptionsArea.querySelector(`input[name="question-${currentQuestionIndex}"]:checked`) : null;
    if (selectedOptionInput) {
        // inputun value'su string gelir, parseInt ile sayıya çeviriyoruz
        userAnswers[currentQuestionIndex] = parseInt(selectedOptionInput.value, 10);
    } else {
        // Eğer seçim yapılmadıysa null olarak kaydediyoruz
        userAnswers[currentQuestionIndex] = null;
    }
     // console.log("Cevap kaydedildi:", currentQuestionIndex, userAnswers[currentQuestionIndex]);
}

function handleNextQuestion() {
    saveCurrentAnswer();
    if (currentQuestionIndex < totalQuestions - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    }
}

function handlePrevQuestion() {
    saveCurrentAnswer(); // Geriye giderken de cevabı kaydetmek isteyebiliriz
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion(currentQuestionIndex);
    }
}

function handleFinishTest() {
    saveCurrentAnswer(); // Son sorunun cevabını kaydet
    console.log("Test Bitiriliyor. Kullanıcı Cevapları:", userAnswers);
    showResults();
}

function showResults() {
    if (!aytTestContainer || !aytResultsSummary || !aytFinalScore || !aytResultsDetails) {
        console.error("Sonuçları göstermek için gerekli elementler bulunamadı.");
        return;
    }

    if (aytTestContainer) aytTestContainer.style.display = 'none';
    if (aytNavigation) aytNavigation.style.display = 'none'; // Navigasyonu da gizle
    if (aytResultsSummary) aytResultsSummary.style.display = 'block';

    let score = 0;
    let resultsHTML = ''; // Başlangıçta boş
    let hasIncorrect = false; // Yanlış var mı kontrolü

    aytQuestionsData.forEach((qData, index) => {
        const correctAnswerIndex = qData.correctOptionIndex;
        const userAnswerIndex = userAnswers[index]; // Bu null veya bir sayı olabilir

        // Index doğrulamaları
         if (typeof correctAnswerIndex !== 'number' || correctAnswerIndex < 0 || !qData.options || correctAnswerIndex >= qData.options.length) {
            console.warn(`Soru ${index + 1} için geçersiz doğru cevap index'i veya seçenek verisi: ${correctAnswerIndex}`);
            // Bu sorunun değerlendirmesini atla veya hata mesajı ekle
             resultsHTML += `<div class="result-item" style="border-left: 4px solid orange;"><strong>Soru ${index + 1}:</strong> Değerlendirilemedi (hatalı veri).</div>`;
             hasIncorrect = true; // Hatalı veri de bir tür "yanlış" sayılabilir
            return; // Sonraki soruya geç
         }

        if (userAnswerIndex !== null && userAnswerIndex === correctAnswerIndex) {
            score++;
        } else { // Yanlış veya boş bırakılanlar
             hasIncorrect = true; // Yanlış veya boş varsa işaretle
             const optionLetters = ['A', 'B', 'C', 'D', 'E'];
             const correctAnswerText = qData.options[correctAnswerIndex];
             let userAnswerText = "Boş Bırakıldı";
             let userAnswerLetter = "-";

             if (userAnswerIndex !== null && userAnswerIndex >= 0 && userAnswerIndex < qData.options.length) {
                 userAnswerText = qData.options[userAnswerIndex];
                 userAnswerLetter = optionLetters[userAnswerIndex];
             } else if (userAnswerIndex !== null) {
                 // Geçersiz index durumu (programlama hatası?)
                 userAnswerText = `Geçersiz Seçim (${userAnswerIndex})`;
                 userAnswerLetter = "?";
             }

             // Açıklama var mı kontrol et
             const explanationText = qData.explanation ? qData.explanation.replace(/\n/g, '<br>') : "Açıklama bulunmuyor.";

             resultsHTML += `
                <div class="result-item ${userAnswerIndex === null ? '' : 'incorrect-answer'}">
                    <strong>Soru ${index + 1}:</strong> ${qData.question.replace(/\n/g, '<br>')}
                    ${userAnswerIndex !== null ? `<div class="user-choice">Sizin Cevabınız: ${userAnswerLetter}) ${userAnswerText}</div>` : '<div class="user-choice">Cevap Vermediniz</div>'}
                    <div class="correct-choice">Doğru Cevap: ${optionLetters[correctAnswerIndex]}) ${correctAnswerText}</div>
                    <div class="explanation"><strong>Açıklama:</strong> ${explanationText}</div>
                </div>
            `;
        }
    });

    aytFinalScore.innerHTML = `Sonuç: ${totalQuestions} soruda ${score} doğru yaptınız.`;

    // Yanlış/boş yoksa özel mesaj, varsa detayları göster
    if (!hasIncorrect) {
        aytResultsDetails.innerHTML = '<p style="color: green; text-align: center; font-weight: bold; padding: 15px 0;">Tebrikler! Tüm soruları doğru cevapladınız.</p>';
    } else {
         // Detayları göstermeden önce başlığı ekle
         aytResultsDetails.innerHTML = `<h4>Yanlış / Boş Bırakılanlar ve Açıklamaları:</h4>${resultsHTML}`;
    }
}
// --- AYT Online Test Fonksiyonları Sonu ---


// --- BİRLEŞTİRİLMİŞ ve DÜZELTİLMİŞ UI Olay Dinleyicileri ---
function setupUIEventListeners() {
    console.log("UI Olay Dinleyicileri Ayarlanıyor...");

    // --- 1. Tab Değiştirme ---
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
     if (tabButtons.length > 0 && tabContents.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                 console.log("Tab butonu tıklandı:", tabId);
                // Tüm butonlardan 'active' sınıfını kaldır
                tabButtons.forEach(btn => btn.classList.remove('active'));
                // Tüm içeriklerden 'active' sınıfını kaldır
                tabContents.forEach(content => content.classList.remove('active'));

                // Tıklanan butona 'active' sınıfını ekle
                button.classList.add('active');

                // İlgili içeriği bul ve 'active' sınıfını ekle
                const targetTab = document.getElementById(tabId);
                 if (targetTab) {
                    targetTab.classList.add('active');
                    console.log("Aktif tab:", tabId);
                } else {
                    console.warn("Hedef tab içeriği bulunamadı:", tabId);
                }
            });
        });
    } else {
        console.warn("Tab butonları (.tab-btn) veya içerikleri (.tab-content) bulunamadı.");
    }


    // --- 2. Model Kontrol Butonları ---
    const btnShowAll = document.getElementById('btn-show-all');
    const btnIsolateHeart = document.getElementById('btn-isolate-heart');
    const btnToggleLabels = document.getElementById('btn-toggle-labels');
    const btnPlayHeartbeat = document.getElementById('btn-play-heartbeat');

    if (btnShowAll) {
        btnShowAll.addEventListener('click', () => {
            if (heartModel) heartModel.visible = true;
            console.log("Tüm Sistemi Göster tıklandı.");
            // Gerekirse diğer objeleri de görünür yap
        });
    }
    if (btnIsolateHeart) {
         btnIsolateHeart.addEventListener('click', () => {
             if (heartModel) heartModel.visible = true; // Sadece kalbi göster, diğerlerini gizle (şimdilik tüm modeli gösteriyor)
             console.log("Sadece Kalbi Göster tıklandı.");
            // TODO: Gerekirse diğer objeleri (damarlar vb.) gizle - Model yapısına bağlı
        });
    }
    if (btnToggleLabels) btnToggleLabels.addEventListener('click', toggleLabels);
    if (btnPlayHeartbeat) btnPlayHeartbeat.addEventListener('click', playHeartbeat);


    // --- 3. YENİ AYT Online Test Butonları ---
    // Element referansları initializeAYTElements içinde global değişkenlere atandı.
    if (btnStartTest) {
        btnStartTest.addEventListener('click', startAYTTest);
     } else { console.warn("Start Test butonu bulunamadı ('btn-start-test')");}

     if (btnNextQuestion) {
         btnNextQuestion.addEventListener('click', handleNextQuestion);
     } else { console.warn("Next Question butonu bulunamadı ('btn-next-question')");}

     if (btnPrevQuestion) {
         btnPrevQuestion.addEventListener('click', handlePrevQuestion);
     } else { console.warn("Previous Question butonu bulunamadı ('btn-prev-question')");}

     if (btnFinishTest) {
         btnFinishTest.addEventListener('click', handleFinishTest);
     } else { console.warn("Finish Test butonu bulunamadı ('btn-finish-test')");}

     if (btnRestartTest) {
          // Restart butonu, sonuçları gizler, test kontainerini gizler ve başlangıç ekranını gösterir.
         btnRestartTest.addEventListener('click', () => {
             if (aytResultsSummary) aytResultsSummary.style.display = 'none';
             if (aytTestContainer) aytTestContainer.style.display = 'none';
             if (aytNavigation) aytNavigation.style.display = 'none'; // Navigasyonu da gizle
             if (aytStartScreen) aytStartScreen.style.display = 'block';
             // İsteğe bağlı: Test state'ini tamamen sıfırla (gerçi startAYTTest bunu yapıyor)
             // currentQuestionIndex = 0;
             // userAnswers = [];
             console.log("Test yeniden başlatılmaya hazır.");
         });
     } else { console.warn("Restart Test butonu bulunamadı ('btn-restart-test')");}

    // --- Bitiş: UI Event Listeners ---
}


// --- Başlatma ---
// DOM tamamen yüklendiğinde init fonksiyonunu çalıştır
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM zaten yüklendiyse doğrudan çalıştır
    init();
}

// --- END OF FILE script.js ---
