
class ChatService {
    constructor(authService, cryptoService) {
        this.authService = authService;
        this.cryptoService = cryptoService;
        this.connection = null;
        this.activeRecipient = null;
        this.messages = {};
        this.onMessageReceived = null;
        this.onUserSelected = null;
        this.onUserListUpdate = null;
    }

    async initConnection() {
        try {
            
            this.connection = new signalR.HubConnectionBuilder()
                .withUrl('http://localhost:5000/chathub', {
                    withCredentials: true
                })
                .withAutomaticReconnect()
                .build();
                
            this.connection.on('ReceiveMessage', async (sender, encryptedMessage, iv, hmac) => {
                try {
                    
                    const decryptedMessage = await this.cryptoService.decryptMessage(
                        sender,
                        encryptedMessage,
                        iv,
                        hmac
                    );

                    
                    if (!this.messages[sender]) {
                        this.messages[sender] = [];
                    }
                    
                    this.messages[sender].push({
                        sender,
                        message: decryptedMessage,
                        timestamp: new Date(),
                        isSent: false
                    });

                    
                    if (this.onMessageReceived) {
                        this.onMessageReceived(sender, decryptedMessage);
                    }
                } catch (error) {
                    console.error('Error processing received message:', error);
                    alert('Failed to decrypt message. The message may have been tampered with.');
                }
            });

            
            this.connection.on('ReceivePublicKey', async (sender, publicKey) => {
                try {
                    
                    await this.cryptoService.performKeyExchange(sender, publicKey);

                    const ourPublicKey = await this.cryptoService.exportPublicKey();
                    await this.connection.invoke('SendPublicKey', sender, ourPublicKey);
                    
                    console.log(`Key exchange completed with ${sender}`);
                } catch (error) {
                    console.error('Key exchange error:', error);
                }
            });

            
            await this.connection.start();
            console.log('SignalR connection established');
        } 
        catch (error) {
            console.error('SignalR connection error:', error);
            throw new Error('Failed to connect to chat server');
        }
    }


    setActiveRecipient(username) {
        this.activeRecipient = username;
        
        if (!this.messages[username]) {
            this.messages[username] = [];
        }
        
        if (this.onUserSelected) {
            this.onUserSelected(username, this.messages[username]);
        }

        this.initiateKeyExchange(username);
    }

 
    async initiateKeyExchange(recipient) {
        try {
            if (!this.cryptoService.encryptionKeys[recipient]) {
                const publicKey = await this.cryptoService.exportPublicKey();
                await this.connection.invoke('SendPublicKey', recipient, publicKey);
                console.log(`Initiated key exchange with ${recipient}`);
            }
        } catch (error) {
            console.error('Key exchange initiation error:', error);
            throw new Error('Failed to initiate key exchange');
        }
    }


    async sendMessage(message) {
        if (!this.activeRecipient) {
            throw new Error('No active recipient selected');
        }
        
        try 
        {
            const encryptedData = await this.cryptoService.encryptMessage(
                this.activeRecipient,
                message
            );
            
            await this.connection.invoke(
                'SendMessage',
                this.activeRecipient,
                encryptedData.encryptedMessage,
                encryptedData.iv,
                encryptedData.hmac
            );
            
            if (!this.messages[this.activeRecipient]) {
                this.messages[this.activeRecipient] = [];
            }
            
            this.messages[this.activeRecipient].push({
                sender: this.authService.getCurrentUser(),
                message,
                timestamp: new Date(),
                isSent: true
            });
            
            return true;
        } 
        catch (error) {
            console.error('Message sending error:', error);
            throw new Error('Failed to send message');
        }
    }


    getMessagesForUser(username) {
        return this.messages[username] || [];
    }

    disconnect() {
        if (this.connection) {
            this.connection.stop();
            this.connection = null;
        }
        this.activeRecipient = null;
        this.messages = {};
    }
} 