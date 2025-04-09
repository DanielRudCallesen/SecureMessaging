using Microsoft.AspNetCore.SignalR;
using SecureMessagingServer.Services;

namespace SecureMessagingServer.Hubs
{
    public class ChatHub : Hub
    {
        private readonly IUserService _userService;

        public ChatHub(IUserService userService)
        {
            _userService = userService;
        }

        public override async Task OnConnectedAsync()
        {
            var username = Context.User?.Identity?.Name;
            if (!string.IsNullOrEmpty(username))
            {
                var user = _userService.GetUserByUsername(username);
                if (user != null)
                {
                    user.ConnectionId = Context.ConnectionId;
                }
                await Clients.Others.SendAsync("UserConnected", username);
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var username = Context.User?.Identity?.Name;
            if (!string.IsNullOrEmpty(username))
            {
                var user = _userService.GetUserByUsername(username);
                if (user != null)
                {
                    user.ConnectionId = null;
                }
                // Notify other users that the user has disconnected
                // Is missing, cba to do. 
                await Clients.Others.SendAsync("UserDisconnected", username);
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(string recipient, string encryptedMessage, string iv, string hmac)
        {
            var sender = Context.User?.Identity?.Name;
            if (string.IsNullOrEmpty(sender))
            {
                throw new HubException("User not authenticated");
            }

            var recipientUser = _userService.GetUserByUsername(recipient);
            if (recipientUser == null || string.IsNullOrEmpty(recipientUser.ConnectionId))
            {
                throw new HubException("Recipient not found or not online");
            }

            await Clients.Client(recipientUser.ConnectionId).SendAsync(
                "ReceiveMessage",
                sender,
                encryptedMessage,
                iv,
                hmac
            );

            await Clients.Caller.SendAsync("MessageSent", recipient);
        }

        public async Task SendPublicKey(string recipient, string publicKey)
        {
            var sender = Context.User?.Identity?.Name;
            if (string.IsNullOrEmpty(sender))
            {
                throw new HubException("User not authenticated");
            }

            var recipientUser = _userService.GetUserByUsername(recipient);
            if (recipientUser == null || string.IsNullOrEmpty(recipientUser.ConnectionId))
            {
                throw new HubException("Recipient not found or not online");
            }


            await Clients.Client(recipientUser.ConnectionId).SendAsync(
                "ReceivePublicKey",
                sender,
                publicKey
            );
        }
    }
} 