let userPublicKey = null;
let db;

// Open or create an IndexedDB database
function openDatabase() {
    const request = indexedDB.open("userFilesDB", 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        // Create an object store for user files
        const objectStore = db.createObjectStore("files", { keyPath: "name" });
    };

    request.onsuccess = function(event) {
        db = event.target.result;
    };

    request.onerror = function(event) {
        console.error("Error opening IndexedDB:", event.target.errorCode);
    };
}

function getAccount() {
    window.solana.connect().then((account) => {
        userPublicKey = account.publicKey.toString();
        console.log("Connected to account:", userPublicKey);

        // Update UI
        document.getElementById('connectButton').style.display = 'none';
        document.getElementById('logoutButton').style.display = 'inline-block';
        document.getElementById('uploadButton').style.display = 'inline-block';
        document.getElementById('loginMessage').innerText = `You are logged in as: ${userPublicKey}`;
        document.getElementById('documentsSection').style.display = 'block';

        // Load user documents from IndexedDB
        loadUserDocuments();
    }).catch((error) => {
        console.error("Error connecting to account:", error);
    });
}

function disconnect() {
    window.solana.disconnect().then(() => {
        console.log("Disconnected");

        // Reset UI
        document.getElementById('connectButton').style.display = 'inline-block';
        document.getElementById('logoutButton').style.display = 'none';
        document.getElementById('uploadButton').style.display = 'none';
        document.getElementById('loginMessage').innerText = '';
        document.getElementById('documentsSection').style.display = 'none';
        document.getElementById('documentsList').innerHTML = '';

        // Clear stored files
        clearUserFiles();
    }).catch((error) => {
        console.error("Error disconnecting:", error);
    });
}

function uploadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const fileData = {
            name: file.name,
            data: e.target.result
        };

        // Save the file data in IndexedDB
        const transaction = db.transaction(["files"], "readwrite");
        const objectStore = transaction.objectStore("files");
        objectStore.put(fileData);

        transaction.oncomplete = function() {
            console.log("File uploaded successfully");
            addDocumentToList(fileData.name, fileData.data);
        };

        transaction.onerror = function(event) {
            console.error("Error uploading file:", event.target.errorCode);
        };
    };
    reader.readAsDataURL(file);
}

function loadUserDocuments() {
    const transaction = db.transaction(["files"], "readonly");
    const objectStore = transaction.objectStore("files");
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        const files = event.target.result;
        files.forEach(file => {
            addDocumentToList(file.name, file.data);
        });
    };

    request.onerror = function(event) {
        console.error("Error loading documents:", event.target.errorCode);
    };
}

function clearUserFiles() {
    const transaction = db.transaction(["files"], "readwrite");
    const objectStore = transaction.objectStore("files");
    const request = objectStore.clear();

    request.onsuccess = function() {
        console.log("All user files cleared.");
    };

    request.onerror = function(event) {
        console.error("Error clearing files:", event.target.errorCode);
    };
}

function addDocumentToList(fileName, fileData) {
    const documentsList = document.getElementById('documentsList');

    const docItem = document.createElement('div');
    docItem.className = "col-span-1 flex items-end w-full h-[315px] rounded-2xl bg-center bg-cover bg-no-repeat hover:scale-95 overflow-hidden transition-transform duration-300";
    docItem.style.backgroundImage = `url('${fileData}')`;

    const docContent = document.createElement('div');
    docContent.className = "block flex-1 bg-white h-[95px] px-4 glass";
    docItem.appendChild(docContent);

    const docTitle = document.createElement('h4');
    docTitle.className = "text-xs font-bold text-[#161616] py-4 truncate max-w-[90%] 2xl:max-w-none";
    docTitle.innerText = fileName;
    docContent.appendChild(docTitle);

    documentsList.appendChild(docItem);
}

// Open the IndexedDB database when the page loads
window.onload = function() {
    openDatabase();
};
