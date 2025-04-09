using SecureMessagingServer.Models;

namespace SecureMessagingServer.Services
{
    public interface IUserService
    {
        bool ValidateCredentials(string username, string password);
        bool RegisterUser(string username, string password);
        User? GetUserByUsername(string username);
        IEnumerable<string> GetAllUsernames();
    }
} 