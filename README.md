# Secure Messaging Application

A real-time secure messaging application built with ASP.NET Core and JavaScript. 
The application implements end-to-end encryption, ensuring that messages can only be read by the intended recipients.

## Features

- Real-time messaging using SignalR
- End-to-end encryption using AES-256
- Secure key exchange using Diffie-Hellman
- Message integrity verification using HMAC
- Simple user authentication (Users stored in a list rather than Database) 

- All messages are encrypted/decrypted client-side
- Server never sees decrypted message content
- Secure key exchange between users
- Message integrity verification
- Protection against message tampering

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/DanielRudCallesen/SecureMessaging
   cd secure-messaging
   ```

2. Start the server:
   ```bash
   cd SecureMessagingServer
   dotnet run
   ```
   The server will start on http://localhost:5000

3. Serve the client:
   - Using Visual Studio Code:
     - Install the "Live Server" extension
     - Right-click on SecureMessagingClient/index.html
     - Select "Open with Live Server"
     - Remember to be using Port:5500
   
4. Access the application:
   - Open your browser and navigate to http://localhost:5500/SecureMessagingClient
   - Open another browser (Preferable in private mode) and navigate to http://localhost:5500/SecureMessagingClient
   - Use the following user credentials:
     ```
     Username: alice
     Password: password123

     Username: bob
     Password: password123
     ```
