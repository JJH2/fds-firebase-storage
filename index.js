const IMAGE_PER_PAGE = 2;

const auth = firebase.auth();
const storage = firebase.storage();
const database = firebase.database();

const provider = new firebase.auth.GoogleAuthProvider();
const loginButtonEl = document.querySelector('.login');
const fileInputEl = document.querySelector('.file-input');

const keyStack = [];

loginButtonEl.addEventListener('click', async e => {
    
    const result = await firebase.auth().signInWithPopup(provider);
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // The signed-in user info.
    var user = result.user;
    // ...
    console.log(result);
})

fileInputEl.addEventListener('change', async e => {
    console.log(fileInputEl.files[0]);
    const getEpochTime = new Date().getTime();
    const refStr = `${auth.currentUser.uid}:${getEpochTime}`;

    // 파이어베이스 스토리지에 저장하기
    const snapshot = await storage.ref(`/images/${refStr}`).put(fileInputEl.files[0]);
    await database.ref(`/images/`).push({
        downloadURL: snapshot.downloadURL,
        fileName: fileInputEl.files[0].name
    });
    refreshImages();
})

async function refreshImages(a) {
    const imageListEl = document.querySelector('.image');
    // 실시간 데이터베이스에서 이미지 정보 가져오기
    const snapshot = await database
        .ref(`/images/`)
        .orderByKey()
        .limitToFirst(IMAGE_PER_PAGE + 1)
        .startAt(keyStack[keyStack.length - 1] || "") // nextKey가 falsy이면 ""을 삽입한다.
        .once('value');
    const getImages = snapshot.val();
    
    // 마지막 키를 저장하기 (페이지네이션)
    const keys = Object.keys(getImages);
    
    keyStack.push(keys[keys.length - 1]);
    // 이미지 표시해주기
    imageListEl.innerHTML = '';
    const imageArr = Object.values(getImages).slice(0, IMAGE_PER_PAGE);
    for (let {downloadURL, fileName} of imageArr) {
        const liEl = document.createElement('li');
        const imageEl = document.createElement('img');
        const pEl = document.createElement('p');

        liEl.classList.add('image-list');

        imageEl.src = downloadURL;
        imageEl.classList.add('image-list__item');

        pEl.classList.add('image-list__name');
        pEl.textContent = fileName;

        imageListEl.appendChild(liEl);
        liEl.appendChild(imageEl)
        liEl.appendChild(pEl);
    }
}

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        refreshImages();
    } else {
        // No user is signed in.
    }
});


document.querySelector('.next-botton').addEventListener('click', async e => {
    refreshImages('next');
})
document.querySelector('.prev-botton').addEventListener('click', async e => {
    keyStack.pop();
    keyStack.pop();
    refreshImages('prev');
})