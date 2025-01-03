// 简单的加密函数
function encryptApiKey(key) {
    return btoa(key.split('').reverse().join('')); // 简单的base64加反转加密
}

// 解密函数
function decryptApiKey(encryptedKey) {
    return atob(encryptedKey).split('').reverse().join('');
}

// 加密后的API KEY
const ENCRYPTED_API_KEY = encryptApiKey('fhjXaCsmBduoQHEWasvW:RUkiuTCkAjvfkMLryqVT'); 