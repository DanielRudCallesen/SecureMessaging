# Secure Messaging Application

A real-time secure messaging application built with ASP.NET Core and JavaScript. 

The application implements end-to-end encryption, ensuring that messages can only be read by the intended recipients.

This is a demonstration project

The authentication system is basic --- Login information is stored in a list rather than Database for simplicity. Real world application should involve a database connection with hashing and salting of passwords. 

User sessions are not persistent

No message history is stored


## Pictures of the application
![{769FD090-A5BC-4677-83FE-EE3F9F9D23B3}](https://github.com/user-attachments/assets/d88b4c36-42f9-43cb-96b2-edbad5417f37)


![{CD8A5843-25A2-489C-A699-D6B7E8F6D501}](https://github.com/user-attachments/assets/7fa873ae-6bc4-4518-8afb-fc0c5b41ee4d)



## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/DanielRudCallesen/SecureMessaging
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

5. Chat with the other user:
   - Click on the user on the left panel.
   - Start chatting with yourself!

5.1. Waitlist (If no user shown):
   - When succusfully logged in wait 15 seconds for the user list to update.


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

## How it works

1. Users authenticate with the server
2. When a chat is initiated:
   - A secure key exchange is performed using Diffie-Hellman
   - A shared secret is established between the users
   - Messages are encrypted using AES-256 before transmission
   - Messages are verified using HMAC for integrity
3. The server acts only as a message relay
4. All cryptographic operations happen client-side

   
5. Known Bugs
   - Bug 1: (FIXED NEW BUG ARRVIED -> Bug 3)
   - Currently if you have logged in on both users, decide to logout with both.
   - Login again on user1, you will see that user2 is still "logged in" which it is not.
   - It will throw an error if you click on user2.
   - Bug 2: (No idea how to fix)
   - Source Map Error even though the URL is correct.
   - Bug 3: (Not gonna fix)
   - When a user disconnects, it doesn't say that a user has disconnected.
   - You wouldn't be able to send messages to that user again.
   - It occurs an error
