class CryptoService {
    constructor() {
        this.privateKey = null;
        this.publicKey = null;
        this.sharedSecrets = {};
        this.encryptionKeys = {};
        this.hmacKeys = {};
    }


    async init() {
        try {
            // Generate Diffie-Hellman key pair
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'ECDH',
                    namedCurve: 'P-256'
                },
                true,
                ['deriveKey', 'deriveBits']
            );

            this.privateKey = keyPair.privateKey;
            this.publicKey = keyPair.publicKey;

            // Export public key for sharing
            return await this.exportPublicKey();
        } 
        catch (error) {
            console.error('Crypto initialization failed:', error);
            throw new Error('Failed to initialize cryptography');
        }
    }


    async exportPublicKey() {
        try {
            const exportedKey = await window.crypto.subtle.exportKey(
                'spki',
                this.publicKey
            );
            return this._arrayBufferToBase64(exportedKey);
        } 
        catch (error) {
            console.error('Public key export failed:', error);
            throw new Error('Failed to export public key');
        }
    }


    async importPublicKey(base64PublicKey) {
        try {
            const binaryKey = this._base64ToArrayBuffer(base64PublicKey);
            return await window.crypto.subtle.importKey(
                'spki',
                binaryKey,
                {
                    name: 'ECDH',
                    namedCurve: 'P-256'
                },
                true,
                []
            );
        } catch (error) {
            console.error('Public key import failed:', error);
            throw new Error('Failed to import public key');
        }
    }


    async performKeyExchange(username, theirPublicKeyBase64) {
        try {
            // Import the other user's public key
            const theirPublicKey = await this.importPublicKey(theirPublicKeyBase64);

            // Derive a shared secret using ECDH
            const sharedSecret = await window.crypto.subtle.deriveBits(
                {
                    name: 'ECDH',
                    public: theirPublicKey
                },
                this.privateKey,
                256 // 256 bits for AES-256
            );

            this.sharedSecrets[username] = sharedSecret;
            await this.deriveKeys(username);

            return true;
        } 
        catch (error) {
            console.error('Key exchange failed:', error);
            throw new Error('Failed to perform key exchange');
        }
    }

    
    async deriveKeys(username) {
        try {
            const sharedSecret = this.sharedSecrets[username];
            if (!sharedSecret) {
                throw new Error('No shared secret found for this user');
            }

            
            const baseKey = await window.crypto.subtle.importKey(
                'raw',
                sharedSecret,
                { name: 'HKDF' },
                false,
                ['deriveBits', 'deriveKey']
            );

           
            const encryptionKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'HKDF',
                    hash: 'SHA-256',
                    salt: new Uint8Array(16), 
                    info: new TextEncoder().encode('AES-GCM encryption')
                },
                baseKey,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt', 'decrypt']
            );

       
            const hmacKey = await window.crypto.subtle.deriveKey(
                {
                    name: 'HKDF',
                    hash: 'SHA-256',
                    salt: new Uint8Array(16), 
                    info: new TextEncoder().encode('HMAC authentication')
                },
                baseKey,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign', 'verify']
            );

            
            this.encryptionKeys[username] = encryptionKey;
            this.hmacKeys[username] = hmacKey;

        } catch (error) {
            console.error('Key derivation failed:', error);
            throw new Error('Failed to derive keys');
        }
    }


    async encryptMessage(username, message) {
        try {
            const encryptionKey = this.encryptionKeys[username];
            const hmacKey = this.hmacKeys[username];

            if (!encryptionKey || !hmacKey) {
                throw new Error('Encryption keys not found for this user');
            }

            // Generate a random IV
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            
            
            const encodedMessage = new TextEncoder().encode(message);
            
            // Encrypt the message with AES-GCM
            const ciphertext = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                encryptionKey,
                encodedMessage
            );
            
            // Combine the IV and ciphertext for HMAC calculation
            const combined = this._concatArrayBuffers(iv, ciphertext);
            
            // Calculate HMAC for integrity verification
            const hmac = await window.crypto.subtle.sign(
                {
                    name: 'HMAC'
                },
                hmacKey,
                combined
            );
            
            return {
                encryptedMessage: this._arrayBufferToBase64(ciphertext),
                iv: this._arrayBufferToBase64(iv),
                hmac: this._arrayBufferToBase64(hmac)
            };
        } 
        catch (error) {
            console.error('Message encryption failed:', error);
            throw new Error('Failed to encrypt message');
        }
    }


    async decryptMessage(username, encryptedMessageBase64, ivBase64, hmacBase64) {
        try {
            const encryptionKey = this.encryptionKeys[username];
            const hmacKey = this.hmacKeys[username];

            if (!encryptionKey || !hmacKey) {
                throw new Error('Decryption keys not found for this user');
            }

            // Convert Base64 to ArrayBuffer
            const ciphertext = this._base64ToArrayBuffer(encryptedMessageBase64);
            const iv = this._base64ToArrayBuffer(ivBase64);
            const receivedHmac = this._base64ToArrayBuffer(hmacBase64);

            // Verify HMAC before decryption
            const combined = this._concatArrayBuffers(iv, ciphertext);
            const isValid = await window.crypto.subtle.verify(
                {
                    name: 'HMAC'
                },
                hmacKey,
                receivedHmac,
                combined
            );

            if (!isValid) {
                throw new Error('HMAC verification failed - message integrity compromised');
            }

            // Decrypt the message
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv
                },
                encryptionKey,
                ciphertext
            );

            // Decode the message
            return new TextDecoder().decode(decryptedBuffer);
        } 
        catch (error) {
            console.error('Message decryption failed:', error);
            throw new Error('Failed to decrypt message');
        }
    }
    // Fuck buffers, so much pain
    _concatArrayBuffers(a, b) {
        const result = new Uint8Array(a.byteLength + b.byteLength);
        result.set(new Uint8Array(a), 0);
        result.set(new Uint8Array(b), a.byteLength);
        return result.buffer;
    }

    _arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    _base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }
} 